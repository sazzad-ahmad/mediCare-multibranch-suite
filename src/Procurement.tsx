import { useEffect, useState } from "react";
import { ApiService } from "./services/api";

/* ─── Data ─── */
const SUPPLIER_OPTS = ["Square Pharmaceuticals Ltd.", "Beximco Pharma Ltd.", "Incepta Pharmaceuticals", "Renata Limited"];

const BRANCHES_OPTS = ["UIU Madani Branch", "Dhanmondi Central Branch", "Uttara Sector 7 Branch"];

type Order = { po:string; poId:number; medicine:string; supplier:string; branch:string; branchId:number; qty:number; cost:number; status:"pending"|"approved"|"received"; paymentStatus:"Paid"|"Pending"; paymentMethod:"Bank Transfer"|"Cash"|"Credit"; date:string };
type Supplier = { id:number; name:string; contact:string; phone:string; email:string; address:string; categories:string; orders:number; status:string };

const SEED_SUPPLIERS: Supplier[] = [
  { id:1, name:"Square Pharmaceuticals Ltd.", contact:"Mr. Arif Hossain",  phone:"+880-2-9887580", email:"arif@squarepharma.com.bd", address:"Dhaka, Bangladesh", categories:"Tablets, Capsules, Syrups", orders:24, status:"Active" },
  { id:2, name:"Beximco Pharma Ltd.",         contact:"Ms. Rima Begum",    phone:"+880-2-8836171", email:"rima@beximcopharma.com",    address:"Tongi, Gazipur", categories:"Tablets, Injections", orders:18, status:"Active" },
  { id:3, name:"Incepta Pharmaceuticals",     contact:"Mr. Tanvir Ahmed",  phone:"+880-2-7793000", email:"tanvir@inceptapharma.com",  address:"Dhamrai, Dhaka", categories:"Capsules, Syrups", orders:15, status:"Active" },
  { id:4, name:"Renata Limited",              contact:"Ms. Farida Khatun", phone:"+880-2-8878878", email:"farida@renata.com.bd",      address:"Mirpur, Dhaka", categories:"Injections, Baby Care", orders:11, status:"Active" },
];

type Filter = "all" | "pending" | "approved" | "received";
type Tab = "requisitions" | "suppliers";

const STATUS_CFG: Record<string, {bg:string;text:string;label:string}> = {
  pending:  { bg:"#FEF3C7", text:"#D97706", label:"Pending Approval"   },
  approved: { bg:"#EEF2FF", text:"#4F46E5", label:"Approved by Admin"  },
  received: { bg:"#DCFCE7", text:"#15803D", label:"Received & Stocked" },
};

/* ─── Icons ─── */
function IcoTruck(){return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="12" height="9" rx="1.5" stroke="#4F46E5" strokeWidth="1.5"/><path d="M13 8h3.5l2.5 3v3h-6V8z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="5" cy="15.5" r="1.5" stroke="#4F46E5" strokeWidth="1.5"/><circle cx="15.5" cy="15.5" r="1.5" stroke="#4F46E5" strokeWidth="1.5"/></svg>;}
function IcoAlert(){return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3L2 17h16L10 3z" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 9v3M10 14.5h.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoTrend(){return <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M3 15l5-5 4 3 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoPlus(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;}
function IcoFilter(){return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;}
function IcoDoc(){return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 3h7l3 3v11H5V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 3v3h3M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;}
function IcoCheck(){return <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoX(){return <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;}
function IcoBuilding(){return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 18V6l6-3 6 3v12" stroke="#0D9488" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 18v-5h2v5M7 8h1M12 8h1M7 11h1M12 11h1" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round"/></svg>;}
function IcoClose(){return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/></svg>;}

function SupplierProfileModal({ supplier, onClose }: { supplier: typeof SEED_SUPPLIERS[0]; onClose: () => void }) {
  return <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
    <div style={{ background:"white", borderRadius:20, width:460, maxWidth:"95vw", boxShadow:"0 24px 80px rgba(15,23,42,0.18)", overflow:"hidden" }}>
      <div style={{ padding:"22px 28px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div><div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A" }}>Supplier Profile</div><div style={{ color:"#94A3B8", fontSize:12.5, marginTop:3 }}>Registered supplier details</div></div>
        <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><IcoClose/></button>
      </div>
      <div style={{ padding:"24px 28px", display:"grid", gap:15 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A" }}>{supplier.name}</div>
        {[["Company name",supplier.name],["Contact person",supplier.contact],["Phone",supplier.phone],["Email",supplier.email],["Address",supplier.address],["Total POs",`${supplier.orders} POs`],["Supplied categories",supplier.categories]].map(([label,value])=><div key={label} style={{ display:"flex", justifyContent:"space-between", gap:20, paddingBottom:10, borderBottom:"1px solid #F1F5F9" }}><span style={{ color:"#94A3B8", fontSize:12.5, fontWeight:600 }}>{label}</span><span style={{ color:"#334155", fontSize:13, fontWeight:600, textAlign:"right" }}>{value}</span></div>)}
      </div>
      <div style={{ padding:"0 28px 22px", display:"flex", justifyContent:"flex-end" }}><button onClick={onClose} style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #E2E8F0", background:"white", color:"#475569", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Close</button></div>
    </div>
  </div>;
}

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const date = order.date;
  return <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
    <div style={{ background:"white", borderRadius:20, width:500, maxWidth:"95vw", boxShadow:"0 24px 80px rgba(15,23,42,0.18)", overflow:"hidden" }}>
      <div style={{ padding:"22px 28px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}><div><div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A" }}>Invoice / Receipt</div><div style={{ color:"#94A3B8", fontSize:12.5, marginTop:3 }}>Completed purchase order</div></div><button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><IcoClose/></button></div>
      <div style={{ padding:"24px 28px", display:"grid", gap:14 }}>{[["PO number",order.po],["Supplier",order.supplier],["Medicine",order.medicine],["Quantity",`${order.qty} units`],["Paid amount",`$${order.cost.toFixed(2)}`],["Payment",`${order.paymentStatus} · ${order.paymentMethod}`],["Date",date],["Status","Completed"]].map(([label,value])=><div key={label} style={{ display:"flex", justifyContent:"space-between", gap:20, paddingBottom:10, borderBottom:"1px solid #F1F5F9" }}><span style={{ color:"#94A3B8", fontSize:12.5, fontWeight:600 }}>{label}</span><span style={{ color:label==="Status"?"#15803D":"#334155", fontSize:13, fontWeight:700, textAlign:"right" }}>{value}</span></div>)}</div>
      <div style={{ padding:"0 28px 22px", display:"flex", justifyContent:"flex-end", gap:10 }}><button onClick={()=>window.print()} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#4338CA,#4F46E5)", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Print Receipt</button><button onClick={onClose} style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #E2E8F0", background:"white", color:"#475569", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Close</button></div>
    </div>
  </div>;
}

function AddSupplierModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (supplier: Supplier) => Promise<void> }) {
  const [form, setForm] = useState({ name:"", contact:"", phone:"", email:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputStyle: React.CSSProperties = { width:"100%", padding:"9px 13px", borderRadius:9, border:"1.5px solid #E2E8F0", fontSize:13.5, fontFamily:"inherit", color:"#0F172A", background:"white", outline:"none", boxSizing:"border-box" };
  const submit = async () => {
    if (!form.name.trim() || !form.contact.trim() || !form.phone.trim() || !form.email.trim()) {
      setError("Please complete all supplier fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ id:Date.now(), name:form.name.trim(), contact:form.contact.trim(), phone:form.phone.trim(), email:form.email.trim(), address:"—", categories:"—", orders:0, status:"Active" });
      onClose();
    } catch (submitError) {
      console.error("Supplier save error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unable to add supplier.");
    } finally {
      setSaving(false);
    }
  };
  return <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
    <div style={{ background:"white", borderRadius:20, width:460, maxWidth:"95vw", boxShadow:"0 24px 80px rgba(15,23,42,0.18)", overflow:"hidden" }}>
      <div style={{ padding:"22px 28px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div><div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A" }}>Add Supplier</div><div style={{ color:"#94A3B8", fontSize:12.5, marginTop:3 }}>Register a pharmaceutical supplier</div></div>
        <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><IcoClose/></button>
      </div>
      <div style={{ padding:"22px 28px", display:"grid", gap:14 }}>
        {([["Company Name","name","e.g. Beacon Pharmaceuticals"],["Contact Person","contact","e.g. Mr. Rahman"],["Phone","phone","+880-2-0000000"],["Email","email","supplier@example.com"]] as const).map(([label,key,placeholder])=><div key={key}><label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label><input type={key==="email"?"email":"text"} value={form[key]} placeholder={placeholder} onChange={e=>setForm({...form,[key]:e.target.value})} style={inputStyle}/></div>)}
        {error && <div style={{ color:"#DC2626", fontSize:12.5 }}>{error}</div>}
      </div>
      <div style={{ padding:"0 28px 22px", display:"flex", gap:10, justifyContent:"flex-end" }}><button onClick={onClose} disabled={saving} style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #E2E8F0", background:"white", color:"#475569", fontSize:13.5, fontWeight:600, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit" }}>Cancel</button><button onClick={submit} disabled={saving} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#0D9488,#059669)", color:"white", fontSize:13.5, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>{saving ? "Saving..." : "Add Supplier"}</button></div>
    </div>
  </div>;
}

/* ─── KPI Card ─── */
function KpiCard({ title, value, sub, bg, icon }: {
  title:string; value:string; sub:React.ReactNode; bg:string; icon:React.ReactNode;
}) {
  return (
    <div style={{ background:"white", border:"1.5px solid #E2E8F0", borderRadius:16, padding:"22px", boxShadow:"0 1px 4px rgba(15,23,42,0.05)", flex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
        {sub}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:28, fontWeight:700, color:"#0F172A", lineHeight:1 }}>{value}</div>
      <div style={{ color:"#94A3B8", fontSize:12.5, marginTop:6, fontWeight:500 }}>{title}</div>
    </div>
  );
}

/* ─── Create PO Modal ─── */
function CreatePOModal({ onClose, onSubmit }: { onClose:()=>void; onSubmit:(o:Order)=>Promise<boolean> }) {
  const [medicine, setMedicine] = useState("");
  const [supplier, setSupplier] = useState(SUPPLIER_OPTS[0]);
  const [branch, setBranch]     = useState(BRANCHES_OPTS[0]);
  const [qty, setQty]           = useState(50);
  const [cost, setCost]         = useState("");

  async function handleSubmit() {
    if (!medicine.trim()) return;
    const now = new Date();
    const po = `PO-${now.getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`;
    const saved = await onSubmit({ po, poId:0, medicine: medicine.trim(), supplier, branch, branchId: branch.includes("UIU") ? 2 : branch.includes("Uttara") ? 3 : 1, qty, cost: parseFloat(cost)||0, status:"pending", paymentStatus:"Pending", paymentMethod:"Credit", date:now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) });
    if (saved) onClose();
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"9px 13px", borderRadius:9, border:"1.5px solid #E2E8F0",
    fontSize:13.5, fontFamily:"inherit", color:"#0F172A", background:"white",
    outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"white", borderRadius:20, width:520, maxWidth:"95vw", boxShadow:"0 24px 80px rgba(15,23,42,0.18)", overflow:"hidden" }}>

        {/* Modal header */}
        <div style={{ padding:"22px 28px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#0F172A" }}>Create New Requisition / Purchase Order</div>
            <div style={{ color:"#94A3B8", fontSize:12.5, marginTop:3 }}>Fill in the details below to submit a new PO</div>
          </div>
          <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoClose/>
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding:"22px 28px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* Medicine Name */}
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Medicine Name</label>
            <input
              value={medicine}
              onChange={e=>setMedicine(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              style={inputStyle}
              onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#A5B4FC"}
              onBlur={e=>(e.target as HTMLInputElement).style.borderColor="#E2E8F0"}
            />
          </div>

          {/* Supplier */}
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Supplier</label>
            <select value={supplier} onChange={e=>setSupplier(e.target.value)} style={{ ...inputStyle, appearance:"none" as any }}>
              {SUPPLIER_OPTS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Branch */}
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Target Branch</label>
            <select value={branch} onChange={e=>setBranch(e.target.value)} style={{ ...inputStyle, appearance:"none" as any }}>
              {BRANCHES_OPTS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>

          {/* Qty + Cost row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Quantity</label>
              <div style={{ display:"flex", alignItems:"center", border:"1.5px solid #E2E8F0", borderRadius:9, overflow:"hidden" }}>
                <button onClick={()=>setQty(q=>Math.max(1,q-10))} style={{ padding:"9px 13px", border:"none", background:"#F8FAFC", cursor:"pointer", fontSize:14, color:"#475569", fontWeight:700 }}>−</button>
                <input
                  type="number" value={qty} min={1}
                  onChange={e=>setQty(Math.max(1,parseInt(e.target.value)||1))}
                  style={{ flex:1, padding:"9px 0", border:"none", textAlign:"center", fontSize:13.5, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"#0F172A", outline:"none" }}
                />
                <button onClick={()=>setQty(q=>q+10)} style={{ padding:"9px 13px", border:"none", background:"#F8FAFC", cursor:"pointer", fontSize:14, color:"#475569", fontWeight:700 }}>+</button>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Est. Cost ($)</label>
              <input
                type="number" value={cost} placeholder="0.00" min={0} step={0.01}
                onChange={e=>setCost(e.target.value)}
                style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace" }}
                onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#A5B4FC"}
                onBlur={e=>(e.target as HTMLInputElement).style.borderColor="#E2E8F0"}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 28px 22px", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{
            padding:"9px 20px", borderRadius:9, border:"1.5px solid #E2E8F0",
            background:"white", color:"#475569", fontSize:13.5, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            padding:"9px 22px", borderRadius:9, border:"none",
            background:"linear-gradient(135deg,#4338CA,#4F46E5)", color:"white",
            fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(79,70,229,0.3)",
          }}>Submit Purchase Order</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Suppliers Tab ─── */
function SuppliersView({ suppliers, onViewProfile, onAddSupplier }: { suppliers: Supplier[]; onViewProfile: (supplier: Supplier) => void; onAddSupplier: () => void }) {
  return (
    <div style={{ background:"white", border:"1.5px solid #E2E8F0", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(15,23,42,0.05)" }}>
      <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A" }}>Registered Suppliers</div>
          <div style={{ color:"#94A3B8", fontSize:12, marginTop:2 }}>{suppliers.length} active pharmaceutical suppliers</div>
        </div>
        <button
          onClick={onAddSupplier}
          style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"8px 16px", border:"none", borderRadius:9,
            background:"linear-gradient(135deg,#0D9488,#059669)", color:"white",
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 3px 10px rgba(13,148,136,0.3)",
          }}
        ><IcoPlus/> Add Supplier</button>
      </div>

      <div style={{ width:"100%", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:780 }}>
          <thead>
            <tr style={{ background:"#F8FAFC" }}>
              {["Company Name","Contact Person","Phone & Email","Total Orders","Status",""].map((h,i)=>(
                <th key={i} style={{ padding:"13px 20px", textAlign:"left", fontSize:10.5, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s,i)=>(
              <tr key={s.id}
                style={{ borderBottom: i < suppliers.length-1 ? "1px solid #F1F5F9" : "none" }}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background="#FAFBFF"}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background="white"}
              >
                <td style={{ padding:"14px 20px", fontWeight:700, color:"#0F172A", whiteSpace:"nowrap" }}>{s.name}</td>
                <td style={{ padding:"14px 20px", color:"#475569" }}>{s.contact}</td>
                <td style={{ padding:"14px 20px" }}>
                  <div style={{ fontSize:12.5, color:"#334155", fontWeight:500 }}>{s.phone}</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{s.email}</div>
                </td>
                <td style={{ padding:"14px 20px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"#4F46E5" }}>{s.orders} POs</td>
                <td style={{ padding:"14px 20px" }}>
                  <span style={{ fontSize:11.5, fontWeight:700, padding:"4px 12px", borderRadius:99, background:"#DCFCE7", color:"#15803D" }}>{s.status}</span>
                </td>
                <td style={{ padding:"14px 20px" }}>
                  <button onClick={()=>onViewProfile(s)} style={{
                    padding:"4px 12px", borderRadius:7, border:"1.5px solid #E2E8F0",
                    background:"white", color:"#64748B", fontSize:12, fontWeight:600,
                    cursor:"pointer", fontFamily:"inherit",
                  }}>View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function ProcurementPage({ role = "Admin", selectedBranchId = 1, onPendingCountChange }: { role?: string; selectedBranchId?: number; onPendingCountChange?: (count: number) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("requisitions");
  const [filter, setFilter]       = useState<Filter>("all");
  const [orders, setOrders]       = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [profileSupplier, setProfileSupplier] = useState<typeof SEED_SUPPLIERS[0] | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [toast, setToast] = useState("");

  const isAdmin = role === "Admin";

  async function loadOrders() {
    const response = await ApiService.getProcurementOrders();
    if (response.status !== "success" || !Array.isArray(response.data)) {
      setToast(response.message || "Unable to load procurement orders");
      return;
    }
    const mapped: Order[] = response.data.map((item: any) => {
      const rawStatus = String(item.status || "Pending").toLowerCase();
      const status: Order["status"] = rawStatus === "received" || rawStatus === "received & stocked"
        ? "received"
        : rawStatus === "approved" || rawStatus === "ordered"
          ? "approved"
          : "pending";
      return {
        po: String(item.po_number || ""),
        poId: Number(item.po_id) || 0,
        medicine: String(item.medicine_name || "Medicine"),
        supplier: String(item.supplier_name || "Standard Supplier"),
        branch: String(item.branch_name || ""),
        branchId: Number(item.branch_id) || selectedBranchId,
        qty: Number(item.quantity) || 0,
        cost: Number(item.subtotal ?? item.total_amount) || 0,
        status,
        paymentStatus: status === "received" ? "Paid" : "Pending",
        paymentMethod: "Credit",
        date: item.requested_at ? new Date(item.requested_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "",
      };
    });
    setOrders(mapped);
    onPendingCountChange?.(mapped.filter(item => item.status === "pending").length);
  }

  useEffect(() => {
    loadOrders();
  }, [selectedBranchId]);

  const FILTERS: { id:Filter; label:string }[] = [
    { id:"all",      label:"All"              },
    { id:"pending",  label:"Pending Approval" },
    { id:"approved", label:"Ordered"          },
    { id:"received", label:"Received"         },
  ];

  const visible = filter === "all" ? orders : orders.filter(o => o.status === filter);

  async function accept(po:string){
    const order = orders.find(item => item.po === po);
    if (!order) return;
    const response = await ApiService.updateProcurementStatus(order.poId, "Ordered");
    if (response.status !== "success") {
      setToast(response.message || "Unable to approve requisition");
      return;
    }
    await loadOrders();
    setToast(`${po} approved successfully`);
    window.setTimeout(()=>setToast(""), 3000);
  }
  function reject(po:string){ setOrders(prev=>prev.filter(o=>o.po!==po)); onPendingCountChange?.(Math.max(0, orders.filter(o => o.status === "pending").length - 1)); }

  async function handleAddOrder(o: Order): Promise<boolean> {
    const response = await ApiService.createProcurementOrder({
      po_number: o.po,
      medicine_name: o.medicine,
      supplier_name: o.supplier,
      target_branch: o.branch,
      quantity: o.qty,
      unit_cost: o.qty > 0 ? o.cost / o.qty : 0,
      est_cost: o.cost,
      requested_by: 1,
    });
    console.log("PO submit response:", response);
    if (response.status !== "success") {
      setToast(response.message || "Unable to save requisition");
      window.setTimeout(()=>setToast(""), 3500);
      return false;
    }
    await loadOrders();
    setFilter("pending");
    setToast("Order created");
    window.setTimeout(()=>setToast(""), 3500);
    return true;
  }

  async function handleReceiveDelivery(order: Order) {
    if (order.status === "received") {
      setInvoiceOrder(order);
      return;
    }

    if (role === "Viewer") {
      return <main style={{ padding:"28px 32px 48px", fontFamily:"'Inter',sans-serif", background:"#F8FAFC", minHeight:"100%" }}>
        <div style={{ maxWidth:560, margin:"0 auto", background:"white", border:"1.5px solid #E2E8F0", borderRadius:16, padding:"34px 28px", textAlign:"center", boxShadow:"0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"#FEF3C7", color:"#B45309", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:24 }}>!</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:18, fontWeight:700, color:"#0F172A" }}>Access Denied</div>
          <div style={{ fontSize:13.5, color:"#64748B", marginTop:7 }}>Viewer accounts cannot access Procurement workflows.</div>
        </div>
      </main>;
    }
    const response = await ApiService.receiveAndStockOrder({
      po_id: order.poId || order.po,
      medicine_name: order.medicine,
      supplier_name: order.supplier,
      branch_id: selectedBranchId > 0 ? selectedBranchId : order.branchId,
      quantity: Number(order.qty),
      unit_price: Number(order.qty) > 0 ? Number(order.cost) / Number(order.qty) : 0,
      expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    });
    if (response.status !== "success") {
      setToast(response.message || "Unable to sync received stock");
      window.setTimeout(()=>setToast(""), 3500);
      return;
    }
    setOrders(prev => prev.map(item => item.po === order.po
      ? { ...item, status: "received", paymentStatus: "Paid" }
      : item
    ));
    onPendingCountChange?.(orders.filter(item => item.status === "pending").length);
    await loadOrders();
    setFilter("received");
    setInvoiceOrder({ ...order, status:"received", paymentStatus:"Paid" });
    setToast("Order received and added to inventory stock successfully!");
    window.setTimeout(()=>setToast(""), 3500);
  }

  return (
    <main style={{ padding:"28px 32px 48px", fontFamily:"'Inter',sans-serif", background:"#F8FAFC", minHeight:"100%" }}>

      {/* ── Page Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", margin:0, letterSpacing:"-0.02em" }}>
            Procurement & Supplier Billing
          </h1>
          <p style={{ color:"#94A3B8", fontSize:13.5, margin:"5px 0 0" }}>
            Manage pharmaceutical manufacturers, purchase orders, and wholesale invoices
          </p>
        </div>
        <button
          onClick={()=>setShowModal(true)}
          style={{
            display:"flex", alignItems:"center", gap:7,
            padding:"10px 20px", border:"none", borderRadius:10,
            background:"linear-gradient(135deg,#4338CA,#4F46E5)", color:"white",
            fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(79,70,229,0.35)", flexShrink:0,
          }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity="0.9"}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity="1"}
        >
          <IcoPlus/> Create Purchase Order
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display:"flex", gap:16, marginBottom:20 }}>
        <KpiCard
          title="Active Suppliers" value="18" bg="#CCFBF1" icon={<IcoBuilding/>}
          sub={
            <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"flex-end" }}>
              {["Square","Beximco","Incepta","Renata"].map(s=>(
                <span key={s} style={{ fontSize:10.5, fontWeight:600, padding:"1px 7px", borderRadius:99, background:"#F0FDF4", color:"#0D9488", whiteSpace:"nowrap" }}>{s}</span>
              ))}
            </div>
          }
        />
        <KpiCard
          title="Pending Requisitions" value={String(orders.filter(o=>o.status === "pending").length)} bg="#FEF3C7" icon={<IcoAlert/>}
          sub={
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, fontWeight:700, padding:"3px 10px", borderRadius:99, background:"#FEF3C7", color:"#D97706" }}>
              <IcoAlert/> Needs Review
            </span>
          }
        />
        <KpiCard
          title="Monthly Procurement" value="$18,450" bg="#EEF2FF" icon={<IcoTruck/>}
          sub={
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11.5, fontWeight:700, padding:"3px 10px", borderRadius:99, background:"#DCFCE7", color:"#15803D" }}>
              <IcoTrend/> +8% this month
            </span>
          }
        />
      </div>

      {/* ── Sub-nav tabs ── */}
      <div style={{ display:"flex", gap:4, marginBottom:18 }}>
        {([
          { id:"requisitions" as Tab, label:"📋 Requisitions & POs" },
          { id:"suppliers"    as Tab, label:"🏢 Registered Suppliers" },
        ]).map(t=>{
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              padding:"8px 20px", borderRadius:10,
              border:`1.5px solid ${active?"#4F46E5":"#E2E8F0"}`,
              background:active?"#4F46E5":"white",
              color:active?"white":"#64748B",
              fontSize:13, fontWeight:active?700:500,
              cursor:"pointer", fontFamily:"inherit", transition:"all 0.13s",
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "suppliers" ? (
        <SuppliersView suppliers={suppliers} onViewProfile={setProfileSupplier} onAddSupplier={()=>setShowSupplierModal(true)}/>
      ) : (

        /* ── Requisitions Table ── */
        <div style={{ background:"white", border:"1.5px solid #E2E8F0", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(15,23,42,0.05)" }}>

          {/* Table toolbar */}
          <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A" }}>Drug Purchase Requisitions</div>
              <div style={{ color:"#94A3B8", fontSize:12, marginTop:2 }}>{visible.length} orders</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:"#94A3B8", display:"flex", marginRight:4 }}><IcoFilter/></span>
              {FILTERS.map(f=>{
                const active = filter === f.id;
                return (
                  <button key={f.id} onClick={()=>setFilter(f.id)} style={{
                    padding:"6px 14px", borderRadius:99,
                    border:`1.5px solid ${active?"#4F46E5":"#E2E8F0"}`,
                    background:active?"#4F46E5":"white",
                    color:active?"white":"#64748B",
                    fontSize:12.5, fontWeight:active?700:500,
                    cursor:"pointer", fontFamily:"inherit", transition:"all 0.13s",
                  }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ width:"100%", overflowX:"auto", boxSizing:"border-box" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:860 }}>
              <thead>
                <tr style={{ background:"#F8FAFC" }}>
                  {["PO Number","Medicine Name","Supplier","Branch","Qty","Est. Cost","Status","Actions"].map(h=>(
                    <th key={h} style={{ padding:"16px 24px", textAlign:"left", fontSize:10.5, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap", borderBottom:"1px solid #E2E8F0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding:"40px 24px", textAlign:"center", color:"#94A3B8", fontSize:13.5 }}>
                      No orders in this category
                    </td>
                  </tr>
                )}
                {visible.map((o, i) => {
                  const sc = STATUS_CFG[o.status];
                  const isPending = o.status === "pending";
                  return (
                    <tr key={o.po}
                      style={{ borderBottom: i < visible.length-1 ? "1px solid #F1F5F9" : "none", transition:"background 0.1s" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background="#FAFBFF"}
                      onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background="white"}
                    >
                      <td style={{ padding:"16px 24px", fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:"#4F46E5", whiteSpace:"nowrap" }}>{o.po}</td>
                      <td style={{ padding:"16px 24px", fontWeight:600, color:"#0F172A" }}>{o.medicine}</td>
                      <td style={{ padding:"16px 24px", color:"#475569", fontSize:12.5, maxWidth:200 }}>
                        <div style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:190 }}>{o.supplier}</div>
                      </td>
                      <td style={{ padding:"16px 24px", color:"#64748B", fontSize:12.5, whiteSpace:"nowrap" }}>{o.branch}</td>
                      <td style={{ padding:"16px 24px", fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:"#334155", textAlign:"right" }}>
                        {o.qty} <span style={{ fontSize:10.5, color:"#94A3B8", fontFamily:"Inter,sans-serif", fontWeight:400 }}>units</span>
                      </td>
                      <td style={{ padding:"16px 24px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"#0D9488", whiteSpace:"nowrap" }}>
                        ${o.cost.toFixed(2)}
                      </td>
                      <td style={{ padding:"16px 24px" }}>
                        <div className="flex flex-col items-start justify-center gap-1.5 py-2">
                          <span style={{ fontSize:11.5, fontWeight:700, padding:"6px 14px", borderRadius:99, background:sc.bg, color:sc.text, whiteSpace:"nowrap" }}>
                            {sc.label}
                          </span>
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">{o.paymentStatus} · {o.paymentMethod}</span>
                        </div>
                      </td>
                      {/* Actions — RBAC */}
                      <td style={{ padding:"16px 24px" }}>
                        {isPending ? (
                          isAdmin ? (
                            /* Admin: Accept + Reject */
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={()=>accept(o.po)} style={{
                                display:"flex", alignItems:"center", gap:4,
                                padding:"5px 11px", borderRadius:7,
                                border:"1.5px solid #A7F3D0", background:"#ECFDF5",
                                color:"#059669", fontSize:12, fontWeight:700,
                                cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s",
                              }}
                                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#059669";(e.currentTarget as HTMLButtonElement).style.color="white";}}
                                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#ECFDF5";(e.currentTarget as HTMLButtonElement).style.color="#059669";}}
                              >
                                <IcoCheck/> Accept
                              </button>
                              <button onClick={()=>reject(o.po)} style={{
                                display:"flex", alignItems:"center", gap:4,
                                padding:"5px 11px", borderRadius:7,
                                border:"1.5px solid #FECACA", background:"#FEF2F2",
                                color:"#DC2626", fontSize:12, fontWeight:700,
                                cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s",
                              }}
                                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#DC2626";(e.currentTarget as HTMLButtonElement).style.color="white";}}
                                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#FEF2F2";(e.currentTarget as HTMLButtonElement).style.color="#DC2626";}}
                              >
                                <IcoX/> Reject
                              </button>
                            </div>
                          ) : (
                            /* Pharmacist / others: read-only badge */
                            <span style={{
                              display:"inline-flex", alignItems:"center", gap:5,
                              fontSize:11.5, fontWeight:600,
                              padding:"5px 12px", borderRadius:99,
                              background:"#F1F5F9", color:"#94A3B8",
                              border:"1.5px solid #E2E8F0",
                            }}>
                              ⏳ Awaiting Admin
                            </span>
                          )
                        ) : (
                          <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5" onClick={()=>handleReceiveDelivery(o)}>
                            📦 Receive Delivery
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={{ padding:"12px 24px", background:"#F8FAFC", borderTop:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12.5, color:"#94A3B8" }}>Showing {visible.length} of {orders.length} requisitions</span>
            <div style={{ display:"flex", gap:6 }}>
              {["←","→"].map((a,i)=>(
                <button key={i} style={{ width:30, height:30, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:"#64748B", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Create PO Modal ── */}
      {showModal && <CreatePOModal onClose={()=>setShowModal(false)} onSubmit={handleAddOrder}/>}
      {showSupplierModal && <AddSupplierModal onClose={()=>setShowSupplierModal(false)} onSubmit={async supplier=>{const response=await ApiService.addSupplier({name:supplier.name,contact:supplier.contact,phone:supplier.phone,email:supplier.email});if(response.status !== "success") throw new Error(response.message || "Unable to add supplier");setSuppliers(prev=>[...prev,{...supplier,id:Number(response.supplier_id)||supplier.id}]);setToast(`${supplier.name} added successfully`);window.setTimeout(()=>setToast(""),3000);}}/>}
      {profileSupplier && <SupplierProfileModal supplier={profileSupplier} onClose={()=>setProfileSupplier(null)}/>}
      {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={()=>setInvoiceOrder(null)}/>}
      {toast && <div role="status" style={{ position:"fixed", right:24, bottom:24, zIndex:10000, background:"#0F172A", color:"white", borderRadius:10, padding:"12px 18px", fontSize:13, fontWeight:600, boxShadow:"0 10px 30px rgba(15,23,42,0.2)" }}>{toast}</div>}
    </main>
  );
}
