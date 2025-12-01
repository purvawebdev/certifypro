// components/CertBatchGenerator.jsx
import React, { useState, useRef } from "react";
import * as XLSX from 'xlsx/xlsx.mjs';
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function CertBatchGenerator() {
  const [bgDataUrl, setBgDataUrl] = useState(null);
  const [rows, setRows] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- UPDATED DEFAULTS FOR A4 (Points) ---
  // A4 Landscape is 842pt wide x 595pt high.
  const [nameX, setNameX] = useState(0); // 0 triggers automatic centering
  const [nameY, setNameY] = useState(300); // Vertically near middle (595/2 is ~297)
  
  const [fontSize, setFontSize] = useState(24); // Smaller font for A4 points
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
        const nameKey = keys.find(k => /name/i.test(k)) || keys[0];
        const emailKey = keys.find(k => /email/i.test(k)) || keys[1] || "";
        return {
          raw: r,
          name: String(r[nameKey] ?? "").trim(),
          email: String(r[emailKey] ?? "").trim(),
        };
      });
      setRows(normalized);
    };
    if (f.name.endsWith(".csv")) reader.readAsText(f);
    else reader.readAsBinaryString(f);
  };

  // --- UPDATED PDF GENERATION (FORCE A4 STRETCH) ---
  const generatePdfForRow = async (row) => {
    // 1. Lazy load jsPDF
    const { jsPDF } = await import("jspdf");

    // 2. Force A4 Landscape Page
    // unit: 'pt' means coordinates are in points (1/72 inch)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4", 
    });

    // Get A4 Dimensions (Should be 842 x 595)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 3. Load Image to draw it
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

    // 4. Stretch Image to fill A4 exactly
    // (0, 0) to (pageWidth, pageHeight)
    pdf.addImage(imgEl, imgType, 0, 0, pageWidth, pageHeight);

    // 5. Font Settings
    try {
      pdf.setFont(fontName, fontStyle);
    } catch {
      if (pdf.setFontType) pdf.setFontType(fontStyle || "normal");
    }
    pdf.setFontSize(Number(fontSize) || 24);
    pdf.setTextColor(0, 0, 0);

    // 6. Text Placement
    const text = row.name || "N/A";
    const textWidth = pdf.getTextWidth(text);
    
    // Center logic based on A4 width
    const centerX = (pageWidth / 2) - (textWidth / 2);
    
    // User inputs
    const userX = Number(nameX);
    const userY = Number(nameY);

    const finalX = userX ? userX : centerX;
    const finalY = userY ? userY : (pageHeight / 2);

    pdf.text(text, finalX, finalY);

    return pdf.output("arraybuffer");
  };

  const generateAll = async () => {
    if (!bgDataUrl) {
      alert("Upload background template image first");
      return;
    }
    if (!rows || rows.length === 0) {
      alert("Upload Excel file with student rows first");
      return;
    }

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
      alert("Failed to generate PDFs. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Batch Certificate Generator (A4)</h3>

      <div className="mb-4">
        <label className="block font-medium mb-1">1) Upload certificate background</label>
        <input type="file" accept="image/*" onChange={handleBgUpload} />
        {bgDataUrl && (
          <div className="mt-3">
            <img
              ref={bgImgRef}
              src={bgDataUrl}
              alt="template"
              style={{ maxWidth: "100%", border: "1px solid #e5e7eb" }}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">2) Upload Excel (.xlsx or .csv)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} />
        <p className="text-sm text-gray-500 mt-2">Rows: {rows?.length ?? 0}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm">Name X (pts)</label>
          <input value={nameX} onChange={(e) => setNameX(e.target.value)} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-400">Leave 0 to center (Max ~842)</p>
        </div>
        <div>
          <label className="block text-sm">Name Y (pts)</label>
          <input value={nameY} onChange={(e) => setNameY(e.target.value)} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-400">Max ~595</p>
        </div>
        <div>
          <label className="block text-sm">Font size</label>
          <input value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Font (times/helvetica/courier)</label>
          <input value={fontName} onChange={(e) => setFontName(e.target.value)} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={generateAll} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">
          {loading ? "Generating..." : "Generate & Download ZIP"}
        </button>
        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(rows.slice(0,3), null, 2)); }} className="bg-gray-100 px-3 rounded">
          Copy first 3 rows (debug)
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Note: This forces the output to A4 Landscape (842pt x 595pt). Your image will be stretched to fit.
      </div>
    </div>
  );
}