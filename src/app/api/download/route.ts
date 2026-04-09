import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, quality } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL je obvezen" }, { status: 400 });
    }

    // Use cobalt.tools API — free, no auth, supports YouTube/Instagram/TikTok/Facebook
    const cobaltRes = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url,
        videoQuality: quality || "720",
        filenameStyle: "pretty",
      }),
    });

    const data = await cobaltRes.json();

    if (data.status === "error") {
      return NextResponse.json(
        { error: data.error?.code || "Videa ni mogoče prenesti s te povezave" },
        { status: 400 }
      );
    }

    if (data.status === "redirect" || data.status === "tunnel") {
      const videoUrl = data.url;
      const videoRes = await fetch(videoUrl);

      if (!videoRes.ok) {
        return NextResponse.json({ error: "Prenos videa ni uspel" }, { status: 500 });
      }

      const contentType = videoRes.headers.get("content-type") || "video/mp4";
      const blob = await videoRes.arrayBuffer();

      // Extract filename
      let filename = data.filename || "video.mp4";
      if (!filename.includes(".")) {
        const ext = contentType.includes("mp4") ? "mp4" : contentType.includes("webm") ? "webm" : "mp4";
        filename += "." + ext;
      }

      return new NextResponse(blob, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (data.status === "picker" && data.picker) {
      // Multiple items (e.g. Instagram carousel) — download first video
      const firstVideo = data.picker.find((p: { type: string }) => p.type === "video") || data.picker[0];
      if (firstVideo?.url) {
        const videoRes = await fetch(firstVideo.url);
        const blob = await videoRes.arrayBuffer();
        return new NextResponse(blob, {
          headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": `attachment; filename="video.mp4"`,
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Videa ni mogoče prenesti — format ni podprt" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "Napaka pri obdelavi zahteve" },
      { status: 500 }
    );
  }
}
