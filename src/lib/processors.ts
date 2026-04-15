import { PDFDocument } from "pdf-lib";

// Sanitize text for WinAnsi encoding (Helvetica font)
function sanitize(text: string): string {
  return text
    .replace(/č/g, "c").replace(/Č/g, "C")
    .replace(/š/g, "s").replace(/Š/g, "S")
    .replace(/ž/g, "z").replace(/Ž/g, "Z")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/ć/g, "c").replace(/Ć/g, "C")
    .replace(/[^\x00-\xFF]/g, "");
}

// ===== PDF =====

export async function splitPdf(file: File): Promise<{ name: string; blob: Blob }[]> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const results: { name: string; blob: Blob }[] = [];
  const baseName = file.name.replace(/\.pdf$/i, "");

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);
    const bytes = await newPdf.save();
    results.push({
      name: `${baseName}_stran_${i + 1}.pdf`,
      blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
    });
  }
  return results;
}

export async function combinePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const data = await file.arrayBuffer();
    const pdf = await PDFDocument.load(data);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const data = await file.arrayBuffer();
    const type = file.type;
    let img;
    if (type === "image/png") {
      img = await pdf.embedPng(data);
    } else {
      // Convert to JPEG via canvas for non-jpg/png formats
      if (type !== "image/jpeg") {
        const converted = await convertToJpegArrayBuffer(file);
        img = await pdf.embedJpg(converted);
      } else {
        img = await pdf.embedJpg(data);
      }
    }
    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

async function convertToJpegArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => blob!.arrayBuffer().then(resolve),
        "image/jpeg",
        0.92
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function pdfToImages(file: File): Promise<{ name: string; blob: Blob }[]> {
  // Uses pdf.js via CDN loaded dynamically
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const results: { name: string; blob: Blob }[] = [];
  const baseName = file.name.replace(/\.pdf$/i, "");

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2; // 2x for good quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
    );
    results.push({ name: `${baseName}_stran_${i}.jpg`, blob });
  }
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfjsLib: any = null;
async function loadPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/pdf.min.js";
      script.onload = () => {
        if (w.pdfjsLib) {
          w.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
          resolve();
        } else {
          reject(new Error("pdf.js se ni naložil"));
        }
      };
      script.onerror = () => reject(new Error("Napaka pri nalaganju PDF.js"));
      document.head.appendChild(script);
    });
  }
  _pdfjsLib = w.pdfjsLib;
  return _pdfjsLib;
}

// ===== PDF TOOLS =====

export async function rotatePdf(file: File, degrees: number): Promise<Blob> {
  const { degrees: pdfDegrees } = await import("pdf-lib");
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const pages = pdf.getPages();
  for (const page of pages) {
    const current = page.getRotation().angle;
    page.setRotation(pdfDegrees((current + degrees) % 360));
  }
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function deletePages(file: File, pageNumbers: number[]): Promise<Blob> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  // Sort descending so indices don't shift
  const sorted = [...pageNumbers].sort((a, b) => b - a);
  for (const num of sorted) {
    if (num >= 0 && num < pdf.getPageCount()) {
      pdf.removePage(num);
    }
  }
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function extractPages(file: File, pageNumbers: number[]): Promise<Blob> {
  const data = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(data);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(srcPdf, pageNumbers);
  pages.forEach((p) => newPdf.addPage(p));
  const bytes = await newPdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function reorderPages(file: File, newOrder: number[]): Promise<Blob> {
  const data = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(data);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(srcPdf, newOrder);
  pages.forEach((p) => newPdf.addPage(p));
  const bytes = await newPdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function compressPdf(file: File): Promise<Blob> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function watermarkPdf(file: File, text: string): Promise<Blob> {
  const { rgb, degrees } = await import("pdf-lib");
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const pages = pdf.getPages();
  const font = await pdf.embedFont("Helvetica" as never);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.08;
    const safeText = sanitize(text);
    const textWidth = font.widthOfTextAtSize(safeText, fontSize);
    page.drawText(safeText, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      rotate: degrees(45),
      opacity: 0.3,
    });
  }
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function addPageNumbers(file: File): Promise<Blob> {
  const { rgb } = await import("pdf-lib");
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const pages = pdf.getPages();
  const font = await pdf.embedFont("Helvetica" as never);

  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const text = String(i + 1);
    const textWidth = font.widthOfTextAtSize(text, 12);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 20,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function addTextToPdf(
  file: File,
  text: string,
  pageNum: number,
  x: number,
  y: number,
  fontSize: number
): Promise<Blob> {
  const { rgb } = await import("pdf-lib");
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const page = pdf.getPage(pageNum);
  const font = await pdf.embedFont("Helvetica" as never);
  page.drawText(sanitize(text), {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function protectPdf(file: File, password: string): Promise<Blob> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const bytes = await pdf.save({
    userPassword: password,
    ownerPassword: password,
  } as never);
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  return pdf.getPageCount();
}

// ===== DOCUMENT CONVERSIONS =====

export async function pdfToWord(file: File): Promise<{ name: string; blob: Blob }> {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  // Create simple .docx using XML
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${fullText.split("\n\n").filter(Boolean).map(p =>
    `<w:p><w:r><w:t xml:space="preserve">${p.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</w:t></w:r></w:p>`
  ).join("")}</w:body></w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.folder("_rels")!.file(".rels", rels);
  zip.folder("word")!.file("document.xml", docXml);

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { name: `${baseName}.docx`, blob };
}

export async function pdfToExcel(file: File): Promise<{ name: string; blob: Blob }> {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const XLSX = await import("xlsx");

  const rows: string[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = content.items as any[];

    // Collect all text items with their X and Y positions
    const textItems: { x: number; y: number; text: string; width: number }[] = [];
    for (const item of items) {
      if (!item.str || item.str.trim() === "") continue;
      textItems.push({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        text: item.str,
        width: item.width || 0,
      });
    }

    if (textItems.length === 0) continue;

    // Group by Y position (with tolerance of 3px for same row)
    const yTolerance = 3;
    const rowGroups: Map<number, typeof textItems> = new Map();
    for (const item of textItems) {
      let foundY = false;
      for (const key of rowGroups.keys()) {
        if (Math.abs(key - item.y) <= yTolerance) {
          rowGroups.get(key)!.push(item);
          foundY = true;
          break;
        }
      }
      if (!foundY) {
        rowGroups.set(item.y, [item]);
      }
    }

    // Collect all unique X positions to determine columns
    const allX = textItems.map((t) => t.x).sort((a, b) => a - b);

    // Cluster X positions into columns (gap > 15px = new column)
    const colPositions: number[] = [allX[0]];
    for (let j = 1; j < allX.length; j++) {
      const lastCol = colPositions[colPositions.length - 1];
      if (allX[j] - lastCol > 15) {
        colPositions.push(allX[j]);
      }
    }

    // Find which column an X position belongs to
    const getCol = (x: number): number => {
      let best = 0;
      let bestDist = Math.abs(x - colPositions[0]);
      for (let j = 1; j < colPositions.length; j++) {
        const dist = Math.abs(x - colPositions[j]);
        if (dist < bestDist) {
          bestDist = dist;
          best = j;
        }
      }
      return best;
    };

    // Sort rows top to bottom
    const sortedYs = [...rowGroups.keys()].sort((a, b) => b - a);

    for (const y of sortedYs) {
      const items = rowGroups.get(y)!;
      // Sort items left to right
      items.sort((a, b) => a.x - b.x);

      const row: string[] = new Array(colPositions.length).fill("");
      for (const item of items) {
        const col = getCol(item.x);
        if (row[col]) {
          row[col] += " " + item.text;
        } else {
          row[col] = item.text;
        }
      }
      rows.push(row);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const baseName = file.name.replace(/\.pdf$/i, "");
  return { name: `${baseName}.xlsx`, blob };
}

export async function pdfToPptx(file: File): Promise<{ name: string; blob: Blob }[]> {
  // Convert each PDF page to an image (reuse pdfToImages), user can import into PPTX
  return pdfToImages(file);
}

export async function wordToPdf(file: File): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = await import("mammoth") as any;
  const data = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: data });
  const html = result.value as string;

  // Render HTML to canvas then to PDF
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont("Helvetica" as never);

  // Strip HTML tags for text extraction
  const text = html.replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const lines = text.split("\n").filter(l => l.trim());

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const lineHeight = 16;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    const pageLines = lines.slice(i, i + maxLinesPerPage);
    pageLines.forEach((line, idx) => {
      const trimmed = sanitize(line.trim().substring(0, 80));
      page.drawText(trimmed, {
        x: margin,
        y: pageHeight - margin - idx * lineHeight,
        size: 11,
        font,
      });
    });
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function excelToPdf(file: File): Promise<Blob> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont("Helvetica" as never);
  const { rgb } = await import("pdf-lib");

  const pageWidth = 842; // landscape A4
  const pageHeight = 595;
  const margin = 40;
  const rowHeight = 18;
  const maxRows = Math.floor((pageHeight - margin * 2) / rowHeight);

  for (let i = 0; i < rows.length; i += maxRows) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    const pageRows = rows.slice(i, i + maxRows);

    pageRows.forEach((row, rIdx) => {
      const y = pageHeight - margin - rIdx * rowHeight;
      row.forEach((cell, cIdx) => {
        const x = margin + cIdx * 120;
        if (x < pageWidth - margin) {
          page.drawText(sanitize(String(cell ?? "").substring(0, 20)), {
            x, y, size: 9, font, color: rgb(0, 0, 0),
          });
        }
      });
      // Draw row line
      page.drawLine({
        start: { x: margin, y: y - 4 },
        end: { x: pageWidth - margin, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    });
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function pptxToPdf(file: File): Promise<Blob> {
  // Extract text from PPTX slides and render to PDF
  const { default: JSZip } = await import("jszip");
  const data = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(data);

  const slides: string[] = [];
  let i = 1;
  while (true) {
    const slideFile = zip.file(`ppt/slides/slide${i}.xml`);
    if (!slideFile) break;
    const xml = await slideFile.async("text");
    // Extract text from <a:t> tags
    const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]);
    slides.push(texts.join(" "));
    i++;
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont("Helvetica" as never);

  for (const slideText of slides) {
    const page = pdf.addPage([960, 540]); // 16:9
    const lines = slideText.match(/.{1,80}/g) || [slideText];
    lines.forEach((line, idx) => {
      page.drawText(sanitize(line), {
        x: 50,
        y: 490 - idx * 20,
        size: 14,
        font,
      });
    });
  }

  if (slides.length === 0) {
    const page = pdf.addPage([960, 540]);
    page.drawText("Ni vsebine za pretvorbo", { x: 50, y: 270, size: 16, font } as never);
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export async function compressImage(
  file: File,
  quality: number
): Promise<{ name: string; blob: Blob }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve({ name: `${baseName}_stisnjeno.jpg`, blob: blob! });
        },
        "image/jpeg",
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

// ===== SLIKE =====

export async function convertImage(
  file: File,
  targetFormat: string
): Promise<{ name: string; blob: Blob }> {
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    bmp: "image/bmp",
  };
  const mime = mimeMap[targetFormat] || "image/jpeg";

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      if (targetFormat === "jpg" || targetFormat === "bmp") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve({ name: `${baseName}.${targetFormat}`, blob: blob! });
        },
        mime,
        0.92
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight?: number
): Promise<{ name: string; blob: Blob }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let newWidth: number;
      let newHeight: number;

      if (targetWidth && targetHeight) {
        newWidth = targetWidth;
        newHeight = targetHeight;
      } else if (targetWidth) {
        const ratio = targetWidth / img.width;
        newWidth = targetWidth;
        newHeight = Math.round(img.height * ratio);
      } else if (targetHeight) {
        const ratio = targetHeight / img.height;
        newWidth = Math.round(img.width * ratio);
        newHeight = targetHeight;
      } else {
        newWidth = img.width;
        newHeight = img.height;
      }

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const ext = file.name.match(/\.([^.]+)$/)?.[1] || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve({ name: `${baseName}_${newWidth}x${newHeight}.${ext}`, blob: blob! });
        },
        mime,
        0.92
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

// ===== SCAN =====

export async function scanToPdf(
  images: Blob[],
  filter: "color" | "grayscale" | "bw"
): Promise<Blob> {
  const pdf = await PDFDocument.create();

  for (const imageBlob of images) {
    const processed = await applyScanFilter(imageBlob, filter);
    const data = await processed.arrayBuffer();
    let img;
    if (processed.type === "image/png") {
      img = await pdf.embedPng(data);
    } else {
      img = await pdf.embedJpg(data);
    }
    // A4 proportions: fit image to page
    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const scale = Math.min(A4_WIDTH / img.width, A4_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(img, {
      x: (A4_WIDTH - w) / 2,
      y: (A4_HEIGHT - h) / 2,
      width: w,
      height: h,
    });
  }

  const bytes = await pdf.save();
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

function applyScanFilter(
  imageBlob: Blob,
  filter: "color" | "grayscale" | "bw"
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Step 1: Convert to grayscale array for processing
      const gray = new Float32Array(w * h);
      for (let i = 0; i < gray.length; i++) {
        gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      }

      if (filter === "color") {
        // Color scan: just white-balance, remove shadows, boost contrast
        // Estimate background brightness with large-block sampling
        const blockSize = Math.max(32, Math.floor(Math.min(w, h) / 8));
        const bgMap = estimateBackground(gray, w, h, blockSize);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const bg = bgMap[y * w + x];
            const scale = bg > 20 ? 240 / bg : 1;
            d[idx]     = clamp(d[idx] * scale);
            d[idx + 1] = clamp(d[idx + 1] * scale);
            d[idx + 2] = clamp(d[idx + 2] * scale);
          }
        }

        // Gentle sharpening
        sharpenImageData(d, w, h, 0.3);
      } else if (filter === "grayscale") {
        // Grayscale scan: remove shadows, good contrast, clean look
        const blockSize = Math.max(32, Math.floor(Math.min(w, h) / 8));
        const bgMap = estimateBackground(gray, w, h, blockSize);

        for (let i = 0; i < gray.length; i++) {
          const bg = bgMap[i];
          // Normalize: make background white, scale foreground
          let val = bg > 20 ? (gray[i] / bg) * 240 : gray[i];
          // Contrast curve — S-curve for crisper text
          val = sCurve(val, 1.4);
          const v = clamp(val);
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        }

        sharpenImageData(d, w, h, 0.4);
      } else {
        // B&W scan: adaptive threshold — like a real scanner
        // Remove shadows with background estimation
        const blockSize = Math.max(32, Math.floor(Math.min(w, h) / 8));
        const bgMap = estimateBackground(gray, w, h, blockSize);

        // Normalize against background
        const normalized = new Float32Array(w * h);
        for (let i = 0; i < gray.length; i++) {
          const bg = bgMap[i];
          normalized[i] = bg > 20 ? (gray[i] / bg) * 255 : gray[i];
        }

        // Adaptive thresholding with local window
        const windowSize = Math.max(15, Math.floor(Math.min(w, h) / 40) | 1);
        const halfWin = Math.floor(windowSize / 2);

        // Build integral image for fast local mean
        const integral = new Float64Array((w + 1) * (h + 1));
        for (let y = 0; y < h; y++) {
          let rowSum = 0;
          for (let x = 0; x < w; x++) {
            rowSum += normalized[y * w + x];
            integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
          }
        }

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const x1 = Math.max(0, x - halfWin);
            const y1 = Math.max(0, y - halfWin);
            const x2 = Math.min(w - 1, x + halfWin);
            const y2 = Math.min(h - 1, y + halfWin);
            const area = (x2 - x1 + 1) * (y2 - y1 + 1);
            const sum = integral[(y2 + 1) * (w + 1) + (x2 + 1)]
                      - integral[y1 * (w + 1) + (x2 + 1)]
                      - integral[(y2 + 1) * (w + 1) + x1]
                      + integral[y1 * (w + 1) + x1];
            const localMean = sum / area;
            // Sauvola-inspired threshold: pixel must be notably darker than local mean
            const threshold = localMean * (1 - 0.2 * (1 - normalized[y * w + x] / 255));
            const val = normalized[y * w + x] < threshold - 8 ? 0 : 255;
            const idx = (y * w + x) * 4;
            d[idx] = d[idx + 1] = d[idx + 2] = val;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => resolve(blob!),
        "image/jpeg",
        0.95
      );
    };
    img.src = URL.createObjectURL(imageBlob);
  });
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function sCurve(val: number, strength: number): number {
  const normalized = val / 255;
  const curved = 1 / (1 + Math.exp(-strength * 10 * (normalized - 0.5)));
  return curved * 255;
}

// Estimate background brightness using block-based max values
// This helps remove shadows and uneven lighting
function estimateBackground(
  gray: Float32Array, w: number, h: number, blockSize: number
): Float32Array {
  const bw = Math.ceil(w / blockSize);
  const bh = Math.ceil(h / blockSize);
  // Find max (brightest = background) per block
  const blockMax = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let max = 0;
      const yStart = by * blockSize;
      const yEnd = Math.min(yStart + blockSize, h);
      const xStart = bx * blockSize;
      const xEnd = Math.min(xStart + blockSize, w);
      // Use 90th percentile instead of max for robustness
      const vals: number[] = [];
      for (let y = yStart; y < yEnd; y += 2) {
        for (let x = xStart; x < xEnd; x += 2) {
          vals.push(gray[y * w + x]);
        }
      }
      vals.sort((a, b) => a - b);
      max = vals[Math.floor(vals.length * 0.9)] || 200;
      blockMax[by * bw + bx] = Math.max(max, 30); // never below 30
    }
  }
  // Bilinear interpolation to full image
  const bg = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fx = (x / blockSize) - 0.5;
      const fy = (y / blockSize) - 0.5;
      const bx0 = Math.max(0, Math.floor(fx));
      const by0 = Math.max(0, Math.floor(fy));
      const bx1 = Math.min(bw - 1, bx0 + 1);
      const by1 = Math.min(bh - 1, by0 + 1);
      const tx = fx - bx0;
      const ty = fy - by0;
      const v00 = blockMax[by0 * bw + bx0];
      const v10 = blockMax[by0 * bw + bx1];
      const v01 = blockMax[by1 * bw + bx0];
      const v11 = blockMax[by1 * bw + bx1];
      bg[y * w + x] = v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty)
                     + v01 * (1 - tx) * ty + v11 * tx * ty;
    }
  }
  return bg;
}

// Unsharp mask sharpening
function sharpenImageData(d: Uint8ClampedArray, w: number, h: number, amount: number) {
  const copy = new Uint8ClampedArray(d);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c] * 5;
        const neighbors = copy[((y - 1) * w + x) * 4 + c]
                        + copy[((y + 1) * w + x) * 4 + c]
                        + copy[(y * w + x - 1) * 4 + c]
                        + copy[(y * w + x + 1) * 4 + c];
        const sharpened = center - neighbors;
        d[idx + c] = clamp(copy[idx + c] + sharpened * amount);
      }
    }
  }
}

// ===== VIDEO (ffmpeg.wasm) =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const ff = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ff.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpegInstance = ff;
  return ff;
}

export async function convertVideo(
  file: File,
  targetFormat: string,
  onProgress?: (ratio: number) => void
): Promise<{ name: string; blob: Blob }> {
  const ff = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const inputName = "input" + getExt(file.name);
  const outputName = "output." + targetFormat;

  ff.on("progress", ({ ratio }: { ratio: number }) => onProgress?.(ratio));
  await ff.writeFile(inputName, await fetchFile(file));

  const args = buildVideoArgs(inputName, outputName, targetFormat);
  await ff.exec(args);

  const data = await ff.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: getMime(targetFormat) });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { name: `${baseName}.${targetFormat}`, blob };
}

export async function cutVideo(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: (ratio: number) => void
): Promise<{ name: string; blob: Blob }> {
  const ff = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const ext = getExt(file.name);
  const inputName = "input" + ext;
  const outputName = "output" + ext;

  ff.on("progress", ({ ratio }: { ratio: number }) => onProgress?.(ratio));
  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec([
    "-i", inputName,
    "-ss", String(startSec),
    "-to", String(endSec),
    "-c", "copy",
    "-avoid_negative_ts", "make_zero",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: file.type || "video/mp4" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { name: `${baseName}_cut${ext}`, blob };
}

export async function extractAudio(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<{ name: string; blob: Blob }> {
  const ff = await getFFmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  const inputName = "input" + getExt(file.name);
  const outputName = "output.mp3";

  ff.on("progress", ({ ratio }: { ratio: number }) => onProgress?.(ratio));
  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec(["-i", inputName, "-vn", "-acodec", "libmp3lame", "-q:a", "2", outputName]);

  const data = await ff.readFile(outputName);
  const blob = new Blob([data as unknown as BlobPart], { type: "audio/mpeg" });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return { name: `${baseName}.mp3`, blob };
}

function getExt(filename: string): string {
  const m = filename.match(/(\.[^.]+)$/);
  return m ? m[1].toLowerCase() : ".mp4";
}

function getMime(format: string): string {
  const map: Record<string, string> = {
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mov: "video/quicktime",
    webm: "video/webm",
    gif: "image/gif",
    mp3: "audio/mpeg",
  };
  return map[format] || "video/mp4";
}

function buildVideoArgs(input: string, output: string, format: string): string[] {
  if (format === "mp3") return ["-i", input, "-vn", "-acodec", "libmp3lame", "-q:a", "2", output];
  if (format === "gif") return ["-i", input, "-vf", "fps=12,scale=480:-1:flags=lanczos", "-loop", "0", output];
  if (format === "webm") return ["-i", input, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus", output];
  return ["-i", input, "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", output];
}
