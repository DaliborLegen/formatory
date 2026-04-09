import { PDFDocument } from "pdf-lib";

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
  const cdnUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
  _pdfjsLib = await import(/* webpackIgnore: true */ cdnUrl);
  _pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
  return _pdfjsLib;
}

// ===== PDF TOOLS =====

export async function rotatePdf(file: File, degrees: number): Promise<Blob> {
  const data = await file.arrayBuffer();
  const pdf = await PDFDocument.load(data);
  const pages = pdf.getPages();
  for (const page of pages) {
    page.setRotation({ type: 0, angle: (page.getRotation().angle + degrees) % 360 } as never);
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
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
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
  page.drawText(text, {
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

    // Group by Y position to detect rows
    const lineMap = new Map<number, string[]>();
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item.str);
    }

    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      rows.push(lineMap.get(y)!);
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
      const trimmed = line.trim().substring(0, 80);
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
          page.drawText(String(cell ?? "").substring(0, 20), {
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
      page.drawText(line, {
        x: 50,
        y: 490 - idx * 20,
        size: 14,
        font,
      });
    });
  }

  if (slides.length === 0) {
    const page = pdf.addPage([960, 540]);
    page.drawText("Ni vsebine za pretvorbo", { x: 50, y: 270, size: 16, font });
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
