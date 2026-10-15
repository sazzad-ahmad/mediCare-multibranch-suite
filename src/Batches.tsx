import { useState, useMemo } from "react";

type Batch = {
  id: number;
  batchNo: string;
  medicine: string;
  generic: string;
  branch: string;
  stock: number;
  maxStock: number;
  buyPrice: number;
  sellPrice: number;
  mfgDate: string;
  expiryDate: string;
  category: string;
};

const ALL_BATCHES: Batch[] = [
  { id: 1,  batchNo: "B-NAP-01", medicine: "Napa Extra 500mg",      generic: "Paracetamol",         branch: "Dhanmondi", stock: 320, maxStock: 500, buyPrice: 1.80,  sellPrice: 2.50,  mfgDate: "2024-06-01", expiryDate: "2026-12-15", category: "Tablets"    },
  { id: 2,  batchNo: "B-AZI-07", medicine: "Azithro 250mg",         generic: "Azithromycin",         branch: "Gulshan",   stock: 64,  maxStock: 200, buyPrice: 3.60,  sellPrice: 4.80,  mfgDate: "2024-09-10", expiryDate: "2027-03-22", category: "Tablets"    },
  { id: 3,  batchNo: "B-CET-14", medicine: "Cetimax 10mg",          generic: "Cetirizine HCl",       branch: "Dhanmondi", stock: 210, maxStock: 300, buyPrice: 0.90,  sellPrice: 1.20,  mfgDate: "2024-11-05", expiryDate: "2027-06-30", category: "Tablets"    },
  { id: 4,  batchNo: "B-OMP-03", medicine: "Omep 20mg",             generic: "Omeprazole",           branch: "Mirpur",    stock: 8,   maxStock: 100, buyPrice: 2.50,  sellPrice: 3.40,  mfgDate: "2024-04-20", expiryDate: "2026-09-28", category: "Capsules"   },
  { id: 5,  batchNo: "B-AMX-22", medicine: "Amoxil 500mg",          generic: "Amoxicillin",          branch: "Dhanmondi", stock: 47,  maxStock: 150, buyPrice: 4.20,  sellPrice: 5.60,  mfgDate: "2024-08-14", expiryDate: "2027-01-18", category: "Capsules"   },
  { id: 6,  batchNo: "B-TUS-09", medicine: "Tussikof Syrup",        generic: "Dextromethorphan",     branch: "Gulshan",   stock: 33,  maxStock: 80,  buyPrice: 2.80,  sellPrice: 3.90,  mfgDate: "2024-07-22", expiryDate: "2026-09-30", category: "Syrups"     },
  { id: 7,  batchNo: "B-ZIM-18", medicine: "Zimax 500mg",           generic: "Azithromycin",         branch: "Dhanmondi", stock: 5,   maxStock: 100, buyPrice: 4.60,  sellPrice: 6.20,  mfgDate: "2024-05-30", expiryDate: "2026-10-12", category: "Tablets"    },
  { id: 8,  batchNo: "B-INS-05", medicine: "Insulin Glargine 100U", generic: "Insulin Glargine",     branch: "Mirpur",    stock: 14,  maxStock: 50,  buyPrice: 14.00, sellPrice: 18.00, mfgDate: "2024-10-01", expiryDate: "2026-10-20", category: "Injections" },
  { id: 9,  batchNo: "B-JBW-31", medicine: "Johnson Baby Wash",     generic: "Baby Cleansing Gel",   branch: "Gulshan",   stock: 55,  maxStock: 100, buyPrice: 5.60,  sellPrice: 7.50,  mfgDate: "2024-12-01", expiryDate: "2027-08-01", category: "Baby Care"  },
  { id: 10, batchNo: "B-MET-11", medicine: "Metformin 500mg",       generic: "Metformin HCl",        branch: "Dhanmondi", stock: 96,  maxStock: 200, buyPrice: 1.50,  sellPrice: 2.10,  mfgDate: "2024-07-07", expiryDate: "2027-05-14", category: "Tablets"    },
  { id: 11, batchNo: "B-VEN-06", medicine: "Ventolin 100mcg",       generic: "Salbutamol",           branch: "Dhanmondi", stock: 22,  maxStock: 60,  buyPrice: 7.20,  sellPrice: 9.80,  mfgDate: "2024-06-15", expiryDate: "2026-09-25", category: "Injections" },
  { id: 12, batchNo: "B-PED-27", medicine: "Pedilyte Syrup",        generic: "ORS + Zinc",           branch: "Mirpur",    stock: 41,  maxStock: 120, buyPrice: 3.10,  sellPrice: 4.20,  mfgDate: "2024-09-18", expiryDate: "2027-02-09", category: "Syrups"     },
  { id: 13, batchNo: "B-LOS-33", medicine: "Losartan 50mg",         generic: "Losartan Potassium",   branch: "Gulshan",   stock: 11,  maxStock: 80,  buyPrice: 1.90,  sellPrice: 2.70,  mfgDate: "2024-03-12", expiryDate: "2026-10-02", category: "Tablets"    },
  { id: 14, batchNo: "B-ATV-19", medicine: "Atorva 10mg",           generic: "Atorvastatin",         branch: "Dhanmondi", stock: 138, maxStock: 250, buyPrice: 2.20,  sellPrice: 3.00,  mfgDate: "2024-11-20", expiryDate: "2027-04-25", category: "Tablets"    },
  { id: 15, batchNo: "B-CEF-44", medicine: "Cefurox 500mg",         generic: "Cefuroxime",           branch: "Mirpur",    stock: 3,   maxStock: 60,  buyPrice: 5.80,  sellPrice: 7.80,  mfgDate: "2024-04-05", expiryDate: "2026-12-01", category: "Capsules"   },
  { id: 16, batchNo: "B-DCL-52", medicine: "Diclofenac Gel",        generic: "Diclofenac Sodium",    branch: "Gulshan",   stock: 76,  maxStock: 150, buyPrice: 2.40,  sellPrice: 3.30,  mfgDate: "2024-08-30", expiryDate: "2027-07-19", category: "Syrups"     },
  { id: 17, batchNo: "B-RAN-28", medicine: "Ranitidine 150mg",      generic: "Ranitidine HCl",       branch: "Dhanmondi", stock: 189, maxStock: 300, buyPrice: 0.80,  sellPrice: 1.10,  mfgDate: "2024-12-10", expiryDate: "2027-09-03", category: "Tablets"    },
  { id: 18, batchNo: "B-DEX-13", medicine: "Dexamethasone 4mg",     generic: "Dexamethasone",        branch: "Gulshan",   stock: 7,   maxStock: 50,  buyPrice: 3.50,  sellPrice: 4.90,  mfgDate: "2024-05-08", expiryDate: "2026-09-25", category: "Injections" },
  { id: 19, batchNo: "B-CLO-37", medicine: "Clonazepam 0.5mg",      generic: "Clonazepam",           branch: "Mirpur",    stock: 28,  maxStock: 100, buyPrice: 1.20,  sellPrice: 1.80,  mfgDate: "2024-10-15", expiryDate: "2027-10-15", category: "Tablets"    },
  { id: 20, batchNo: "B-AMB-08", medicine: "Ambrox 30mg Syrup",     generic: "Ambroxol HCl",         branch: "Dhanmondi", stock: 9,   maxStock: 80,  buyPrice: 2.10,  sellPrice: 3.00,  mfgDate: "2024-07-01", expiryDate: "2026-10-08", category: "Syrups"     },
];

const BRANCHES = ["All Branches", "Dhanmondi", "Gulshan", "Mirpur"];
const ROWS_OPTIONS = [5, 10, 15, 20];

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type FilterKey = "all" | "expiring" | "lowstock";

function ExpiryBadge({ days }: { days: number }) {
  if (days <= 20) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"#EF4444", display:"inline-block" }} />
      {days}d · Critical
    </span>
  );
  if (days <= 60) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#FFFBEB", color:"#B45309", border:"1px solid #FDE68A", fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"#F59E0B", display:"inline-block" }} />
      {days}d · Warning
    </span>
  );
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0", fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"#10B981", display:"inline-block" }} />
      {days}d
    </span>
  );
}

function StockBar({ stock, max }: { stock: number; max: number }) {
  const pct = Math.min(100, Math.round((stock / max) * 100));
  const low = stock < 10;
  const mid = !low && pct < 40;
  const color = low ? "#EF4444" : mid ? "#F59E0B" : "#10B981";
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:100 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
          padding:"2px 8px", borderRadius:99,
          background: low ? "#FEF2F2" : "#F0FDF4",
          color: low ? "#DC2626" : "#15803D",
          border: `1px solid ${low ? "#FECACA" : "#BBF7D0"}`,
        }}>{stock}</span>
        <span style={{ fontSize:10.5, color:"#94A3B8" }}>{pct}%</span>
      </div>
      <div style={{ height:5, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.3s" }} />
      </div>
    </div>
  );
}

function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M14.7 3.3a1 1 0 0 1 1.41 1.41L5.41 15.42 3 16l.58-2.41L14.7 3.3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconWaste() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 10v4M11 10v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function IconPlus() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function ChevDown() {
  return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevL() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevR() {
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CloseIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function AddBatchModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ batchNo:"", medicine:"", generic:"", branch:"Dhanmondi", stock:"", maxStock:"", buyPrice:"", sellPrice:"", mfgDate:"", expiryDate:"", category:"Tablets" });
  const F = (label: string, key: keyof typeof form, type="text", opts?: string[]) => (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</label>
      {opts ? (
        <div style={{ position:"relative" }}>
          <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
            style={{ width:"100%", appearance:"none", padding:"9px 30px 9px 11px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit" }}>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
          <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}><ChevDown/></span>
        </div>
      ) : (
        <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={label}
          style={{ padding:"9px 11px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit" }}
          onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
          onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
        />
      )}
    </div>
  );
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:18, width:580, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 28px 90px rgba(15,23,42,0.2)" }}>
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"white", borderRadius:"18px 18px 0 0", zIndex:1 }}>
          <div>
            <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, fontWeight:700, color:"#0F172A", margin:0 }}>Add New Batch</h2>
            <p style={{ color:"#94A3B8", fontSize:12, margin:"3px 0 0" }}>Enter batch details and stock information</p>
          </div>
          <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:9, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748B" }}><CloseIcon/></button>
        </div>
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {F("Batch No.", "batchNo")}
            {F("Category", "category", "text", ["Tablets","Capsules","Syrups","Injections","Baby Care"])}
            {F("Medicine (Brand)", "medicine")}
            {F("Generic Name", "generic")}
            {F("Branch", "branch", "text", ["Dhanmondi","Gulshan","Mirpur"])}
            {F("Available Stock", "stock", "number")}
            {F("Max Stock Capacity", "maxStock", "number")}
            {F("Buy Price (৳)", "buyPrice", "number")}
            {F("Sell Price (৳)", "sellPrice", "number")}
            {F("Manufacture Date", "mfgDate", "date")}
            {F("Expiry Date", "expiryDate", "date")}
          </div>
        </div>
        <div style={{ padding:"14px 24px 22px", borderTop:"1px solid #F1F5F9", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", color:"#64748B", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onClose} style={{ padding:"9px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 10px rgba(79,70,229,0.3)" }}>Add Batch</button>
        </div>
      </div>
    </div>
  );
}

function WasteModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:18, width:420, boxShadow:"0 28px 90px rgba(15,23,42,0.2)", padding:"28px" }}>
        <div style={{ width:48, height:48, borderRadius:14, background:"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M5 6l1.5 14h11L19 6" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v5M14 11v5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A", margin:"0 0 6px" }}>Discard / Waste Batch</h3>
        <p style={{ fontSize:13.5, color:"#64748B", margin:"0 0 6px", lineHeight:1.6 }}>
          You are about to mark <strong style={{ color:"#0F172A" }}>{batch.batchNo}</strong> ({batch.medicine}) as wasted stock. This will remove it from active inventory.
        </p>
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 14px", marginBottom:20 }}>
          <span style={{ fontSize:12.5, color:"#B45309", fontWeight:500 }}>⚠ This action is logged in the waste register and cannot be undone.</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", color:"#64748B", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onClose} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:"#F59E0B", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Confirm Discard</button>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, {bg:string;text:string}> = {
  Tablets:    {bg:"#EEF2FF",text:"#4F46E5"},
  Capsules:   {bg:"#F5F3FF",text:"#7C3AED"},
  Syrups:     {bg:"#CCFBF1",text:"#0D9488"},
  Injections: {bg:"#FEF3C7",text:"#B45309"},
  "Baby Care":{bg:"#FCE7F3",text:"#BE185D"},
};

export default function BatchesPage() {
  const [search, setSearch]         = useState("");
  const [branch, setBranch]         = useState("All Branches");
  const [filter, setFilter]         = useState<FilterKey>("all");
  const [page, setPage]             = useState(1);
  const [rows, setRows]             = useState(10);
  const [showAdd, setShowAdd]       = useState(false);
  const [wasteBatch, setWasteBatch] = useState<Batch|null>(null);
  const [sortCol, setSortCol]       = useState<string|null>(null);
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("asc");

  const expiringCount  = ALL_BATCHES.filter(b=>daysUntil(b.expiryDate)<=60).length;
  const lowStockCount  = ALL_BATCHES.filter(b=>b.stock<10).length;

  const filtered = useMemo(()=>{
    let d = ALL_BATCHES.filter(b=>{
      const q = search.toLowerCase();
      const ms = !q || b.batchNo.toLowerCase().includes(q) || b.medicine.toLowerCase().includes(q) || b.generic.toLowerCase().includes(q);
      const mb = branch==="All Branches" || b.branch===branch;
      const mf = filter==="all" ? true : filter==="expiring" ? daysUntil(b.expiryDate)<=60 : b.stock<10;
      return ms && mb && mf;
    });
    if(sortCol){
      d=[...d].sort((a,b)=>{
        const av=(a as any)[sortCol], bv=(b as any)[sortCol];
        const c=typeof av==="number"?av-bv:String(av).localeCompare(String(bv));
        return sortDir==="asc"?c:-c;
      });
    }
    return d;
  },[search,branch,filter,sortCol,sortDir]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/rows));
  const paged = filtered.slice((page-1)*rows, page*rows);

  function toggleSort(col:string){
    if(sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  }

  const SI = ({col}:{col:string}) => sortCol!==col
    ? <span style={{opacity:.3,fontSize:10}}>↕</span>
    : <span style={{fontSize:10,color:"#4F46E5"}}>{sortDir==="asc"?"↑":"↓"}</span>;

  const TH=({label,col,align="left"}:{label:string;col?:string;align?:string})=>(
    <th onClick={()=>col&&toggleSort(col)} style={{
      padding:"13px 14px", fontSize:10.5, fontWeight:700, letterSpacing:"0.07em",
      textTransform:"uppercase", color:"#64748B", textAlign:align as any,
      whiteSpace:"nowrap", cursor:col?"pointer":"default", userSelect:"none",
      background:"#F8FAFC", borderBottom:"2px solid #E2E8F0",
    }}>
      <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
        {label}{col&&<SI col={col}/>}
      </span>
    </th>
  );

  const filterBtns: {key:FilterKey;label:string;count:number;active:{bg:string;text:string;border:string}}[] = [
    { key:"all",      label:"All Batches",          count:ALL_BATCHES.length, active:{bg:"#EEF2FF",text:"#4F46E5",border:"#A5B4FC"} },
    { key:"expiring", label:"Expiring Soon",         count:expiringCount,      active:{bg:"#FFFBEB",text:"#B45309",border:"#FDE68A"} },
    { key:"lowstock", label:"Low Stock (<10 Units)", count:lowStockCount,      active:{bg:"#FEF2F2",text:"#DC2626",border:"#FECACA"} },
  ];

  return (
    <div style={{ padding:"28px", display:"flex", flexDirection:"column", gap:20, flex:1 }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", margin:0, lineHeight:1.2 }}>Inventory & Batch Management</h1>
            <p style={{ color:"#94A3B8", fontSize:13.5, margin:"5px 0 0" }}>Track medicine stock, cost prices, and shelf-life expiration dates</p>
          </div>
          <button onClick={()=>setShowAdd(true)} style={{
            display:"flex", alignItems:"center", gap:7,
            background:"linear-gradient(135deg,#4F46E5,#6366F1)",
            color:"white", border:"none", borderRadius:11,
            padding:"10px 20px", fontSize:13.5, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 2px 12px rgba(79,70,229,0.3)",
            whiteSpace:"nowrap",
          }}><IconPlus/> Add New Batch</button>
        </div>

        {/* Quick Filter Badges */}
        <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
          {filterBtns.map(f=>{
            const isActive=filter===f.key;
            return (
              <button key={f.key} onClick={()=>{setFilter(f.key);setPage(1);}} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"8px 16px", borderRadius:10, border:`1.5px solid ${isActive?f.active.border:"#E2E8F0"}`,
                background:isActive?f.active.bg:"white",
                color:isActive?f.active.text:"#64748B",
                fontSize:13, fontWeight:isActive?700:500,
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.13s",
              }}>
                {f.label}
                <span style={{
                  fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
                  background:isActive?"rgba(0,0,0,0.08)":"#F1F5F9",
                  padding:"1px 8px", borderRadius:99,
                  color:isActive?f.active.text:"#64748B",
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search + Branch filter row */}
        <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:"1 1 260px", maxWidth:340 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94A3B8" }}><IconSearch/></span>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Search by batch number or drug…"
              style={{ width:"100%", paddingLeft:34, paddingRight:14, paddingTop:9, paddingBottom:9, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
              onFocus={e=>{e.target.style.borderColor="#A5B4FC";}}
              onBlur={e=>{e.target.style.borderColor="#E2E8F0";}}
            />
          </div>
          <div style={{ position:"relative" }}>
            <select value={branch} onChange={e=>{setBranch(e.target.value);setPage(1);}} style={{ appearance:"none", padding:"9px 34px 9px 12px", background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", cursor:"pointer", fontFamily:"inherit", minWidth:170 }}>
              {BRANCHES.map(b=><option key={b}>{b}</option>)}
            </select>
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}><ChevDown/></span>
          </div>
          <span style={{ fontSize:12.5, color:"#94A3B8", marginLeft:4 }}>{filtered.length} batch{filtered.length!==1?"es":""}</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 1px 8px rgba(15,23,42,0.04)" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1020 }}>
            <thead>
              <tr>
                <TH label="Batch No." col="batchNo"/>
                <TH label="Medicine & Generic" col="medicine"/>
                <TH label="Branch" col="branch"/>
                <TH label="Stock" col="stock" align="center"/>
                <TH label="Buy Price (৳)" col="buyPrice" align="right"/>
                <TH label="Sell Price (৳)" col="sellPrice" align="right"/>
                <TH label="Mfg. Date" col="mfgDate" align="center"/>
                <TH label="Expiry Date" col="expiryDate" align="center"/>
                <TH label="Actions" align="center"/>
              </tr>
            </thead>
            <tbody>
              {paged.map((b,i)=>{
                const days=daysUntil(b.expiryDate);
                const even=i%2===0;
                const cat=CATEGORY_COLORS[b.category]??{bg:"#F1F5F9",text:"#64748B"};
                return (
                  <tr key={b.id}
                    style={{ background:even?"white":"#FAFBFC", borderBottom:"1px solid #F1F5F9", transition:"background 0.12s" }}
                    onMouseEnter={e=>(e.currentTarget.style.background="#F5F7FF")}
                    onMouseLeave={e=>(e.currentTarget.style.background=even?"white":"#FAFBFC")}
                  >
                    {/* Batch No */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, background:"#F1F5F9", color:"#334155", padding:"4px 10px", borderRadius:8 }}>{b.batchNo}</span>
                    </td>

                    {/* Medicine */}
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontWeight:600, fontSize:13.5, color:"#0F172A" }}>{b.medicine}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                        <span style={{ fontSize:11.5, color:"#94A3B8" }}>{b.generic}</span>
                        <span style={{ background:cat.bg, color:cat.text, fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:99 }}>{b.category}</span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:"#475569", fontWeight:500 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", flexShrink:0 }}/>
                        {b.branch}
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding:"12px 16px" }}>
                      <StockBar stock={b.stock} max={b.maxStock}/>
                    </td>

                    {/* Buy Price */}
                    <td style={{ padding:"12px 14px", textAlign:"right" }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#64748B" }}>৳{b.buyPrice.toFixed(2)}</span>
                    </td>

                    {/* Sell Price */}
                    <td style={{ padding:"12px 14px", textAlign:"right" }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:"#0D9488" }}>৳{b.sellPrice.toFixed(2)}</span>
                    </td>

                    {/* Mfg Date */}
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <span style={{ fontSize:12.5, color:"#64748B", whiteSpace:"nowrap" }}>{fmtDate(b.mfgDate)}</span>
                    </td>

                    {/* Expiry */}
                    <td style={{ padding:"12px 14px", textAlign:"center" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <span style={{ fontSize:12.5, color:"#334155", whiteSpace:"nowrap" }}>{fmtDate(b.expiryDate)}</span>
                        <ExpiryBadge days={days}/>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding:"12px 16px", textAlign:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        <button title="Edit batch"
                          style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:"#4F46E5", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.13s" }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#EEF2FF";(e.currentTarget as HTMLButtonElement).style.borderColor="#A5B4FC";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="white";(e.currentTarget as HTMLButtonElement).style.borderColor="#E2E8F0";}}
                        ><IconEdit/></button>
                        <button title="Discard / Waste" onClick={()=>setWasteBatch(b)}
                          style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:"#F59E0B", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.13s" }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#FFFBEB";(e.currentTarget as HTMLButtonElement).style.borderColor="#FDE68A";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="white";(e.currentTarget as HTMLButtonElement).style.borderColor="#E2E8F0";}}
                        ><IconWaste/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length===0&&(
                <tr><td colSpan={9} style={{ padding:"60px 0", textAlign:"center", color:"#94A3B8" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>No batches found</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Try adjusting your search or filters</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid #F1F5F9", background:"#FAFBFC", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, color:"#64748B" }}>Rows per page:</span>
            <div style={{ position:"relative" }}>
              <select value={rows} onChange={e=>{setRows(Number(e.target.value));setPage(1);}}
                style={{ appearance:"none", padding:"5px 28px 5px 10px", background:"white", border:"1.5px solid #E2E8F0", borderRadius:8, fontSize:13, color:"#334155", outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
                {ROWS_OPTIONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}><ChevDown/></span>
            </div>
          </div>

          <span style={{ fontSize:13, color:"#64748B" }}>
            Showing <strong style={{ color:"#334155" }}>{(page-1)*rows+1}–{Math.min(page*rows,filtered.length)}</strong> of <strong style={{ color:"#334155" }}>{filtered.length}</strong>
          </span>

          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:page===1?"#CBD5E1":"#334155", cursor:page===1?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevL/>
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
              .reduce<(number|"…")[]>((acc,p,idx,arr)=>{
                if(idx>0&&typeof arr[idx-1]==="number"&&(p as number)-(arr[idx-1] as number)>1) acc.push("…");
                acc.push(p); return acc;
              },[])
              .map((p,idx)=> p==="…"
                ? <span key={`d${idx}`} style={{ padding:"0 4px", color:"#94A3B8", fontSize:13 }}>…</span>
                : <button key={p} onClick={()=>setPage(p as number)} style={{ width:32, height:32, borderRadius:8, border:"1.5px solid", borderColor:page===p?"#4F46E5":"#E2E8F0", background:page===p?"#4F46E5":"white", color:page===p?"white":"#334155", fontSize:13, fontWeight:page===p?700:400, cursor:"pointer", fontFamily:"inherit" }}>{p}</button>
              )
            }
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:page===totalPages?"#CBD5E1":"#334155", cursor:page===totalPages?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevR/>
            </button>
          </div>
        </div>
      </div>

      {showAdd && <AddBatchModal onClose={()=>setShowAdd(false)}/>}
      {wasteBatch && <WasteModal batch={wasteBatch} onClose={()=>setWasteBatch(null)}/>}
    </div>
  );
}
