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
    section: "Pretvori iz PDF",
    items: [
      { id: "pdf2word", icon: "📝", color: "bg-accent", title: "PDF v Word", sub: ".pdf → .docx", accept: ".pdf" },
      { id: "pdf2img", icon: "🖼", color: "bg-orange", title: "PDF v sliko", sub: ".pdf → .jpg", accept: ".pdf" },
      { id: "pdf2excel", icon: "📊", color: "bg-accent2", title: "PDF v Excel", sub: ".pdf → .xlsx", accept: ".pdf" },
      { id: "pdf2pptx", icon: "📽️", color: "bg-orange", title: "PDF v PPTX", sub: ".pdf → .pptx", accept: ".pdf" },
    ],
  },
  {
    section: "Pretvori v PDF",
    items: [
      { id: "word2pdf", icon: "📄", color: "bg-accent", title: "Word v PDF", sub: ".docx → .pdf", accept: ".docx,.doc" },
      { id: "img2pdf", icon: "🖼", color: "bg-purple", title: "Slika v PDF", sub: ".jpg, .png → .pdf", accept: "image/*,.heic", multiple: true },
      { id: "excel2pdf", icon: "📊", color: "bg-accent2", title: "Excel v PDF", sub: ".xlsx → .pdf", accept: ".xlsx,.xls,.csv" },
      { id: "pptx2pdf", icon: "📽️", color: "bg-orange", title: "PPTX v PDF", sub: ".pptx → .pdf", accept: ".pptx,.ppt" },
    ],
  },
  {
    section: "Uredi PDF",
    items: [
      { id: "combine", icon: "🔗", color: "bg-teal", title: "Združi PDF", sub: "Več datotek v eno", accept: ".pdf", multiple: true },
      { id: "split", icon: "✂️", color: "bg-pink", title: "Razdeli PDF", sub: "Razdeli na posamezne strani", accept: ".pdf" },
      { id: "extract_pages", icon: "📑", color: "bg-mint", title: "Izvleci strani", sub: "Izvleci izbrane strani", accept: ".pdf" },
      { id: "delete_pages", icon: "🗑️", color: "bg-red", title: "Izbriši strani", sub: "Odstrani izbrane strani", accept: ".pdf" },
      { id: "rotate_pdf", icon: "🔄", color: "bg-indigo", title: "Zavrti strani", sub: "Zavrti strani za 90°, 180°, 270°", accept: ".pdf" },
      { id: "reorder_pages", icon: "↕️", color: "bg-brown", title: "Prevrsti strani", sub: "Spremeni vrstni red strani", accept: ".pdf" },
      { id: "watermark_pdf", icon: "💧", color: "bg-teal", title: "Vodni žig", sub: "Dodaj besedilo na vsako stran", accept: ".pdf" },
      { id: "page_numbers", icon: "🔢", color: "bg-yellow", title: "Številke strani", sub: "Dodaj številke strani", accept: ".pdf" },
      { id: "add_text", icon: "✏️", color: "bg-indigo", title: "Dodaj besedilo", sub: "Vstavi tekst na stran", accept: ".pdf" },
      { id: "protect_pdf", icon: "🔒", color: "bg-brown", title: "Zaščiti PDF", sub: "Dodaj geslo za zaščito", accept: ".pdf" },
    ],
  },
  {
    section: "Stisni",
    items: [
      { id: "compress_pdf", icon: "📦", color: "bg-accent", title: "Stisni PDF", sub: "Zmanjšaj velikost PDF", accept: ".pdf" },
      { id: "compress_img", icon: "📦", color: "bg-pink", title: "Stisni sliko", sub: "Zmanjšaj velikost slike", accept: "image/*,.heic", multiple: true },
    ],
  },
  {
    section: "Slike",
    items: [
      { id: "img_convert", icon: "🎨", color: "bg-indigo", title: "Pretvori slike", sub: "JPG, PNG, WebP, BMP", accept: "image/*,.heic", multiple: true },
      { id: "img_resize", icon: "📐", color: "bg-yellow", title: "Pretvori velikost slike", sub: "Spremeni širino in višino slik", accept: "image/*,.heic", multiple: true },
    ],
  },
  {
    section: "Prenosi",
    items: [
      { id: "vid_download", icon: "⬇️", color: "bg-red", title: "Prenos videa iz spleta", sub: "YouTube, Instagram, TikTok, Facebook" },
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
