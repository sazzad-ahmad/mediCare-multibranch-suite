import { useState, useEffect, useRef } from "react";
import { ApiService } from "./services/api";
import POS from "./POS";
import ProcurementPage from "./Procurement";
import InventoryPage from "./Inventory";
import BatchesPage from "./Batches";
import SuppliersPage from "./Suppliers";
import AnalyticsPage from "./Analytics";
import SettingsPage from "./Settings";
import Dashboard, { useDashboardStats } from "./Dashboard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

/* ─── Types ─────────────────────────────────────── */
type Role = "Admin" | "Pharmacist" | "Cashier" | "Viewer";
type StaffRole = "Pharmacist" | "Cashier" | "Viewer";
type AuthUser = {
  user_id: number;
  branch_id: number;
  name: string;
  email: string;
  role: Role;
  branch_name: string;
  title?: string;
  avatar?: string;
};
type AppBranch = { id: number; name: string; short: string; address: string; phone: string; active: boolean };

/* ─── Branches ───────────────────────────────────── */
const BRANCHES: AppBranch[] = [
  { id:1, name:"MediCare - Dhanmondi Branch", short:"Dhanmondi Branch", address:"Road 27, Dhanmondi, Dhaka", phone:"01711000001", active:true },
  { id:2, name:"MediCare - UIU Madani Branch", short:"UIU Madani Branch", address:"100 Feet Road, Madani Ave, Dhaka", phone:"01711000002", active:true },
  { id:3, name:"MediCare - Uttara Sector 7", short:"Uttara Sector 7", address:"Sector 7, Uttara, Dhaka", phone:"01711000003", active:true },
];

const PHARMACIST_PROFILES: Record<number, { name: string; email: string; avatar: string }> = {
  1: { name: "Tanvir Ahmed", email: "tanvir.dha@medicare.com", avatar: "TA" },
  2: { name: "Nadia Islam", email: "pharmacist@medicare.com", avatar: "NI" },
  3: { name: "Farhana Yeasmin", email: "farhana.utt@medicare.com", avatar: "FY" },
};

/* ─── Role config ────────────────────────────────── */
const ROLE_CFG: Record<Role, {
  color:string; glow:string; bg:string; border:string;
  nav:string[]; defaultNav:string;
  user:string; title:string; avatar:string; email:string;
}> = {
  Admin: {
    color:"#4F46E5", glow:"rgba(79,70,229,0.35)", bg:"#EEF2FF", border:"#A5B4FC",
    nav:["dashboard","pos","medicines","procurement","analytics","settings"],
    defaultNav:"dashboard",
    user:"Dr. Rafiq Ahmed", title:"Admin · Pharmacist", avatar:"RA", email:"admin@medicare.com",
  },
  Pharmacist: {
    color:"#0D9488", glow:"rgba(13,148,136,0.35)", bg:"#CCFBF1", border:"#5EEAD4",
    nav:["dashboard","pos","medicines","procurement"],
    defaultNav:"dashboard",
    user:"Nadia Islam", title:"Senior Pharmacist", avatar:"NI", email:"pharmacist@medicare.com",
  },
  Cashier: {
    color:"#7C3AED", glow:"rgba(124,58,237,0.35)", bg:"#F5F3FF", border:"#C4B5FD",
    nav:["pos"],
    defaultNav:"pos",
    user:"Karim Uddin", title:"Cashier · POS Terminal", avatar:"KU", email:"cashier@medicare.com",
  },
  Viewer: {
    color:"#D97706", glow:"rgba(217,119,6,0.35)", bg:"#FEF3C7", border:"#FDE68A",
    nav:["medicines"],
    defaultNav:"medicines",
    user:"Priya Das", title:"Viewer · Read-Only", avatar:"PD", email:"viewer@medicare.com",
  },
};
const ROLES: Role[] = ["Admin","Pharmacist","Cashier","Viewer"];

const ROLE_HINT: Record<StaffRole,string> = {
  Pharmacist:"Grants access to Dashboard, POS Billing, and Inventory. Cannot manage Sales reports or Settings.",
  Cashier:"Grants access to POS Billing only. Restricts all reports, inventory management, and Settings.",
  Viewer:"Read-only access to Dashboard and Sales. All create, edit, and delete actions are disabled.",
};

/* ─── Nav items (5 items per spec) ──────────────── */
const ALL_NAV = [
  { id:"dashboard",    label:"Dashboard",    badge:null,                                    Icon:IcoDashboard },
  { id:"pos",          label:"POS",          badge:null,                                    Icon:IcoPOS      },
  { id:"medicines",    label:"Inventory",    badge:null,                                    Icon:IcoBox      },
  { id:"procurement",  label:"Procurement",  badge:{text:"3",bg:"#F59E0B",color:"#fff"},    Icon:IcoTruck    },
  { id:"analytics",    label:"Sales",        badge:null,                                    Icon:IcoChart    },
  { id:"settings",     label:"Settings",     badge:null,                                    Icon:IcoSettings },
];

/* ─── Dashboard data ─────────────────────────────── */
const weeklyData = [
  {day:"Mon",revenue:2800,profit:1100},{day:"Tue",revenue:3200,profit:1340},
  {day:"Wed",revenue:2600,profit:980 },{day:"Thu",revenue:3800,profit:1620},
  {day:"Fri",revenue:4200,profit:1890},{day:"Sat",revenue:3420,profit:1450},
  {day:"Sun",revenue:1900,profit:720 },
];
const categoryData = [
  {name:"Tablets",   value:42,color:"#4F46E5"},{name:"Syrups",    value:21,color:"#0D9488"},
  {name:"Capsules",  value:19,color:"#F59E0B"},{name:"Injections",value:11,color:"#8B5CF6"},
  {name:"Others",    value:7, color:"#94A3B8"},
];
const fastMeds = [
  {name:"Paracetamol 500mg", cat:"Tablets", sold:842,rev:"$2,105"},
  {name:"Amoxicillin 250mg", cat:"Capsules",sold:614,rev:"$1,842"},
  {name:"Cetirizine 10mg",   cat:"Tablets", sold:527,rev:"$789"  },
  {name:"Azithromycin Syrup",cat:"Syrups",  sold:398,rev:"$1,194"},
  {name:"Omeprazole 20mg",   cat:"Capsules",sold:361,rev:"$650"  },
];
/* ─── Icons ──────────────────────────────────────── */
function IcoDashboard({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".9"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".5"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".5"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".7"/></svg>;}
function IcoPOS({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 17h8M10 15v2M6 7h2M10 7h2M14 7h.01M6 10h2M10 10h2M14 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoBox({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M17 7l-7-4-7 4v6l7 4 7-4V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 7l7 4 7-4M10 11v6" stroke="currentColor" strokeWidth="1.5"/></svg>;}
function IcoChart({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 4 2 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoSettings({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M4.22 15.78l1.06-1.06M14.72 5.28l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoBell(){return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5"/></svg>;}
function IcoPin(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>;}
function IcoX({s=14}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function IcoChevron({open=false}:{open?:boolean}){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoCheck(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoShield({color="#4F46E5"}:{color?:string}){return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2L4 5v5c0 4.14 2.56 7.86 6 9 3.44-1.14 6-4.86 6-9V5l-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoTrendUp(){return <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M3 15l5-5 4 3 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoAlertTri(){return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3L2 17h16L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 9v3M10 14.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoClock(){return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoEye({slash=false}:{slash?:boolean}){return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>{slash&&<path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}</svg>;}
function IcoPlus({color="#fff"}:{color?:string}){return <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>;}
function IcoBranch(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 18V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M1 18h18M7 8h2M11 8h2M7 12h2M11 12h2M9 18v-4h2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;}
function IcoLogout(){return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3M13 14l3-4-3-4M16 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function IcoLock(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoUser(){return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3.5 17c0-3.31 2.91-6 6.5-6s6.5 2.69 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoMail(){return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoKey(){return <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="7.5" cy="9.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 12.5l6 5M14 14.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;}
function IcoTruck({s=18}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 8h3.5l2.5 3v3h-6V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="15.5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>;}

function useDateTime(){
  const [dt,setDt]=useState(new Date());
  useEffect(()=>{const id=setInterval(()=>setDt(new Date()),1000);return()=>clearInterval(id);},[]);
  return dt;
}
/* ─── Chart tooltips ─────────────────────────────── */
const BarTip=({active,payload,label}:any)=>{if(!active||!payload?.length)return null;return <div style={{background:"#0F1729",borderRadius:10,padding:"10px 14px",color:"#F8FAFC",fontSize:13}}><div style={{fontWeight:600,marginBottom:6}}>{label}</div><div style={{color:"#818CF8"}}>Revenue: <b style={{color:"#fff"}}>${payload[0]?.value?.toLocaleString()}</b></div><div style={{color:"#34D399"}}>Profit: <b style={{color:"#fff"}}>${payload[1]?.value?.toLocaleString()}</b></div></div>;};
const PieTip=({active,payload}:any)=>{if(!active||!payload?.length)return null;return <div style={{background:"#0F1729",borderRadius:10,padding:"8px 14px",color:"#F8FAFC",fontSize:13}}><b>{payload[0].name}:</b> {payload[0].value}%</div>;};

/* ─── Form helpers ───────────────────────────────── */
function FLabel({children}:{children:React.ReactNode}){return <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#475569",marginBottom:6,letterSpacing:"0.02em"}}>{children}</label>;}
function FInput({value,onChange,placeholder,type="text"}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}){return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:13.5,color:"#334155",fontFamily:"inherit",outline:"none",background:"white",transition:"border 0.15s"}} onFocus={e=>e.currentTarget.style.borderColor="#A5B4FC"} onBlur={e=>e.currentTarget.style.borderColor="#E2E8F0"}/>;}
function FSelect({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:{label:string;value:string}[]}){return <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:13.5,color:"#334155",fontFamily:"inherit",outline:"none",background:"white",cursor:"pointer",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 8l5 5 5-5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;}
function FToggle({on,onChange,label}:{on:boolean;onChange:(v:boolean)=>void;label:string}){return <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}><span style={{fontSize:13.5,color:"#334155",fontWeight:500}}>{label}</span><button onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:99,border:"none",background:on?"#4F46E5":"#CBD5E1",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}><span style={{position:"absolute",top:3,left:on?22:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/></button></div>;}

/* ─── Login Screen ───────────────────────────────── */
function LoginScreen({onLogin, branches}:{onLogin:(user:AuthUser)=>void; branches:AppBranch[]}){
  const [email,setEmail]       = useState("admin@medicare.com");
  const [password,setPassword] = useState("password123");
  const [showPw,setShowPw]     = useState(false);
  const [remember,setRemember] = useState(true);
  const [error,setError]       = useState("");
  const [loading,setLoading]   = useState(false);
  const [registerMode,setRegisterMode] = useState(false);
  const [registration,setRegistration] = useState({name:"", email:"", password:"", role:"Pharmacist" as "Pharmacist"|"Cashier", branch_id:1});
  const [registrationMessage,setRegistrationMessage] = useState("");
  const [loginBranchId, setLoginBranchId] = useState(2);
  const [loginRole, setLoginRole] = useState<Role>("Admin");
  const isPharmacistLogin = loginRole === "Pharmacist" || Object.values(PHARMACIST_PROFILES).some((profile) => profile.email === email.trim());

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault();
    setError("");
    if (registerMode) {
      setLoading(true);
      try {
        const response = await ApiService.register(registration);
        if (response?.status === "success") {
          setRegistrationMessage(response.message || "User registered successfully. You can now sign in.");
          setRegisterMode(false);
          setEmail(registration.email);
          setPassword(registration.password);
          setRegistration({name:"", email:"", password:"", role:"Pharmacist", branch_id:1});
        } else {
          setError(response?.message || "Unable to register staff account.");
        }

      } catch {
        setError("Unable to connect to the registration service.");
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await ApiService.login(email.trim(), password, isPharmacistLogin ? loginBranchId : undefined);
      const rawUser = response?.user as AuthUser | undefined;
      const pharmacistProfile = rawUser?.role === "Pharmacist" ? PHARMACIST_PROFILES[Number(rawUser.branch_id) || loginBranchId] : undefined;
      const user = rawUser && pharmacistProfile ? { ...rawUser, ...pharmacistProfile, title: "Senior Pharmacist" } : rawUser;
      const responseRole = user?.role;

      if (response?.status === "success" && user && typeof responseRole === "string" && ROLES.includes(responseRole)) {
        onLogin(user);
      } else {
        setError(response?.message || "Invalid email or credentials.");
      }
    } catch {
      setError("Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  }

  return(
    <div style={{minHeight:"100vh",background:"#0F1729",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
      {/* Glow accents */}
      <div style={{position:"absolute",top:-200,left:-200,width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,70,229,0.16) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-160,right:-120,width:440,height:440,borderRadius:"50%",background:"radial-gradient(circle,rgba(13,148,136,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>

      <div style={{width:420,padding:"0 20px",position:"relative",zIndex:1}}>
        {/* Card */}
        <div style={{background:"white",borderRadius:12,boxShadow:"0 24px 64px rgba(0,0,0,0.4),0 8px 20px rgba(0,0,0,0.2)",overflow:"hidden"}}>
          {/* Header band */}
          <div style={{background:"linear-gradient(135deg,#0F1729 0%,#1E2D4E 60%,#0F2641 100%)",padding:"32px 32px 26px",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
            {/* Logo */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:16,position:"relative"}}>
              <div style={{position:"relative"}}>
                <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(145deg,#4338CA 0%,#4F46E5 45%,#0D9488 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 8px rgba(79,70,229,0.1),0 0 28px rgba(79,70,229,0.5),inset 0 1px 0 rgba(255,255,255,0.15)"}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.97 3.46 9.38 8 10 4.54-.62 8-5.03 8-10V6l-8-4z" fill="rgba(255,255,255,0.1)"/><rect x="10" y="5" width="4" height="14" rx="2" fill="white"/><rect x="5" y="10" width="14" height="4" rx="2" fill="white"/></svg>
                </div>
                <span style={{position:"absolute",bottom:1,right:1,width:13,height:13,borderRadius:"50%",background:"#10B981",border:"2.5px solid #0F1729",boxShadow:"0 0 0 3px rgba(16,185,129,0.25)"}}/>
              </div>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:21,fontWeight:700,color:"white",letterSpacing:"-0.02em",position:"relative"}}>
              <span style={{color:"#E2E8F0"}}>Medi</span><span style={{background:"linear-gradient(90deg,#818CF8,#34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Care</span><span style={{color:"#94A3B8"}}> Pharmacy Suite</span>
            </div>
            <p style={{color:"#64748B",fontSize:14,marginTop:7,position:"relative"}}>Sign in to your branch workspace</p>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} style={{padding:"28px 32px 28px"}}>
            {error&&(
              <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
                <IcoAlertTri/><span style={{fontSize:13,color:"#DC2626",fontWeight:500}}>{error}</span>
              </div>
            )}

            {registrationMessage&&<div style={{background:"#ECFDF5",border:"1.5px solid #A7F3D0",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#047857",fontWeight:600}}>{registrationMessage}</div>}
            {registerMode&&(
              <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:18}}>
                <div><FLabel>Full Name</FLabel><FInput value={registration.name} onChange={v=>setRegistration(p=>({...p,name:v}))} placeholder="e.g. Nadia Islam"/></div>
                <div><FLabel>Email Address</FLabel><FInput value={registration.email} onChange={v=>setRegistration(p=>({...p,email:v}))} placeholder="staff@medicare.com" type="email"/></div>
                <div><FLabel>Password</FLabel><FInput value={registration.password} onChange={v=>setRegistration(p=>({...p,password:v}))} placeholder="Minimum 8 characters" type="password"/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><FLabel>Role</FLabel><FSelect value={registration.role} onChange={v=>setRegistration(p=>({...p,role:v as "Pharmacist"|"Cashier"}))} options={[{label:"Pharmacist",value:"Pharmacist"},{label:"Cashier",value:"Cashier"}]}/></div>
                  <div><FLabel>Branch</FLabel><FSelect value={String(registration.branch_id)} onChange={v=>setRegistration(p=>({...p,branch_id:Number(v)}))} options={branches.filter(item=>item.active).map(item=>({label:item.short,value:String(item.id)}))}/></div>
                </div>
              </div>
            )}
            {/* Email */}
            <div style={{marginBottom:14,display:registerMode?"none":undefined}}>
              <FLabel>Email Address</FLabel>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",display:"flex"}}><IcoMail/></span>
                <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}}
                  placeholder="admin@medicare.com"
                  style={{width:"100%",boxSizing:"border-box",paddingLeft:38,paddingRight:14,paddingTop:11,paddingBottom:11,border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:13.5,color:"#334155",fontFamily:"inherit",outline:"none",background:"white",transition:"all 0.15s"}}
                  onFocus={e=>{e.currentTarget.style.borderColor="#A5B4FC";e.currentTarget.style.boxShadow="0 0 0 3px rgba(165,180,252,0.18)";}}
                  onBlur={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="none";}}/>
              </div>
            </div>

            {/* Password */}
            <div style={{marginBottom:16,display:registerMode?"none":undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <FLabel>Password</FLabel>
                <button type="button" style={{fontSize:12,color:"#4F46E5",fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0}}>Forgot password?</button>
              </div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",display:"flex"}}><IcoKey/></span>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{width:"100%",boxSizing:"border-box",paddingLeft:38,paddingRight:42,paddingTop:11,paddingBottom:11,border:"1.5px solid #E2E8F0",borderRadius:10,fontSize:13.5,color:"#334155",fontFamily:"inherit",outline:"none",background:"white",transition:"all 0.15s"}}
                  onFocus={e=>{e.currentTarget.style.borderColor="#A5B4FC";e.currentTarget.style.boxShadow="0 0 0 3px rgba(165,180,252,0.18)";}}
                  onBlur={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="none";}}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:0,display:"flex"}}>
                  <IcoEye slash={showPw}/>
                </button>
              </div>
            </div>

            {isPharmacistLogin && <div style={{marginBottom:16}}>
              <FLabel>Assigned Branch</FLabel>
              <FSelect value={String(loginBranchId)} onChange={v=>{const branchId=Number(v);setLoginBranchId(branchId);if(loginRole === "Pharmacist") setEmail(PHARMACIST_PROFILES[branchId]?.email ?? "pharmacist@medicare.com");}} options={branches.filter(item=>item.active).map(item=>({label:item.name,value:String(item.id)}))}/>
            </div>}

            {/* Remember me */}
            <div style={{display:registerMode?"none":"flex",alignItems:"center",gap:9,marginBottom:20}}>
              <div onClick={()=>setRemember(r=>!r)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${remember?"#4F46E5":"#CBD5E1"}`,background:remember?"#4F46E5":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",flexShrink:0}}>
                {remember&&<svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{fontSize:13.5,color:"#475569",cursor:"pointer",userSelect:"none"}} onClick={()=>setRemember(r=>!r)}>Remember me</span>
            </div>

            {/* Sign In CTA */}
            <button type="submit" disabled={loading} style={{width:"100%",height:44,border:"none",borderRadius:10,background:loading?"#6366F1":"linear-gradient(135deg,#4338CA,#4F46E5)",color:"white",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(79,70,229,0.38)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity 0.15s"}}>
              {loading
                ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{animation:"spin 0.8s linear infinite"}}><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>Signing in…</>
                : <>{registerMode ? "Create Staff Account" : "Sign In to Portal"}</>
              }
            </button>
            <button type="button" onClick={()=>{setRegisterMode(v=>!v);setError("");setRegistrationMessage("");}} style={{width:"100%",marginTop:12,border:"none",background:"transparent",color:"#4F46E5",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {registerMode ? "Already have an account? Sign in" : "Don't have an account? Create one"}
            </button>
            {!registerMode&&<div style={{ marginTop: 14, display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"#94A3B8", fontSize:11.5, whiteSpace:"nowrap" }}>
              <span>Quick Demo Login:</span>
              {(["Admin","Pharmacist","Viewer"] as const).map((demoRole) => (
                <button
                  key={demoRole}
                  type="button"
                  onClick={() => {
                    setLoginRole(demoRole);
                    setEmail(
                      demoRole === "Viewer"
                        ? "viewer@medicare.com"
                        : demoRole === "Pharmacist"
                          ? PHARMACIST_PROFILES[loginBranchId]?.email ?? "pharmacist@medicare.com"
                          : "admin@medicare.com",
                    );
                    setPassword("password123");
                    setError("");
                  }}
                  style={{ border:"1px solid #E2E8F0", background:"#F8FAFC", color:"#4F46E5", borderRadius:99, padding:"3px 9px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
                >
                  {demoRole}
                </button>
              ))}
            </div>}

          </form>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ─── Profile popover ────────────────────────────── */
function ProfilePopover({role,branch,name,email,avatar,onLogout,onClose,onAccountInfo}:{role:Role;branch:string;name:string;email:string;avatar:string;onLogout:()=>void;onClose:()=>void;onAccountInfo:()=>void}){
  const cfg=ROLE_CFG[role];
  return(
    <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,right:0,background:"#1E293B",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,boxShadow:"0 -8px 32px rgba(0,0,0,0.5)",zIndex:100,overflow:"hidden"}}>
      <div style={{padding:"16px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${cfg.color},${cfg.color}90)`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:14,fontFamily:"'DM Sans',sans-serif",flexShrink:0,boxShadow:`0 2px 10px ${cfg.glow}`}}>{avatar}</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{name}</div>
            <span style={{display:"inline-block",marginTop:4,fontSize:11,fontWeight:700,color:cfg.color,background:`${cfg.color}22`,border:`1px solid ${cfg.border}`,padding:"2px 9px",borderRadius:99}}>{role}</span>
          </div>
        </div>
      </div>
      <div style={{padding:"6px 8px"}}>
        {[
          {icon:<IcoUser/>,label:"Account Info",sub:"Profile & security settings"},
          {icon:<IcoBranch/>,label:`Assigned Branch: ${branch}`,sub:"Active terminal"},
          {icon:<IcoShield color="#94A3B8"/>,label:"My Permissions",sub:email},
        ].map((item,i)=>(
          <button key={i} onClick={i===0?onAccountInfo:undefined} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:10,padding:"9px 11px",borderRadius:10,border:"none",background:"transparent",cursor:i===0?"pointer":"default",fontFamily:"inherit",transition:"background 0.1s"}}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
            <span style={{color:"#64748B",marginTop:2,flexShrink:0}}>{item.icon}</span>
            <div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:600,color:"#CBD5E1"}}>{item.label}</div><div style={{fontSize:11.5,color:"#475569",marginTop:1}}>{item.sub}</div></div>
          </button>
        ))}
      </div>
      <div style={{padding:"8px 8px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <button onClick={()=>{onLogout();onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 11px",borderRadius:10,border:"none",background:"rgba(239,68,68,0.1)",cursor:"pointer",fontFamily:"inherit",color:"#F87171"}}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.2)"}
          onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.1)"}>
          <IcoLogout/>
          <div style={{textAlign:"left"}}><div style={{fontSize:13.5,fontWeight:700}}>Sign Out / Switch Account</div><div style={{fontSize:11,color:"#EF4444",opacity:0.7,marginTop:1}}>Return to login screen</div></div>
        </button>
      </div>
    </div>
  );
}

/* ─── Modals ─────────────────────────────────────── */
function AccountProfileModal({user,onClose}:{user:AuthUser;onClose:()=>void}){
  return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(3px)"}}/>
    <div style={{position:"relative",background:"white",borderRadius:20,width:440,maxWidth:"90vw",boxShadow:"0 32px 80px rgba(15,23,42,0.22)",overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#0F1729,#1E293B)",padding:"22px 28px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,color:"#F1F5F9"}}>Account Profile</div><div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>Current staff account</div></div>
        <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoX s={12}/></button>
      </div>
      <div style={{padding:"24px 28px",display:"grid",gap:14}}>
        {[["Name",user.name],["Email",user.email],["Role",user.role],["Assigned Branch",user.branch_name]].map(([label,value])=><div key={label} style={{display:"flex",justifyContent:"space-between",gap:20,paddingBottom:10,borderBottom:"1px solid #F1F5F9"}}><span style={{color:"#94A3B8",fontSize:12.5,fontWeight:600}}>{label}</span><span style={{color:"#334155",fontSize:13,fontWeight:700,textAlign:"right"}}>{value}</span></div>)}
      </div>
      <div style={{padding:"0 28px 24px",display:"flex",justifyContent:"flex-end"}}><button onClick={onClose} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #E2E8F0",background:"white",color:"#475569",fontSize:13.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>
    </div>
  </div>;
}

function AccessDeniedCard({label}:{label:string}){
  return <div style={{padding:"28px",flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
    <div style={{width:"100%",maxWidth:560,background:"white",border:"1.5px solid #E2E8F0",borderRadius:16,padding:"34px 28px",textAlign:"center",boxShadow:"0 1px 4px rgba(15,23,42,0.05)"}}>
      <div style={{width:48,height:48,borderRadius:14,background:"#FEF3C7",color:"#B45309",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:24}}>!</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:700,color:"#0F172A"}}>Access Denied</div>
      <div style={{fontSize:13.5,color:"#64748B",marginTop:7}}>Viewer accounts cannot access {label}. Use Global Medicine Inventory for consolidated read-only stock.</div>
    </div>
  </div>;
}

function BranchModal({onClose, onCreated, actorName, actorRole}:{onClose:()=>void; onCreated:(branchId:number)=>void; actorName:string; actorRole:Role}){
  const [form,setForm]=useState({name:"Mirpur 10 Outlet",address:"",phone:"",active:false});
  const f=(k:keyof typeof form)=>(v:string|boolean)=>setForm(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",background:"white",borderRadius:20,width:480,maxWidth:"90vw",boxShadow:"0 32px 80px rgba(15,23,42,0.22)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#0F1729,#1E293B)",padding:"22px 28px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,70,229,0.2)",border:"1px solid rgba(79,70,229,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoBranch/></div>
            <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,color:"#F1F5F9"}}>Add Pharmacy Branch</div><div style={{fontSize:12,color:"#64748B",marginTop:2}}>Register a new branch location</div></div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoX s={12}/></button>
        </div>
        <div style={{padding:"24px 28px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <div><FLabel>Branch Name</FLabel><FInput value={form.name} onChange={f("name") as (v:string)=>void} placeholder="e.g. Mirpur 10 Outlet"/></div>
            <div><FLabel>Full Physical Address</FLabel><FInput value={form.address as string} onChange={f("address") as (v:string)=>void} placeholder="House 4, Road 10, Mirpur 10, Dhaka"/></div>
            <div><FLabel>Contact Phone Number</FLabel><FInput value={form.phone as string} onChange={f("phone") as (v:string)=>void} placeholder="+880 1700-000000"/></div>
            <div style={{borderTop:"1px solid #F1F5F9",paddingTop:10}}><FToggle on={form.active} onChange={v=>f("active")(v)} label="Set as Active Branch"/></div>
          </div>
        </div>
        <div style={{padding:"0 28px 24px",display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",border:"1.5px solid #E2E8F0",borderRadius:11,background:"white",color:"#64748B",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={async()=>{const response=await ApiService.addBranch({branch_name:form.name,location:form.address,contact_no:form.phone,actor_name:actorName,actor_role:actorRole});if(response.status==="success"){onCreated(Number(response.branch_id));onClose();}}} style={{flex:2,padding:"11px",border:"none",borderRadius:11,background:"linear-gradient(135deg,#4338CA,#4F46E5)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(79,70,229,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><IcoPlus/> Create Branch</button>
        </div>
      </div>
    </div>
  );
}

function StaffModal({onClose, branches, actorName, actorRole}:{onClose:()=>void; branches:AppBranch[]; actorName:string; actorRole:Role}){
  const [form,setForm]=useState({name:"Kazi Arif",email:"",password:"",branch:"Dhanmondi Central Branch",role:"Cashier" as "Pharmacist" | "Cashier"});
  const f=(k:keyof typeof form)=>(v:string)=>setForm(p=>({...p,[k]:v}));
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.55)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",background:"white",borderRadius:20,width:500,maxWidth:"90vw",boxShadow:"0 32px 80px rgba(15,23,42,0.22)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#0F1729,#1E293B)",padding:"22px 28px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,70,229,0.2)",border:"1px solid rgba(79,70,229,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoShield/></div>
            <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,color:"#F1F5F9"}}>Create User Account</div><div style={{fontSize:12,color:"#64748B",marginTop:2}}>Add staff and assign branch access</div></div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoX s={12}/></button>
        </div>
        <div style={{padding:"24px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><FLabel>Full Name</FLabel><FInput value={form.name} onChange={f("name")} placeholder="e.g. Kazi Arif"/></div>
            <div><FLabel>Official Email</FLabel><FInput value={form.email} onChange={f("email")} placeholder="kazi@medicare.com" type="email"/></div>
            <div><FLabel>Temporary Password</FLabel><FInput value={form.password} onChange={f("password")} placeholder="Min. 8 characters" type="password"/></div>
            <div><FLabel>Assign Branch</FLabel><FSelect value={form.branch} onChange={f("branch")} options={branches.filter(b=>b.active).map(b=>({label:b.name,value:b.name}))}/></div>
            <div><FLabel>Actor Role</FLabel><FSelect value={form.role} onChange={v=>f("role")(v)} options={[{label:"Pharmacist",value:"Pharmacist"},{label:"Cashier",value:"Cashier"}]}/></div>
          </div>
          <div style={{marginTop:14,padding:"12px 14px",background:"#F8FAFF",border:"1.5px solid #C7D2FE",borderRadius:11,display:"flex",gap:10}}>
            <IcoShield/><p style={{margin:0,fontSize:12.5,color:"#4338CA",lineHeight:1.6}}><span style={{fontWeight:700}}>{form.role}:</span> {ROLE_HINT[form.role]}</p>
          </div>
        </div>
        <div style={{padding:"0 28px 24px",display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",border:"1.5px solid #E2E8F0",borderRadius:11,background:"white",color:"#64748B",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={async()=>{const selected=branches.find(b=>b.name===form.branch);if(!selected)return;const response=await ApiService.addStaff({name:form.name,email:form.email,password:form.password,role:form.role,branch_id:selected.id,actor_name:actorName,actor_role:actorRole});if(response.status==="success")onClose();}} style={{flex:2,padding:"11px",border:"none",borderRadius:11,background:"linear-gradient(135deg,#0F766E,#0D9488)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(13,148,136,0.4)",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><IcoPlus/> Save &amp; Grant Access</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings admin panel ───────────────────────── */
function AdminQuickPanel({onBranch,onStaff}:{onBranch:()=>void;onStaff:()=>void}){
  return(
    <div style={{padding:"20px 28px 0",flexShrink:0}}>
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,fontWeight:700,color:"#0F172A"}}>Multi-Branch &amp; User Roles</div>
        <div style={{fontSize:13,color:"#94A3B8",marginTop:3}}>Manage branch locations and control staff access permissions</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
        {[
          {title:"Create New Branch",desc:"Register a new pharmacy outlet and configure its settings.",action:"Add Branch",color:"#4F46E5",hoverBorder:"#A5B4FC",fn:onBranch},
          {title:"Add Staff & Assign Role",desc:"Create user accounts and assign branch access with role-based permissions.",action:"Add Staff",color:"#0D9488",hoverBorder:"#5EEAD4",fn:onStaff},
        ].map((c,i)=>(
          <div key={i} style={{background:"white",border:"1.5px solid #E2E8F0",borderRadius:16,padding:"20px",cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=c.hoverBorder;(e.currentTarget as HTMLDivElement).style.boxShadow=`0 4px 20px ${c.color}1a`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#E2E8F0";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}
            onClick={c.fn}>
            <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:4}}>{c.title}</div>
            <div style={{fontSize:12.5,color:"#94A3B8",lineHeight:1.5}}>{c.desc}</div>
            <div style={{marginTop:14,display:"flex",alignItems:"center",gap:6,color:c.color,fontSize:13,fontWeight:600}}><IcoPlus color={c.color}/>{c.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Cashier locked nav ─────────────────────────── */
function CashierLockedNav(){
  const restricted=ALL_NAV.filter(n=>n.id!=="pos");
  return(
    <nav style={{padding:"8px 12px 4px",flex:1}}>
      <div style={{padding:"9px 10px",borderRadius:10,background:"rgba(124,58,237,0.22)",display:"flex",alignItems:"center",gap:9,marginBottom:2}}>
        <span style={{color:"#A78BFA",display:"flex",flexShrink:0}}><IcoPOS s={17}/></span>
        <span style={{fontSize:13.5,fontWeight:600,color:"#C4B5FD",flex:1}}>POS</span>
        <span style={{fontSize:10.5,background:"rgba(124,58,237,0.3)",color:"#C4B5FD",padding:"2px 8px",borderRadius:99,fontWeight:700}}>ACTIVE</span>
      </div>
      <div style={{marginTop:10,marginBottom:6}}>
        <div style={{color:"#2D3E5F",fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 6px",marginBottom:4}}>Restricted Access</div>
        {restricted.map(item=>{
          const {Icon}=item;
          return(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:10,marginBottom:2,opacity:0.35,cursor:"not-allowed"}}>
              <span style={{color:"#2D3E5F",display:"flex",flexShrink:0}}><Icon s={17}/></span>
              <span style={{fontSize:13.5,color:"#2D3E5F",flex:1}}>{item.label}</span>
              <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#3B4A6B",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",padding:"2px 7px",borderRadius:6,fontWeight:600,flexShrink:0}}><IcoLock/> Denied</span>
            </div>
          );
        })}
      </div>
      <div style={{margin:"8px 0 0",padding:"10px 12px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:10}}>
        <div style={{fontSize:11,fontWeight:700,color:"#A78BFA",marginBottom:3}}>🔒 Cashier Terminal Mode</div>
        <div style={{fontSize:11.5,color:"#7C3AED",lineHeight:1.5}}>Access restricted to POS only. Contact Admin for elevated permissions.</div>
      </div>
    </nav>
  );
}

/* ─── Main App ───────────────────────────────────── */
export default function App(){
  const [isLoggedIn,setIsLoggedIn]   = useState(false);
  const [role,setRole]               = useState<Role>("Admin");
  const [authUser,setAuthUser]       = useState<AuthUser | null>(null);
  const [activeNav,setActiveNav]     = useState("dashboard");
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [branches, setBranches] = useState<AppBranch[]>(BRANCHES);
  const [vatRate, setVatRate] = useState(5);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [expiryWarningDays, setExpiryWarningDays] = useState(90);
  const [branchOpen,setBranchOpen]   = useState(false);
  const [profileOpen,setProfileOpen] = useState(false);
  const [accountProfileOpen,setAccountProfileOpen] = useState(false);
  const [showBranchModal,setShowBranchModal]   = useState(false);
  const [showStaffModal,setShowStaffModal]     = useState(false);
  const [reorderItem,setReorderItem]           = useState<{name:string; batch:string; supplier:string}|null>(null);
  const [reorderQty,setReorderQty]             = useState(100);
  const [pendingRequisitionCount, setPendingRequisitionCount] = useState(3);
  const [requisitionToast, setRequisitionToast] = useState("");

  const branchRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dt = useDateTime();

  const cfg       = ROLE_CFG[role];
  const displayName = authUser?.name ?? cfg.user;
  const displayTitle = authUser?.title ?? cfg.title;
  const displayAvatar = authUser?.avatar ?? cfg.avatar;
  const displayEmail = authUser?.email ?? cfg.email;
  const isViewer  = role==="Viewer";
  const isCashier = role==="Cashier";
  const isPharmacist = role === "Pharmacist";
  const navItems  = ALL_NAV.filter(n=>cfg.nav.includes(n.id));
  const isPOS     = activeNav==="pos";
  const branch    = isViewer
    ? { id: 0, name: "All Branches (Global View)", short: "All Branches (Global View)", address: "Consolidated read-only inventory" }
    : branches.find((item) => item.id === selectedBranchId) ?? branches[0] ?? BRANCHES[0];
  const { stats: dashboardStats } = useDashboardStats(selectedBranchId, lowStockThreshold, expiryWarningDays);

  useEffect(() => {
    ApiService.getBranches().then(response => { if (response.status === "success") setBranches((response.data ?? []).map(branch => ({ ...branch, short: branch.name.replace(/^MediCare - /, "") }))); });
    ApiService.getPreferences().then(response => {
      const data = response.data; if (!data) return;
      setVatRate(Number(data.vat_rate ?? 5)); setLowStockThreshold(Number(data.low_stock_threshold ?? 10)); setExpiryWarningDays(Number(data.expiry_warning_days ?? 90));
    });
  }, []);

  function handleLogin(user:AuthUser){
    setAuthUser(user);
    setRole(user.role);
    if (user.role === "Viewer") {
      setSelectedBranchId(0);
    } else {
      setSelectedBranchId(branches.some((item) => item.id === user.branch_id && item.active) ? user.branch_id : (branches.find(item => item.active)?.id ?? 1));
    }
    setActiveNav(ROLE_CFG[user.role].defaultNav);
    setIsLoggedIn(true);
  }
  function handleLogout(){setIsLoggedIn(false);setAuthUser(null);setRole("Admin");setSelectedBranchId(1);setActiveNav("dashboard");setProfileOpen(false);setAccountProfileOpen(false);}
  function handleOpenReorderModal(medicineName: string, supplier: string) {
    setReorderQty(100);
    setReorderItem({ name: medicineName, batch: "", supplier });
  }
  async function submitRequisition() {
    if (!reorderItem) return;
    const response = await ApiService.createProcurementOrder({
      medicine_name: reorderItem.name,
      batch_number: reorderItem.batch,
      supplier_name: reorderItem.supplier,
      branch_id: selectedBranchId > 0 ? selectedBranchId : 1,
      quantity: reorderQty,
      est_cost: reorderQty * 1.5,
      requested_by: authUser?.user_id ?? 1,
    });
    if (response.status !== "success") {
      setRequisitionToast(response.message || "Unable to submit requisition.");
      window.setTimeout(() => setRequisitionToast(""), 3000);
      return;
    }
    setPendingRequisitionCount((count) => count + 1);
    setRequisitionToast("Requisition submitted to Admin for approval");
    setReorderItem(null);
    window.setTimeout(() => setRequisitionToast(""), 3000);
  }

  useEffect(()=>{
    if(!ROLE_CFG[role].nav.includes(activeNav)) setActiveNav(ROLE_CFG[role].defaultNav);
  },[role]);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(branchRef.current&&!branchRef.current.contains(e.target as Node))setBranchOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(profileRef.current&&!profileRef.current.contains(e.target as Node))setProfileOpen(false);};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  if(!isLoggedIn) return <LoginScreen onLogin={handleLogin} branches={branches}/>;

  const dateStr = dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
  const timeStr = dt.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

  return(
    <div style={{display:"flex",height:"100vh",background:"#F8FAFC",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>

      {/* ════ SIDEBAR — 260px ════ */}
      <aside style={{width:260,minWidth:260,background:"#0F1729",display:"flex",flexDirection:"column",height:"100%",flexShrink:0,zIndex:10}}>
        {/* Logo */}
        <div style={{padding:"20px 20px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:42,height:42,borderRadius:13,background:"linear-gradient(145deg,#4338CA 0%,#4F46E5 45%,#0D9488 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 14px rgba(79,70,229,0.5),inset 0 1px 0 rgba(255,255,255,0.15)"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.97 3.46 9.38 8 10 4.54-.62 8-5.03 8-10V6l-8-4z" fill="rgba(255,255,255,0.1)"/><rect x="10.5" y="7" width="3" height="10" rx="1.5" fill="white"/><rect x="7" y="10.5" width="10" height="3" rx="1.5" fill="white"/></svg>
              </div>
              <span style={{position:"absolute",bottom:-1,right:-1,width:9,height:9,borderRadius:"50%",background:"#10B981",border:"2px solid #0F1729",boxShadow:"0 0 0 2px rgba(16,185,129,0.3)"}}/>
            </div>
            <div style={{lineHeight:1}}>
              <div style={{display:"flex",alignItems:"baseline"}}>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:18,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>Medi</span>
                <span style={{background:"linear-gradient(90deg,#818CF8,#34D399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,fontSize:18,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>Care</span>
              </div>
              <div style={{color:"#334155",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3}}>Pharmacy Suite</div>
            </div>
          </div>
        </div>

        {/* Branch selector */}
        {!isCashier&&(
          <div style={{padding:"14px 16px 0",position:"relative"}} ref={branchRef}>
            <button disabled={isViewer || role !== "Admin"} onClick={()=>setBranchOpen(o=>!o)} aria-label={isPharmacist ? `${branch.short} (Locked)` : "Select branch"} style={{width:"100%",background:branchOpen?"rgba(79,70,229,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${branchOpen?"rgba(79,70,229,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"9px 13px",cursor:(isViewer || role !== "Admin")?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:9,transition:"all 0.15s",opacity:(isViewer || role !== "Admin")?0.8:1}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#10B981",flexShrink:0,boxShadow:"0 0 5px #10B981"}}/>
              <span style={{color:"#CBD5E1",fontSize:13,fontWeight:500,flex:1,textAlign:"left"}}>{isPharmacist ? `🔒 ${branch.short} (Locked)` : branch.short}</span>
              <span style={{color:"#64748B"}}>{isPharmacist ? <IcoLock/> : <IcoChevron open={branchOpen}/>}</span>
            </button>
            {branchOpen&&(
              <div style={{position:"absolute",top:"calc(100% + 6px)",left:16,right:16,background:"#1E293B",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,boxShadow:"0 16px 48px rgba(0,0,0,0.5)",zIndex:50,overflow:"hidden"}}>
                <div style={{padding:"8px 13px 6px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}><span style={{fontSize:10,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.09em"}}>Select Branch</span></div>
                {branches.filter(b=>b.active).map((b,i)=>(
                  <button key={b.id} onClick={()=>{setSelectedBranchId(b.id);setBranchOpen(false);}}
                    style={{width:"100%",background:selectedBranchId===b.id?"rgba(79,70,229,0.18)":"transparent",border:"none",padding:"10px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background 0.1s"}}
                    onMouseEnter={e=>{if(selectedBranchId!==b.id)(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)";}}
                    onMouseLeave={e=>{if(selectedBranchId!==b.id)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                    <div style={{width:30,height:30,borderRadius:8,background:i===0?"rgba(79,70,229,0.2)":i===1?"rgba(13,148,136,0.2)":"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i===0?"#818CF8":i===1?"#34D399":"#A78BFA",flexShrink:0}}>{b.name.slice(0,2).toUpperCase()}</div>
                    <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:13,fontWeight:600,color:selectedBranchId===b.id?"#A5B4FC":"#CBD5E1"}}>{b.name}</div><div style={{fontSize:11,color:"#475569",marginTop:1}}>{b.address}</div></div>
                    {selectedBranchId===b.id&&<div style={{width:20,height:20,borderRadius:6,background:"rgba(79,70,229,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IcoCheck/></div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cashier banner */}
        {isCashier&&(
          <div style={{margin:"14px 16px 0",padding:"10px 13px",background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:10}}>
            <div style={{fontSize:10.5,fontWeight:700,color:"#A78BFA",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2}}>⚡ POS Terminal Active</div>
            <div style={{fontSize:12,color:"#7C3AED"}}>{cfg.user} · {branch.short}</div>
          </div>
        )}

        {/* Nav */}
        {isCashier
          ? <CashierLockedNav/>
          : (
            <nav style={{padding:"12px 12px 4px",flex:1,overflowY:"auto"}}>
              <div style={{color:"#2D3E5F",fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",padding:"6px 8px",marginBottom:3}}>Navigation</div>
              {navItems.map(item=>{
                const {Icon}=item;
                const active=activeNav===item.id;
                return(
                  <button key={item.id} onClick={()=>setActiveNav(item.id)}
                    style={{width:"100%",border:"none",background:active?"rgba(79,70,229,0.25)":"transparent",color:active?"#A5B4FC":"#94A3B8",marginBottom:2,padding:"10px 12px",borderRadius:10,display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13.5,fontWeight:active?600:500,transition:"all 0.12s",fontFamily:"inherit"}}
                    onMouseEnter={e=>{if(!active){(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.08)";(e.currentTarget as HTMLButtonElement).style.color="#F1F5F9";}}}
                    onMouseLeave={e=>{if(!active){(e.currentTarget as HTMLButtonElement).style.background="transparent";(e.currentTarget as HTMLButtonElement).style.color="#94A3B8";}}}>
                    <span style={{display:"flex",flexShrink:0}}><Icon s={18}/></span>
                    <span style={{flex:1}}>{item.label}</span>
                    {item.badge&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:item.badge.bg,color:item.badge.color,flexShrink:0,lineHeight:1.4}}>{item.id==="procurement"?pendingRequisitionCount:item.badge.text}</span>}
                  </button>
                );
              })}
            </nav>
          )
        }

        {/* Profile */}
        <div style={{padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0,position:"relative"}} ref={profileRef}>
          {profileOpen&&<ProfilePopover role={role} branch={branch.short} name={displayName} email={displayEmail} avatar={displayAvatar} onLogout={handleLogout} onAccountInfo={()=>{setAccountProfileOpen(true);setProfileOpen(false);}} onClose={()=>setProfileOpen(false)}/>} 
          <button onClick={()=>setProfileOpen(o=>!o)}
            style={{width:"100%",background:profileOpen?"rgba(255,255,255,0.06)":"transparent",border:`1px solid ${profileOpen?"rgba(255,255,255,0.1)":"transparent"}`,borderRadius:10,padding:"9px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s",fontFamily:"inherit"}}
            onMouseEnter={e=>{if(!profileOpen)(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.04)";}}
            onMouseLeave={e=>{if(!profileOpen)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${cfg.color},${cfg.color}90)`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:13,flexShrink:0,fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 8px ${cfg.glow}`}}>{displayAvatar}</div>
            <div style={{flex:1,minWidth:0,textAlign:"left"}}>
              <div style={{color:"#E2E8F0",fontSize:13.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{displayName}</div>
              <div style={{color:"#3B4A6B",fontSize:11.5,marginTop:1}}>{displayTitle}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#10B981"}}/>
              <span style={{color:"#475569",fontSize:10}}><IcoChevron open={profileOpen}/></span>
            </div>
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:isPOS?"hidden":"auto"}}>

        {/* ── White Navbar — 64px ── */}
        <header style={{height:64,background:"white",borderBottom:"1px solid #E2E8F0",padding:"0 24px",display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:20,flexShrink:0,boxSizing:"border-box"}}>
          <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {ALL_NAV.find((item) => item.id === activeNav)?.label ?? "MediCare Pharmacy Suite"}
            </span>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:14,flexShrink:0}}>

          {/* Date / time */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:"#94A3B8",fontSize:12.5}}>{dateStr}</span>
            <span style={{color:"#E2E8F0"}}>·</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:"#334155"}}>{timeStr}</span>
          </div>

          {/* Branch pill with pin icon */}
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:99,padding:"6px 13px",fontSize:13,fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            <span style={{color:"#94A3B8"}}>{isPharmacist ? "🔒" : <IcoPin/>}</span>
            {isPharmacist ? `${branch.short} (Locked)` : branch.short}
          </div>

          {/* Bell */}
          <button style={{position:"relative",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#64748B",flexShrink:0}}>
            <IcoBell/>
            <span style={{position:"absolute",top:8,right:9,width:7,height:7,background:"#EF4444",borderRadius:"50%",border:"1.5px solid white"}}/>
          </button>
          <button onClick={()=>setProfileOpen((open)=>!open)} aria-label="Open user profile" style={{width:38,height:38,borderRadius:11,border:"none",background:`linear-gradient(135deg,${cfg.color},${cfg.color}90)`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 2px 8px ${cfg.glow}`,flexShrink:0}}>
            {displayAvatar}
          </button>
          </div>
        </header>

        {/* Viewer banner */}
        {isViewer&&(
          <div style={{background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",borderBottom:"1px solid #FDE68A",padding:"7px 24px",display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
            <IcoEye/><span style={{fontSize:12.5,fontWeight:600,color:"#B45309"}}>Read-Only Mode — create, edit, and delete actions are disabled.</span>
          </div>
        )}

        {/* Page area */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:isPOS?"hidden":"auto",position:"relative"}}>
          {activeNav==="pos"&&<div style={{flex:1,display:"flex",overflow:"hidden"}}><POS selectedBranchId={selectedBranchId} userId={authUser?.user_id ?? 1} role={role} vatRate={vatRate}/></div>}
          {activeNav==="medicines"&&<div style={{flex:1,display:"flex",flexDirection:"column"}}><InventoryPage role={role} selectedBranchId={selectedBranchId} branchName={branch.short} lowStockThreshold={lowStockThreshold} expiryWarningDays={expiryWarningDays} onReorderClick={handleOpenReorderModal}/></div>}
          {activeNav==="procurement"&&<div style={{flex:1,overflow:"auto"}}><ProcurementPage role={role} selectedBranchId={selectedBranchId} onPendingCountChange={setPendingRequisitionCount}/></div>}
          {activeNav==="inventory"&&<div style={{flex:1,display:"flex",flexDirection:"column",pointerEvents:isViewer?"none":undefined}}><BatchesPage/></div>}
          {activeNav==="suppliers"&&<div style={{flex:1,display:"flex",flexDirection:"column",pointerEvents:isViewer?"none":undefined}}><SuppliersPage/></div>}
          {activeNav==="analytics"&&<div style={{flex:1,display:"flex",flexDirection:"column"}}>{isViewer?<AccessDeniedCard label="Sales"/>:<AnalyticsPage/>}</div>}
          {activeNav==="settings"&&(
            isViewer ? <AccessDeniedCard label="Settings"/> :
            <SettingsPage
              isAdmin={role==="Admin"}
              branches={branches.map(({ id, name, address, phone, active }) => ({ id, name, address, phone: phone ?? "", active }))}
              onBranchesChange={(next) => setBranches(next.map(branch => ({ ...branch, short: branch.name.replace(/^MediCare - /, ""), phone: branch.phone ?? "" })))}
              onBranchDeleted={(branchId) => { if (selectedBranchId === branchId) setSelectedBranchId(branches.find(branch => branch.id !== branchId && branch.active)?.id ?? 1); }}
              actorName={displayName}
              actorRole={role}
              onPreferencesChange={(preferences) => { setVatRate(preferences.vat_rate); setLowStockThreshold(preferences.low_stock_threshold); setExpiryWarningDays(preferences.expiry_warning_days); localStorage.setItem("medicare_preferences", JSON.stringify(preferences)); }}
              onBranch={()=>setShowBranchModal(true)}
              onStaff={()=>setShowStaffModal(true)}
            />
          )}
          {activeNav==="dashboard"&&(
            isViewer ? <AccessDeniedCard label="Dashboard"/> :
            <main style={{padding:"28px",flex:1}}>
              <div style={{marginBottom:24}}>
                <h1 style={{fontFamily:"'DM Sans',sans-serif",fontSize:23,fontWeight:700,color:"#0F172A",margin:0}}>Dashboard Overview</h1>
                <p style={{color:"#94A3B8",fontSize:13.5,margin:"5px 0 0"}}>Welcome back, {displayName} · {displayTitle} · {branch.name}</p>
              </div>

              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
                {[
                  {icon:<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M7 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round"/></svg>,icoStyle:{background:"#EEF2FF",border:"1px solid #C7D2FE"},val:`$${Number(dashboardStats?.today_sales || 0).toLocaleString()}`,label:"Today's Sales",sub:"Live branch total",badge:"Today",badgeStyle:{background:"#DCFCE7",color:"#15803D"},trend:false},
                  {icon:<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8S14.42 2 10 2z" stroke="#0D9488" strokeWidth="1.5"/><path d="M7 10h6M10 7v6" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/></svg>,icoStyle:{background:"#CCFBF1",border:"1px solid #99F6E4"},val:String(dashboardStats?.total_medicines ?? 0),label:"Total Medicines",sub:"Live branch inventory",badge:"In Stock",badgeStyle:{background:"#F0FDF4",color:"#15803D"},trend:false},
                  {icon:<IcoAlertTri/>,icoStyle:{background:"#FEE2E2",border:"1px solid #FECACA",color:"#EF4444"},val:String(dashboardStats?.low_stock_count ?? 0),label:"Low Stock Alert",sub:"Below reorder level",badge:"Urgent",badgeStyle:{background:"#FEE2E2",color:"#DC2626"},trend:false,cardBg:"#FFF5F5",cardBorder:"#FECACA",valColor:"#DC2626"},
                  {icon:<IcoClock/>,icoStyle:{background:"#FEF3C7",border:"1px solid #FDE68A"},val:String(dashboardStats?.near_expiry_count ?? 0),label:"Near-Expiry Alert",sub:"Within 90 days",badge:"Warning",badgeStyle:{background:"#FEF3C7",color:"#B45309"},trend:false,cardBg:"#FFFBEB",cardBorder:"#FDE68A",valColor:"#B45309"},
                ].map((k,i)=>(
                  <div key={i} style={{background:(k as any).cardBg||"white",border:`1.5px solid ${(k as any).cardBorder||"#E2E8F0"}`,borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(15,23,42,0.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:(k.icoStyle as any).color||"inherit",...k.icoStyle}}>{k.icon}</div>
                      <span style={{...k.badgeStyle,fontSize:11.5,fontWeight:700,padding:"3px 10px",borderRadius:99,display:"flex",alignItems:"center",gap:4,height:"fit-content"}}>{k.trend&&<IcoTrendUp/>}{k.badge}</span>
                    </div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:26,fontWeight:700,color:(k as any).valColor||"#0F172A",lineHeight:1}}>{k.val}</div>
                    <div style={{color:"#94A3B8",fontSize:12.5,marginTop:5,fontWeight:500}}>{k.label}</div>
                    <div style={{color:"#64748B",fontSize:12,marginTop:3}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 390px",gap:16,marginBottom:20}}>
                <div style={{background:"white",border:"1.5px solid #E2E8F0",borderRadius:16,padding:"22px",boxShadow:"0 1px 4px rgba(15,23,42,0.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                    <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A"}}>Weekly Revenue &amp; Profit</div><div style={{color:"#94A3B8",fontSize:12,marginTop:2}}>Last 7 days</div></div>
                    <div style={{display:"flex",gap:14}}>{[{c:"#4F46E5",l:"Revenue"},{c:"#0D9488",l:"Profit"}].map((d,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#64748B"}}><span style={{width:10,height:10,borderRadius:3,background:d.c,display:"inline-block"}}/>{d.l}</span>)}</div>
                  </div>
                  <BarChart width={480} height={210} data={weeklyData} barGap={3} barCategoryGap="30%">
                    <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="0"/>
                    <XAxis dataKey="day" tick={{fontSize:12,fill:"#94A3B8",fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:12,fill:"#94A3B8",fontFamily:"Inter"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                    <Tooltip content={<BarTip/>} cursor={{fill:"rgba(241,245,249,0.7)",radius:6}}/>
                    <Bar dataKey="revenue" fill="#4F46E5" radius={[6,6,0,0]} maxBarSize={26} isAnimationActive={false}/>
                    <Bar dataKey="profit"  fill="#0D9488" radius={[6,6,0,0]} maxBarSize={26} isAnimationActive={false}/>
                  </BarChart>
                </div>
                <div style={{background:"white",border:"1.5px solid #E2E8F0",borderRadius:16,padding:"22px",boxShadow:"0 1px 4px rgba(15,23,42,0.05)"}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:3}}>Category Distribution</div>
                  <div style={{color:"#94A3B8",fontSize:12,marginBottom:10}}>By medicine type</div>
                  <div style={{display:"flex",justifyContent:"center"}}>
                    <PieChart width={200} height={165}><Pie data={categoryData} cx={100} cy={82} innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" isAnimationActive={false}>{categoryData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<PieTip/>}/></PieChart>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:2}}>
                    {categoryData.map((item,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{width:9,height:9,borderRadius:3,background:item.color,flexShrink:0}}/>
                        <span style={{fontSize:12,color:"#475569",flex:1}}>{item.name}</span>
                        <div style={{flex:1,height:4,background:"#F1F5F9",borderRadius:99,overflow:"hidden"}}><div style={{width:`${item.value}%`,height:"100%",background:item.color,borderRadius:99}}/></div>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,color:"#334155",fontWeight:500,width:28,textAlign:"right"}}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tables */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:"white",border:"1.5px solid #E2E8F0",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(15,23,42,0.05)"}}>
                  <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A"}}>Fast-Moving Medicines</div><div style={{color:"#94A3B8",fontSize:12,marginTop:2}}>Top 5 by units sold</div></div>
                    <span style={{fontSize:11.5,background:"#EEF2FF",color:"#4F46E5",padding:"3px 10px",borderRadius:99,fontWeight:700}}>Today</span>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr style={{background:"#F8FAFC"}}>{["#","Medicine","Category","Sold","Revenue"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                    <tbody>{fastMeds.map((m,i)=>(
                      <tr key={i} style={{borderTop:"1px solid #F1F5F9"}}>
                        <td style={{padding:"10px 16px"}}><span style={{width:22,height:22,borderRadius:6,background:i===0?"#EEF2FF":"#F8FAFC",color:i===0?"#4F46E5":"#94A3B8",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{i+1}</span></td>
                        <td style={{padding:"10px 16px",fontWeight:500,color:"#1E293B"}}>{m.name}</td>
                        <td style={{padding:"10px 16px"}}><span style={{fontSize:11.5,padding:"2px 9px",borderRadius:99,fontWeight:600,background:m.cat==="Tablets"?"#EEF2FF":m.cat==="Capsules"?"#F5F3FF":"#CCFBF1",color:m.cat==="Tablets"?"#4F46E5":m.cat==="Capsules"?"#7C3AED":"#0D9488"}}>{m.cat}</span></td>
                        <td style={{padding:"10px 16px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:500,color:"#334155"}}>{m.sold}</td>
                        <td style={{padding:"10px 16px",fontWeight:600,color:"#0D9488"}}>{m.rev}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <Dashboard
                  selectedBranchId={selectedBranchId}
                  role={role}
                  isViewer={isViewer}
                  alerts={[]}
                  onReorderClick={handleOpenReorderModal}
                  onReorder={({ name, batch, supplier }) => setReorderItem({ name, batch, supplier })}
                />
              </div>
            </main>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBranchModal&&<BranchModal onClose={()=>setShowBranchModal(false)} actorName={displayName} actorRole={role} onCreated={async branchId=>{const response=await ApiService.getBranches();if(response.status==="success"){setBranches((response.data ?? []).map(branch=>({...branch,short:branch.name.replace(/^MediCare - /,""),active:branch.active})));setSelectedBranchId(branchId);}}}/>} 
      {showStaffModal&&<StaffModal branches={branches} actorName={displayName} actorRole={role} onClose={()=>setShowStaffModal(false)}/>}
      {accountProfileOpen&&authUser&&<AccountProfileModal user={authUser} onClose={()=>setAccountProfileOpen(false)}/>}
      {requisitionToast&&<div style={{position:"fixed",right:24,bottom:24,zIndex:300,background:"#0F1729",color:"white",borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:600,boxShadow:"0 12px 30px rgba(15,23,42,0.2)"}}>{requisitionToast}</div>}
      {reorderItem&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={()=>setReorderItem(null)} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(3px)"}}/>
          <div style={{position:"relative",background:"white",borderRadius:20,width:420,maxWidth:"92vw",boxShadow:"0 32px 80px rgba(15,23,42,0.22)",overflow:"hidden"}}>
            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#0F1729,#1E293B)",padding:"20px 24px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:"rgba(79,70,229,0.2)",border:"1px solid rgba(79,70,229,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <IcoTruck s={16}/>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#F1F5F9"}}>Create Drug Requisition</div>
                  <div style={{fontSize:11.5,color:"#475569",marginTop:2}}>Submit a purchase request for approval</div>
                </div>
              </div>
              <button onClick={()=>setReorderItem(null)} style={{width:30,height:30,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#94A3B8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoX s={12}/></button>
            </div>
            {/* Body */}
            <div style={{padding:"22px 24px",display:"flex",flexDirection:"column",gap:14}}>
              {/* Medicine name — read-only */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#475569",marginBottom:5,letterSpacing:"0.02em"}}>Medicine Name</label>
                <input readOnly value={reorderItem.name} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:9,fontSize:13.5,color:"#64748B",fontFamily:"inherit",outline:"none",background:"#F8FAFC",cursor:"default"}}/>
              </div>
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#475569",marginBottom:5,letterSpacing:"0.02em"}}>Batch Number</label>
                <input readOnly value={reorderItem.batch} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:9,fontSize:13.5,color:"#64748B",fontFamily:"inherit",outline:"none",background:"#F8FAFC",cursor:"default"}}/>
              </div>
              {/* Supplier */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#475569",marginBottom:5,letterSpacing:"0.02em"}}>Supplier</label>
                <input defaultValue={reorderItem.supplier} style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:9,fontSize:13.5,color:"#334155",fontFamily:"inherit",outline:"none",background:"white",transition:"border 0.15s"}}
                  onFocus={e=>{e.currentTarget.style.borderColor="#A5B4FC";e.currentTarget.style.boxShadow="0 0 0 3px rgba(165,180,252,0.18)";}}
                  onBlur={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="none";}}/>
              </div>
              {/* Quantity */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#475569",marginBottom:5,letterSpacing:"0.02em"}}>Required Quantity</label>
                <div style={{display:"flex",alignItems:"center",background:"#F8FAFC",border:"1.5px solid #E2E8F0",borderRadius:9,overflow:"hidden",width:"fit-content"}}>
                  <button onClick={()=>setReorderQty(q=>Math.max(1,q-10))} style={{width:38,height:40,background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>−</button>
                  <input type="number" value={reorderQty} onChange={e=>setReorderQty(Math.max(1,Number(e.target.value)))} min={1}
                    style={{width:70,textAlign:"center",border:"none",background:"none",padding:"0 4px",fontSize:14,fontWeight:700,color:"#0F172A",fontFamily:"'JetBrains Mono',monospace",outline:"none"}}/>
                  <button onClick={()=>setReorderQty(q=>q+10)} style={{width:38,height:40,background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>+</button>
                </div>
              </div>
              {/* Approval note */}
              <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10}}>
                <IcoAlertTri/>
                <p style={{margin:0,fontSize:12.5,color:"#92400E",lineHeight:1.6}}>Requires <strong>Central Admin Approval</strong> before dispatching purchase order to supplier.</p>
              </div>
            </div>
            {/* Footer */}
            <div style={{padding:"0 24px 22px",display:"flex",gap:10}}>
              <button onClick={()=>setReorderItem(null)} style={{flex:1,padding:"11px",border:"1.5px solid #E2E8F0",borderRadius:11,background:"white",color:"#64748B",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button               onClick={submitRequisition} style={{flex:2,padding:"11px",border:"none",borderRadius:11,background:"linear-gradient(135deg,#4338CA,#4F46E5)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(79,70,229,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                <IcoTruck s={14}/> Submit Requisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
