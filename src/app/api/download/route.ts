import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL je obvezen" }, { status: 400 });
    }

    // Get video info from yt-dlp API
    const infoRes = await fetch(
      `https://yozora.vercel.app/api/info?query=${encodeURIComponent(url)}`
    );

    if (!infoRes.ok) {
      return NextResponse.json(
        { error: "Videa ni mogoče najti na tej povezavi" },
        { status: 400 }
      );
    }

    const info = await infoRes.json();

    if (!info || !info.formats || info.formats.length === 0) {
      return NextResponse.json(
        { error: "Ni najdenih formatov za prenos" },
        { status: 400 }
      );
    }

    // Find best video+audio format, prefer mp4
    const videoFormats = info.formats.filter(
      (f: { vcodec?: string; acodec?: string; ext?: string; url?: string }) =>
        f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none" && f.url
    );

    // Sort by height (quality) descending, prefer mp4
    const sorted = videoFormats.sort(
      (a: { height?: number; ext?: string }, b: { height?: number; ext?: string }) => {
        const aH = a.height || 0;
        const bH = b.height || 0;
        if (bH !== aH) return bH - aH;
        if (a.ext === "mp4" && b.ext !== "mp4") return -1;
        if (b.ext === "mp4" && a.ext !== "mp4") return 1;
        return 0;
      }
    );

    // Pick best available (max 1080p to keep size reasonable)
    const best = sorted.find(
      (f: { height?: number }) => (f.height || 0) <= 1080
    ) || sorted[0];

    if (!best?.url) {
      return NextResponse.json(
        { error: "Ni najdene ustrezne kakovosti za prenos" },
        { status: 400 }
      );
    }

    // Stream the video back
    const videoRes = await fetch(best.url, {
      headers: { Referer: url },
    });

    if (!videoRes.ok) {
      return NextResponse.json(
        { error: "Prenos videa ni uspel" },
        { status: 500 }
      );
    }

    const title = (info.title || "video").replace(/[^\w\s-]/g, "").trim();
    const ext = best.ext || "mp4";
    const filename = `${title}.${ext}`;

    const blob = await videoRes.arrayBuffer();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": videoRes.headers.get("content-type") || "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "Napaka pri obdelavi zahteve" },
      { status: 500 }
    );
  }
}
