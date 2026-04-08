"use client";
import { useState, useRef, useCallback } from "react";
import type { Tool } from "@/lib/tools";
import Link from "next/link";

type Status = "idle" | "processing" | "done" | "error";
type ResultFile = { name: string; blob: Blob };

const FORMAT_OPTIONS: Record<string, string[]> = {
  img_convert: ["jpg", "png", "webp", "bmp"],
  vid_convert: ["mp4", "avi", "mkv", "mov", "webm", "gif", "mp3"],
};

export default function ToolPageClient({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [error, setError] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_OPTIONS[tool.id]?.[0] || "");
  const [resizeWidth, setResizeWidth] = useState("800");
  const [cutStart, setCutStart] = useState("0");
  const [cutEnd, setCutEnd] = useState("10");
  const [videoDuration, setVideoDuration] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Get video duration if video tool
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
          const w = parseInt(resizeWidth) || 800;
          const all = await Promise.all(
            files.map((f) => proc.resizeImage(f, w))
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
      }

      setResults(res);
      setStatus("done");
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
      <Link href="/" className="text-accent text-sm mb-4 inline-block hover:underline">
        ← Nazaj
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <span className={`w-11 h-11 ${tool.color} rounded-xl flex items-center justify-center text-white text-xl`}>
          {tool.icon}
        </span>
        <div>
          <h1 className="text-xl font-bold text-txt">{tool.title}</h1>
          <p className="text-sm text-txt2">{tool.sub}</p>
        </div>
      </div>

      {/* Drop zone */}
      {status === "idle" && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-divider rounded-2xl p-10 text-center cursor-pointer hover:border-accent hover:bg-surface transition-colors"
          >
            <p className="text-3xl mb-2">📁</p>
            <p className="text-sm text-txt2 mb-1">
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
            <div className="mt-4">
              <div className="bg-surface rounded-xl border border-divider p-4">
                <p className="text-sm font-medium text-txt mb-2">
                  {files.length} {files.length === 1 ? "datoteka" : "datotek"} izbran{files.length === 1 ? "a" : "ih"}
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {files.map((f, i) => (
                    <p key={i} className="text-xs text-txt2 truncate">
                      {f.name} ({formatSize(f.size)})
                    </p>
                  ))}
                </div>
              </div>

              {/* Format picker */}
              {FORMAT_OPTIONS[tool.id] && (
                <div className="mt-4 bg-surface rounded-xl border border-divider p-4">
                  <p className="text-sm font-medium text-txt mb-2">Ciljni format</p>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS[tool.id].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedFormat === fmt
                            ? "bg-accent text-white"
                            : "bg-surface-hover text-txt2 hover:text-txt"
                        }`}
                      >
                        .{fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resize width */}
              {tool.id === "img_resize" && (
                <div className="mt-4 bg-surface rounded-xl border border-divider p-4">
                  <p className="text-sm font-medium text-txt mb-2">Sirina (px)</p>
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => setResizeWidth(e.target.value)}
                    className="w-full bg-bg border border-divider rounded-lg px-3 py-2 text-sm text-txt"
                  />
                </div>
              )}

              {/* Video cut controls */}
              {tool.id === "vid_cut" && (
                <div className="mt-4 bg-surface rounded-xl border border-divider p-4">
                  <p className="text-sm font-medium text-txt mb-3">
                    Izreži od — do {videoDuration > 0 && `(trajanje: ${videoDuration.toFixed(1)}s)`}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-accent2 font-bold">Od (sekunde)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={videoDuration || 9999}
                        value={cutStart}
                        onChange={(e) => setCutStart(e.target.value)}
                        className="w-full bg-bg border border-divider rounded-lg px-3 py-2 text-sm text-txt mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-red font-bold">Do (sekunde)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={videoDuration || 9999}
                        value={cutEnd}
                        onChange={(e) => setCutEnd(e.target.value)}
                        className="w-full bg-bg border border-divider rounded-lg px-3 py-2 text-sm text-txt mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Process button */}
              <button
                onClick={process}
                className="mt-4 w-full bg-accent hover:bg-accent/90 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Pretvori
              </button>
            </div>
          )}
        </>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div className="bg-surface rounded-2xl border border-divider p-8 text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-sm text-txt2 mb-4">Obdelujem...</p>
          <div className="w-full bg-divider rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(progress * 100, 5)}%` }}
            />
          </div>
          {progress > 0 && (
            <p className="text-xs text-txt3 mt-2">{Math.round(progress * 100)}%</p>
          )}
        </div>
      )}

      {/* Done */}
      {status === "done" && (
        <div className="bg-surface rounded-2xl border border-divider p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm font-medium text-txt">Koncano!</p>
            <p className="text-xs text-txt2">{results.length} {results.length === 1 ? "datoteka" : "datotek"}</p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2">
                <span className="text-xs text-txt truncate flex-1 mr-2">{r.name}</span>
                <button
                  onClick={() => download(r)}
                  className="text-xs text-accent font-medium shrink-0 hover:underline"
                >
                  Prenesi
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {results.length > 1 && (
              <button
                onClick={downloadAll}
                className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Prenesi vse
              </button>
            )}
            {results.length === 1 && (
              <button
                onClick={() => download(results[0])}
                className="flex-1 bg-accent text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Prenesi
              </button>
            )}
            <button
              onClick={reset}
              className="flex-1 bg-surface-hover text-txt font-medium py-2.5 rounded-xl text-sm"
            >
              Nova pretvorba
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-surface rounded-2xl border border-red/30 p-6 text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-sm text-red font-medium mb-2">Napaka</p>
          <p className="text-xs text-txt2 mb-4">{error}</p>
          <button
            onClick={reset}
            className="bg-accent text-white font-semibold py-2.5 px-6 rounded-xl text-sm"
          >
            Poskusi znova
          </button>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-center text-xs text-txt3 mt-6">
        Vse poteka v vašem brskalniku. Datoteke se ne nalagajo na strežnik.
      </p>
    </div>
  );
}
