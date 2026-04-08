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
  // @ts-expect-error dynamic import from CDN
  _pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
  _pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
  return _pdfjsLib;
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
  targetWidth: number
): Promise<{ name: string; blob: Blob }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = targetWidth / img.width;
      const newHeight = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, targetWidth, newHeight);
      const ext = file.name.match(/\.([^.]+)$/)?.[1] || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve({ name: `${baseName}_${targetWidth}px.${ext}`, blob: blob! });
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
