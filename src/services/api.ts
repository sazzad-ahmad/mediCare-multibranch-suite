const BASE_URL = "http://medicare-api.42web.io/api";

export interface DashboardStatsResponse {
  status: "success" | "error";
  branch_id?: number;
  data?: {
    today_sales: number;
    total_medicines: number;
    low_stock_count: number;
    near_expiry_count: number;
    critical_batches: Array<{
      batch_id: number;
      batch_number: string;
      brand_name: string;
      stock_quantity: number;
      expiry_date: string;
      supplier_name: string | null;
    }>;
  };
  message?: string;
}

export interface AnalyticsResponse {
  status: "success" | "error";
  data?: {
    summary: {
      revenue: number;
      profit: number;
      orders: number;
      retention: number;
    };
    trend: Array<{ day: string; sales: number; profit: number }>;
    branches: Array<{ branch: string; revenue: number; profit: number }>;
    payments: Array<{ name: string; value: number; count: number; color: string }>;
    top_medicines: Array<{
      brand: string;
      cost: number;
      sell: number;
      margin: number;
      profit: number;
    }>;
  };
  message?: string;
}

export interface BranchRecord { id: number; name: string; address: string; phone: string; active: boolean; }
export interface SystemPreferences { vat_rate: number; low_stock_threshold: number; expiry_warning_days: number; invoice_footer: string; }
export interface AuditLog { log_id: number; action_type: string; description: string; user_name: string; role: string; created_at: string; }

export const ApiService = {
  async getBranches(): Promise<{ status: string; data?: BranchRecord[]; message?: string }> {
    try { const res = await fetch(`${BASE_URL}/branches/get_branches.php`); const json = await res.json(); return { ...json, data: (json.data ?? []).map((b: any) => ({ id: Number(b.branch_id), name: b.branch_name, address: b.location, phone: b.contact_no, active: Boolean(Number(b.is_active)) })) }; }
    catch { return { status: "error", data: [], message: "Network error" }; }
  },
  async addBranch(data: { branch_name: string; location: string; contact_no: string; actor_name?: string; actor_role?: string }) { return this.postJson("/branches/add_branch.php", data); },
  async deleteBranch(data: { branch_id: number; actor_name?: string; actor_role?: string }) { return this.postJson("/branches/delete_branch.php", data); },
  async toggleBranchStatus(data: { branch_id: number; is_active: boolean; actor_name?: string; actor_role?: string }) { return this.postJson("/branches/toggle_branch_status.php", data); },
  async addStaff(data: { name: string; email: string; password: string; role: "Pharmacist" | "Cashier"; branch_id: number; actor_name?: string; actor_role?: string }) { return this.postJson("/settings/add_staff.php", data); },
  async deleteStaff(data: { user_id: number; actor_name?: string; actor_role?: string }) { return this.postJson("/settings/delete_staff.php", data); },
  async getUsers(): Promise<{ status: string; data?: Array<{ user_id: number; name: string; email: string; role: string; status: "Active" | "Inactive"; branch_id: number; branch_name: string }> }> { try { const res = await fetch(`${BASE_URL}/settings/get_users.php`); return await res.json(); } catch { return { status: "error", data: [] }; } },
  async updateUser(data: { user_id: number; name: string; email?: string; branch_id: number; role: string; status: "Active" | "Inactive"; actor_name?: string; actor_role?: string }) { return this.postJson("/settings/update_user.php", data); },
  async getPreferences(): Promise<{ status: string; data?: Partial<SystemPreferences> }> { try { const res = await fetch(`${BASE_URL}/settings/get_preferences.php`); return await res.json(); } catch { return { status: "error" }; } },
  async savePreferences(data: SystemPreferences & { actor_name?: string; actor_role?: string }) { return this.postJson("/settings/save_preferences.php", data); },
  async getAuditLogs(): Promise<{ status: string; data?: AuditLog[] }> { try { const res = await fetch(`${BASE_URL}/settings/get_audit_logs.php`); return await res.json(); } catch { return { status: "error", data: [] }; } },
  async createBackup(actorName = "System", actorRole = "Admin"): Promise<Response> { const params = new URLSearchParams({ actor_name: actorName, actor_role: actorRole }); return fetch(`${BASE_URL}/settings/backup_db.php?${params.toString()}`); },
  async downloadLastBackup(): Promise<Response> { return fetch(`${BASE_URL}/settings/backup_db.php?action=download_last`); },
  async postJson(path: string, data: unknown) { try { const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return await res.json(); } catch { return { status: "error", message: "Network error" }; } },
  // Inventory medicines fetch
  async getMedicines(branchId: number = 1) {
    try {
      const res = await fetch(`${BASE_URL}/inventory/get_medicines.php?branch_id=${branchId}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getMedicines):", err);
      return { status: "error", data: [] };
    }
  },

  // Login authentication
  async login(email: string, password: string, branchId?: number) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, branch_id: branchId }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (login):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async register(data: { name: string; email: string; password: string; role: "Pharmacist" | "Cashier"; branch_id: number }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (register):", err);
      return { status: "error", message: "Network error" };
    }
  },

  // POS Checkout
  async checkout(orderPayload: any) {
    try {
      const res = await fetch(`${BASE_URL}/pos/checkout.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (checkout):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async getBranchSales(branchId: number) {
    try {
      const res = await fetch(`${BASE_URL}/pos/sales.php?branch_id=${branchId}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getBranchSales):", err);
      return { status: "error", data: [] };
    }
  },

  async getAnalytics(range: string = "last_30_days", branchId: number = 0): Promise<AnalyticsResponse> {
    try {
      const params = new URLSearchParams({ range, branch_id: String(branchId) });
      const res = await fetch(`${BASE_URL}/pos/analytics.php?${params.toString()}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getAnalytics):", err);
      return { status: "error", message: "Network error" };
    }
  },

  // Add a medicine and its branch inventory batch
  async addMedicine(data: any) {
    try {
      const res = await fetch(`${BASE_URL}/inventory/add_medicine.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (addMedicine):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async updateMedicine(data: any) {
    try {
      const res = await fetch(`${BASE_URL}/inventory/update_medicine.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (updateMedicine):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async addSupplier(data: { name: string; contact: string; phone: string; email: string }) {
    try {
      const res = await fetch(`${BASE_URL}/procurement/add_supplier.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (addSupplier):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async receiveProcurementOrder(payload: any) {
    try {
      const res = await fetch(`${BASE_URL}/procurement/receive_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (receiveProcurementOrder):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async receivePO(data: any) {
    try {
      const res = await fetch(`${BASE_URL}/procurement/receive_po.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (receivePO):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async getProcurementOrders() {
    try {
      const res = await fetch(`${BASE_URL}/procurement/orders.php`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getProcurementOrders):", err);
      return { status: "error", data: [] };
    }
  },

  async updateProcurementStatus(poId: number, status: "Approved" | "Ordered" | "Received") {
    try {
      const res = await fetch(`${BASE_URL}/procurement/orders.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", po_id: poId, status }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (updateProcurementStatus):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async receiveAndStockOrder(data: any) {
    try {
      const res = await fetch(`${BASE_URL}/procurement/orders.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "receive_and_stock", ...data }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (receiveAndStockOrder):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async createProcurementOrder(data: any) {
    try {
      const res = await fetch(`${BASE_URL}/procurement/orders.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...data }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (createProcurementOrder):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async receivePurchaseOrder(data: { medicine: string; branch: string; quantity: number }) {
    return this.receiveProcurementOrder(data);
  },

  // Delete a medicine inventory batch
  async deleteMedicine(batchId: number) {
    try {
      const res = await fetch(`${BASE_URL}/inventory/delete_medicine.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (deleteMedicine):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async disposeBatch(batchId: number) {
    try {
      const res = await fetch(`${BASE_URL}/inventory/dispose_batch.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: batchId }),
      });
      return await res.json();
    } catch (err) {
      console.error("API Error (disposeBatch):", err);
      return { status: "error", message: "Network error" };
    }
  },

  async getDashboardStats(branchId: number, lowStockThreshold = 10, expiryWarningDays = 90): Promise<DashboardStatsResponse> {
    try {
      const res = await fetch(`${BASE_URL}/dashboard/get_stats.php?branch_id=${branchId}&low_stock_threshold=${lowStockThreshold}&expiry_warning_days=${expiryWarningDays}`);
      return await res.json();
    } catch (err) {
      console.error("API Error (getDashboardStats):", err);
      return { status: "error", data: { today_sales: 0, total_medicines: 0, low_stock_count: 0, near_expiry_count: 0, critical_batches: [] }, message: "Network error" };
    }
  }
};