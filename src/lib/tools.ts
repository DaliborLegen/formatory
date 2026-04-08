export interface Tool {
  id: string;
  icon: string;
  color: string;
  title: string;
  sub: string;
  accept?: string;
  multiple?: boolean;
}

export interface ToolSection {
  section: string;
  items: Tool[];
}

export const TOOLS: ToolSection[] = [
  {
    section: "Dokumenti",
    items: [
      { id: "pdf2img", icon: "🖼", color: "bg-orange", title: "PDF v slike", sub: ".pdf → .jpg", accept: ".pdf" },
      { id: "img2pdf", icon: "📄", color: "bg-purple", title: "Slike v PDF", sub: ".jpg, .png → .pdf", accept: "image/*,.heic", multiple: true },
    ],
  },
  {
    section: "Orodja PDF",
    items: [
      { id: "split", icon: "✂", color: "bg-pink", title: "Razdeli PDF", sub: "Razdeli na posamezne strani", accept: ".pdf" },
      { id: "combine", icon: "🔗", color: "bg-teal", title: "Združi PDF", sub: "Več datotek v eno", accept: ".pdf", multiple: true },
    ],
  },
  {
    section: "Slike",
    items: [
      { id: "img_convert", icon: "🎨", color: "bg-indigo", title: "Pretvori slike", sub: "JPG, PNG, WebP, BMP", accept: "image/*,.heic", multiple: true },
      { id: "img_resize", icon: "📐", color: "bg-yellow", title: "Pomanjšaj slike", sub: "Spremeni velikost slik", accept: "image/*,.heic", multiple: true },
    ],
  },
  {
    section: "Video & zvok",
    items: [
      { id: "vid_convert", icon: "🎬", color: "bg-mint", title: "Pretvori video", sub: "MP4, AVI, MKV, MOV, WebM, GIF", accept: "video/*" },
      { id: "vid_cut", icon: "✂", color: "bg-orange", title: "Izreži video", sub: "Izreži del videa (od-do)", accept: "video/*" },
      { id: "vid_audio", icon: "🎵", color: "bg-brown", title: "Izvleci zvok", sub: "Video → MP3", accept: "video/*" },
    ],
  },
];

export function getToolById(id: string): Tool | undefined {
  for (const section of TOOLS) {
    const found = section.items.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}
