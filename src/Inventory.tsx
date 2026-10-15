import { useState, useMemo, useEffect } from "react";
import { ApiService } from "./services/api";

type Medicine = {
  id: number;
  brand: string;
  generic: string;
  category: string;
  manufacturer: string;
  batch: string;
  stock: number;
  buyPrice: number;
  sellPrice: number;
  expiry_date: string;
  img: string;
};

const CATEGORIES = ["All Categories", "Tablets", "Capsules", "Syrups", "Injections", "Baby Care"];
const EXPIRY_FILTERS = ["All Expiry Dates", "Already Expired", "Expiring in 30 Days (1 Month)", "Expiring in 60 Days (2 Months)", "Expiring in 90 Days (3 Months)"];
const ROWS_OPTIONS = [5, 10, 15, 25];
const FALLBACK_MEDICINE_IMAGE = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=60";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Tablets:    { bg: "#EEF2FF", text: "#4F46E5" },
  Capsules:   { bg: "#F5F3FF", text: "#7C3AED" },
  Syrups:     { bg: "#CCFBF1", text: "#0D9488" },
  Injections: { bg: "#FEF3C7", text: "#B45309" },
  "Baby Care":{ bg: "#FCE7F3", text: "#BE185D" },
};

function daysUntil(dateStr: string) {
  const now = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M14.7 3.3a1 1 0 0 1 1.41 1.41L5.41 15.42 3 16l.58-2.41L14.7 3.3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeft() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChevronRight() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChevronDown() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function SelectField({ value, onChange, options, disabled = false }: { value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none", padding: "8px 34px 8px 12px",
          background: "white", border: "1.5px solid #E2E8F0",
          borderRadius: 10, fontSize: 13, color: "#334155",
          outline: "none", fontFamily: "inherit",
          minWidth: 150, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>
        <ChevronDown />
      </span>
    </div>
  );
}

function MedicineModal({ onClose, onSaved, medicine, branchId }: { onClose: () => void; onSaved: () => Promise<void>; medicine?: Medicine; branchId: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imageChanged, setImageChanged] = useState(false);
  const [form, setForm] = useState({
    brand: medicine?.brand ?? "",
    generic: medicine?.generic ?? "",
    category: medicine?.category ?? "Tablets",
    manufacturer: medicine?.manufacturer ?? "Square",
    batch: medicine?.batch ?? "",
    stock: medicine?.stock?.toString() ?? "",
    buyPrice: medicine?.buyPrice?.toString() ?? "",
    sellPrice: medicine?.sellPrice?.toString() ?? "",
    expiry: medicine?.expiry_date ?? "",
    img: medicine?.img ?? "",
  });

  function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({ ...current, img: reader.result as string }));
        setImageChanged(true);
        setError("");
      }
    };
    reader.onerror = () => setError("Unable to read the selected image.");
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        ...(medicine && !imageChanged ? { img: undefined } : {}),
        ...(medicine ? { batch_id: medicine.id } : { branch_id: branchId }),
        stock: Number(form.stock) || 0,
        buyPrice: Number(form.buyPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
      };
      const response = medicine
        ? await ApiService.updateMedicine(payload)
        : await ApiService.addMedicine(payload);

      if (response.status === "success") {
        await onSaved();
        onClose();
      } else {
        setError(response.message || (medicine ? "Unable to update medicine." : "Unable to add medicine."));
      }
    } catch (submitError) {
      console.error("Medicine save error:", submitError);
      setError(medicine ? "Unable to update medicine." : "Unable to add medicine.");
    } finally {
      setSubmitting(false);
    }
  }

  function field(label: string, key: keyof typeof form, type = "text", opts?: string[]) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
        {opts ? (
          <div style={{ position: "relative" }}>
            <select
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              style={{ width: "100%", appearance: "none", padding: "9px 32px 9px 12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, fontSize: 13.5, color: "#334155", outline: "none", fontFamily: "inherit" }}
            >
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}><ChevronDown /></span>
          </div>
        ) : (
          <input
            type={type}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            style={{ padding: "9px 12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, fontSize: 13.5, color: "#334155", outline: "none", fontFamily: "inherit" }}
            onFocus={(e) => { e.target.style.borderColor = "#A5B4FC"; e.target.style.background = "white"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.background = "#F8FAFC"; }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 18, width: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(15,23,42,0.18)" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {medicine ? "Edit Medicine" : "Add New Medicine"}
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 12.5, margin: "3px 0 0" }}>Fill in product and batch details</p>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 9, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: "#F1F5F9", border: "2px dashed #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {form.img ? (
                <img
                  src={form.img}
                  alt="Medicine preview"
                  onError={(e) => {
                    const image = e.currentTarget;
                    if (image.src !== FALLBACK_MEDICINE_IMAGE) {
                      image.src = FALLBACK_MEDICINE_IMAGE;
                    } else {
                      image.style.display = "none";
                    }
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Product Photo</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Upload JPG or PNG, max 2MB</div>
                <input id="medicine-image" type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
                <label htmlFor="medicine-image" style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 600, color: "#4F46E5", background: "#EEF2FF", border: "none", borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>Browse</label>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Or enter image URL</label>
            <input
              type="url"
              value={form.img}
              onChange={(e) => { setForm({ ...form, img: e.target.value }); setImageChanged(true); }}
              style={{ padding: "9px 12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 9, fontSize: 13.5, color: "#334155", outline: "none", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {field("Brand Name", "brand")}
            {field("Generic Name", "generic")}
            {field("Category", "category", "text", ["Tablets", "Capsules", "Syrups", "Injections", "Baby Care"])}
            {field("Manufacturer", "manufacturer", "text", ["Square", "Beximco", "ACI", "Renata", "Novo Nordisk", "GSK", "J&J"])}
            {field("Batch No.", "batch")}
            {field("Available Stock", "stock", "number")}
            {field("Buy Price ($)", "buyPrice", "number")}
            {field("Sell Price ($)", "sellPrice", "number")}
            {field("Expiry Date", "expiry", "date")}
          </div>
          {error && <div style={{ color: "#DC2626", fontSize: 12.5 }}>{error}</div>}
        </div>

        <div style={{ padding: "16px 24px 22px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "white", fontSize: 13.5, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(79,70,229,0.3)", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? (medicine ? "Saving..." : "Adding...") : medicine ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ medicine, onClose, onDeleted }: { medicine: Medicine; onClose: () => void; onDeleted: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const response = await ApiService.deleteMedicine(medicine.id);
    if (response.status === "success") {
      await onDeleted();
      onClose();
    } else {
      setError(response.message || "Unable to delete medicine batch.");
    }
    setDeleting(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 18, width: 420, boxShadow: "0 24px 80px rgba(15,23,42,0.18)", padding: "28px 28px 24px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#EF4444" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </div>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Delete Medicine</h3>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 22px", lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "#0F172A" }}>{medicine.brand}</strong>? This action cannot be undone.
        </p>
        {error && <div style={{ color: "#DC2626", fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "#EF4444", color: "white", fontSize: 13.5, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: deleting ? 0.7 : 1 }}>{deleting ? "Deleting..." : "Yes, Delete"}</button>
        </div>
      </div>
    </div>
  );
}

function DisposeModal({ medicine, onClose, onDisposed }: { medicine: Medicine; onClose: () => void; onDisposed: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function dispose() {
    setSubmitting(true);
    setError("");
    const response = await ApiService.disposeBatch(medicine.id);
    if (response.status === "success") {
      await onDisposed();
      onClose();
    } else {
      setError(response.message || "Unable to dispose batch stock.");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 18, width: 420, boxShadow: "0 24px 80px rgba(15,23,42,0.18)", padding: "28px 28px 24px" }}>
        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>Dispose Stock</h3>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: "0 0 18px", lineHeight: 1.6 }}>Dispose Batch <strong style={{ color: "#0F172A" }}>{medicine.batch}</strong>? This will write off stock and set quantity to 0.</p>
        {error && <div style={{ color: "#DC2626", fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "white", color: "#64748B", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={dispose} disabled={submitting} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "#EF4444", color: "white", fontSize: 13.5, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Disposing..." : "Dispose Batch"}</button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage({ role = "Admin", selectedBranchId = 1, branchName = "Active Branch", lowStockThreshold = 10, expiryWarningDays = 90, onReorderClick }: { role?: string; selectedBranchId?: number; branchName?: string; lowStockThreshold?: number; expiryWarningDays?: number; onReorderClick?: (medicineName: string, supplier: string) => void }) {
  const [medicinesList, setMedicinesList] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInventory() {
    setLoading(true);
    const branchId = role === "Viewer" ? 0 : selectedBranchId;
    const res = await ApiService.getMedicines(branchId);
    if (res.status === "success" && Array.isArray(res.data)) {
      const formatted = res.data.map((m: any) => ({
        ...m,
        stock: Number(m.stock),
        buyPrice: Number(m.buyPrice),
        sellPrice: Number(m.sellPrice),
        expiry_date: m.expiry_date ?? m.expiry,
      }));
      setMedicinesList(formatted);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadInventory();
  }, [selectedBranchId, role]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState("All Expiry Dates");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState<Medicine | null>(null);
  const [deleteMedicine, setDeleteMedicine] = useState<Medicine | null>(null);
  const [toast, setToast] = useState("");
  const [sort, setSort] = useState<{ column: "manufacturer" | "expiry_date" | null; direction: "asc" | "desc" }>({ column: null, direction: "asc" });
  const [disposeMedicine, setDisposeMedicine] = useState<Medicine | null>(null);
  const [disposing, setDisposing] = useState(false);

  const filtered = useMemo(() => {
    let data = medicinesList.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.brand.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q) || m.manufacturer.toLowerCase().includes(q);
      const matchCat = category === "All Categories" || m.category === category;
      const matchLowStock = !lowStockOnly || m.stock <= lowStockThreshold;
      const days = daysUntil(m.expiry_date);
      const matchExpiry = expiryFilter === "All Expiry Dates"
        || (expiryFilter === "Already Expired" && days <= 0)
        || (expiryFilter.includes("30") && days > 0 && days <= 30)
        || (expiryFilter.includes("60") && days > 0 && days <= 60)
        || (expiryFilter.includes("90") && days > 0 && days <= expiryWarningDays);
      return matchSearch && matchCat && matchLowStock && matchExpiry;
    });

    if (sort.column) {
      data = [...data].sort((a, b) => {
        const cmp = sort.column === "manufacturer"
          ? a.manufacturer.localeCompare(b.manufacturer)
          : new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        return sort.direction === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [search, category, lowStockOnly, expiryFilter, sort, medicinesList, lowStockThreshold, expiryWarningDays]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  async function saveMedicine() {
    await loadInventory();
    setToast("Medicine updated successfully");
    window.setTimeout(() => setToast(""), 2500);
  }

  function toggleSort(column: "manufacturer" | "expiry_date") {
    setSort((current) => current.column === column
      ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
      : { column, direction: "asc" });
    setPage(1);
  }

  function SortIcon({ col }: { col: "manufacturer" | "expiry_date" }) {
    if (sort.column !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>;
    return <span style={{ fontSize: 10, color: "#4F46E5" }}>{sort.direction === "asc" ? "↑" : "↓"}</span>;
  }

  const TH = ({ label, col, align = "left" }: { label: string; col?: string; align?: string }) => (
    <th
      onClick={() => (col === "manufacturer" || col === "expiry_date") && toggleSort(col)}
      style={{
        padding: "13px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "#64748B", textAlign: align as any,
        whiteSpace: "nowrap", cursor: col ? "pointer" : "default",
        userSelect: "none", background: "#F8FAFC",
        borderBottom: "2px solid #E2E8F0", verticalAlign: "middle",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}{(col === "manufacturer" || col === "expiry_date") && <SortIcon col={col} />}
      </span>
    </th>
  );

  return (
    <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>

      {/* ── Top Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ marginRight: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#0F172A", margin: 0 }}>{role === "Viewer" ? "Global Medicine Inventory (All Branches)" : "Medicine Inventory"}</h1>
            <span style={{
              background: "#EEF2FF", color: "#4F46E5",
              fontSize: 12, fontWeight: 700, padding: "3px 11px", borderRadius: 99,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{loading ? "Loading..." : `${medicinesList.length} items`}</span>
          </div>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: "3px 0 0" }}>{branchName} · Last synced just now</p>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search brand, generic, batch…"
            style={{
              paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              background: "white", border: "1.5px solid #E2E8F0", borderRadius: 10,
              fontSize: 13, color: "#334155", outline: "none", fontFamily: "inherit", width: 230,
            }}
            onFocus={(e) => { e.target.style.borderColor = "#A5B4FC"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
          />
        </div>

        <SelectField value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CATEGORIES} />
        {role !== "Viewer" && <button
          onClick={() => { setLowStockOnly((value) => !value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${lowStockOnly ? "#4F46E5" : "#E2E8F0"}`, background: lowStockOnly ? "#EEF2FF" : "white", color: lowStockOnly ? "#4F46E5" : "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          Low Stock (&le; 10)
        </button>}

        <SelectField value={expiryFilter} onChange={(v) => { setExpiryFilter(v); setPage(1); }} options={EXPIRY_FILTERS} />

        {role !== "Viewer" && <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "linear-gradient(135deg, #4F46E5, #6366F1)",
            color: "white", border: "none", borderRadius: 10,
            padding: "9px 18px", fontSize: 13.5, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 2px 10px rgba(79,70,229,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          <PlusIcon /> Add New Medicine
        </button>}
      </div>

      {/* ── Table Card ── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 8px rgba(15,23,42,0.04)" }}>
        <div style={{ width: "100%", overflowX: "auto", boxSizing: "border-box" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
            <thead>
              <tr>
                <TH label="Photo" align="center" />
                <TH label="Brand Name" col="brand" />
                <TH label="Generic" col="generic" />
                <TH label="Category" col="category" />
                <TH label="Manufacturer" col="manufacturer" />
                <TH label="Batch No." col="batch" />
                <TH label="Stock" col="stock" align="center" />
                <TH label="Buy Price" col="buyPrice" />
                <TH label="Sell Price" col="sellPrice" />
                <TH label="Expiry Date" col="expiry_date" align="center" />
                <TH label="Actions" align="center" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((m, i) => {
                const days = daysUntil(m.expiry_date);
                const expiryUrgent = days <= 30;
                const expiryWarn = days > 30 && days <= 60;
                const lowStock = m.stock < 10;
                const catColor = CATEGORY_COLORS[m.category] ?? { bg: "#F1F5F9", text: "#64748B" };
                const isEven = i % 2 === 0;

                return (
                  <tr key={m.id} style={{ background: isEven ? "white" : "#FAFBFC", borderBottom: "1px solid #F1F5F9", transition: "background 0.12s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F7FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? "white" : "#FAFBFC")}
                  >
                    {/* Photo */}
                    <td style={{ padding: "8px 10px", textAlign: "center", width: 48, verticalAlign: "middle" }}>
                      <img
                        src={m.img || FALLBACK_MEDICINE_IMAGE}
                        alt={m.brand}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          const image = e.currentTarget;
                          if (image.src !== FALLBACK_MEDICINE_IMAGE) {
                            image.src = FALLBACK_MEDICINE_IMAGE;
                          } else {
                            image.style.display = "none";
                          }
                        }}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1.5px solid #E2E8F0", display: "block", margin: "0 auto" }}
                      />
                    </td>

                    {/* Brand */}
                    <td style={{ padding: "8px 10px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>{m.brand}</div>
                    </td>

                    {/* Generic */}
                    <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13, color: "#64748B" }}>{m.generic}</div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                      <span style={{ background: catColor.bg, color: catColor.text, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>
                        {m.category}
                      </span>
                    </td>

                    {/* Manufacturer */}
                    <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{m.manufacturer}</div>
                    </td>

                    {/* Batch */}
                    <td style={{ padding: "8px 10px", verticalAlign: "middle", whiteSpace: "nowrap", textAlign: "left" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#64748B", background: "#F1F5F9", padding: "3px 8px", borderRadius: 6 }}>
                        {m.batch}
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: "8px 10px", textAlign: "center", width: 60, verticalAlign: "middle" }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 99,
                        background: lowStock ? "#FEF2F2" : "#F0FDF4",
                        color: lowStock ? "#DC2626" : "#15803D",
                        border: `1px solid ${lowStock ? "#FECACA" : "#BBF7D0"}`,
                      }}>
                        {m.stock}
                      </span>
                    </td>

                    {/* Buy Price */}
                    <td style={{ padding: "8px 10px 8px 14px", width: 75, verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#64748B" }}>${m.buyPrice.toFixed(2)}</span>
                    </td>

                    {/* Sell Price */}
                    <td style={{ padding: "8px 10px 8px 14px", width: 75, verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "#0D9488" }}>${m.sellPrice.toFixed(2)}</span>
                    </td>

                    {/* Expiry */}
                    <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 12.5, color: "#334155", whiteSpace: "nowrap" }}>{formatDate(m.expiry_date)}</span>
                        {days <= 0 ? (
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 8px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", whiteSpace: "nowrap" }}>Expired</span>
                        ) : (expiryUrgent || expiryWarn) && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 700, padding: "1px 8px", borderRadius: 99,
                            background: expiryUrgent ? "#FFF7ED" : "#FFFBEB",
                            color: expiryUrgent ? "#EA580C" : "#B45309",
                            border: `1px solid ${expiryUrgent ? "#FED7AA" : "#FDE68A"}`,
                            whiteSpace: "nowrap",
                          }}>
                            {expiryUrgent ? `Critical (${days}d left)` : `Expiring (${days}d left)`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "8px 10px", textAlign: "center", width: 80, verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {role !== "Cashier" && role !== "Viewer" && (
                          <button
                            onClick={() => setEditMedicine(m)}
                            title="Edit"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0",
                              background: "white", color: "#4F46E5", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.13s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF2FF"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#A5B4FC"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; }}
                          >
                            <EditIcon />
                          </button>
                        )}
                        {role !== "Viewer" && (
                          <button
                            onClick={() => onReorderClick?.(m.brand, m.manufacturer)}
                            title="Order / Reorder"
                            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "white", color: lowStock ? "#D97706" : "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", cursor: onReorderClick ? "pointer" : "default", fontSize: 16 }}
                          >
                            +
                          </button>
                        )}
                        {role === "Admin" && (
                          <button
                            onClick={() => setDeleteMedicine(m)}
                            title="Delete"
                            style={{
                              width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0",
                              background: "white", color: "#EF4444", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.13s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#FECACA"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; }}
                          >
                            <DeleteIcon />
                          </button>
                        )}
                        {days <= 30 && role !== "Viewer" && (
                          <button
                            onClick={() => setDisposeMedicine(m)}
                            title="Dispose Stock"
                            style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: "60px 0", textAlign: "center", color: "#94A3B8" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No medicines found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 20px", borderTop: "1px solid #F1F5F9", background: "#FAFBFC",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#64748B" }}>Rows per page:</span>
            <div style={{ position: "relative" }}>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                style={{ appearance: "none", padding: "5px 28px 5px 10px", background: "white", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#334155", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                {ROWS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}><ChevronDown /></span>
            </div>
          </div>

          <span style={{ fontSize: 13, color: "#64748B" }}>
            Showing <strong style={{ color: "#334155" }}>{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)}</strong> of <strong style={{ color: "#334155" }}>{filtered.length}</strong> results
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "white", color: page === 1 ? "#CBD5E1" : "#334155", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><ChevronLeft /></button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`dots-${idx}`} style={{ padding: "0 4px", color: "#94A3B8", fontSize: 13 }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "1.5px solid",
                      borderColor: page === p ? "#4F46E5" : "#E2E8F0",
                      background: page === p ? "#4F46E5" : "white",
                      color: page === p ? "white" : "#334155",
                      fontSize: 13, fontWeight: page === p ? 700 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{p}</button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #E2E8F0", background: "white", color: page === totalPages || totalPages === 0 ? "#CBD5E1" : "#334155", cursor: page === totalPages || totalPages === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><ChevronRight /></button>
          </div>
        </div>
      </div>

      {showAddModal && <MedicineModal onClose={() => setShowAddModal(false)} onSaved={loadInventory} branchId={selectedBranchId} />}
      {editMedicine && <MedicineModal onClose={() => setEditMedicine(null)} onSaved={saveMedicine} medicine={editMedicine} branchId={selectedBranchId} />}
      {deleteMedicine && <DeleteModal medicine={deleteMedicine} onClose={() => setDeleteMedicine(null)} onDeleted={loadInventory} />}
      {disposeMedicine && <DisposeModal medicine={disposeMedicine} onClose={() => setDisposeMedicine(null)} onDisposed={loadInventory} />}
      {toast && <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 200, background: "#0F172A", color: "white", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, boxShadow: "0 12px 30px rgba(15,23,42,0.2)" }}>{toast}</div>}
    </div>
  );
}