import { forwardRef, MouseEventHandler, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Check, ChevronRight, Download, FileText, Plus, Trash2 } from "lucide-react";

type Label = { id: string; name: string; price: string; priceSuffix: string };

const STORAGE_KEY = "label-studio-labels";
const PAGE_WIDTH_MM = 72;
const PAGE_HEIGHT_MM = 21;
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const exportPdf = async () => {
    if (!sheetRef.current || isExporting) return;
    setIsExporting(true);
    setExportMessage("");
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 4,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
        compress: true,
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM, undefined, "SLOW");
      pdf.save(`label-${Date.now()}.pdf`);
      setExportMessage("PDF opened and downloaded");
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
          <span className="format-pill">72 × 21 mm</span>
        </div>
      </header>

      <section className="intro-row">
        <div>
          <p className="section-kicker">PRINT WORKSPACE</p>
          <h2>
            Make the label once.
            <br />
            <em>Print it precisely.</em>
          </h2>
        </div>
        <p className="intro-copy">
          A focused two-up label maker for the counter, the stockroom, and everywhere in between.
        </p>
      </section>

      <section className="label-strip" aria-label="Saved labels">
        <div className="strip-heading">
          <span>Saved labels</span>
          <strong>{labels.length.toString().padStart(2, "0")}</strong>
        </div>
        <div className="label-tabs">
          {labels.map(label => (
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
            <input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Kaju Katli" />
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
            <span className="preview-size">30 × 19 mm each</span>
          </div>
          <div className="preview-stage">
            <StickerSheet ref={sheetRef} name={name} price={price} priceSuffix={priceSuffix} />
          </div>
          <div className="preview-caption">
            <span>
              <span className="caption-dot" /> Exact print area
            </span>
            <span>2 mm gap</span>
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
      MRP: रु. {price || "0"} / {priceSuffix.trim() ? ` ${priceSuffix.trim()}` : ""}
    </span>
  </article>
);
