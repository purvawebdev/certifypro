import React, { useState, useRef } from "react";
import * as XLSX from "xlsx/xlsx.mjs";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function CertBatchGenerator() {
  const [bgDataUrl, setBgDataUrl] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // --- DEFAULTS FOR A4 (Points) ---
  const [nameX, setNameX] = useState(0);
  const [nameY, setNameY] = useState(300);
  const [fontSize, setFontSize] = useState(24);
  const [fontName, setFontName] = useState("times");
  const [fontStyle, setFontStyle] = useState("normal");
  const bgImgRef = useRef(null);

  const handleBgUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgDataUrl(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleExcelUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const normalized = json.map((r) => {
        const keys = Object.keys(r);
        const nameKey = keys.find((k) => /name/i.test(k)) || keys[0];
        const emailKey = keys.find((k) => /email/i.test(k)) || keys[1] || "";
        return {
          raw: r,
          name: String(r[nameKey] ?? "").trim(),
          email: String(r[emailKey] ?? "").trim(),
        };
      });
      setRows(normalized);
      setLogs([]);
    };
    if (f.name.endsWith(".csv")) reader.readAsText(f);
    else reader.readAsBinaryString(f);
  };

  // --- OPTIMIZATION 1: Helper to load image only ONCE ---
  const loadImgElement = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // --- OPTIMIZATION 2: Pass resources as arguments ---
  // We pass 'jsPDF' class and 'imgElement' so we don't re-import/re-load them 100 times.
  const generatePdfBlob = (row, jsPDFClass, imgElement, imgType) => {
    const pdf = new jsPDFClass({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
      compress: true, // Compress PDF to make upload faster
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Reuse the pre-loaded image element
    pdf.addImage(imgElement, imgType, 0, 0, pageWidth, pageHeight);

    try {
      pdf.setFont(fontName, fontStyle);
    } catch {
      if (pdf.setFontType) pdf.setFontType(fontStyle || "normal");
    }
    pdf.setFontSize(Number(fontSize) || 24);
    pdf.setTextColor(0, 0, 0);

    const text = row.name || "N/A";
    const textWidth = pdf.getTextWidth(text);
    const centerX = pageWidth / 2 - textWidth / 2;
    const userX = Number(nameX);
    const userY = Number(nameY);

    const finalX = userX ? userX : centerX;
    const finalY = userY ? userY : pageHeight / 2;

    pdf.text(text, finalX, finalY);

    // Return Blob directly
    return pdf.output("blob");
  };

  // --- ZIP FUNCTION (Optimized) ---
  const generateAllZip = async () => {
    if (!bgDataUrl) return alert("Upload background template image first");
    if (!rows || rows.length === 0) return alert("Upload Excel file first");

    setLoading(true);
    try {
      // 1. PRE-LOAD RESOURCES ONCE
      const { jsPDF } = await import("jspdf");
      const imgEl = await loadImgElement(bgDataUrl);
      const imgType = bgDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

      const zip = new JSZip();

      // Generate files
      rows.forEach((row) => {
        const nameSafe = (row.name || `student`).replace(/[^\w\s.-]/g, "");
        const blob = generatePdfBlob(row, jsPDF, imgEl, imgType);
        zip.file(`${nameSafe}.pdf`, blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "certificates.zip");
    } catch (err) {
      console.error(err);
      alert("Failed to generate ZIP.");
    } finally {
      setLoading(false);
    }
  };

  // --- OPTIMIZED EMAIL FUNCTION (Batch + Retry) ---
  const handleSendEmails = async () => {
    if (!bgDataUrl) return alert("Upload background template image first");
    if (!rows || rows.length === 0) return alert("Upload Excel file first");

    if (!confirm(`Sending emails to ${rows.length} people. \n⚠️ KEEP THIS TAB OPEN.`)) return;

    setLoading(true);
    setLogs([]);
    let successCount = 0;
    const addLog = (msg) => setLogs((prev) => [msg, ...prev]);

    // 1. PRE-LOAD RESOURCES (Crucial for speed)
    const { jsPDF } = await import("jspdf");
    const imgEl = await loadImgElement(bgDataUrl);
    const imgType = bgDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

    // 2. DEFINE BATCH SIZE (3 is safe for Gmail/Vercel)
    const BATCH_SIZE = 3;

    // Helper function to process one email with retries
    const processSingleEmail = async (row) => {
      if (!row.email || !row.email.includes("@")) return;

      let attempts = 0;
      let sent = false;

      while (attempts < 2 && !sent) {
        try {
          const pdfBlob = generatePdfBlob(row, jsPDF, imgEl, imgType);
          const formData = new FormData();
          formData.append("pdf", pdfBlob, "certificate.pdf");
          formData.append("email", row.email);
          formData.append("name", row.name);

          const response = await fetch("/api/send-certificate", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            sent = true;
            successCount++;
            addLog(`✅ Sent: ${row.name}`);
          } else {
            throw new Error("Server error");
          }
        } catch (err) {
          attempts++;
          if (attempts < 2) await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
          else addLog(`❌ Failed: ${row.name} (Network Error)`);
        }
      }
    };

    // 3. RUN BATCH LOOP
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      addLog(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

      // Run 3 emails in parallel (Faster!)
      await Promise.all(batch.map(row => processSingleEmail(row)));

      // Small cooldown to respect Gmail limits
      await new Promise(r => setTimeout(r, 1000));
    }

    setLoading(false);
    alert(`Batch Complete! Sent ${successCount}/${rows.length}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Batch Certificate Generator</h3>

      <div className="mb-4">
        <label className="block font-medium mb-1">1) Upload certificate background</label>
        <input type="file" accept="image/*" onChange={handleBgUpload} />
        {bgDataUrl && (
          <div className="mt-3">
            <img ref={bgImgRef} src={bgDataUrl} alt="template" style={{ maxWidth: "100%", border: "1px solid #e5e7eb" }} />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">2) Upload Excel (.xlsx or .csv)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} />
        <p className="text-sm text-gray-500 mt-2">Rows found: {rows?.length ?? 0}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Name X (pts)</label>
          <input value={nameX} onChange={(e) => setNameX(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Name Y (pts)</label>
          <input value={nameY} onChange={(e) => setNameY(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Font size</label>
          <input value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Font Name</label>
          <input value={fontName} onChange={(e) => setFontName(e.target.value)} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={generateAllZip} disabled={loading} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          {loading ? "Working..." : "Download ZIP (Test)"}
        </button>a
        <button onClick={handleSendEmails} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold">
          {loading ? "Sending..." : "Generate & Email All"}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono h-48 overflow-y-auto border max-h-[300px]">
          {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
        </div>
      )}
    </div>
  );
}