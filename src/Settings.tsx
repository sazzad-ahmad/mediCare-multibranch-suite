import { useEffect, useState } from "react";
import { ApiService, AuditLog, BranchRecord, SystemPreferences } from "./services/api";

/* ─── Types ─── */
type Branch = BranchRecord & { cashier: string };
type User   = { id: number; name: string; role: string; branch: string; email: string; active: boolean };
type UserRecord = { id?: number; user_id: number; name: string; email: string; role: string; status: "Active" | "Inactive"; branch_id: number; branch_name: string; branch?: string };

/* ─── Seed Data ─── */
const INIT_BRANCHES: Branch[] = [
  { id:1, name:"Dhanmondi Central",  address:"House 32, Road 7, Dhanmondi, Dhaka-1209",  cashier:"Md. Rafiq Ahmed",  active:true,  phone:"01711-100200" },
  { id:2, name:"UIU Madani Branch",  address:"Madani Ave, Vatara, Dhaka-1212",            cashier:"Nadia Islam",      active:true,  phone:"01855-200300" },
  { id:3, name:"Mirpur Branch",      address:"Section-10, Mirpur, Dhaka-1216",            cashier:"Karim Uddin",      active:false, phone:"01922-300400" },
];

const USERS: User[] = [
  { id:1, name:"Dr. Rafiq Ahmed",  role:"Admin",      branch:"Dhanmondi Central", email:"rafiq@medicare.com",  active:true  },
  { id:2, name:"Nadia Islam",      role:"Pharmacist", branch:"UIU Madani Branch", email:"nadia@medicare.com",  active:true  },
  { id:3, name:"Karim Uddin",      role:"Cashier",    branch:"Mirpur Branch",     email:"karim@medicare.com",  active:true  },
  { id:4, name:"Priya Das",        role:"Cashier",    branch:"Dhanmondi Central", email:"priya@medicare.com",  active:false },
  { id:5, name:"Arif Hossain",     role:"Pharmacist", branch:"UIU Madani Branch", email:"arif@medicare.com",   active:true  },
];

const AUDIT_LOGS = [
  { id:1, action:"Batch B-NAP-01 updated",       user:"Dr. Rafiq Ahmed",  time:"2026-09-12 14:32", type:"edit"   },
  { id:2, action:"New supplier invoice PO-9921",  user:"Nadia Islam",      time:"2026-09-12 13:10", type:"create" },
  { id:3, action:"User Priya Das deactivated",    user:"Dr. Rafiq Ahmed",  time:"2026-09-12 11:55", type:"delete" },
  { id:4, action:"VAT rate changed to 5%",        user:"Dr. Rafiq Ahmed",  time:"2026-09-11 17:20", type:"edit"   },
  { id:5, action:"Database backup completed",     user:"System",           time:"2026-09-11 03:00", type:"backup" },
  { id:6, action:"Medicine Cefurox 500mg added",  user:"Karim Uddin",      time:"2026-09-10 09:44", type:"create" },
  { id:7, action:"Branch Mirpur deactivated",     user:"Dr. Rafiq Ahmed",  time:"2026-09-09 16:30", type:"edit"   },
  { id:8, action:"Low stock alert triggered",     user:"System",           time:"2026-09-09 08:00", type:"alert"  },
];

const ROLES = ["Admin","Pharmacist","Cashier","Viewer"];
const PERMISSIONS: Record<string, string[]> = {
  Admin:       ["View Dashboard","POS Billing","Manage Medicines","Manage Batches","Manage Suppliers","View Analytics","System Settings","User Management","Backup & Restore"],
  Pharmacist:  ["View Dashboard","POS Billing","Manage Medicines","Manage Batches","View Analytics"],
  Cashier:     ["View Dashboard","POS Billing"],
  Viewer:      ["View Dashboard","View Analytics"],
};

const TABS = [
  { id:"general",   label:"General & Pharmacy Info"     },
  { id:"branches",  label:"Multi-Branch Settings"        },
  { id:"rbac",      label:"User Roles & Permissions"     },
  { id:"tax",       label:"Tax & Preferences"            },
  { id:"backup",    label:"Audit Logs"                   },
];

/* ─── Icons ─── */
function IcoBuilding() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 21v-5h6v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function IcoBranchTree(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="19" cy="19" r="2" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7v4M12 11l-5 6M12 11l5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function IcoShieldIcon(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6l-8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function IcoReceiptIcon(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function IcoDatabaseIcon(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 5v5c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="1.6"/><path d="M3 10v5c0 1.66 4.03 3 9 3s9-1.34 9-3v-5" stroke="currentColor" strokeWidth="1.6"/></svg>; }
function IcoCheck()    { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoPlus()     { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>; }
function IcoSave()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IcoBackup()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoTrash()    { return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IcoPower()    { return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2v7M5.4 4.8a7 7 0 1 0 9.2 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function IcoDownload() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function IcoBranch()   { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 18V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M1 18h18M7 8h2M11 8h2M7 12h2M11 12h2M9 18v-4h2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function IcoStaff()    { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 8v4M16 10h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }

const TAB_ICONS: Record<string, React.ReactNode> = {
  general:  <IcoBuilding/>,
  branches: <IcoBranchTree/>,
  rbac:     <IcoShieldIcon/>,
  tax:      <IcoReceiptIcon/>,
  backup:   <IcoDatabaseIcon/>,
};

/* ─── Reusable field components ─── */
function FieldRow({ label, sub, children }: { label:string; sub?:string; children:React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20, paddingBottom:18, borderBottom:"1px solid #F1F5F9" }}>
      <div style={{ flex:"0 0 220px" }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:"#0F172A" }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:"#94A3B8", marginTop:2, lineHeight:1.4 }}>{sub}</div>}
      </div>
      <div style={{ flex:1 }}>{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 12px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13.5, color:"#334155", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
      onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
      onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
    />
  );
}

function NumberInput({ value, onChange, min, max, unit }: { value:number; onChange:(v:number)=>void; min?:number; max?:number; unit?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, overflow:"hidden" }}>
        <button onClick={()=>onChange(Math.max(min??0, value-1))} style={{ width:34, height:38, background:"none", border:"none", cursor:"pointer", color:"#64748B", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
        <input type="number" value={value} onChange={e=>onChange(Number(e.target.value))}
          style={{ width:60, textAlign:"center", border:"none", background:"none", padding:"0 4px", fontSize:14, fontWeight:700, color:"#0F172A", fontFamily:"'JetBrains Mono',monospace", outline:"none" }}
          min={min} max={max}
        />
        <button onClick={()=>onChange(Math.min(max??9999, value+1))} style={{ width:34, height:38, background:"none", border:"none", cursor:"pointer", color:"#64748B", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
      </div>
      {unit && <span style={{ fontSize:13, color:"#94A3B8" }}>{unit}</span>}
    </div>
  );
}

function Toggle({ on, onChange }: { on:boolean; onChange:(v:boolean)=>void }) {
  return (
    <button onClick={()=>onChange(!on)} style={{
      width:46, height:26, borderRadius:99, border:"none", cursor:"pointer", padding:3,
      background:on?"#4F46E5":"#E2E8F0", transition:"background 0.2s", display:"flex", alignItems:"center",
      flexShrink:0,
    }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transform:on?"translateX(20px)":"translateX(0)", transition:"transform 0.2s" }}/>
    </button>
  );
}

function SectionCard({ title, sub, children }: { title:string; sub?:string; children:React.ReactNode }) {
  return (
    <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0" }}>
      <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9" }}>
        <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14.5, fontWeight:700, color:"#0F172A", margin:0 }}>{title}</h3>
        {sub && <p style={{ color:"#94A3B8", fontSize:12.5, margin:"3px 0 0" }}>{sub}</p>}
      </div>
      <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>{children}</div>
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:string[] }) {
  return (
    <div style={{ position:"relative" }}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", appearance:"none", padding:"9px 32px 9px 12px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13.5, color:"#334155", outline:"none", fontFamily:"inherit", cursor:"pointer" }}
        onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
        onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
      >
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
      <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}>
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  );
}

function LogBadge({ type }: { type:string }) {
  const map: Record<string, {bg:string;text:string;label:string}> = {
    edit:   { bg:"#EEF2FF", text:"#4F46E5",  label:"Edit"   },
    create: { bg:"#F0FDF4", text:"#15803D",  label:"Create" },
    delete: { bg:"#FEF2F2", text:"#DC2626",  label:"Delete" },
    backup: { bg:"#F5F3FF", text:"#7C3AED",  label:"Backup" },
    alert:  { bg:"#FFFBEB", text:"#B45309",  label:"Alert"  },
  };
  const c = map[type] ?? { bg:"#F1F5F9", text:"#64748B", label:type };
  return <span style={{ fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:99, background:c.bg, color:c.text, whiteSpace:"nowrap" }}>{c.label}</span>;
}

/* ─── Action Footer ─── */
function ActionFooter({ saved, onSave, onDiscard }: { saved:boolean; onSave:()=>void; onDiscard:()=>void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:12, paddingTop:24 }}>
      {saved && (
        <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13.5, fontWeight:600, color:"#15803D", marginRight:8 }}>
          <span style={{ width:20, height:20, borderRadius:"50%", background:"#DCFCE7", color:"#15803D", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoCheck/></span>
          Changes saved
        </span>
      )}
      <button onClick={onDiscard} style={{ padding:"9px 20px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", color:"#64748B", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
        Discard Changes
      </button>
      <button onClick={onSave} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 12px rgba(79,70,229,0.3)" }}>
        <IcoSave/> Save Changes
      </button>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SettingsPage({ isAdmin=false, onBranch, onStaff, branches: sharedBranches, onBranchesChange, onBranchDeleted, actorName = "System", actorRole = "Admin", onPreferencesChange }: { isAdmin?:boolean; onBranch?:()=>void; onStaff?:()=>void; branches?:BranchRecord[]; onBranchesChange?:(branches: BranchRecord[])=>void; onBranchDeleted?:(branchId:number)=>void; actorName?:string; actorRole?:string; onPreferencesChange?:(preferences:SystemPreferences)=>void }) {
  const [activeTab, setActiveTab]   = useState("general");
  const [saved, setSaved]           = useState(false);
  const [branches, setBranches]     = useState<Branch[]>(INIT_BRANCHES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [toast, setToast] = useState("");
  const [lastBackup, setLastBackup] = useState({ label: "Not yet backed up", size: "-", blob: "" });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeRole, setActiveRole] = useState("Admin");

  /* General fields */
  const [pharmacyName,    setPharmacyName]    = useState("MediCare Pharmacy Ltd.");
  const [hotline,         setHotline]         = useState("01711-000000");
  const [tradeLicense,    setTradeLicense]    = useState("TRAD/DNCC/042817/2024");
  const [currency,        setCurrency]        = useState("BDT (৳)");
  const [email,           setEmail]           = useState("info@medicare-pharma.com");
  const [address,         setAddress]         = useState("32 Road 7, Dhanmondi, Dhaka-1209");
  /* Tax fields */
  const [vatRate,         setVatRate]         = useState(5);
  const [lowStockLimit,   setLowStockLimit]   = useState(10);
  const [expiryWarning,   setExpiryWarning]   = useState(90);
  const [invoiceFooter,   setInvoiceFooter]   = useState("Thank you for visiting MediCare. Your health is our priority.");
  const [printLogo,       setPrintLogo]       = useState(true);
  const [autoPrint,       setAutoPrint]       = useState(false);
  const [receiptCopies,   setReceiptCopies]   = useState(1);

  useEffect(() => {
    if (sharedBranches) setBranches(sharedBranches.map(branch => ({ ...branch, cashier: "Unassigned" })));
  }, [sharedBranches]);

  useEffect(() => {
    ApiService.getBranches().then(response => {
      if (response.status === "success") { const next = response.data ?? []; setBranches(next.map(branch => ({ ...branch, cashier: "Unassigned" }))); onBranchesChange?.(next); }
    });
    ApiService.getPreferences().then(response => {
      const data = response.data;
      if (!data) return;
      setVatRate(Number(data.vat_rate ?? 5)); setLowStockLimit(Number(data.low_stock_threshold ?? 10)); setExpiryWarning(Number(data.expiry_warning_days ?? 90)); setInvoiceFooter(String(data.invoice_footer ?? invoiceFooter));
    });
    ApiService.getAuditLogs().then(response => { if (response.status === "success") setAuditLogs(response.data ?? []); });
    ApiService.getUsers().then(response => { if (response.status === "success") setUsers(response.data ?? []); });
  }, []);

  function handleSave() {
    const preferences = { vat_rate: vatRate, low_stock_threshold: lowStockLimit, expiry_warning_days: expiryWarning, invoice_footer: invoiceFooter };
    ApiService.savePreferences({ ...preferences, actor_name: actorName, actor_role: actorRole }).then(response => {
      if (response.status === "success") { localStorage.setItem("medicare_preferences", JSON.stringify(preferences)); onPreferencesChange?.(preferences); setSaved(true); setToast("Preferences saved successfully"); window.setTimeout(()=>{setSaved(false);setToast("")}, 2500); }
      else setToast(response.message || "Unable to save preferences");
    });
  }
  function handleDiscard() { setSaved(false); }
  async function backupDatabase() {
    const response = await ApiService.createBackup(actorName, actorRole);
    if (!response.ok) { setToast("Backup failed"); return; }
    const blob = await response.blob();
    setLastBackup({ label: new Date().toLocaleString(), size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`, blob: URL.createObjectURL(blob) });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `medicare_db_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`; link.click();
    setToast("Database backup completed"); window.setTimeout(() => setToast(""), 2500);
    ApiService.getAuditLogs().then(result => { if (result.status === "success") setAuditLogs(result.data ?? []); });
  }
  function exportAuditLogs() {
    const rows = auditLogs.map(log => [log.log_id, log.action_type, log.description, log.user_name, log.created_at]);
    const csv = [["Log ID", "Type", "Action", "User", "Timestamp"], ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
  }

  function toggleBranch(id: number) {
    const branch = branches.find(item => item.id === id); if (!branch) return;
    ApiService.toggleBranchStatus({ branch_id: id, is_active: !branch.active, actor_name: actorName, actor_role: actorRole }).then(response => { if (response.status === "success") { const next = branches.map(b => b.id===id ? {...b,active:!b.active} : b); setBranches(next); onBranchesChange?.(next.map(({ id, name, address, phone, active }) => ({ id, name, address, phone, active }))); } });
  }

  async function deleteBranch(id: number) {
    if (!window.confirm("Delete this branch? Branches with records must be deactivated instead.")) return;
    const response = await ApiService.deleteBranch({ branch_id: id, actor_name: actorName, actor_role: actorRole });
    if (response.status === "success") { const next = branches.filter(branch => branch.id !== id); setBranches(next); onBranchesChange?.(next.map(({ id: branchId, name, address, phone, active }) => ({ id: branchId, name, address, phone, active }))); onBranchDeleted?.(id); setToast("Branch deleted successfully"); }
    else { setToast(response.message || "Branch could not be deleted"); }
    window.setTimeout(() => setToast(""), 3500);
  }

  async function toggleUserAccess(event: React.MouseEvent<HTMLButtonElement>, user: UserRecord) {
    event.preventDefault();
    event.stopPropagation();
    const name = user?.name ?? "this staff member";
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    const confirmation = nextStatus === "Inactive"
      ? `Are you sure you want to deactivate ${name}? Their system access will be immediately blocked.`
      : `Restore access for ${name}? They will be able to log in again immediately.`;
    if (!window.confirm(confirmation)) return;
    const response = await ApiService.updateUser({ user_id: user.user_id ?? user.id ?? 0, name, branch_id: user.branch_id ?? 1, role: user.role ?? "Pharmacist", status: nextStatus, actor_name: actorName, actor_role: actorRole });
    if (response.status === "success") {
      setUsers(current => current.map(item => item.user_id === (user.user_id ?? user.id) ? { ...item, status: nextStatus } : item));
      setToast(`${name} access ${nextStatus === "Active" ? "restored" : "revoked"} successfully`);
    } else setToast(response.message || "Unable to update staff access");
    window.setTimeout(() => setToast(""), 3000);
  }

  return (
    <div style={{ padding:"28px 32px 48px", display:"flex", gap:32, alignItems:"flex-start", minHeight:0 }}>
      {toast && <div style={{ position:"fixed", right:24, bottom:24, zIndex:400, background:"#0F1729", color:"white", borderRadius:10, padding:"12px 18px", boxShadow:"0 12px 30px rgba(15,23,42,.25)", fontSize:13 }}>{toast}</div>}

      {/* ── Left Sub-nav ── */}
      <aside style={{
        width:260, flexShrink:0,
        background:"white", borderRadius:12, border:"1px solid #E2E8F0",
        padding:"16px 10px",
        display:"flex", flexDirection:"column", gap:4,
        position:"sticky", top:0,
      }}>
        <div style={{ padding:"4px 8px 12px", marginBottom:4 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14.5, fontWeight:700, color:"#0F172A" }}>System Settings</div>
          <div style={{ fontSize:11.5, color:"#94A3B8", marginTop:2 }}>MediCare Suite v2.4.1</div>
        </div>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              borderRadius:10, border:"none", cursor:"pointer", fontFamily:"inherit",
              background: active ? "#4F46E5" : "transparent",
              color: active ? "white" : "#64748B",
              fontSize:13.5, fontWeight: active ? 700 : 500, textAlign:"left",
              transition:"all 0.13s",
            }}
            onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLButtonElement).style.background="rgba(79,70,229,0.07)"; }}
            onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
            >
              <span style={{ flexShrink:0, opacity: active ? 1 : 0.65 }}>{TAB_ICONS[t.id]}</span>
              {t.label}
            </button>
          );
        })}
      </aside>

      {/* ── Right Work Area ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:24, minWidth:0 }}>

        {/* ════ TAB: GENERAL ════ */}
        {activeTab==="general" && (
          <>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0 }}>General & Pharmacy Info</h2>
              <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Core pharmacy identity and contact details</p>
            </div>

            <SectionCard title="Pharmacy Identity" sub="Your registered business information">
              <FieldRow label="Pharmacy Name" sub="Displayed on all invoices and reports">
                <TextInput value={pharmacyName} onChange={setPharmacyName}/>
              </FieldRow>
              <FieldRow label="Business Email" sub="For system notifications and reports">
                <TextInput value={email} onChange={setEmail} placeholder="email@example.com"/>
              </FieldRow>
              <FieldRow label="Hotline / Phone" sub="Customer-facing contact number">
                <TextInput value={hotline} onChange={setHotline}/>
              </FieldRow>
              <FieldRow label="Trade License No." sub="Government-issued business license">
                <TextInput value={tradeLicense} onChange={setTradeLicense}/>
              </FieldRow>
              <FieldRow label="Registered Address" sub="Primary branch address">
                <TextInput value={address} onChange={setAddress}/>
              </FieldRow>
              <FieldRow label="Currency" sub="Default currency for all transactions">
                <SelectInput value={currency} onChange={setCurrency} options={["BDT (৳)","USD ($)","EUR (€)","GBP (£)"]}/>
              </FieldRow>
            </SectionCard>

            <SectionCard title="System Preferences" sub="Application-level defaults">
              <FieldRow label="Language" sub="Interface display language">
                <SelectInput value="English (EN)" onChange={()=>{}} options={["English (EN)","বাংলা (BN)"]}/>
              </FieldRow>
              <FieldRow label="Timezone" sub="Used for all timestamps and reports">
                <SelectInput value="Asia/Dhaka (UTC+6)" onChange={()=>{}} options={["Asia/Dhaka (UTC+6)","UTC","Asia/Kolkata (UTC+5:30)"]}/>
              </FieldRow>
              <FieldRow label="Date Format" sub="How dates are displayed throughout the system">
                <SelectInput value="DD MMM YYYY" onChange={()=>{}} options={["DD MMM YYYY","MM/DD/YYYY","YYYY-MM-DD"]}/>
              </FieldRow>
            </SectionCard>

            <ActionFooter saved={saved} onSave={handleSave} onDiscard={handleDiscard}/>
          </>
        )}

        {/* ════ TAB: BRANCHES ════ */}
        {activeTab==="branches" && (
          <>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div>
                <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0 }}>Multi-Branch Settings</h2>
                <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Manage branch locations, cashier assignments, and active status</p>
              </div>
              <button style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                <IcoPlus/> Add Branch
              </button>
            </div>

            {/* Admin quick-action cards */}
            {isAdmin && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { title:"Create New Branch", desc:"Register a new pharmacy outlet and configure its settings.", action:"Add Branch", color:"#4F46E5", hoverBorder:"#A5B4FC", Icon:IcoBranch, fn:onBranch },
                  { title:"Add Staff & Assign Role", desc:"Create user accounts and assign branch access with role-based permissions.", action:"Add Staff", color:"#0D9488", hoverBorder:"#5EEAD4", Icon:IcoStaff, fn:onStaff },
                ].map((c,i)=>(
                  <div key={i} style={{ background:"white", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"18px 20px", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=c.hoverBorder;(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 20px ${c.color}1a`;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#E2E8F0";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}
                    onClick={c.fn}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${c.color}14`, border:`1.5px solid ${c.color}30`, display:"flex", alignItems:"center", justifyContent:"center", color:c.color, marginBottom:10 }}>
                      <c.Icon/>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#0F172A", marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:12.5, color:"#94A3B8", lineHeight:1.5 }}>{c.desc}</div>
                    <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:5, color:c.color, fontSize:13, fontWeight:600 }}>
                      <IcoPlus/>{c.action}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {branches.map((b,i)=>(
                <div key={b.id} style={{ background:"white", borderRadius:12, border:`1.5px solid ${b.active?"#C7D2FE":"#E2E8F0"}`, padding:"20px 24px", transition:"border-color 0.2s" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:14, flex:1 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:b.active?"#EEF2FF":"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:800, color:b.active?"#4F46E5":"#94A3B8" }}>B{i+1}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A" }}>{b.name}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:b.active?"#DCFCE7":"#F1F5F9", color:b.active?"#15803D":"#94A3B8" }}>
                            {b.active?"Active":"Inactive"}
                          </span>
                        </div>
                        <div style={{ fontSize:13, color:"#64748B", marginBottom:10 }}>{b.address}</div>
                        <div style={{ display:"flex", gap:20 }}>
                          <div>
                            <div style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Cashier</div>
                            <div style={{ fontSize:13, fontWeight:500, color:"#334155" }}>{b.cashier}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Phone</div>
                            <div style={{ fontSize:13, fontWeight:500, color:"#334155", fontFamily:"'JetBrains Mono',monospace" }}>{b.phone}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:12 }}>
                      <Toggle on={b.active} onChange={()=>toggleBranch(b.id)}/>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>deleteBranch(b.id)} title="Delete branch" style={{ width:32, height:32, borderRadius:8, border:"1.5px solid #E2E8F0", background:"white", color:"#EF4444", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoTrash/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <ActionFooter saved={saved} onSave={handleSave} onDiscard={handleDiscard}/>
          </>
        )}

        {/* ════ TAB: RBAC ════ */}
        {activeTab==="rbac" && (
          <>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0 }}>User Roles & Permissions</h2>
              <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Role-based access control for all system users</p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <SectionCard title="Roles" sub="Select a role to view permissions">
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {ROLES.map(r=>{
                    const isActive = activeRole===r;
                    return (
                      <button key={r} onClick={()=>setActiveRole(r)} style={{
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"11px 14px", borderRadius:10, border:`1.5px solid ${isActive?"#4F46E5":"#E2E8F0"}`,
                        background:isActive?"#EEF2FF":"#F8FAFC", cursor:"pointer", fontFamily:"inherit",
                        transition:"all 0.13s",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:isActive?"#4F46E5":"#CBD5E1" }}/>
                          <span style={{ fontSize:14, fontWeight:isActive?700:500, color:isActive?"#4F46E5":"#334155" }}>{r}</span>
                        </div>
                        <span style={{ fontSize:11.5, fontWeight:600, background:isActive?"#C7D2FE":"#E2E8F0", color:isActive?"#4F46E5":"#64748B", padding:"2px 8px", borderRadius:99 }}>
                          {PERMISSIONS[r].length} perms
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title={`${activeRole} Permissions`} sub="Granted access scopes for this role">
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {["View Dashboard","POS Billing","Manage Medicines","Manage Batches","Manage Suppliers","View Analytics","System Settings","User Management","Backup & Restore"].map(perm=>{
                    const granted = PERMISSIONS[activeRole].includes(perm);
                    return (
                      <div key={perm} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", borderRadius:9, background:granted?"#F0FDF4":"#F8FAFC", border:`1px solid ${granted?"#BBF7D0":"#E2E8F0"}` }}>
                        <span style={{ fontSize:13.5, fontWeight:500, color:granted?"#0F172A":"#94A3B8" }}>{perm}</span>
                        {granted
                          ? <span style={{ background:"#DCFCE7", color:"#15803D", width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoCheck/></span>
                          : <span style={{ width:22, height:22, borderRadius:"50%", background:"#F1F5F9", border:"1.5px solid #E2E8F0", display:"inline-block" }}/>
                        }
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="System Users" sub="All registered users and their role assignments">
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                    {["Name","Role","Branch","Email","Status",""].map(h=>(
                      <th key={h} style={{ padding:"10px 14px", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#64748B", textAlign:"left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(users.length ? users : USERS.map(user => ({ user_id:user.id, name:user.name, email:user.email, role:user.role, status:user.active ? "Active" as const : "Inactive" as const, branch_id:branches.find(branch=>branch.name.includes(user.branch))?.id ?? 1, branch_name:user.branch }))).map((u,i)=>{
                    const roleColor: Record<string,{bg:string;text:string}> = { Admin:{bg:"#EEF2FF",text:"#4F46E5"}, Pharmacist:{bg:"#CCFBF1",text:"#0D9488"}, Cashier:{bg:"#F5F3FF",text:"#7C3AED"}, Viewer:{bg:"#F1F5F9",text:"#64748B"} };
                    const rc = roleColor[u.role]??{bg:"#F1F5F9",text:"#64748B"};
                    return (
                      <tr key={u.user_id} style={{ borderBottom:i<(users.length || USERS.length)-1?"1px solid #F1F5F9":"none" }}>
                        <td style={{ padding:"12px 14px", fontWeight:600, fontSize:13.5, color:"#0F172A" }}>{u.name}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ background:rc.bg, color:rc.text, fontSize:11.5, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>{u.role}</span></td>
                        <td style={{ padding:"12px 14px", fontSize:13, color:"#64748B" }}>{u.branch_name}</td>
                        <td style={{ padding:"12px 14px", fontSize:12.5, color:"#64748B", fontFamily:"'JetBrains Mono',monospace" }}>{u.email}</td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ fontSize:11.5, fontWeight:700, padding:"3px 10px", borderRadius:99, background:u.status==="Active"?"#DCFCE7":"#F1F5F9", color:u.status==="Active"?"#15803D":"#94A3B8" }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <button type="button" onClick={event=>toggleUserAccess(event, u)} title={u.status === "Active" ? "Revoke access" : "Restore access"} style={{ width:30, height:30, borderRadius:8, border:`1.5px solid ${u.status === "Active" ? "#FECACA" : "#BBF7D0"}`, background:"white", color:u.status === "Active" ? "#DC2626" : "#15803D", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IcoPower/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SectionCard>

            <ActionFooter saved={saved} onSave={handleSave} onDiscard={handleDiscard}/>
          </>
        )}

        {/* ════ TAB: TAX & BILLING ════ */}
        {activeTab==="tax" && (
          <>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0 }}>Tax & Billing Preferences</h2>
              <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Configure VAT, stock thresholds, and invoice settings</p>
            </div>

            <SectionCard title="Tax Configuration" sub="Applied automatically to all transactions">
              <FieldRow label="Default VAT Rate" sub="Applied to all medicine sales">
                <NumberInput value={vatRate} onChange={setVatRate} min={0} max={30} unit="% of net amount"/>
              </FieldRow>
              <FieldRow label="VAT Registration No." sub="Your pharmacy VAT registration number">
                <TextInput value="VAT-BD-00712834" onChange={()=>{}}/>
              </FieldRow>
              <FieldRow label="Tax Inclusive Pricing" sub="Whether displayed prices include VAT">
                <Toggle on={false} onChange={()=>{}}/>
              </FieldRow>
            </SectionCard>

            <SectionCard title="Inventory Alert Thresholds" sub="Trigger warnings when stock or expiry reaches these limits">
              <FieldRow label="Low Stock Threshold" sub="Alert when stock drops below this count">
                <NumberInput value={lowStockLimit} onChange={setLowStockLimit} min={1} max={100} unit="units"/>
              </FieldRow>
              <FieldRow label="Expiry Warning Window" sub="Alert this many days before expiry date">
                <NumberInput value={expiryWarning} onChange={setExpiryWarning} min={7} max={365} unit="days before expiry"/>
              </FieldRow>
            </SectionCard>

            <SectionCard title="Receipt & Invoice Settings" sub="Customize how invoices are printed">
              <FieldRow label="Print Logo on Invoice" sub="Show MediCare logo on printed receipts">
                <Toggle on={printLogo} onChange={setPrintLogo}/>
              </FieldRow>
              <FieldRow label="Auto-Print on Checkout" sub="Automatically print receipt after each sale">
                <Toggle on={autoPrint} onChange={setAutoPrint}/>
              </FieldRow>
              <FieldRow label="Receipt Copies" sub="Number of copies printed per transaction">
                <NumberInput value={receiptCopies} onChange={setReceiptCopies} min={1} max={3} unit="copies"/>
              </FieldRow>
              <FieldRow label="Invoice Footer Text" sub="Displayed at the bottom of every receipt">
                <div>
                  <textarea value={invoiceFooter} onChange={e=>setInvoiceFooter(e.target.value)} rows={3}
                    style={{ width:"100%", padding:"9px 12px", background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13.5, color:"#334155", outline:"none", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" }}
                    onFocus={e=>{e.target.style.borderColor="#A5B4FC"; e.target.style.background="white";}}
                    onBlur={e=>{e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC";}}
                  />
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Preview: <em>"{invoiceFooter}"</em></div>
                </div>
              </FieldRow>
            </SectionCard>

            <ActionFooter saved={saved} onSave={handleSave} onDiscard={handleDiscard}/>
          </>
        )}

        {/* ════ TAB: BACKUP ════ */}
        {activeTab==="backup" && (
          <>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", margin:0 }}>Database Backup & Audit Logs</h2>
              <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>System integrity, recovery, and full activity trail</p>
            </div>

            <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0" }}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9" }}>
                <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14.5, fontWeight:700, color:"#0F172A", margin:0 }}>Database Backup</h3>
                <p style={{ color:"#94A3B8", fontSize:12.5, margin:"3px 0 0" }}>Manage backups and schedule automated exports</p>
              </div>
              <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[
                    { label:"Last Backup",    value:lastBackup.label, accent:"#0D9488", bg:"#CCFBF1" },
                    { label:"Backup Size",    value:lastBackup.size, accent:"#4F46E5", bg:"#EEF2FF" },
                    { label:"Next Scheduled", value:"Sep 13, 2026 · 03:00 AM", accent:"#D97706", bg:"#FEF3C7" },
                  ].map(c=>(
                    <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:"14px 16px" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:c.accent, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{c.label}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={backupDatabase} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#6366F1)", color:"white", fontSize:13.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 10px rgba(79,70,229,0.3)" }}>
                    <IcoBackup/> Backup Now
                  </button>
                  <button onClick={async()=>{const response=await ApiService.downloadLastBackup();if(!response.ok){setToast("No backup is available yet");window.setTimeout(()=>setToast(""),2500);return;}const blob=await response.blob();const disposition=response.headers.get("Content-Disposition") ?? "";const filename=disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "medicare_db_last_backup.sql";const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=filename;link.click();}} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, border:"1.5px solid #E2E8F0", background:"white", color:"#334155", fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    <IcoDownload/> Download Last Backup
                  </button>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#F8FAFC", borderRadius:12, padding:"14px 16px", border:"1px solid #E2E8F0" }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:600, color:"#0F172A" }}>Automatic Daily Backup</div>
                    <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>Runs every day at 3:00 AM server time</div>
                  </div>
                  <Toggle on={true} onChange={()=>{}}/>
                </div>
              </div>
            </div>

            <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0" }}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14.5, fontWeight:700, color:"#0F172A", margin:0 }}>Audit Log</h3>
                  <p style={{ color:"#94A3B8", fontSize:12.5, margin:"3px 0 0" }}>Complete trail of all user and system actions</p>
                </div>
                <button onClick={exportAuditLogs} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, border:"1.5px solid #E2E8F0", background:"white", color:"#334155", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  <IcoDownload/> Export CSV
                </button>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E2E8F0" }}>
                    {["Type","Action","User","Timestamp"].map(h=>(
                      <th key={h} style={{ padding:"11px 16px", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#64748B", textAlign:"left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(auditLogs.length ? auditLogs : AUDIT_LOGS.map(log => ({ log_id: log.id, action_type: log.type === "edit" ? "Edit" : log.type === "create" ? "Create" : log.type === "delete" ? "Delete" : log.type === "backup" ? "Backup" : "Alert", description: log.action, user_name: log.user, role: "System", created_at: log.time }))).map((log,i)=>(
                    <tr key={log.log_id} style={{ borderBottom:i<(auditLogs.length || AUDIT_LOGS.length)-1?"1px solid #F1F5F9":"none", background:i%2===0?"white":"#FAFBFC" }}>
                      <td style={{ padding:"12px 16px" }}><LogBadge type={log.action_type.toLowerCase()}/></td>
                      <td style={{ padding:"12px 16px", fontSize:13.5, color:"#0F172A", fontWeight:500 }}>{log.description}</td>
                      <td style={{ padding:"12px 16px", fontSize:13, color:"#64748B" }}>{log.user_name}</td>
                      <td style={{ padding:"12px 16px", fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"#94A3B8" }}>{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
