import { useState, useMemo } from "react";

/* ─── Types ─── */
type Supplier = {
  id: number; name: string; rep: string; phone: string;
  email: string; address: string; orders: number; category: string;
  logo: string;
};
type Invoice = {
  id: number; po: string; supplier: string; date: string;
  billed: number; paid: number; status: "Paid" | "Partial" | "Due";
  method: "Bank Transfer" | "Cash" | "Cheque";
};

/* ─── Data ─── */
const SUPPLIERS: Supplier[] = [
  { id:1,  name:"Square Pharmaceuticals", rep:"Md. Arif Hossain",   phone:"01711-234567", email:"arif@square-pharma.com",    address:"Mohakhali, Dhaka-1212",     orders:142, category:"Multi-segment", logo:"SQ" },
  { id:2,  name:"Beximco Pharma",         rep:"Tanvir Ahmed",        phone:"01855-345678", email:"tanvir@beximco-pharma.com", address:"Tejgaon, Dhaka-1208",       orders:98,  category:"Generic",       logo:"BX" },
  { id:3,  name:"Incepta Pharmaceuticals",rep:"Nasrin Sultana",      phone:"01922-456789", email:"nasrin@incepta.com",        address:"Savar, Dhaka-1340",         orders:74,  category:"Antibiotics",   logo:"IN" },
  { id:4,  name:"Renata Limited",         rep:"Karim Uddin",         phone:"01633-567890", email:"karim@renata.com",          address:"Mirpur, Dhaka-1216",        orders:61,  category:"Branded",       logo:"RL" },
  { id:5,  name:"ACI Limited",            rep:"Sadia Islam",         phone:"01744-678901", email:"sadia@aci-bd.com",          address:"Tejgaon I/A, Dhaka-1208",   orders:55,  category:"Consumer",      logo:"AC" },
  { id:6,  name:"Novo Nordisk BD",        rep:"Dr. Farhan Rashid",   phone:"01811-789012", email:"farhan@novonordisk.com",    address:"Gulshan-2, Dhaka-1212",     orders:29,  category:"Insulin",       logo:"NN" },
  { id:7,  name:"GSK Bangladesh",         rep:"Priya Chowdhury",     phone:"01966-890123", email:"priya@gsk.com",             address:"Banani, Dhaka-1213",        orders:23,  category:"Vaccines",      logo:"GK" },
  { id:8,  name:"Opsonin Pharma",         rep:"Rubel Mia",           phone:"01888-901234", email:"rubel@opsonin.com",         address:"Tongi, Gazipur-1700",       orders:18,  category:"Generic",       logo:"OP" },
];

const INVOICES: Invoice[] = [
  { id:1,  po:"PO-9921", supplier:"Square Pharmaceuticals", date:"2026-09-08", billed:4200,  paid:4200,  status:"Paid",    method:"Bank Transfer" },
  { id:2,  po:"PO-9920", supplier:"Beximco Pharma",         date:"2026-09-06", billed:3150,  paid:1500,  status:"Partial", method:"Cash"          },
  { id:3,  po:"PO-9919", supplier:"Incepta Pharmaceuticals",date:"2026-09-04", billed:2800,  paid:0,     status:"Due",     method:"Bank Transfer" },
  { id:4,  po:"PO-9918", supplier:"Renata Limited",         date:"2026-09-01", billed:1900,  paid:1900,  status:"Paid",    method:"Cheque"        },
  { id:5,  po:"PO-9917", supplier:"ACI Limited",            date:"2026-08-28", billed:3400,  paid:2000,  status:"Partial", method:"Bank Transfer" },
  { id:6,  po:"PO-9916", supplier:"Novo Nordisk BD",        date:"2026-08-25", billed:5200,  paid:5200,  status:"Paid",    method:"Bank Transfer" },
  { id:7,  po:"PO-9915", supplier:"GSK Bangladesh",         date:"2026-08-20", billed:980,   paid:980,   status:"Paid",    method:"Cash"          },
  { id:8,  po:"PO-9914", supplier:"Opsonin Pharma",         date:"2026-08-18", billed:1420,  paid:0,     status:"Due",     method:"Bank Transfer" },
  { id:9,  po:"PO-9913", supplier:"Square Pharmaceuticals", date:"2026-08-14", billed:2600,  paid:2600,  status:"Paid",    method:"Cheque"        },
  { id:10, po:"PO-9912", supplier:"Beximco Pharma",         date:"2026-08-10", billed:1800,  paid:900,   status:"Partial", method:"Cash"          },
  { id:11, po:"PO-9911", supplier:"Incepta Pharmaceuticals",date:"2026-08-05", billed:3100,  paid:3100,  status:"Paid",    method:"Bank Transfer" },
  { id:12, po:"PO-9910", supplier:"ACI Limited",            date:"2026-07-30", billed:750,   paid:0,     status:"Due",     method:"Bank Transfer" },
];

const LOGO_COLORS: Record<string, string> = {
  SQ:"#4F46E5", BX:"#0D9488", IN:"#7C3AED", RL:"#0891B2", AC:"#D97706", NN:"#DB2777", GK:"#059669", OP:"#DC2626",
};

const ROWS_OPTIONS = [5, 10, 15];

/* ─── Helpers ─── */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}
function StatusBadge({ s }: { s: Invoice["status"] }) {
  const map = { Paid:{ bg:"#F0FDF4",text:"#15803D",border:"#BBF7D0",dot:"#10B981" }, Partial:{ bg:"#FFFBEB",text:"#B45309",border:"#FDE68A",dot:"#F59E0B" }, Due:{ bg:"#FEF2F2",text:"#DC2626",border:"#FECACA",dot:"#EF4444" } };
  const c = map[s];
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, color:c.text, border:`1px solid ${c.border}`, fontSize:11.5, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
    <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot }} />{s}
  </span>;
}
function MethodBadge({ m }: { m: string }) {
  return <span style={{ fontSize:11.5, color:"#64748B", background:"#F1F5F9", padding:"3px 9px", borderRadius:99, fontWeight:500 }}>{m}</span>;
}

/* ─── Icons ─── */
const IconPlus=()=><svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
const IconDownload=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
const IconPhone=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h2l1.5 4L7 8.5a11 11 0 004.5 4.5L13 11.5l4 1.5v2a2 2 0 01-2 2A16 16 0 013 5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
const IconMail=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconPin=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>;
const IconBox=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M17 7l-7-4-7 4v6l7 4 7-4V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M3 7l7 4 7-4M10 11v6" stroke="currentColor" strokeWidth="1.4"/></svg>;
const IconPO=()=><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const ChevDown=()=><svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevL=()=><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevR=()=><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CloseIcon=()=><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconSearch=()=><svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

/* ─── New Purchase Modal ─── */
function PurchaseModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ supplier:"Square Pharmaceuticals", invoiceNo:"", batch:"", medicine:"", qty:"", buyPrice:"", totalAmt:"", payMethod:"Bank Transfer", notes:"" });
  function f(label: string, key: keyof typeof form, type="text", opts?: string[]) {
    return (
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
          <input type={type} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={`Enter ${label.toLowerCase()}`}
            style={{ padding:"9px 11px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit" }}
            onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
            onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
          />
        )}
      </div>
    );
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"white", borderRadius:18, width:580, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 28px 90px rgba(15,23,42,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"white", borderRadius:"18px 18px 0 0", zIndex:1 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#4F46E5,#0D9488)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IconPO/>
              </div>
              <div>
                <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, fontWeight:700, color:"#0F172A", margin:0 }}>New Medicine Purchase Entry</h2>
                <p style={{ color:"#94A3B8", fontSize:12, margin:"2px 0 0" }}>Record a supplier invoice and batch received</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:9, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#64748B" }}><CloseIcon/></button>
        </div>
        {/* Body */}
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {f("Supplier", "supplier", "text", SUPPLIERS.map(s=>s.name))}
            {f("Invoice No.", "invoiceNo")}
            {f("Medicine (Brand Name)", "medicine")}
            {f("Batch No. Received", "batch")}
            {f("Quantity (Units)", "qty", "number")}
            {f("Wholesale Buy Price (৳)", "buyPrice", "number")}
            {f("Total Amount (৳)", "totalAmt", "number")}
            {f("Payment Method", "payMethod", "text", ["Bank Transfer","Cash","Cheque","MFS"])}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em" }}>Notes (Optional)</label>
            <textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Add any notes about this purchase…"
              style={{ padding:"9px 11px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", resize:"none" }}
              onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
              onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
            />
          </div>
          {/* Summary preview */}
          {form.qty && form.buyPrice && (
            <div style={{ background:"linear-gradient(135deg,#EEF2FF,#CCFBF1)", borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:"#64748B", fontWeight:500 }}>Calculated Total</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:800, color:"#4F46E5" }}>
                ৳{(parseFloat(form.qty||"0")*parseFloat(form.buyPrice||"0")).toLocaleString("en",{minimumFractionDigits:2})}
              </span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding:"14px 24px 22px", borderTop:"1px solid #F1F5F9", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", color:"#64748B", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onClose} style={{ padding:"9px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#0D9488)", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 12px rgba(79,70,229,0.3)" }}>
            Save Purchase Entry
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SuppliersPage() {
  const [tab, setTab]           = useState<"directory"|"invoices">("directory");
  const [showModal, setModal]   = useState(false);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [page, setPage]         = useState(1);
  const [rows, setRows]         = useState(10);

  const totalDue = INVOICES.reduce((s,i)=>s+(i.billed-i.paid),0);

  const filteredInvoices = useMemo(()=>{
    const q = search.toLowerCase();
    return INVOICES.filter(i=>{
      const ms = !q || i.po.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q);
      const mst = statusFilter==="All" || i.status===statusFilter;
      return ms && mst;
    });
  },[search,statusFilter]);

  const totalPages = Math.max(1,Math.ceil(filteredInvoices.length/rows));
  const paged = filteredInvoices.slice((page-1)*rows, page*rows);

  const filteredSuppliers = useMemo(()=>{
    const q = search.toLowerCase();
    return !q ? SUPPLIERS : SUPPLIERS.filter(s=>s.name.toLowerCase().includes(q)||s.rep.toLowerCase().includes(q)||s.category.toLowerCase().includes(q));
  },[search]);

  return (
    <div style={{ padding:"28px", display:"flex", flexDirection:"column", gap:20, flex:1 }}>

      {/* ── Page Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", margin:0 }}>Suppliers & Purchase Billing</h1>
          <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Manage pharmaceutical suppliers and procurement invoices</p>
        </div>
        <button onClick={()=>setModal(true)} style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#4F46E5,#0D9488)", color:"white", border:"none", borderRadius:11, padding:"10px 20px", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 12px rgba(79,70,229,0.3)", whiteSpace:"nowrap" }}>
          <IconPlus/> New Medicine Purchase Entry
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {/* Total Suppliers */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#4F46E5" strokeWidth="1.6"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <span style={{ background:"#F0FDF4", color:"#15803D", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>All Active</span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:30, fontWeight:800, color:"#0F172A", lineHeight:1 }}>24</div>
          <div style={{ color:"#94A3B8", fontSize:13, marginTop:5, fontWeight:500 }}>Total Suppliers</div>
          <div style={{ color:"#64748B", fontSize:12, marginTop:3 }}>8 shown in directory</div>
        </div>

        {/* Total Purchases */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#CCFBF1", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#0D9488" strokeWidth="1.6" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#0D9488" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, background:"#DCFCE7", color:"#15803D", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M3 15l5-5 4 3 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              +8.4%
            </div>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:30, fontWeight:800, color:"#0F172A", lineHeight:1 }}>$18,450</div>
          <div style={{ color:"#94A3B8", fontSize:13, marginTop:5, fontWeight:500 }}>Total Purchases This Month</div>
          <div style={{ color:"#64748B", fontSize:12, marginTop:3 }}>vs $17,020 last month</div>
        </div>

        {/* Outstanding Due */}
        <div style={{ background:"#FFFBEB", borderRadius:16, border:"1px solid #FDE68A", padding:"22px 24px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#FEF3C7", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#D97706" strokeWidth="1.6" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ background:"#FEF3C7", color:"#B45309", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99, border:"1px solid #FDE68A" }}>Action Needed</span>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:30, fontWeight:800, color:"#B45309", lineHeight:1 }}>$3,210</div>
          <div style={{ color:"#D97706", fontSize:13, marginTop:5, fontWeight:600 }}>Outstanding Due to Suppliers</div>
          <div style={{ color:"#F59E0B", fontSize:12, marginTop:3 }}>Across 4 pending invoices</div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", background:"#F1F5F9", borderRadius:12, padding:4, gap:2 }}>
          {([["directory","🏢  Supplier Directory"],["invoices","🧾  Invoices & Billing"]] as const).map(([key,label])=>(
            <button key={key} onClick={()=>{setTab(key);setSearch("");setPage(1);}} style={{
              padding:"8px 20px", borderRadius:9, border:"none",
              background:tab===key?"white":"transparent",
              color:tab===key?"#0F172A":"#64748B",
              fontSize:13.5, fontWeight:tab===key?700:500,
              cursor:"pointer", fontFamily:"inherit",
              boxShadow:tab===key?"0 1px 4px rgba(15,23,42,0.08)":"none",
              transition:"all 0.15s",
            }}>{label}</button>
          ))}
        </div>

        {/* Search — shared */}
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94A3B8" }}><IconSearch/></span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder={tab==="directory"?"Search suppliers…":"Search PO or supplier…"}
            style={{ paddingLeft:34, paddingRight:14, paddingTop:9, paddingBottom:9, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:13, color:"#334155", outline:"none", fontFamily:"inherit", width:240 }}
            onFocus={e=>{e.target.style.borderColor="#A5B4FC";}}
            onBlur={e=>{e.target.style.borderColor="#E2E8F0";}}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — Supplier Directory
      ══════════════════════════════════════ */}
      {tab==="directory" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          {filteredSuppliers.map(s=>{
            const color = LOGO_COLORS[s.logo] ?? "#64748B";
            return (
              <div key={s.id} style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"20px", display:"flex", flexDirection:"column", gap:14, transition:"box-shadow 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 20px rgba(15,23,42,0.07)")}
                onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}
              >
                {/* Card header */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:46, height:46, borderRadius:12, background:`${color}18`, border:`1.5px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:800, color }}>{s.logo}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:14.5, color:"#0F172A", lineHeight:1.2 }}>{s.name}</div>
                    <span style={{ display:"inline-block", marginTop:4, background:"#EEF2FF", color:"#4F46E5", fontSize:10.5, fontWeight:600, padding:"2px 8px", borderRadius:99 }}>{s.category}</span>
                  </div>
                </div>

                {/* Rep */}
                <div style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Rep Contact</div>
                  <div style={{ fontWeight:600, fontSize:13.5, color:"#0F172A", marginBottom:8 }}>{s.rep}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {[{icon:<IconPhone/>,val:s.phone},{icon:<IconMail/>,val:s.email},{icon:<IconPin/>,val:s.address}].map(({icon,val},i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:7, color:"#64748B", fontSize:12.5 }}>
                        <span style={{ marginTop:1, flexShrink:0, color:"#94A3B8" }}>{icon}</span>{val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer stats + CTA */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, color:"#64748B", fontSize:12.5 }}>
                    <IconBox/>
                    <span><strong style={{ color:"#0F172A" }}>{s.orders}</strong> orders supplied</span>
                  </div>
                  <button onClick={()=>setModal(true)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:9, border:"1.5px solid #C7D2FE", background:"#EEF2FF", color:"#4F46E5", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.13s" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#4F46E5";(e.currentTarget as HTMLButtonElement).style.color="white";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#EEF2FF";(e.currentTarget as HTMLButtonElement).style.color="#4F46E5";}}
                  >
                    <IconPO/> Create PO
                  </button>
                </div>
              </div>
            );
          })}
          {filteredSuppliers.length===0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"60px 0", color:"#94A3B8" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🏢</div>
              <div style={{ fontSize:14, fontWeight:500 }}>No suppliers found</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — Invoices & Billing Table
      ══════════════════════════════════════ */}
      {tab==="invoices" && (
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 1px 8px rgba(15,23,42,0.04)" }}>
          {/* Table filters */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {(["All","Paid","Partial","Due"] as const).map(s=>(
              <button key={s} onClick={()=>{setStatus(s);setPage(1);}} style={{
                padding:"5px 14px", borderRadius:99, border:"1.5px solid",
                borderColor:statusFilter===s?"#4F46E5":"#E2E8F0",
                background:statusFilter===s?"#EEF2FF":"white",
                color:statusFilter===s?"#4F46E5":"#64748B",
                fontSize:12.5, fontWeight:statusFilter===s?700:500,
                cursor:"pointer", fontFamily:"inherit",
              }}>{s}{s==="All"?` (${INVOICES.length})`:""}</button>
            ))}
            <span style={{ marginLeft:"auto", fontSize:12.5, color:"#94A3B8" }}>{filteredInvoices.length} invoice{filteredInvoices.length!==1?"s":""}</span>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:920 }}>
              <thead>
                <tr>
                  {["PO Number","Supplier","Invoice Date","Billed (৳)","Paid (৳)","Balance (৳)","Status","Method",""].map((h,i)=>(
                    <th key={i} style={{ padding:"13px 16px", fontSize:10.5, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"#64748B", textAlign:i>=3&&i<=5?"right":"left", background:"#F8FAFC", borderBottom:"2px solid #E2E8F0", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((inv,i)=>{
                  const bal = inv.billed-inv.paid;
                  const even = i%2===0;
                  return (
                    <tr key={inv.id}
                      style={{ background:even?"white":"#FAFBFC", borderBottom:"1px solid #F1F5F9", transition:"background 0.12s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#F5F7FF")}
                      onMouseLeave={e=>(e.currentTarget.style.background=even?"white":"#FAFBFC")}
                    >
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, fontWeight:700, background:"#F1F5F9", color:"#334155", padding:"4px 10px", borderRadius:8 }}>{inv.po}</span>
                      </td>
                      <td style={{ padding:"13px 16px" }}>
                        <div style={{ fontWeight:600, fontSize:13.5, color:"#0F172A" }}>{inv.supplier}</div>
                      </td>
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ fontSize:13, color:"#64748B" }}>{fmtDate(inv.date)}</span>
                      </td>
                      <td style={{ padding:"13px 16px", textAlign:"right" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600, color:"#0F172A" }}>৳{inv.billed.toLocaleString()}</span>
                      </td>
                      <td style={{ padding:"13px 16px", textAlign:"right" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#0D9488", fontWeight:600 }}>৳{inv.paid.toLocaleString()}</span>
                      </td>
                      <td style={{ padding:"13px 16px", textAlign:"right" }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:bal>0?"#DC2626":"#15803D" }}>
                          {bal>0?`৳${bal.toLocaleString()}`:"—"}
                        </span>
                      </td>
                      <td style={{ padding:"13px 16px" }}><StatusBadge s={inv.status}/></td>
                      <td style={{ padding:"13px 16px" }}><MethodBadge m={inv.method}/></td>
                      <td style={{ padding:"13px 14px" }}>
                        <button style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:"#4F46E5", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", transition:"all 0.13s" }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#EEF2FF";(e.currentTarget as HTMLButtonElement).style.borderColor="#A5B4FC";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="white";(e.currentTarget as HTMLButtonElement).style.borderColor="#E2E8F0";}}
                        ><IconDownload/> PDF</button>
                      </td>
                    </tr>
                  );
                })}
                {paged.length===0&&(
                  <tr><td colSpan={9} style={{ padding:"50px 0", textAlign:"center", color:"#94A3B8" }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🧾</div>
                    <div style={{ fontSize:14, fontWeight:500 }}>No invoices found</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
              Showing <strong style={{ color:"#334155" }}>{(page-1)*rows+1}–{Math.min(page*rows,filteredInvoices.length)}</strong> of <strong style={{ color:"#334155" }}>{filteredInvoices.length}</strong>
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
      )}

      {showModal && <PurchaseModal onClose={()=>setModal(false)}/>}
    </div>
  );
}
