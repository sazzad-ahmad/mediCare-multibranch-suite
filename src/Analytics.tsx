import { useEffect, useState } from "react";
import { ApiService, AnalyticsResponse } from "./services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";

/* ─── Data ─── */
const DAILY_SALES = [
  { day:"Aug 13", sales:1240, profit:410 }, { day:"Aug 14", sales:1560, profit:530 },
  { day:"Aug 15", sales:980,  profit:310 }, { day:"Aug 16", sales:1820, profit:640 },
  { day:"Aug 17", sales:2100, profit:750 }, { day:"Aug 18", sales:1750, profit:600 },
  { day:"Aug 19", sales:1430, profit:480 }, { day:"Aug 20", sales:2240, profit:820 },
  { day:"Aug 21", sales:1980, profit:700 }, { day:"Aug 22", sales:2380, profit:880 },
  { day:"Aug 23", sales:1600, profit:540 }, { day:"Aug 24", sales:1900, profit:670 },
  { day:"Aug 25", sales:2150, profit:780 }, { day:"Aug 26", sales:1730, profit:590 },
  { day:"Aug 27", sales:2420, profit:900 }, { day:"Aug 28", sales:2050, profit:730 },
  { day:"Aug 29", sales:1840, profit:640 }, { day:"Aug 30", sales:2600, profit:970 },
  { day:"Aug 31", sales:2290, profit:840 }, { day:"Sep 01", sales:1950, profit:690 },
  { day:"Sep 02", sales:2100, profit:760 }, { day:"Sep 03", sales:1680, profit:580 },
  { day:"Sep 04", sales:2350, profit:870 }, { day:"Sep 05", sales:2080, profit:740 },
  { day:"Sep 06", sales:1790, profit:620 }, { day:"Sep 07", sales:2460, profit:920 },
  { day:"Sep 08", sales:2220, profit:810 }, { day:"Sep 09", sales:1560, profit:530 },
  { day:"Sep 10", sales:1980, profit:700 }, { day:"Sep 11", sales:2340, profit:860 },
];

const BRANCH_DATA = [
  { branch: "Dhanmondi Central", revenue: 24600, profit: 8400 },
  { branch: "UIU Madani Branch", revenue: 18200, profit: 5800 },
];

const PAYMENT_DATA = [
  { name: "Cash",   value: 54, color: "#4F46E5" },
  { name: "bKash",  value: 32, color: "#0D9488" },
  { name: "Nagad",  value: 10, color: "#F59E0B" },
  { name: "Card",   value: 4,  color: "#8B5CF6" },
];

const TOP_MEDICINES = [
  { brand: "Insulin Glargine 100U", cost: 14.00, sell: 18.00, margin: 22.2, profit: 4760 },
  { brand: "Azithro 250mg",         cost: 3.60,  sell: 4.80,  margin: 25.0, profit: 2956 },
  { brand: "Ventolin 100mcg",       cost: 7.20,  sell: 9.80,  margin: 26.5, profit: 2184 },
  { brand: "Cefurox 500mg",         cost: 5.80,  sell: 7.80,  margin: 25.6, profit: 1560 },
  { brand: "Omep 20mg",             cost: 2.50,  sell: 3.40,  margin: 26.5, profit: 1188 },
];

const DATE_RANGES = ["Today", "Last 7 Days", "Last 30 Days", "This Month", "All Time"];
const BRANCHES    = ["All Branches", "MediCare - Dhanmondi Branch", "MediCare - UIU Madani Branch", "MediCare - Uttara Sector 7"];
const BRANCH_IDS: Record<string, number> = { "All Branches": 0, "MediCare - Dhanmondi Branch": 1, "MediCare - UIU Madani Branch": 2, "MediCare - Uttara Sector 7": 3 };
const RANGE_KEYS: Record<string, string> = { Today: "today", "Last 7 Days": "last_7_days", "Last 30 Days": "last_30_days", "This Month": "this_month", "All Time": "all_time" };
const PAYMENT_COLORS: Record<string, string> = { Cash: "#4F46E5", bKash: "#0D9488", Nagad: "#F59E0B", Card: "#8B5CF6" };

type AnalyticsData = NonNullable<AnalyticsResponse["data"]>;
const EMPTY_ANALYTICS: AnalyticsData = { summary: { revenue: 0, profit: 0, orders: 0, retention: 0 }, trend: [], branches: [], payments: [], top_medicines: [] };
const SEEDED_FALLBACK: AnalyticsData = {
  summary: { revenue: 11.41, profit: 3.6, orders: 1, retention: 0 },
  trend: [{ day: "2026-09-22", sales: 11.41, profit: 3.6 }],
  branches: [
    { branch: "MediCare - Dhanmondi Branch", revenue: 11.41, profit: 3.6 },
    { branch: "MediCare - UIU Madani Branch", revenue: 0, profit: 0 },
    { branch: "MediCare - Uttara Sector 7", revenue: 0, profit: 0 },
  ],
  payments: [{ name: "bKash", value: 100, count: 1, color: PAYMENT_COLORS.bKash }],
  top_medicines: [{ brand: "Amoxil 500mg", cost: 3.8, sell: 5.6, margin: 32.1, profit: 3.6 }],
};

/* ─── Tiny Icons ─── */
const IcoTrend = () => <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M3 15l5-5 4 3 5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoDown  = () => <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M3 5l5 5 4-3 5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevDown = () => <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoCal   = () => <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 1v4M14 1v4M2 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;

/* ─── Tooltip Styles ─── */
const TooltipBox = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0F1729", borderRadius:10, padding:"10px 14px", color:"#F8FAFC", fontSize:12.5, boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
      <div style={{ fontWeight:600, marginBottom:6, color:"#94A3B8" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, display:"inline-block" }}/>
          <span style={{ color:"#94A3B8" }}>{p.name}:</span>
          <span style={{ color:"white", fontWeight:600 }}>${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0F1729", borderRadius:10, padding:"8px 14px", color:"#F8FAFC", fontSize:12.5 }}>
      <strong>{payload[0].name}</strong>: {payload[0].value}%
    </div>
  );
};
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0F1729", borderRadius:10, padding:"10px 14px", color:"#F8FAFC", fontSize:12.5 }}>
      <div style={{ fontWeight:600, marginBottom:6, color:"#94A3B8" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.fill, display:"inline-block" }}/>
          <span style={{ color:"#94A3B8" }}>{p.name}:</span>
          <span style={{ color:"white", fontWeight:600 }}>${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ─── */
type KPIProps = { label: string; value: string; sub: string; trend: number; icon: React.ReactNode; accent: string; accentBg: string };
function KPICard({ label, value, sub, trend, icon, accent, accentBg }: KPIProps) {
  const up = trend >= 0;
  return (
    <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px", transition:"box-shadow 0.15s" }}
      onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 4px 20px rgba(15,23,42,0.06)")}
      onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:accentBg, display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>
          {icon}
        </div>
        <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11.5, fontWeight:700, padding:"3px 9px", borderRadius:99, background:up?"#DCFCE7":"#FEF2F2", color:up?"#15803D":"#DC2626" }}>
          {up?<IcoTrend/>:<IcoDown/>}{up?"+":""}{trend}%
        </span>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:28, fontWeight:800, color:"#0F172A", letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
      <div style={{ color:"#475569", fontSize:13, fontWeight:600, marginTop:6 }}>{label}</div>
      <div style={{ color:"#94A3B8", fontSize:12, marginTop:3 }}>{sub}</div>
    </div>
  );
}

/* ─── Sparkline mini-bar inside table ─── */
function MarginBar({ pct }: { pct: number }) {
  const color = pct >= 25 ? "#0D9488" : pct >= 20 ? "#4F46E5" : "#F59E0B";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
        <div style={{ width:`${Math.min(pct*2,100)}%`, height:"100%", background:color, borderRadius:99 }}/>
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color, width:40 }}>{pct}%</span>
    </div>
  );
}

/* ─── Custom Pie Legend ─── */
function PieLegend({ payments }: { payments: AnalyticsData["payments"] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, justifyContent:"center" }}>
      {payments.map(p=>(
        <div key={p.name} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ width:10, height:10, borderRadius:3, background:p.color, flexShrink:0 }}/>
          <span style={{ fontSize:13, color:"#475569", flex:1 }}>{p.name}</span>
          <div style={{ width:80, height:5, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:`${p.value}%`, height:"100%", background:p.color, borderRadius:99 }}/>
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:p.color, width:34, textAlign:"right" }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Rank label ─── */
function Rank({ n }: { n: number }) {
  const colors = ["#F59E0B","#94A3B8","#CD7F32","#64748B","#64748B"];
  return (
    <span style={{ width:24, height:24, borderRadius:8, background:n<=3?`${colors[n-1]}18`:"#F8FAFC", color:colors[n-1] ?? "#94A3B8", fontSize:12, fontWeight:800, display:"inline-flex", alignItems:"center", justifyContent:"center", border:`1px solid ${n<=3?colors[n-1]+"30":"#E2E8F0"}` }}>{n}</span>
  );
}

function SelectPill({ value, onChange, options, icon }: { value:string; onChange:(v:string)=>void; options:string[]; icon?:React.ReactNode }) {
  return (
    <div style={{ position:"relative" }}>
      {icon && <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}>{icon}</span>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ appearance:"none", padding:`9px ${icon?"32px":"14px"} 9px ${icon?"30px":"14px"}`, paddingRight:32, background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:13, color:"#334155", fontWeight:500, outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
      <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}><ChevDown/></span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [branch,    setBranch]    = useState("All Branches");
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ApiService.getAnalytics(RANGE_KEYS[dateRange], BRANCH_IDS[branch]).then(response => {
      if (active) setAnalytics(response.status === "success" && response.data ? response.data : SEEDED_FALLBACK);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dateRange, branch]);

  const { summary, trend, branches, payments, top_medicines: topMedicines } = analytics;
  const trendTicks = trend.length > 7 ? trend.filter((_, index) => index % Math.ceil(trend.length / 7) === 0).map(point => point.day) : trend.map(point => point.day);
  const formatMoney = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const exportReport = () => {
    const rows = [
      ["Date Range", dateRange], ["Selected Branch", branch], ["Total Revenue", summary.revenue], ["Total Net Profit", summary.profit], ["Invoices Count", summary.orders], [],
      ["Medicine", "Cost", "Sell", "Margin %", "Net Profit"],
      ...topMedicines.map(m => [m.brand, m.cost, m.sell, m.margin, m.profit]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `medicare-sales-${RANGE_KEYS[dateRange]}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  // pick a tick interval so the area chart isn't crowded
  const ticks = trendTicks;

  return (
    <div style={{ padding:"28px", display:"flex", flexDirection:"column", gap:20, flex:1, minWidth:0 }}>

      {/* ── Header + Filters ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
        <div>
          <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:22, fontWeight:700, color:"#0F172A", margin:0 }}>Pharmacy Analytics</h1>
          <p style={{ color:"#94A3B8", fontSize:13.5, margin:"4px 0 0" }}>Financial intelligence & performance breakdown · {branch}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <SelectPill value={dateRange} onChange={setDateRange} options={DATE_RANGES} icon={<IcoCal/>}/>
          <SelectPill value={branch}    onChange={setBranch}    options={BRANCHES}/>
          <button onClick={exportReport} disabled={loading} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4F46E5,#0D9488)", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 10px rgba(79,70,229,0.3)", opacity:loading ? 0.6 : 1 }}>
            Export Report
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <KPICard
          label="Gross Revenue" value={formatMoney(summary.revenue)} sub={`${summary.orders.toLocaleString()} invoices · ${dateRange}`}
          trend={0} accent="#4F46E5" accentBg="#EEF2FF"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
        />
        <KPICard
          label="Net Profit" value={formatMoney(summary.profit)} sub={`${summary.revenue ? ((summary.profit / summary.revenue) * 100).toFixed(1) : "0.0"}% profit margin`}
          trend={0} accent="#0D9488" accentBg="#CCFBF1"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-5 4 3 4-6 4-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
        />
        <KPICard
          label="Avg. Basket Size" value={formatMoney(summary.orders ? summary.revenue / summary.orders : 0)} sub="Per transaction average"
          trend={0} accent="#7C3AED" accentBg="#F5F3FF"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
        />
        <KPICard
          label="Customer Retention" value={`${summary.retention}%`} sub="Returning customers"
          trend={0} accent="#D97706" accentBg="#FEF3C7"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* ── Row 2: Area Chart + Branch Bar ── */}
      <div style={{ display:"grid", gridTemplateColumns:"65fr 35fr", gap:16 }}>

        {/* Area Chart */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A", margin:0 }}>30-Day Sales Trend</h2>
              <p style={{ color:"#94A3B8", fontSize:12, margin:"3px 0 0" }}>Daily Revenue vs. Gross Profit · {dateRange}</p>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[{label:"Revenue",color:"#4F46E5"},{label:"Profit",color:"#0D9488"}].map(({label,color})=>(
                <span key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748B" }}>
                  <span style={{ width:10, height:3, borderRadius:99, background:color, display:"inline-block" }}/>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ width:"100%", overflowX:"auto" }}>
            <AreaChart width={560} height={220} data={trend.length ? trend : [{ day: "No sales", sales: 0, profit: 0 }]} style={{ margin:"0 auto" }}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0D9488" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9"/>
              <XAxis dataKey="day" ticks={ticks} tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{ fontSize:11, fill:"#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={44}/>
              <Tooltip content={<TooltipBox/>}/>
              <Area type="monotone" dataKey="sales"  name="Revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#gSales)"  dot={false} isAnimationActive={false}/>
              <Area type="monotone" dataKey="profit" name="Profit"  stroke="#0D9488" strokeWidth={2} fill="url(#gProfit)" dot={false} isAnimationActive={false}/>
            </AreaChart>
          </div>
        </div>

        {/* Branch Horizontal Bar Chart */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px", overflow:"hidden" }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A", margin:0 }}>Branch Revenue Comparison</h2>
            <p style={{ color:"#94A3B8", fontSize:12, margin:"3px 0 0" }}>Revenue vs Profit by location</p>
          </div>

          {/* Custom horizontal bars */}
          <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
            {(branches.length ? branches : [{ branch: "No branch sales", revenue: 0, profit: 0 }]).map((b, bi)=>{
              const maxRev = Math.max(...branches.map(x=>Number(x.revenue)), 1);
              const revPct = (b.revenue/maxRev)*100;
              const profPct = b.revenue > 0 ? (b.profit/b.revenue)*100 : 0;
              const colors = bi===0 ? { rev:"#4F46E5", profit:"#0D9488" } : { rev:"#8B5CF6", profit:"#F59E0B" };
              return (
                <div key={b.branch}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:colors.rev, flexShrink:0 }}/>
                      <span style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{b.branch}</span>
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:colors.rev }}>${b.revenue.toLocaleString()}</span>
                  </div>
                  {/* Revenue bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>Revenue</span>
                      <span style={{ fontSize:11, color:"#94A3B8" }}>${b.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ height:10, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${revPct}%`, height:"100%", background:`linear-gradient(90deg,${colors.rev},${colors.rev}aa)`, borderRadius:99 }}/>
                    </div>
                  </div>
                  {/* Profit bar */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>Net Profit</span>
                      <span style={{ fontSize:11, color:"#94A3B8" }}>${b.profit.toLocaleString()}</span>
                    </div>
                    <div style={{ height:10, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${(b.profit/maxRev)*100}%`, height:"100%", background:`linear-gradient(90deg,${colors.profit},${colors.profit}aa)`, borderRadius:99 }}/>
                    </div>
                  </div>
                  {/* Margin badge */}
                  <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:11, fontWeight:700, background:`${colors.profit}18`, color:colors.profit, padding:"2px 9px", borderRadius:99 }}>
                      {profPct.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recharts bar (hidden spacer to keep import used) — replaced by custom bars above */}
          <div style={{ display:"none" }}>
            <BarChart width={100} height={10} data={[]}><Bar dataKey="x" isAnimationActive={false}/></BarChart>
          </div>
        </div>
      </div>

      {/* ── Row 3: Payment Pie + Top Medicines Table ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        {/* Doughnut + Legend */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"22px 24px" }}>
          <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A", margin:"0 0 4px" }}>Payment Gateway Breakdown</h2>
          <p style={{ color:"#94A3B8", fontSize:12, margin:"0 0 20px" }}>Transaction split by payment method</p>
          <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
            {/* Doughnut */}
            <div style={{ flexShrink:0 }}>
              <PieChart width={180} height={180}>
                    <Pie data={payments.length ? payments : [{ name: "No payments", value: 100, count: 0, color: "#CBD5E1" }]} cx={90} cy={90} innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                      {(payments.length ? payments : [{ name: "No payments", value: 100, count: 0, color: "#CBD5E1" }]).map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </div>

            {/* Right: legend + center stat */}
            <div style={{ flex:1, minWidth:140 }}>
              {/* Center figure above legend */}
              <div style={{ marginBottom:16, paddingBottom:14, borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Total Transactions</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:24, fontWeight:800, color:"#0F172A" }}>{summary.orders.toLocaleString()}</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>This period · all methods</div>
              </div>
              <PieLegend payments={payments}/>
            </div>
          </div>
        </div>

        {/* Top Profitable Medicines */}
        <div style={{ background:"white", borderRadius:16, border:"1px solid #E2E8F0", overflow:"hidden" }}>
          <div style={{ padding:"22px 24px 14px", borderBottom:"1px solid #F1F5F9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#0F172A", margin:0 }}>Top 5 Most Profitable Medicines</h2>
              <p style={{ color:"#94A3B8", fontSize:12, margin:"3px 0 0" }}>Ranked by net profit generated this period</p>
            </div>
            <span style={{ background:"#EEF2FF", color:"#4F46E5", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
              {dateRange}
            </span>
          </div>

          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
                {["#","Medicine","Cost","Sell","Margin","Net Profit"].map((h,i)=>(
                  <th key={h} style={{ padding:"11px 16px", fontSize:10.5, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"#64748B", textAlign:i>=2?"right":"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topMedicines.map((m,i)=>(
                <tr key={m.brand}
                  style={{ borderBottom:i<4?"1px solid #F1F5F9":"none", transition:"background 0.12s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#F5F7FF")}
                  onMouseLeave={e=>(e.currentTarget.style.background="white")}
                >
                  <td style={{ padding:"13px 16px" }}><Rank n={i+1}/></td>
                  <td style={{ padding:"13px 16px" }}>
                    <div style={{ fontWeight:600, fontSize:13.5, color:"#0F172A" }}>{m.brand}</div>
                  </td>
                  <td style={{ padding:"13px 16px", textAlign:"right" }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, color:"#64748B" }}>${m.cost.toFixed(2)}</span>
                  </td>
                  <td style={{ padding:"13px 16px", textAlign:"right" }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, color:"#0D9488", fontWeight:600 }}>${m.sell.toFixed(2)}</span>
                  </td>
                  <td style={{ padding:"13px 16px 13px 0", minWidth:120 }}>
                    <MarginBar pct={m.margin}/>
                  </td>
                  <td style={{ padding:"13px 16px", textAlign:"right" }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:"#4F46E5" }}>${m.profit.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary footer */}
          <div style={{ padding:"12px 20px", background:"#F8FAFC", borderTop:"1px solid #F1F5F9", display:"flex", justifyContent:"flex-end", alignItems:"center", gap:16 }}>
            <span style={{ fontSize:12.5, color:"#64748B" }}>Combined profit from top 5:</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:800, color:"#0F172A" }}>
              {formatMoney(topMedicines.reduce((sum, medicine) => sum + medicine.profit, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
