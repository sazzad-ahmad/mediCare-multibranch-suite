import { useEffect, useState } from "react";
import { ApiService, DashboardStatsResponse } from "./services/api";

export type CriticalBatchAlert = {
  batch: string;
  name: string;
  exp: string;
  days: number;
  stock: number;
  supplier?: string;
};

export type DashboardReorderRequest = {
  name: string;
  batch: string;
  supplier: string;
};

export interface DashboardProps {
  selectedBranchId: number;
  role?: string;
  onReorderClick?: (medicineName: string, supplier: string) => void;
}

export function useDashboardStats(selectedBranchId: number, lowStockThreshold = 10, expiryWarningDays = 90) {
  const [stats, setStats] = useState<DashboardStatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ApiService.getDashboardStats(selectedBranchId, lowStockThreshold, expiryWarningDays).then((response) => {
      if (active) {
        setStats(response.status === "success" ? response.data ?? null : null);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [selectedBranchId, lowStockThreshold, expiryWarningDays]);

  return { stats, loading };
}

type DashboardCriticalBatchAlertsProps = DashboardProps & {
  alerts?: CriticalBatchAlert[];
  isViewer?: boolean;
  onReorder?: (request: DashboardReorderRequest) => void;
};

function alertStyle(days: number) {
  return days <= 30
    ? { bg: "#FEF2F2", text: "#DC2626", label: "Urgent" }
    : { bg: "#FEF3C7", text: "#D97706", label: "Monitor" };
}

export default function DashboardCriticalBatchAlerts({
  selectedBranchId,
  role,
  onReorderClick,
  alerts,
  isViewer = false,
  onReorder,
}: DashboardCriticalBatchAlertsProps) {
  if (role === "Viewer") {
    return <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "34px 28px", textAlign: "center", color: "#64748B" }}>Unauthorized Access</div>;
  }
  const { stats } = useDashboardStats(selectedBranchId);
  const dynamicAlerts = (stats?.critical_batches ?? []).map((item) => ({
    batch: item.batch_number,
    name: item.brand_name,
    exp: item.expiry_date,
    days: Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000),
    stock: Number(item.stock_quantity) || 0,
    supplier: item.supplier_name || "Standard Supplier",
  }));
  const visibleAlerts = stats ? dynamicAlerts : alerts ?? [];

  return (
    <div style={{ background: "white", border: "1.5px solid #E2E8F0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Critical Batch Alerts</div><div style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>Expiry &amp; low stock</div></div>
        <span style={{ fontSize: 11.5, background: "#FEE2E2", color: "#DC2626", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>{visibleAlerts.length} items</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: "#F8FAFC" }}>{["Batch", "Medicine", "Expiry", "Stock", ""].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}</tr></thead>
        <tbody>{visibleAlerts.length === 0 ? <tr><td colSpan={5} style={{ padding: "28px 14px", textAlign: "center", color: "#94A3B8" }}>No critical alerts</td></tr> : visibleAlerts.map(alert => {
          const status = alertStyle(alert.days);
          const supplier = alert.supplier ?? "N/A";
          return <tr key={alert.batch} style={{ borderTop: "1px solid #F1F5F9" }}>
            <td style={{ padding: "9px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: "#64748B" }}>{alert.batch}</td>
            <td style={{ padding: "9px 14px", fontWeight: 500, color: "#1E293B", fontSize: 12.5 }}>{alert.name}</td>
            <td style={{ padding: "9px 14px" }}><div style={{ fontSize: 12, color: "#475569" }}>{alert.exp}</div><span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 99, fontWeight: 600, background: status.bg, color: status.text }}>{alert.days}d · {status.label}</span></td>
            <td style={{ padding: "9px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: alert.stock < 15 ? "#DC2626" : "#334155" }}>{alert.stock}</td>
            <td style={{ padding: "9px 14px" }}>{!isViewer && <button onClick={() => { onReorderClick?.(alert.name, supplier); onReorder?.({ name: alert.name, batch: alert.batch, supplier }); }} style={{ padding: "5px 11px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#4F46E5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reorder</button>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}
