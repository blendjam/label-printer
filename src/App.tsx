import { forwardRef, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Check, ChevronRight, Download, FileText, Plus, Search, Trash2, X } from "lucide-react";
import { Directory, Filesystem } from "@capacitor/filesystem";
import PdfOpener from "./plugins/pdfOpenerPlugin";

const VERSION = "1.0.0";

type Label = { id: string; name: string; price: string; priceSuffix: string };

const STORAGE_KEY = "label-studio-labels";
const PAGE_WIDTH_MM = 72;
const PAGE_HEIGHT_MM = 24;
const INITIAL_LABELS: Label[] = [
  { id: "1", name: "SS Bat", price: "1200", priceSuffix: "" },
  { id: "2", name: "Mikasa Vollyball", price: "1500", priceSuffix: "" },
  { id: "3", name: "Kaizen Tennis Ball Gold Heavy", price: "150", priceSuffix: "" },
];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readLabels() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_LABELS;
    const labels = JSON.parse(stored) as Partial<Label>[];
    return labels.length
      ? labels.map(label => ({
          id: label.id || createId(),
          name: label.name || "Product name",
          price: label.price || "0",
          priceSuffix: label.priceSuffix || "",
        }))
      : INITIAL_LABELS;
  } catch {
    return INITIAL_LABELS;
  }
}

export default function App() {
  const [labels, setLabels] = useState(() => readLabels());
  const [activeId, setActiveId] = useState(() => labels[0]?.id);
  const activeLabel: Label = labels.find(label => label.id === activeId) ?? labels[0] ?? INITIAL_LABELS[0]!;
  const [name, setName] = useState(activeLabel.name);
  const [price, setPrice] = useState(activeLabel.price);
  const [priceSuffix, setPriceSuffix] = useState(activeLabel.priceSuffix);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);
  const filteredLabels = labels.filter(label => label.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  }, [labels]);

  const selectLabel = (label: Label) => {
    setActiveId(label.id);
    setName(label.name);
    setPrice(label.price);
    setPriceSuffix(label.priceSuffix);
    setExportMessage("");
  };

  const saveLabel = () => {
    if (!name.trim() || !price.trim()) {
      setExportMessage("Add a product name and price first.");
      return;
    }
    setLabels(current =>
      current.map(label =>
        label.id === activeId
          ? { ...label, name: name.trim(), price: price.trim(), priceSuffix: priceSuffix.trim() }
          : label,
      ),
    );
    setExportMessage("Label saved");
    window.setTimeout(() => setExportMessage(""), 1800);
  };

  const addLabel = () => {
    const label = { id: createId(), name: "New product", price: "0", priceSuffix: "" };
    setLabels(current => [...current, label]);
    setSearchQuery("");
    selectLabel(label);
  };

  const deleteLabel = () => {
    if (labels.length === 1) return;
    const next = labels.filter(label => label.id !== activeId);
    const nextLabel = next[0];
    if (!nextLabel) return;
    setLabels(next);
    selectLabel(nextLabel);
  };

  const openPdf = async (pdf: jsPDF) => {
    setExportMessage("Trying open pdf");
    const base64 = pdf.output("datauristring").split(",")[1];
    if (!base64) {
      setExportMessage("No base64");
      return;
    }
    const fileName = `label-${Date.now()}.pdf`;

    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });
    setExportMessage("Made File");
    await PdfOpener.open({
      uri: result.uri,
    });
  };

  const exportPdf = async () => {
    if (!sheetRef.current || isExporting) return;
    setIsExporting(true);
    setExportMessage("");
    try {
      const SCALE = 4;
      const width = PAGE_WIDTH_MM * SCALE;
      const height = PAGE_HEIGHT_MM * SCALE;

      // Give the native UI thread enough time to settle
      await new Promise(resolve => setTimeout(resolve, 250));

      const canvas = await html2canvas(sheetRef.current, {
        scale: SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        // Enforce absolute layout boundaries during capture translation
        width: sheetRef.current.getBoundingClientRect().width,
        height: sheetRef.current.getBoundingClientRect().height,
        onclone: clonedDocument => {
          // FIX: Locate the cloned preview sheet element within the capture scope
          const clonedSheet = clonedDocument.querySelector(".sheet") as HTMLDivElement | null;
          if (clonedSheet) {
            // Flatten Flexbox into solid Block alignments for html2canvas compilation stability
            clonedSheet.style.display = "block";
            clonedSheet.style.position = "relative";
            clonedSheet.style.boxSizing = "border-box";

            const clonedStickers = clonedSheet.querySelectorAll(".sticker");
            clonedStickers.forEach(stickerElement => {
              const sticker = stickerElement as HTMLElement;
              sticker.style.display = "block";
              sticker.style.float = "left";
              sticker.style.boxSizing = "border-box";
            });
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [width, height],
        compress: true,
      });

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height, undefined);
      await openPdf(pdf);
    } catch (error) {
      console.error("PDF export failed", error);
      setExportMessage("Could not create the PDF");
    } finally {
      setIsExporting(false);
      window.setTimeout(() => setExportMessage(""), 2600);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">K</span>
          <div>
            <p className="eyebrow">KOSELI SUPPLIERS</p>
            <h1>Label studio</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="status-dot">Offline-ready</span>
          <span className="format-pill">
            {PAGE_WIDTH_MM} × {PAGE_HEIGHT_MM} mm
          </span>
          <span>v{VERSION}</span>
        </div>
      </header>

      <section className="search-row" aria-label="Find a saved label">
        <div>
          <p className="section-kicker">LABEL LIBRARY</p>
          <h2>Find a label</h2>
        </div>
        <label className="search-field">
          <Search size={19} aria-hidden="true" />
          <span className="visually-hidden">Search labels by product name</span>
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search by product name"
            type="search"
          />
          {searchQuery && (
            <button type="button" aria-label="Clear label search" onClick={() => setSearchQuery("")}>
              <X size={17} />
            </button>
          )}
        </label>
      </section>

      <section className="label-strip" aria-label="Saved labels">
        <div className="strip-heading">
          <span>Saved labels</span>
          <strong>{filteredLabels.length.toString().padStart(2, "0")}</strong>
        </div>
        <div className="label-tabs">
          {filteredLabels.map(label => (
            <button
              key={label.id}
              className={`label-tab ${label.id === activeId ? "selected" : ""}`}
              onClick={() => selectLabel(label)}>
              <span>{label.name}</span>
              <small>
                Rs. {label.price}
                {label.priceSuffix ? ` · ${label.priceSuffix}` : ""}
              </small>
            </button>
          ))}
          {!filteredLabels.length && <p className="empty-search">No labels match “{searchQuery}”.</p>}
          <button className="new-label" onClick={addLabel}>
            <Plus size={16} /> New label
          </button>
        </div>
      </section>

      <section className="studio-grid">
        <aside className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">EDIT LABEL</p>
              <h3>Product details</h3>
            </div>
            <span className="step-number">01</span>
          </div>
          <label>
            Product name
            <textarea
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. Mikasa Vollyball"
              rows={2}
            />
          </label>
          <label>
            Price
            <div className="input-with-prefix">
              <span>Rs.</span>
              <input value={price} onChange={event => setPrice(event.target.value)} inputMode="decimal" />
            </div>
          </label>
          <label>
            After price
            <div className="input-with-prefix">
              <span>+</span>
              <input
                value={priceSuffix}
                onChange={event => setPriceSuffix(event.target.value)}
                placeholder="e.g. per roll"
              />
            </div>
          </label>
          <div className="editor-actions">
            <button className="text-action danger" onClick={deleteLabel}>
              <Trash2 size={15} /> Delete
            </button>
            <button className="primary-button" onClick={saveLabel}>
              <Check size={15} /> Save changes
            </button>
          </div>
          <p className={`feedback ${exportMessage ? "visible" : ""}`} role="status">
            {exportMessage}
          </p>
        </aside>

        <section className="preview-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">LIVE PREVIEW</p>
              <h3>Two-up sheet</h3>
            </div>
            <span className="preview-size">
              Print Size: {PAGE_WIDTH_MM} × {PAGE_HEIGHT_MM} mm
            </span>
          </div>
          <div className="preview-stage">
            <StickerSheet ref={sheetRef} name={name} price={price} priceSuffix={priceSuffix} />
          </div>
          <div className="preview-caption">
            <span>
              <span className="caption-dot" /> Exact print area
            </span>
            <span>34x20 each 2 mm gap</span>
          </div>
        </section>
      </section>

      <button className="export-card" onClick={exportPdf} disabled={isExporting}>
        <span className="export-icon">
          <Download size={22} />
        </span>
        <span className="export-copy">
          <strong>{isExporting ? "Preparing PDF..." : "Export print-ready PDF"}</strong>
        </span>
        <ChevronRight className="export-chevron" size={23} />
      </button>

      <footer>
        <span>
          <FileText size={14} /> One source, two identical stickers
        </span>
        <span>Saved locally in this browser</span>
      </footer>
    </main>
  );
}

type StickerSheetProps = { name: string; price: string; priceSuffix: string };

const StickerSheet = forwardRef<HTMLDivElement, StickerSheetProps>(({ name, price, priceSuffix }, ref) => (
  <div className="sheet" ref={ref}>
    <Sticker name={name} price={price} priceSuffix={priceSuffix} />
    <Sticker name={name} price={price} priceSuffix={priceSuffix} />
  </div>
));

const Sticker = ({ name, price, priceSuffix }: StickerSheetProps) => (
  <article className="sticker">
    <span>IMPORTED &amp; DISTRIBUTED BY:</span>
    <span>KOSELI SUPPLIERS</span>
    <span>Biratnagar, Nepal</span>
    <span>EMAIL: milanlamsal70@gmail.com</span>
    <span>EXIM CODE: 3016869700126NP</span>
    <span className="sticker-item">ITEM: {name || "Product name"}</span>
    <span className="price-tag">
      MRP: NPR. {price || "0"} / {priceSuffix.trim() ? ` ${priceSuffix.trim()}` : ""}
    </span>
  </article>
);
