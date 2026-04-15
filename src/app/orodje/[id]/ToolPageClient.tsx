"use client";
import { useState, useRef, useCallback, useEffect } from "react";
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

  // Document scanner - special UI
  if (tool.id === "doc_scan") {
    return <ScanUI tool={tool} />;
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

// ===== SCAN UI COMPONENT =====

type ScanFilter = "color" | "grayscale" | "bw";
type ScanCategory = "document" | "book" | "id_card" | "business_card";
type ScanStatus = "idle" | "camera" | "edit" | "review" | "processing" | "done" | "error";

interface ScannedPage {
  original: Blob;
  edited: Blob;
  preview: string;
  rotation: number;
  filter: ScanFilter;
  crop: { x: number; y: number; w: number; h: number } | null;
}

const SCAN_CATEGORIES: { id: ScanCategory; label: string; icon: string; defaultFilter: ScanFilter }[] = [
  { id: "document", label: "Dokument", icon: "📄", defaultFilter: "bw" },
  { id: "book", label: "Knjiga", icon: "📖", defaultFilter: "grayscale" },
  { id: "id_card", label: "Osebna", icon: "🪪", defaultFilter: "color" },
  { id: "business_card", label: "Vizitka", icon: "💼", defaultFilter: "grayscale" },
];

function ScanUI({ tool }: { tool: Tool }) {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [flashActive, setFlashActive] = useState(false);
  const [category, setCategory] = useState<ScanCategory>("document");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editFilter, setEditFilter] = useState<ScanFilter>("bw");
  const [editRotation, setEditRotation] = useState(0);
  const [editPreview, setEditPreview] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [dragState, setDragState] = useState<{ type: string; startX: number; startY: number; startRect: typeof cropRect } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCameraFn = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setStatus("camera");
    } catch {
      setError("Ni mogoce dostopati do kamere. Preverite dovoljenja brskalnika.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Auto-start camera when page loads
    startCameraFn();
    return () => stopCamera();
  }, [startCameraFn, stopCamera]);

  useEffect(() => {
    if (status === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  // Render edit preview when filter/rotation changes
  useEffect(() => {
    if (status !== "edit" || editingIndex < 0 || !pages[editingIndex]) return;
    renderEditPreview(pages[editingIndex].original, editFilter, editRotation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFilter, editRotation, status, editingIndex]);

  const renderEditPreview = (blob: Blob, filter: ScanFilter, rotation: number) => {
    const img = new Image();
    img.onload = () => {
      const canvas = editCanvasRef.current || document.createElement("canvas");
      const isRotated = rotation === 90 || rotation === 270;
      const w = isRotated ? img.height : img.width;
      const h = isRotated ? img.width : img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (filter !== "color") {
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (filter === "bw") {
            const boosted = Math.min(255, gray * 1.3 - 30);
            const val = boosted > 140 ? 255 : 0;
            d[i] = d[i + 1] = d[i + 2] = val;
          } else {
            const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.2 + 128));
            d[i] = d[i + 1] = d[i + 2] = boosted;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob((b) => {
        if (b) setEditPreview(URL.createObjectURL(b));
      }, "image/jpeg", 0.92);
    };
    img.src = URL.createObjectURL(blob);
  };

  const startCamera = startCameraFn;

  const playShutterSound = () => {
    try {
      const audioCtx = new AudioContext();
      const duration = 0.15;
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / audioCtx.sampleRate;
        data[i] = Math.sin(t * 4000) * Math.exp(-t * 40) * 0.3;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch { /* ignore */ }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    setFlashActive(true);
    playShutterSound();
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const cat = SCAN_CATEGORIES.find((c) => c.id === category)!;
        const preview = URL.createObjectURL(blob);
        const newPage: ScannedPage = {
          original: blob,
          edited: blob,
          preview,
          rotation: 0,
          filter: cat.defaultFilter,
          crop: null,
        };
        setPages((prev) => [...prev, newPage]);
        setEditingIndex(pages.length);
        setEditFilter(cat.defaultFilter);
        setEditRotation(0);
        setIsCropping(false);
        setCropRect({ x: 10, y: 10, w: 80, h: 80 });
        setStatus("edit");
      },
      "image/jpeg",
      0.95
    );
  };

  const addFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const cat = SCAN_CATEGORIES.find((c) => c.id === category)!;
    const newPages: ScannedPage[] = newFiles.map((f) => ({
      original: f,
      edited: f,
      preview: URL.createObjectURL(f),
      rotation: 0,
      filter: cat.defaultFilter,
      crop: null,
    }));
    setPages((prev) => [...prev, ...newPages]);
    if (newPages.length === 1) {
      setEditingIndex(pages.length);
      setEditFilter(cat.defaultFilter);
      setEditRotation(0);
      setIsCropping(false);
      setCropRect({ x: 10, y: 10, w: 80, h: 80 });
      setStatus("edit");
    } else {
      setStatus("review");
    }
    e.target.value = "";
  };

  const applyCrop = async (): Promise<Blob> => {
    const page = pages[editingIndex];
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const sx = (cropRect.x / 100) * img.width;
        const sy = (cropRect.y / 100) * img.height;
        const sw = (cropRect.w / 100) * img.width;
        const sh = (cropRect.h / 100) * img.height;
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95);
      };
      img.src = URL.createObjectURL(page.original);
    });
  };

  const saveEdit = async () => {
    let sourceBlob = pages[editingIndex].original;

    // Apply crop first if active
    if (isCropping) {
      sourceBlob = await applyCrop();
    }

    // Apply filter & rotation via canvas
    const img = new Image();
    img.onload = () => {
      const isRotated = editRotation === 90 || editRotation === 270;
      const w = isRotated ? img.height : img.width;
      const h = isRotated ? img.width : img.height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((editRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (editFilter !== "color") {
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (editFilter === "bw") {
            const boosted = Math.min(255, gray * 1.3 - 30);
            const val = boosted > 140 ? 255 : 0;
            d[i] = d[i + 1] = d[i + 2] = val;
          } else {
            const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.2 + 128));
            d[i] = d[i + 1] = d[i + 2] = boosted;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const preview = URL.createObjectURL(blob);
        setPages((prev) => {
          const updated = [...prev];
          updated[editingIndex] = {
            ...updated[editingIndex],
            edited: blob,
            preview,
            rotation: editRotation,
            filter: editFilter,
            crop: isCropping ? { ...cropRect } : null,
          };
          return updated;
        });
        setStatus("review");
        setIsCropping(false);
      }, "image/jpeg", 0.92);
    };
    img.src = URL.createObjectURL(sourceBlob);
  };

  const retakePhoto = () => {
    // Remove current editing page and go back to camera
    setPages((prev) => prev.filter((_, i) => i !== editingIndex));
    setEditingIndex(-1);
    startCamera();
  };

  const editPage = (index: number) => {
    setEditingIndex(index);
    setEditFilter(pages[index].filter);
    setEditRotation(pages[index].rotation);
    setIsCropping(false);
    setCropRect({ x: 10, y: 10, w: 80, h: 80 });
    setStatus("edit");
  };

  const removePage = (index: number) => {
    URL.revokeObjectURL(pages[index].preview);
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (pages.length === 0) return;
    setStatus("processing");
    setError("");
    try {
      const proc = await import("@/lib/processors");
      const editedBlobs = pages.map((p) => p.edited);
      const blob = await proc.scanToPdf(editedBlobs, "color"); // filters already applied per-page
      setResult(blob);
      setStatus("done");
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: tool.id }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri ustvarjanju PDF");
      setStatus("error");
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scan.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    stopCamera();
    pages.forEach((p) => URL.revokeObjectURL(p.preview));
    setPages([]);
    setResult(null);
    setStatus("idle");
    setError("");
    setEditingIndex(-1);
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Crop drag handlers (percentage based)
  const handleCropPointerDown = (type: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = cropContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;
    setDragState({ type, startX, startY, startRect: { ...cropRect } });
  };

  useEffect(() => {
    if (!dragState) return;
    const container = cropContainerRef.current;
    if (!container) return;

    const handleMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * 100;
      const cy = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = cx - dragState.startX;
      const dy = cy - dragState.startY;
      const s = dragState.startRect;

      setCropRect(() => {
        let { x, y, w, h } = s;
        switch (dragState.type) {
          case "move":
            x = Math.max(0, Math.min(100 - w, s.x + dx));
            y = Math.max(0, Math.min(100 - h, s.y + dy));
            break;
          case "tl":
            x = Math.max(0, Math.min(s.x + s.w - 10, s.x + dx));
            y = Math.max(0, Math.min(s.y + s.h - 10, s.y + dy));
            w = s.w - (x - s.x);
            h = s.h - (y - s.y);
            break;
          case "tr":
            w = Math.max(10, Math.min(100 - s.x, s.w + dx));
            y = Math.max(0, Math.min(s.y + s.h - 10, s.y + dy));
            h = s.h - (y - s.y);
            break;
          case "bl":
            x = Math.max(0, Math.min(s.x + s.w - 10, s.x + dx));
            w = s.w - (x - s.x);
            h = Math.max(10, Math.min(100 - s.y, s.h + dy));
            break;
          case "br":
            w = Math.max(10, Math.min(100 - s.x, s.w + dx));
            h = Math.max(10, Math.min(100 - s.y, s.h + dy));
            break;
        }
        return { x, y, w, h };
      });
    };

    const handleUp = () => setDragState(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragState]);

  return (
    <div>
      {/* Header — only show when not in fullscreen modes */}
      {status !== "camera" && status !== "edit" && (
        <>
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
        </>
      )}

      {/* ====== CAMERA — fullscreen ====== */}
      {status === "camera" && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {flashActive && (
              <div className="absolute inset-0 bg-white z-10 animate-[flashFade_0.3s_ease-out_forwards]" />
            )}
            {pages.length > 0 && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1.5 rounded-full z-20">
                {pages.length} {pages.length === 1 ? "stran" : "strani"}
              </div>
            )}
            <button
              onClick={() => { stopCamera(); setStatus(pages.length > 0 ? "review" : "idle"); }}
              className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-xl z-20"
            >
              ✕
            </button>
          </div>

          {/* Category selector */}
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 flex justify-center gap-1 overflow-x-auto">
            {SCAN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? "bg-blue-500 text-white"
                    : "text-white/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Bottom controls */}
          <div className="bg-black/80 backdrop-blur-sm px-6 py-5 flex items-center justify-center gap-8 scan-safe-bottom">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center text-lg border border-white/20"
            >
              🖼
            </button>
            <button
              onClick={capturePhoto}
              className="w-[72px] h-[72px] rounded-full bg-white border-[5px] border-white/30 flex items-center justify-center shadow-xl active:scale-90 transition-transform duration-100"
            >
              <div className="w-[58px] h-[58px] rounded-full bg-white border-2 border-gray-200" />
            </button>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-black/40">
              {pages.length > 0 ? (
                <img src={pages[pages.length - 1].preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={addFromFile} className="hidden" />

          <style jsx>{`
            @keyframes flashFade { 0% { opacity: 0.8; } 100% { opacity: 0; } }
            .scan-safe-bottom { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
          `}</style>
        </div>
      )}

      {/* ====== EDIT PAGE — fullscreen ====== */}
      {status === "edit" && editingIndex >= 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="bg-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between scan-safe-top">
            <button onClick={retakePhoto} className="text-white text-sm font-medium px-3 py-1.5">
              Ponovno slikaj
            </button>
            <span className="text-white/60 text-xs">Urejanje</span>
            <button onClick={saveEdit} className="bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              Shrani
            </button>
          </div>

          {/* Image preview */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4" ref={cropContainerRef}>
            <img
              src={editPreview || pages[editingIndex]?.preview}
              alt="Urejanje"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={isCropping ? { opacity: 0.4 } : {}}
            />
            {/* Crop overlay */}
            {isCropping && (
              <>
                <div
                  className="absolute border-2 border-blue-400 bg-transparent z-10"
                  style={{
                    left: `${cropRect.x}%`,
                    top: `${cropRect.y}%`,
                    width: `${cropRect.w}%`,
                    height: `${cropRect.h}%`,
                  }}
                  onPointerDown={(e) => handleCropPointerDown("move", e)}
                >
                  {/* Visible image inside crop area */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={editPreview || pages[editingIndex]?.preview}
                      alt=""
                      className="max-w-none"
                      style={{
                        position: "absolute",
                        left: `-${(cropRect.x / cropRect.w) * 100}%`,
                        top: `-${(cropRect.y / cropRect.h) * 100}%`,
                        width: `${(100 / cropRect.w) * 100}%`,
                        height: `${(100 / cropRect.h) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                {/* Corner handles */}
                {[
                  { pos: "tl", style: { left: `${cropRect.x}%`, top: `${cropRect.y}%`, transform: "translate(-50%,-50%)" } },
                  { pos: "tr", style: { left: `${cropRect.x + cropRect.w}%`, top: `${cropRect.y}%`, transform: "translate(-50%,-50%)" } },
                  { pos: "bl", style: { left: `${cropRect.x}%`, top: `${cropRect.y + cropRect.h}%`, transform: "translate(-50%,-50%)" } },
                  { pos: "br", style: { left: `${cropRect.x + cropRect.w}%`, top: `${cropRect.y + cropRect.h}%`, transform: "translate(-50%,-50%)" } },
                ].map((corner) => (
                  <div
                    key={corner.pos}
                    className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white z-20 cursor-pointer touch-none"
                    style={corner.style}
                    onPointerDown={(e) => handleCropPointerDown(corner.pos, e)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Edit toolbar */}
          <div className="bg-black/80 backdrop-blur-sm px-2 py-3">
            {/* Tool buttons */}
            <div className="flex justify-center gap-1 mb-3">
              <button
                onClick={() => setIsCropping(!isCropping)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isCropping ? "bg-blue-500/30 text-blue-400" : "text-white/70"
                }`}
              >
                <span className="text-lg">✂️</span>
                Obrezi
              </button>
              <button
                onClick={() => setEditRotation((r) => (r + 90) % 360)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-white/70"
              >
                <span className="text-lg">🔄</span>
                Zavrti
              </button>
              {(["bw", "grayscale", "color"] as ScanFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setEditFilter(f)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    editFilter === f ? "bg-blue-500/30 text-blue-400" : "text-white/70"
                  }`}
                >
                  <span className="text-lg">{f === "bw" ? "◐" : f === "grayscale" ? "🌫" : "🎨"}</span>
                  {f === "bw" ? "Crno-belo" : f === "grayscale" ? "Sivine" : "Barvno"}
                </button>
              ))}
            </div>

            {/* Keep scanning / Save */}
            <div className="flex gap-3 px-2 scan-safe-bottom">
              <button
                onClick={() => { saveEdit().then(() => startCamera()); }}
                className="flex-1 bg-white/15 text-white font-semibold py-3 rounded-xl text-sm border border-white/20"
              >
                Skeniraj naprej
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm shadow-lg"
              >
                Shrani stran
              </button>
            </div>
          </div>

          <style jsx>{`
            .scan-safe-top { padding-top: max(0.75rem, env(safe-area-inset-top)); }
            .scan-safe-bottom { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
          `}</style>
        </div>
      )}

      {/* ====== REVIEW / pages list ====== */}
      {status === "review" && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-txt">
                {pages.length} {pages.length === 1 ? "stran" : "strani"}
              </p>
              <button
                onClick={startCamera}
                className="text-xs bg-accent/10 text-accent font-semibold px-3 py-1.5 rounded-lg"
              >
                + Dodaj stran
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {pages.map((page, i) => (
                <div key={i} className="relative group">
                  <button onClick={() => editPage(i)} className="w-full">
                    <img
                      src={page.preview}
                      alt={`Stran ${i + 1}`}
                      className="w-full aspect-[3/4] object-cover rounded-xl border-2 border-border group-hover:border-accent transition-all shadow-sm"
                    />
                  </button>
                  <button
                    onClick={() => removePage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red text-white text-xs rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-md font-medium">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => editPage(i)}
                    className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Uredi
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={generatePdf}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            Shrani PDF ({pages.length} {pages.length === 1 ? "stran" : "strani"})
          </button>
        </div>
      )}

      {/* ====== IDLE — start screen ====== */}
      {status === "idle" && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-accent/50 hover:bg-surface/80 transition-all duration-200"
          >
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm font-medium text-txt mb-1">Odpri kamero in skeniraj dokument</p>
            <p className="text-xs text-txt3">Na telefonu se odpre zadnja kamera</p>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-txt3 font-medium">ali</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-surface/80 transition-all duration-200"
          >
            <p className="text-3xl mb-2">📁</p>
            <p className="text-sm font-medium text-txt mb-1">Nalozi slike iz naprave</p>
            <p className="text-xs text-txt3">JPG, PNG — lahko vec slik hkrati</p>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={addFromFile} className="hidden" />
        </div>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="bg-surface rounded-2xl border border-border p-10 text-center shadow-sm">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-sm font-medium text-txt mb-1">Ustvarjam PDF...</p>
          <p className="text-xs text-txt3">Obdelujem {pages.length} {pages.length === 1 ? "stran" : "strani"}</p>
        </div>
      )}

      {/* Done */}
      {status === "done" && result && (
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-lg font-bold text-txt">Scan ustvarjen!</p>
            <p className="text-sm text-txt2 mt-1">
              {pages.length} {pages.length === 1 ? "stran" : "strani"} — {fmtSize(result.size)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadResult}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-sm"
            >
              Prenesi PDF
            </button>
            <button
              onClick={resetAll}
              className="flex-1 bg-bg2 border border-border text-txt font-medium py-3 rounded-xl text-sm hover:bg-surface-hover transition-all duration-200"
            >
              Nov scan
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
            onClick={resetAll}
            className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-8 rounded-xl text-sm transition-all duration-200 shadow-sm"
          >
            Poskusi znova
          </button>
        </div>
      )}

      <p className="text-center text-xs text-txt3 mt-8">
        Vse poteka v vasem brskalniku. Slike se ne nalagajo na streznik.
      </p>
    </div>
  );
}
