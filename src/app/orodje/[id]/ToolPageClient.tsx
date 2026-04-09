"use client";
import { useState, useRef, useCallback } from "react";
import type { Tool } from "@/lib/tools";
import Link from "next/link";

type Status = "idle" | "processing" | "done" | "error";
type ResultFile = { name: string; blob: Blob };

// Parse "1, 3, 5-8" into zero-based page indices
function parsePageInput(input: string, total: number): number[] {
  const result: number[] = [];
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [a, b] = trimmed.split("-").map(Number);
      for (let i = a; i <= b && i <= total; i++) {
        if (i >= 1) result.push(i - 1);
      }
    } else {
      const n = parseInt(trimmed);
      if (n >= 1 && n <= total) result.push(n - 1);
    }
  }
  return result;
}

const FORMAT_OPTIONS: Record<string, string[]> = {
  img_convert: ["jpg", "png", "webp", "bmp"],
  vid_convert: ["mp4", "avi", "mkv", "mov", "webm", "gif", "mp3"],
  compress_img: ["30", "50", "70", "85"],
};

export default function ToolPageClient({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [error, setError] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_OPTIONS[tool.id]?.[0] || "");
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const [cutStart, setCutStart] = useState("0");
  const [cutEnd, setCutEnd] = useState("10");
  const [videoDuration, setVideoDuration] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [videoQuality, setVideoQuality] = useState("720");
  const [rotateDeg, setRotateDeg] = useState("90");
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState("");
  const [watermarkText, setWatermarkText] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [addTextVal, setAddTextVal] = useState("");
  const [addTextPage, setAddTextPage] = useState("1");
  const [addTextX, setAddTextX] = useState("50");
  const [addTextY, setAddTextY] = useState("700");
  const [addTextSize, setAddTextSize] = useState("16");
  const [pageOrder, setPageOrder] = useState("");

  const resetAll = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadFile = (r: ResultFile) => {
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Video download tool - special UI
  if (tool.id === "vid_download") {
    const platforms = [
      { name: "YouTube", icon: "▶️", color: "bg-red" },
      { name: "Instagram", icon: "📷", color: "bg-pink" },
      { name: "TikTok", icon: "🎵", color: "bg-txt" },
      { name: "Facebook", icon: "👤", color: "bg-accent" },
    ];

    const detectPlatform = (url: string) => {
      if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
      if (/instagram\.com/i.test(url)) return "Instagram";
      if (/tiktok\.com/i.test(url)) return "TikTok";
      if (/facebook\.com|fb\.watch/i.test(url)) return "Facebook";
      return null;
    };

    const detectedPlatform = detectPlatform(downloadUrl);

    const doDownload = async () => {
      if (!downloadUrl.trim()) return;
      setStatus("processing");
      setProgress(0);
      setError("");
      setResults([]);
      try {
        const response = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: downloadUrl.trim(), quality: videoQuality }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Napaka: ${response.status}`);
        }
        const blob = await response.blob();
        const disposition = response.headers.get("content-disposition");
        let fileName = "video.mp4";
        if (disposition) {
          const match = disposition.match(/filename="?([^";\n]+)"?/);
          if (match) fileName = match[1];
        }
        setResults([{ name: fileName, blob }]);
        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Napaka pri prenosu");
        setStatus("error");
      }
    };

    return (
      <div>
        <Link href="/" className="text-accent text-sm mb-6 inline-flex items-center gap-1.5 hover:underline font-medium">
          ← Nazaj
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <span className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-sm`}>
            {tool.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-txt tracking-tight">{tool.title}</h1>
            <p className="text-sm text-txt2 mt-0.5">{tool.sub}</p>
          </div>
        </div>

        {/* Supported platforms */}
        <div className="flex gap-3 mb-6">
          {platforms.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                detectedPlatform === p.name
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-txt2"
              }`}
            >
              <span>{p.icon}</span>
              {p.name}
            </div>
          ))}
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <label className="text-sm font-semibold text-txt mb-2 block">Prilepite povezavo do videa</label>
              <input
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
              {detectedPlatform && (
                <p className="text-xs text-accent2 mt-2 font-medium">
                  ✓ Zaznana platforma: {detectedPlatform}
                </p>
              )}
            </div>

            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <p className="text-sm font-semibold text-txt mb-3">Kakovost videa</p>
              <div className="flex flex-wrap gap-2">
                {["360", "480", "720", "1080"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setVideoQuality(q)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      videoQuality === q
                        ? "bg-accent text-white shadow-sm"
                        : "bg-bg2 text-txt2 hover:text-txt border border-border"
                    }`}
                  >
                    {q}p
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={doDownload}
              disabled={!downloadUrl.trim()}
              className="w-full bg-red hover:bg-red/90 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              ⬇️ Prenesi video
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="bg-surface rounded-2xl border border-border p-10 text-center shadow-sm">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <p className="text-sm font-medium text-txt mb-1">Prenašam video...</p>
            <p className="text-xs text-txt3">To lahko traja nekaj trenutkov</p>
          </div>
        )}

        {status === "done" && (
          <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-bold text-txt">Video prenesen!</p>
            </div>
            <div className="space-y-2 mb-6">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-bg2 rounded-xl px-4 py-3">
                  <span className="text-sm text-txt truncate flex-1 mr-3">{r.name} ({fmtSize(r.blob.size)})</span>
                  <button onClick={() => downloadFile(r)} className="text-sm text-accent font-semibold shrink-0 hover:underline">
                    Prenesi
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => { resetAll(); setDownloadUrl(""); }}
              className="w-full bg-bg2 border border-border text-txt font-medium py-3 rounded-xl text-sm hover:bg-surface-hover transition-all duration-200"
            >
              Prenesi še en video
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-surface rounded-2xl border border-red/30 p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-base font-semibold text-red mb-2">Napaka</p>
            <p className="text-sm text-txt2 mb-6">{error}</p>
            <button
              onClick={resetAll}
              className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-8 rounded-xl text-sm transition-all duration-200 shadow-sm"
            >
              Poskusi znova
            </button>
          </div>
        )}

        <p className="text-center text-xs text-txt3 mt-8">
          Prilepite povezavo iz YouTube, Instagram, TikTok ali Facebook.
        </p>
      </div>
    );
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files);
      setFiles(tool.multiple ? dropped : [dropped[0]]);
    },
    [tool.multiple]
  );

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(tool.multiple ? selected : [selected[0]]);

    // Get PDF page count for PDF tools
    const pdfTools = ["rotate_pdf", "delete_pages", "extract_pages", "reorder_pages", "add_text"];
    if (pdfTools.includes(tool.id) && selected[0]) {
      import("@/lib/processors").then((proc) =>
        proc.getPdfPageCount(selected[0]).then((count) => {
          setPdfPageCount(count);
          setPageOrder(Array.from({ length: count }, (_, i) => i + 1).join(", "));
        })
      );
    }

    if (tool.id === "img_resize" && selected[0]) {
      const img = new window.Image();
      img.onload = () => {
        setOriginalSize({ w: img.width, h: img.height });
        setResizeWidth(String(img.width));
        setResizeHeight(String(img.height));
      };
      img.src = URL.createObjectURL(selected[0]);
    }

    if (tool.id.startsWith("vid_") && selected[0]) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(selected[0]);
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setCutEnd(video.duration.toFixed(1));
      };
    }
  };

  const process = async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setProgress(0);
    setError("");
    setResults([]);

    try {
      const proc = await import("@/lib/processors");
      let res: ResultFile[] = [];

      switch (tool.id) {
        case "split": {
          res = await proc.splitPdf(files[0]);
          break;
        }
        case "combine": {
          const blob = await proc.combinePdfs(files);
          res = [{ name: "zdruzeno.pdf", blob }];
          break;
        }
        case "img2pdf": {
          const blob = await proc.imagesToPdf(files);
          res = [{ name: "slike.pdf", blob }];
          break;
        }
        case "pdf2img": {
          res = await proc.pdfToImages(files[0]);
          break;
        }
        case "img_convert": {
          const all = await Promise.all(
            files.map((f) => proc.convertImage(f, selectedFormat))
          );
          res = all;
          break;
        }
        case "img_resize": {
          const w = parseInt(resizeWidth) || 0;
          const h = parseInt(resizeHeight) || 0;
          const all = await Promise.all(
            files.map((f) => proc.resizeImage(f, w, h || undefined))
          );
          res = all;
          break;
        }
        case "vid_convert": {
          const r = await proc.convertVideo(files[0], selectedFormat, setProgress);
          res = [r];
          break;
        }
        case "vid_cut": {
          const r = await proc.cutVideo(
            files[0],
            parseFloat(cutStart),
            parseFloat(cutEnd),
            setProgress
          );
          res = [r];
          break;
        }
        case "vid_audio": {
          const r = await proc.extractAudio(files[0], setProgress);
          res = [r];
          break;
        }
        case "rotate_pdf": {
          const blob = await proc.rotatePdf(files[0], parseInt(rotateDeg));
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_zavrteno.pdf"), blob }];
          break;
        }
        case "delete_pages": {
          const pages = parsePageInput(selectedPages, pdfPageCount);
          const blob = await proc.deletePages(files[0], pages);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_brez_strani.pdf"), blob }];
          break;
        }
        case "extract_pages": {
          const pages = parsePageInput(selectedPages, pdfPageCount);
          const blob = await proc.extractPages(files[0], pages);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_izvleceno.pdf"), blob }];
          break;
        }
        case "reorder_pages": {
          const order = pageOrder.split(",").map((s) => parseInt(s.trim()) - 1).filter((n) => !isNaN(n));
          const blob = await proc.reorderPages(files[0], order);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_prevrsceno.pdf"), blob }];
          break;
        }
        case "compress_pdf": {
          const blob = await proc.compressPdf(files[0]);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_stisnjeno.pdf"), blob }];
          break;
        }
        case "watermark_pdf": {
          const blob = await proc.watermarkPdf(files[0], watermarkText || "DRAFT");
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_zig.pdf"), blob }];
          break;
        }
        case "page_numbers": {
          const blob = await proc.addPageNumbers(files[0]);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_stevilke.pdf"), blob }];
          break;
        }
        case "add_text": {
          const blob = await proc.addTextToPdf(
            files[0], addTextVal, parseInt(addTextPage) - 1,
            parseInt(addTextX), parseInt(addTextY), parseInt(addTextSize)
          );
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_besedilo.pdf"), blob }];
          break;
        }
        case "protect_pdf": {
          const blob = await proc.protectPdf(files[0], pdfPassword);
          res = [{ name: files[0].name.replace(/\.pdf$/i, "_zasciteno.pdf"), blob }];
          break;
        }
        case "pdf2word": {
          const r = await proc.pdfToWord(files[0]);
          res = [r];
          break;
        }
        case "pdf2excel": {
          const r = await proc.pdfToExcel(files[0]);
          res = [r];
          break;
        }
        case "pdf2pptx": {
          res = await proc.pdfToPptx(files[0]);
          break;
        }
        case "word2pdf": {
          const blob = await proc.wordToPdf(files[0]);
          res = [{ name: files[0].name.replace(/\.(docx?|doc)$/i, ".pdf"), blob }];
          break;
        }
        case "excel2pdf": {
          const blob = await proc.excelToPdf(files[0]);
          res = [{ name: files[0].name.replace(/\.(xlsx?|xls|csv)$/i, ".pdf"), blob }];
          break;
        }
        case "pptx2pdf": {
          const blob = await proc.pptxToPdf(files[0]);
          res = [{ name: files[0].name.replace(/\.(pptx?|ppt)$/i, ".pdf"), blob }];
          break;
        }
        case "compress_img": {
          const q = parseInt(selectedFormat || "70") / 100;
          const all = await Promise.all(
            files.map((f) => proc.compressImage(f, q))
          );
          res = all;
          break;
        }
      }

      setResults(res);
      setStatus("done");

      // Track conversion in analytics
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: tool.id }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri obdelavi");
      setStatus("error");
    }
  };

  const download = (r: ResultFile) => {
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => results.forEach(download);

  const reset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      {/* Back + title */}
      <Link href="/" className="text-accent text-sm mb-6 inline-flex items-center gap-1.5 hover:underline font-medium">
        ← Nazaj
      </Link>
      <div className="flex items-center gap-4 mb-8">
        <span className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center text-white text-2xl shadow-sm`}>
          {tool.icon}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-txt tracking-tight">{tool.title}</h1>
          <p className="text-sm text-txt2 mt-0.5">{tool.sub}</p>
        </div>
      </div>

      {/* Basic conversion warning */}
      {["pdf2word", "pdf2excel", "pdf2pptx", "word2pdf", "excel2pdf", "pptx2pdf"].includes(tool.id) && (
        <div className="mb-6 bg-bg2 border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-txt2">
            ⚡ Osnovna pretvorba — ohranja besedilo, ne pa oblikovanja (tabele, slike, fonti). Za zahtevnejše dokumente priporočamo namizne programe.
          </p>
        </div>
      )}

      {/* Drop zone */}
      {status === "idle" && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-accent/50 hover:bg-surface/80 transition-all duration-200"
          >
            <p className="text-4xl mb-3">📁</p>
            <p className="text-sm font-medium text-txt mb-1">
              Povlecite datoteke sem ali kliknite za izbiro
            </p>
            <p className="text-xs text-txt3">{tool.sub}</p>
            <input
              ref={inputRef}
              type="file"
              accept={tool.accept}
              multiple={tool.multiple}
              onChange={onSelect}
              className="hidden"
            />
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                <p className="text-sm font-semibold text-txt mb-3">
                  {files.length} {files.length === 1 ? "datoteka" : "datotek"} izbran{files.length === 1 ? "a" : "ih"}
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {files.map((f, i) => (
                    <p key={i} className="text-xs text-txt2 truncate">
                      {f.name} ({formatSize(f.size)})
                    </p>
                  ))}
                </div>
              </div>

              {/* Format picker */}
              {FORMAT_OPTIONS[tool.id] && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-txt mb-3">{tool.id === "compress_img" ? "Kakovost" : "Ciljni format"}</p>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS[tool.id].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedFormat === fmt
                            ? "bg-accent text-white shadow-sm"
                            : "bg-bg2 text-txt2 hover:text-txt border border-border"
                        }`}
                      >
                        {tool.id === "compress_img" ? `${fmt}%` : `.${fmt.toUpperCase()}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resize dimensions */}
              {tool.id === "img_resize" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-txt">Velikost (px)</p>
                    {originalSize.w > 0 && (
                      <span className="text-xs text-txt3">Originalno: {originalSize.w} × {originalSize.h}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div>
                      <label className="text-xs font-medium text-txt2 mb-1 block">Širina</label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => {
                          const w = e.target.value;
                          setResizeWidth(w);
                          if (keepRatio && originalSize.w > 0 && w) {
                            const ratio = originalSize.h / originalSize.w;
                            setResizeHeight(String(Math.round(parseInt(w) * ratio)));
                          }
                        }}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setKeepRatio(!keepRatio)}
                      className={`mt-5 w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-all ${
                        keepRatio
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-txt3 hover:border-accent/40"
                      }`}
                      title={keepRatio ? "Razmerje zaklenjeno" : "Razmerje odklenjeno"}
                    >
                      {keepRatio ? "🔗" : "🔓"}
                    </button>
                    <div>
                      <label className="text-xs font-medium text-txt2 mb-1 block">Višina</label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => {
                          const h = e.target.value;
                          setResizeHeight(h);
                          if (keepRatio && originalSize.h > 0 && h) {
                            const ratio = originalSize.w / originalSize.h;
                            setResizeWidth(String(Math.round(parseInt(h) * ratio)));
                          }
                        }}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-txt3 mt-3">
                    {keepRatio ? "Razmerje stranic je zaklenjeno" : "Prosto spreminjanje dimenzij"}
                  </p>
                </div>
              )}

              {/* Video cut controls */}
              {tool.id === "vid_cut" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-txt mb-4">
                    Izreži od — do {videoDuration > 0 && `(trajanje: ${videoDuration.toFixed(1)}s)`}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-accent2">Od (sekunde)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={videoDuration || 9999}
                        value={cutStart}
                        onChange={(e) => setCutStart(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt mt-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-red">Do (sekunde)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={videoDuration || 9999}
                        value={cutEnd}
                        onChange={(e) => setCutEnd(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt mt-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rotate PDF */}
              {tool.id === "rotate_pdf" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-txt mb-3">Kot vrtenja</p>
                  <div className="flex gap-2">
                    {["90", "180", "270"].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotateDeg(deg)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          rotateDeg === deg ? "bg-accent text-white" : "bg-bg2 text-txt2 border border-border"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Page selection for delete/extract */}
              {(tool.id === "delete_pages" || tool.id === "extract_pages") && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-txt">Strani</p>
                    {pdfPageCount > 0 && <span className="text-xs text-txt3">Skupaj: {pdfPageCount} strani</span>}
                  </div>
                  <input
                    type="text"
                    value={selectedPages}
                    onChange={(e) => setSelectedPages(e.target.value)}
                    placeholder="npr. 1, 3, 5-8"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                  <p className="text-xs text-txt3 mt-2">Ločite s vejicami, obsege z vezajem (1-5)</p>
                </div>
              )}

              {/* Reorder pages */}
              {tool.id === "reorder_pages" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-txt">Vrstni red strani</p>
                    {pdfPageCount > 0 && <span className="text-xs text-txt3">Skupaj: {pdfPageCount} strani</span>}
                  </div>
                  <input
                    type="text"
                    value={pageOrder}
                    onChange={(e) => setPageOrder(e.target.value)}
                    placeholder="npr. 3, 1, 2, 5, 4"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                  <p className="text-xs text-txt3 mt-2">Vpišite novo zaporedje številk strani</p>
                </div>
              )}

              {/* Watermark */}
              {tool.id === "watermark_pdf" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-txt mb-2">Besedilo vodnega žiga</p>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="npr. ZAUPNO, OSNUTEK..."
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
              )}

              {/* Protect PDF */}
              {tool.id === "protect_pdf" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-txt mb-2">Geslo</p>
                  <input
                    type="password"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="Vpišite geslo..."
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
              )}

              {/* Add text */}
              {tool.id === "add_text" && (
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-txt mb-2">Besedilo</p>
                    <input
                      type="text"
                      value={addTextVal}
                      onChange={(e) => setAddTextVal(e.target.value)}
                      placeholder="Vpišite besedilo..."
                      className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-txt2 block mb-1">Stran</label>
                      <input type="number" value={addTextPage} onChange={(e) => setAddTextPage(e.target.value)} min="1" max={pdfPageCount || 999}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-txt2 block mb-1">Velikost</label>
                      <input type="number" value={addTextSize} onChange={(e) => setAddTextSize(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-txt2 block mb-1">X pozicija</label>
                      <input type="number" value={addTextX} onChange={(e) => setAddTextX(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-txt2 block mb-1">Y pozicija</label>
                      <input type="number" value={addTextY} onChange={(e) => setAddTextY(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                  </div>
                </div>
              )}

              {/* Process button */}
              <button
                onClick={process}
                className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              >
                Pretvori
              </button>
            </div>
          )}
        </>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="bg-surface rounded-2xl border border-border p-10 text-center shadow-sm">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-sm font-medium text-txt mb-1">Obdelujem...</p>
          <p className="text-xs text-txt3 mb-6">Prosimo pocakajte</p>
          <div className="w-full bg-bg2 rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progress * 100, 5)}%` }}
            />
          </div>
          {progress > 0 && (
            <p className="text-xs text-txt3 mt-3">{Math.round(progress * 100)}%</p>
          )}
        </div>
      )}

      {/* Done */}
      {status === "done" && (
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-lg font-bold text-txt">Koncano!</p>
            <p className="text-sm text-txt2 mt-1">{results.length} {results.length === 1 ? "datoteka" : "datotek"}</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-bg2 rounded-xl px-4 py-3">
                <span className="text-sm text-txt truncate flex-1 mr-3">{r.name}</span>
                <button
                  onClick={() => download(r)}
                  className="text-sm text-accent font-semibold shrink-0 hover:underline"
                >
                  Prenesi
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {results.length > 1 && (
              <button
                onClick={downloadAll}
                className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-sm"
              >
                Prenesi vse
              </button>
            )}
            {results.length === 1 && (
              <button
                onClick={() => download(results[0])}
                className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-sm"
              >
                Prenesi
              </button>
            )}
            <button
              onClick={reset}
              className="flex-1 bg-bg2 border border-border text-txt font-medium py-3 rounded-xl text-sm hover:bg-surface-hover transition-all duration-200"
            >
              Nova pretvorba
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-surface rounded-2xl border border-red/30 p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-base font-semibold text-red mb-2">Napaka</p>
          <p className="text-sm text-txt2 mb-6">{error}</p>
          <button
            onClick={reset}
            className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-8 rounded-xl text-sm transition-all duration-200 shadow-sm"
          >
            Poskusi znova
          </button>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-center text-xs text-txt3 mt-8">
        Vse poteka v vašem brskalniku. Datoteke se ne nalagajo na strežnik.
      </p>
    </div>
  );
}
