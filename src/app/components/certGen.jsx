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

  // --- PDF GENERATION ---
  const generatePdfForRow = async (row) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const loadImgEl = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    if (!bgDataUrl) throw new Error("Background not loaded");
    const imgEl = await loadImgEl(bgDataUrl);
    const imgType = bgDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

    pdf.addImage(imgEl, imgType, 0, 0, pageWidth, pageHeight);

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

    return pdf.output("arraybuffer");
  };

  // --- EXISTING ZIP FUNCTION ---
  const generateAllZip = async () => {
    if (!bgDataUrl) return alert("Upload background template image first");
    if (!rows || rows.length === 0) return alert("Upload Excel file first");

    setLoading(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nameSafe = (row.name || `student_${i + 1}`).replace(/[^\w\s.-]/g, "");
        try {
          const ab = await generatePdfForRow(row);
          zip.file(`${nameSafe}.pdf`, ab);
        } catch (e) {
          console.error("pdf gen error for row", row, e);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "certificates.zip");
    } catch (err) {
      console.error(err);
      alert("Failed to generate ZIP.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW EMAIL FUNCTION (Connected to API) ---
  const handleSendEmails = async () => {
    if (!bgDataUrl) return alert("Upload background template image first");
    if (!rows || rows.length === 0) return alert("Upload Excel file first");

    if (!confirm(`Are you sure you want to send emails to ${rows.length} people?`)) return;

    setLoading(true);
    setLogs([]); 
    let successCount = 0;

    const addLog = (msg) => setLogs((prev) => [...prev, msg]);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.email || !row.email.includes("@")) {
        addLog(`⚠️ Skipped ${row.name}: Invalid email`);
        continue;
      }

      try {
        addLog(`⏳ Processing ${row.name}...`);

        const pdfBuffer = await generatePdfForRow(row);
        const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });

        const formData = new FormData();
        formData.append("pdf", pdfBlob, "certificate.pdf");
        formData.append("email", row.email);
        formData.append("name", row.name);

        const response = await fetch("/api/send-certificate", {
          method: "POST",
          body: formData,
        });
        
        const result = await response.json();

        if (response.ok) {
          successCount++;
          addLog(`✅ Sent to ${row.email}`);
        } else {
          addLog(`❌ Error for ${row.name}: ${result.error}`);
        }
      } catch (e) {
        console.error(e);
        addLog(`❌ System error for ${row.name}`);
      }
      
      // Delay to respect API limits
      await new Promise((r) => setTimeout(r, 1000));
    }

    setLoading(false);
    alert(`Batch Complete! Sent ${successCount} emails.`);
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
        </button>
        <button onClick={handleSendEmails} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold">
          {loading ? "Sending..." : "Generate & Email All"}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono h-48 overflow-y-auto border">
          {logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
        </div>
      )}
    </div>
  );
}