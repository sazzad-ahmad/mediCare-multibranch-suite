import { useState, useMemo, useEffect } from "react"
import { ApiService } from "./services/api"

type Product = {
  id: number
  medicineId?: number
  brand: string
  generic: string
  batch: string
  price: number
  stock: number
  category: string
  img: string
}

type CartItem = Product & { qty: number }

const PRODUCTS: Product[] = [
  {
    id: 1,
    brand: "Napa Extra 500mg",
    generic: "Paracetamol",
    batch: "B-01",
    price: 2.5,
    stock: 120,
    category: "Tablets",
    img: "https://images.unsplash.com/photo-1544829894-eb023ba95a38?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 2,
    brand: "Azithro 250mg",
    generic: "Azithromycin",
    batch: "B-07",
    price: 4.8,
    stock: 64,
    category: "Tablets",
    img: "https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 3,
    brand: "Cetimax 10mg",
    generic: "Cetirizine HCl",
    batch: "B-14",
    price: 1.2,
    stock: 210,
    category: "Tablets",
    img: "https://images.unsplash.com/photo-1655913198024-1a30f1c911e5?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 4,
    brand: "Omep 20mg",
    generic: "Omeprazole",
    batch: "B-03",
    price: 3.4,
    stock: 88,
    category: "Capsules",
    img: "https://images.unsplash.com/photo-1562243061-204550d8a2c9?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 5,
    brand: "Amoxil 500mg",
    generic: "Amoxicillin",
    batch: "B-22",
    price: 5.6,
    stock: 47,
    category: "Capsules",
    img: "https://images.unsplash.com/photo-1631669969504-f35518bf96ba?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 6,
    brand: "Tussikof Syrup",
    generic: "Dextromethorphan",
    batch: "B-09",
    price: 3.9,
    stock: 33,
    category: "Syrups",
    img: "https://images.unsplash.com/photo-1635166304271-04931640a450?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 7,
    brand: "Zimax 500mg",
    generic: "Azithromycin",
    batch: "B-18",
    price: 6.2,
    stock: 29,
    category: "Tablets",
    img: "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 8,
    brand: "Insulin Glargine",
    generic: "Insulin Glargine",
    batch: "B-05",
    price: 18.0,
    stock: 14,
    category: "Injections",
    img: "https://images.unsplash.com/photo-1588802060188-ee08afc87823?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 9,
    brand: "Johnson Baby Wash",
    generic: "Baby Cleansing Gel",
    batch: "B-31",
    price: 7.5,
    stock: 55,
    category: "Baby Care",
    img: "https://images.unsplash.com/photo-1544991936-9464fa9919d2?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 10,
    brand: "Metformin 500mg",
    generic: "Metformin HCl",
    batch: "B-11",
    price: 2.1,
    stock: 96,
    category: "Tablets",
    img: "https://images.unsplash.com/photo-1544829894-eb023ba95a38?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 11,
    brand: "Ventolin Inhaler",
    generic: "Salbutamol",
    batch: "B-06",
    price: 9.8,
    stock: 22,
    category: "Injections",
    img: "https://images.unsplash.com/photo-1562243061-204550d8a2c9?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 12,
    brand: "Pedilyte Syrup",
    generic: "ORS + Zinc",
    batch: "B-27",
    price: 4.2,
    stock: 41,
    category: "Syrups",
    img: "https://images.unsplash.com/photo-1700104494908-a08588182134?w=200&h=200&fit=crop&auto=format",
  },
]

const CATEGORIES = [
  "All",
  "Tablets",
  "Capsules",
  "Syrups",
  "Injections",
  "Baby Care",
]
const BRANCHES = [
  { id: 0, name: "All Branches" },
  { id: 1, name: "MediCare - Dhanmondi Branch" },
  { id: 2, name: "MediCare - UIU Madani Branch" },
  { id: 3, name: "MediCare - Uttara Sector 7" },
] as const
const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "mfs", label: "bKash / Nagad", icon: "📱" },
  { id: "card", label: "Card", icon: "💳" },
]
const VAT_RATE = 0.05

type SaleItem = {
  brand_name: string
  generic_name: string
  batch_number: string
  quantity: number
  unit_price: number
  item_subtotal: number
  category_name: string
}

type Sale = {
  order_id: number
  invoice_number: string
  branch_id: number
  order_date: string
  customer_name: string
  cashier_name: string
  branch_name: string
  location: string
  subtotal: number
  discount: number
  vat: number
  paid_amount: number
  payment_method: string
  items: SaleItem[]
}

type SalesApiRow = {
  order_id: number | string
  invoice_number: string
  branch_id: number | string
  order_date: string
  customer_name?: string
  cashier_name?: string
  branch_name?: string
  location?: string
  subtotal: number | string
  discount: number | string
  vat: number | string
  paid_amount: number | string
  payment_method: string
  brand_name: string
  generic_name: string
  batch_number: string
  quantity: number | string
  unit_price: number | string
  item_subtotal: number | string
  category_name: string
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function ScanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 12h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
function PrintIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="6"
        y="14"
        width="12"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}
function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AdminSalesAudit({ selectedBranchId }: { selectedBranchId: number }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("latest")
  const [branchId, setBranchId] = useState(0)
  const [branchSort, setBranchSort] = useState<"asc" | "desc">("asc")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  useEffect(() => {
    let active = true
    async function loadSales() {
      setLoading(true)
      setError("")
      const response = await ApiService.getBranchSales(0)
      if (!active) return
      if (response.status !== "success" || !Array.isArray(response.data)) {
        setSales([])
        setError(response.message || "Unable to load branch sales.")
        setLoading(false)
        return
      }
      const grouped = new Map<number, Sale>()
      response.data.forEach((row: SalesApiRow) => {
        const orderId = Number(row.order_id)
        const sale = grouped.get(orderId) ?? {
          order_id: orderId,
          invoice_number: row.invoice_number,
          branch_id: Number(row.branch_id),
          order_date: row.order_date,
          customer_name: row.customer_name || "Walk-in Customer",
          cashier_name: row.cashier_name || "Unknown cashier",
          branch_name: row.branch_name || "Selected branch",
          location: row.location || "Location unavailable",
          subtotal: Number(row.subtotal),
          discount: Number(row.discount),
          vat: Number(row.vat),
          paid_amount: Number(row.paid_amount),
          payment_method: row.payment_method,
          items: [],
        }
        sale.items.push({
          brand_name: row.brand_name,
          generic_name: row.generic_name,
          batch_number: row.batch_number,
          quantity: Number(row.quantity),
          unit_price: Number(row.unit_price),
          item_subtotal: Number(row.item_subtotal),
          category_name: row.category_name,
        })
        grouped.set(orderId, sale)
      })
      setSales(Array.from(grouped.values()))
      setLoading(false)
    }
    loadSales()
    return () => {
      active = false
    }
  }, [selectedBranchId])

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sales
      .filter((sale) => {
        const branchMatch = branchId === 0 || sale.branch_id === branchId
        const categoryMatch =
          category === "All" ||
          sale.items.some((item) => item.category_name === category)
        const searchMatch =
          !query ||
          [
            sale.customer_name,
            sale.invoice_number,
            ...sale.items.map((item) => item.brand_name),
          ].some((value) => value.toLowerCase().includes(query))
        return branchMatch && categoryMatch && searchMatch
      })
      .sort((a, b) =>
        sort === "highest"
          ? b.paid_amount - a.paid_amount
          : sort === "lowest"
            ? a.paid_amount - b.paid_amount
            : sort === "oldest"
              ? new Date(a.order_date).getTime() -
                new Date(b.order_date).getTime()
              : sort === "branch"
                ? branchSort === "asc"
                  ? a.branch_name.localeCompare(b.branch_name)
                  : b.branch_name.localeCompare(a.branch_name)
                : new Date(b.order_date).getTime() -
                  new Date(a.order_date).getTime(),
      )
  }, [sales, search, category, sort, branchId, branchSort])

  const today = new Date().toDateString()
  const scopedSales = sales.filter(
    (sale) => branchId === 0 || sale.branch_id === branchId,
  )
  const todaySales = scopedSales.filter(
    (sale) => new Date(sale.order_date).toDateString() === today,
  )
  const revenue = todaySales.reduce((sum, sale) => sum + sale.paid_amount, 0)
  const itemCounts = scopedSales
    .flatMap((sale) => sale.items)
    .reduce<Record<string, number>>((counts, item) => {
      counts[item.brand_name] = (counts[item.brand_name] || 0) + item.quantity
      return counts
    }, {})
  const topMedicine = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]
  const branchName =
    branchId === 0
      ? "All Branches"
      : BRANCHES.find((branch) => branch.id === branchId)?.name ||
        `Branch ${branchId}`
  const money = (value: number) => `$${value.toFixed(2)}`
  const dateTime = (value: string) =>
    new Date(value).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    })

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        overflow: "auto",
        background: "#F8FAFC",
        color: "#0F172A",
      }}
    >
      <div
        style={{ padding: "28px 30px 36px", maxWidth: 1600, margin: "0 auto" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            marginBottom: 22,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#4F46E5",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Admin terminal / branch audit
            </div>
            <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800 }}>
              Sales Audit &amp; Receipt Register
            </h1>
            <div style={{ color: "#64748B", fontSize: 13.5 }}>
              {branchName} · Itemized transaction history
            </div>
          </div>
          <div
            style={{
              color: "#64748B",
              fontSize: 12.5,
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
              padding: "9px 12px",
              borderRadius: 9,
            }}
          >
            Live enterprise scope · {branchName}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Today's Branch Revenue",
              value: money(revenue),
              note: `${todaySales.length} invoice${
                todaySales.length === 1 ? "" : "s"
              }`,
            },
            {
              label: "Invoices / Customers Served",
              value: String(todaySales.length),
              note: "Today",
            },
            {
              label: "Top Selling Medicine",
              value: topMedicine ? topMedicine[0] : "No sales yet",
              note: topMedicine
                ? `${topMedicine[1]} units sold`
                : "Branch history",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "#0F1729",
                borderRadius: 10,
                padding: "18px 20px",
                color: "white",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  color: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  marginTop: 10,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {card.value}
              </div>
              <div style={{ color: "#34D399", fontSize: 12, marginTop: 5 }}>
                {card.note}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, invoice, or medicine"
            style={{
              flex: "1 1 240px",
              minWidth: 220,
              padding: "10px 12px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              font: "inherit",
              fontSize: 13,
              outline: "none",
            }}
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            style={{
              padding: "10px 30px 10px 12px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              font: "inherit",
              fontSize: 13,
              background: "white",
            }}
          >
            <option value="latest">Sort by Time: Latest first</option>
            <option value="oldest">Sort by Time: Oldest first</option>
            <option value="highest">Sort by Bill: Highest first</option>
            <option value="lowest">Sort by Bill: Lowest first</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{
              padding: "10px 30px 10px 12px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              font: "inherit",
              fontSize: 13,
              background: "white",
            }}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "Category: All" : item}
              </option>
            ))}
          </select>
          <select
            value={branchId}
            onChange={(event) => setBranchId(Number(event.target.value))}
            style={{
              padding: "10px 30px 10px 12px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              font: "inherit",
              fontSize: 13,
              background: "white",
            }}
          >
            {BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            overflow: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748B" }}>
              Loading branch transactions...
            </div>
          ) : error ? (
            <div style={{ padding: 60, textAlign: "center", color: "#DC2626" }}>
              {error}
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1180,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  {[
                    "Time & Date",
                    "Invoice / Receipt #",
                    "Customer Name & Type",
                    "Branch & Staff",
                    "Medicines Sold",
                    "Category",
                    "Payment Method",
                    "Total Bill",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "#64748B",
                        fontSize: 10.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading === "Branch & Staff" ? (
                        <button
                          onClick={() => {
                            setSort("branch")
                            setBranchSort((current) =>
                              current === "asc" ? "desc" : "asc",
                            )
                          }}
                          style={{
                            border: 0,
                            background: "transparent",
                            padding: 0,
                            color: "inherit",
                            font: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          Branch &amp; Staff{" "}
                          {sort === "branch"
                            ? branchSort === "asc"
                              ? "A-Z"
                              : "Z-A"
                            : "A-Z"}
                        </button>
                      ) : (
                        heading
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.order_id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      verticalAlign: "top",
                    }}
                  >
                    <td
                      style={{
                        padding: 14,
                        color: "#475569",
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dateTime(sale.order_date)}
                    </td>
                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                        color: "#4F46E5",
                        fontSize: 12.5,
                        fontWeight: 700,
                      }}
                    >
                      {sale.invoice_number}
                    </td>
                    <td style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {sale.customer_name}
                      </div>
                      <div
                        style={{
                          color: "#94A3B8",
                          fontSize: 11.5,
                          marginTop: 3,
                        }}
                      >
                        {sale.customer_name === "Walk-in Customer"
                          ? "Walk-in Customer"
                          : "Registered customer"}
                      </div>
                    </td>
                    <td style={{ padding: 14, minWidth: 190 }}>
                      <div
                        style={{
                          display: "inline-block",
                          background: "#EEF2FF",
                          color: "#4338CA",
                          borderRadius: 5,
                          padding: "4px 7px",
                          fontSize: 11.5,
                        }}
                      >
                        {sale.branch_name}
                      </div>
                      <div
                        style={{
                          color: "#475569",
                          fontSize: 11.5,
                          marginTop: 5,
                        }}
                      >
                        {sale.cashier_name}
                      </div>
                      <div
                        style={{
                          color: "#94A3B8",
                          fontSize: 10.5,
                          marginTop: 2,
                        }}
                      >
                        {sale.location}
                      </div>
                    </td>
                    <td style={{ padding: 14, maxWidth: 220 }}>
                      {sale.items.map((item) => (
                        <span
                          key={`${item.batch_number}-${item.brand_name}`}
                          style={{
                            display: "inline-block",
                            background: "#EEF2FF",
                            color: "#4338CA",
                            borderRadius: 5,
                            padding: "4px 7px",
                            margin: "0 4px 4px 0",
                            fontSize: 11.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.brand_name} x {item.quantity}
                        </span>
                      ))}
                    </td>
                    <td
                      style={{ padding: 14, color: "#475569", fontSize: 12.5 }}
                    >
                      {[
                        ...new Set(
                          sale.items.map((item) => item.category_name),
                        ),
                      ].join(", ")}
                    </td>
                    <td
                      style={{ padding: 14, color: "#475569", fontSize: 12.5 }}
                    >
                      {sale.payment_method}
                    </td>
                    <td
                      style={{
                        padding: 14,
                        fontFamily: "monospace",
                        fontWeight: 800,
                        color: "#0F172A",
                      }}
                    >
                      {money(sale.paid_amount)}
                    </td>
                    <td style={{ padding: 14 }}>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        style={{
                          border: "1px solid #C7D2FE",
                          background: "#EEF2FF",
                          color: "#4338CA",
                          borderRadius: 7,
                          padding: "7px 10px",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 11.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !error && filteredSales.length === 0 && (
            <div
              style={{
                padding: 50,
                textAlign: "center",
                color: "#64748B",
                fontSize: 13,
              }}
            >
              No transactions match the current filters.
            </div>
          )}
        </div>
      </div>
      {selectedSale && (
        <div
          onClick={() => setSelectedSale(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "white",
              width: 720,
              maxWidth: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: 12,
              padding: 24,
              color: "#0F172A",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
                borderBottom: "1px solid #E2E8F0",
                paddingBottom: 16,
              }}
            >
              <div>
                <div
                  style={{ color: "#4F46E5", fontWeight: 800, fontSize: 16 }}
                >
                  {selectedSale.branch_name}
                </div>
                <div style={{ color: "#64748B", fontSize: 12.5, marginTop: 5 }}>
                  {selectedSale.invoice_number} ·{" "}
                  {dateTime(selectedSale.order_date)}
                </div>
                <div style={{ color: "#64748B", fontSize: 12.5, marginTop: 3 }}>
                  Served by {selectedSale.cashier_name}
                </div>
                <div style={{ color: "#64748B", fontSize: 12.5, marginTop: 3 }}>
                  Location: {selectedSale.location}
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                style={{
                  alignSelf: "flex-start",
                  border: "none",
                  background: "#F1F5F9",
                  borderRadius: 7,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "#475569",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ margin: "18px 0" }}>
              <div style={{ color: "#64748B", fontSize: 12, marginBottom: 8 }}>
                Customer:{" "}
                <strong style={{ color: "#0F172A" }}>
                  {selectedSale.customer_name}
                </strong>
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12.5,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    {[
                      "Medicine / Generic",
                      "Batch",
                      "Unit Price",
                      "Qty",
                      "Subtotal",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "8px 5px",
                          textAlign: "left",
                          color: "#64748B",
                          fontSize: 10.5,
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item) => (
                    <tr
                      key={`${item.batch_number}-${item.brand_name}`}
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                    >
                      <td style={{ padding: "10px 5px" }}>
                        <strong>{item.brand_name}</strong>
                        <div style={{ color: "#94A3B8", fontSize: 11 }}>
                          {item.generic_name}
                        </div>
                      </td>
                      <td
                        style={{ padding: "10px 5px", fontFamily: "monospace" }}
                      >
                        {item.batch_number}
                      </td>
                      <td style={{ padding: "10px 5px" }}>
                        {money(item.unit_price)}
                      </td>
                      <td style={{ padding: "10px 5px" }}>{item.quantity}</td>
                      <td style={{ padding: "10px 5px", fontWeight: 700 }}>
                        {money(item.item_subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                marginLeft: "auto",
                maxWidth: 260,
                borderTop: "1px solid #E2E8F0",
                paddingTop: 12,
                fontSize: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 7,
                }}
              >
                <span>Subtotal</span>
                <span>{money(selectedSale.subtotal)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 7,
                  color: "#DC2626",
                }}
              >
                <span>Discount</span>
                <span>-{money(selectedSale.discount)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 7,
                }}
              >
                <span>VAT</span>
                <span>{money(selectedSale.vat)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px dashed #CBD5E1",
                  paddingTop: 9,
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                <span>Net Payable</span>
                <span style={{ color: "#4F46E5" }}>
                  {money(selectedSale.paid_amount)}
                </span>
              </div>
              <div style={{ color: "#64748B", marginTop: 9 }}>
                Payment mode:{" "}
                <strong style={{ color: "#0F172A" }}>
                  {selectedSale.payment_method}
                </strong>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 22,
              }}
            >
              <button
                onClick={() => window.print()}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  background: "#0F1729",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Print Duplicate Memo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function POS({
  selectedBranchId = 1,
  userId = 1,
  role = "Admin",
  vatRate = 5,
}: {
  selectedBranchId?: number
  userId?: number
  role?: "Admin" | "Pharmacist" | "Cashier" | "Viewer"
  vatRate?: number
}) {
  const canOperate = role === "Cashier" || role === "Pharmacist"
  if (role === "Admin")
    return <AdminSalesAudit selectedBranchId={selectedBranchId} />
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<string>("0")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [customer, setCustomer] = useState("walk-in")
  const [orderDone, setOrderDone] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutError, setCheckoutError] = useState("")
  const [receipt, setReceipt] = useState<{
    invoiceId: number
    total: number
  } | null>(null)

  useEffect(() => {
    let active = true
    async function loadProducts() {
      setLoading(true)
      const response = await ApiService.getMedicines(selectedBranchId)
      if (
        active &&
        response.status === "success" &&
        Array.isArray(response.data)
      ) {
        setProducts(
          response.data.map((item: any) => ({
            id: Number(item.id),
            medicineId: Number(item.medicine_id),
            brand: item.brand,
            generic: item.generic,
            batch: item.batch,
            price: Number(item.sellPrice),
            stock: Number(item.stock),
            category: item.category,
            img: item.img,
          })),
        )
      }
      if (active) setLoading(false)
    }
    loadProducts()
    return () => {
      active = false
    }
  }, [selectedBranchId])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.brand.toLowerCase().includes(q) ||
        p.generic.toLowerCase().includes(q) ||
        p.batch.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, activeCategory, products])

  function addToCart(p: Product) {
    if (!canOperate) return
    setCart((prev) => {
      const existing = prev.find((c) => c.id === p.id)
      if (existing)
        return prev.map((c) =>
          c.id === p.id ? { ...c, qty: Math.min(c.qty + 1, p.stock) } : c,
        )
      return [...prev, { ...p, qty: 1 }]
    })
    setOrderDone(false)
  }

  function updateQty(id: number, delta: number) {
    if (!canOperate) return
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c,
        )
        .filter((c) => c.qty > 0),
    )
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((c) => c.id !== id))
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const discountAmt = subtotal * (parseFloat(discount || "0") / 100)
  const afterDiscount = subtotal - discountAmt
  const vatAmt = afterDiscount * (vatRate / 100)
  const netPayable = afterDiscount + vatAmt

  async function completeOrder() {
    if (!canOperate || cart.length === 0 || orderDone) return
    setOrderDone(true)
    setCheckoutError("")
    const response = await ApiService.checkout({
      branch_id: selectedBranchId,
      user_id: userId,
      customer_name: customer === "walk-in" ? "Walk-in Customer" : customer,
      subtotal,
      discount: discountAmt,
      vat: vatAmt,
      total_amount: netPayable,
      payment_method:
        paymentMethod === "mfs"
          ? "bKash"
          : paymentMethod === "card"
            ? "Card"
            : "Cash",
      items: cart.map((item) => ({
        batch_id: item.id,
        medicine_id: item.medicineId ?? item.id,
        quantity: item.qty,
        unit_price: item.price,
        subtotal: item.price * item.qty,
      })),
    })

    if (response.status === "success") {
      setReceipt({ invoiceId: Number(response.invoice_id), total: netPayable })
      setCart([])
      setDiscount("0")
      const refreshed = await ApiService.getMedicines(selectedBranchId)
      if (refreshed.status === "success" && Array.isArray(refreshed.data)) {
        setProducts(
          refreshed.data.map((item: any) => ({
            id: Number(item.id),
            medicineId: Number(item.medicine_id),
            brand: item.brand,
            generic: item.generic,
            batch: item.batch,
            price: Number(item.sellPrice),
            stock: Number(item.stock),
            category: item.category,
            img: item.img,
          })),
        )
      }
    } else {
      setCheckoutError(response.message || "Unable to complete checkout.")
    }
    setOrderDone(false)
  }

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "#F8FAFC",
      }}
    >
      {role === "Admin" && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 260,
            right: 0,
            zIndex: 15,
            padding: "10px 20px",
            background: "#FEF3C7",
            color: "#92400E",
            borderBottom: "1px solid #FCD34D",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          🔒 Admin View Mode: Cash register &amp; order processing is restricted
          to Cashiers/Pharmacists.
        </div>
      )}

      {/* ── LEFT: Product Catalog (60%) ── */}
      <div
        style={{
          flex: "0 0 60%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        {/* Search + Scan bar */}
        <div
          style={{
            padding: "18px 24px 14px",
            background: "white",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 20 20"
                fill="none"
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                }}
              >
                <circle
                  cx="9"
                  cy="9"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M13.5 13.5L17 17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine by brand, generic, or barcode…"
                style={{
                  width: "100%",
                  paddingLeft: 38,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  background: "#F1F5F9",
                  border: "1.5px solid transparent",
                  borderRadius: 11,
                  fontSize: 13.5,
                  color: "#334155",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#A5B4FC"
                  e.target.style.background = "white"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "transparent"
                  e.target.style.background = "#F1F5F9"
                }}
              />
            </div>
            <button
              disabled={!canOperate}
              title={
                !canOperate
                  ? "Admin View Mode: checkout is restricted to Cashiers and Pharmacists."
                  : "Scan Barcode"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #4F46E5, #6366F1)",
                color: "white",
                border: "none",
                borderRadius: 11,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: canOperate ? "pointer" : "not-allowed",
                opacity: canOperate ? 1 : 0.55,
                fontFamily: "inherit",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
              }}
            >
              <ScanIcon />
              Scan Barcode
            </button>
          </div>

          {/* Category filters */}
          <div
            style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}
          >
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 99,
                    border: "1.5px solid",
                    borderColor: active ? "#4F46E5" : "#E2E8F0",
                    background: active ? "#EEF2FF" : "white",
                    color: active ? "#4F46E5" : "#64748B",
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.13s",
                  }}
                >
                  {cat}
                </button>
              )
            })}
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#94A3B8",
                alignSelf: "center",
              }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Product Grid — 16px gap, fixed 220px cards */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 16,
            alignContent: "start",
            boxSizing: "border-box",
          }}
        >
          {loading && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "60px 0",
                color: "#94A3B8",
              }}
            >
              Loading medicines...
            </div>
          )}
          {filtered.map((p) => {
            const inCart = cart.find((c) => c.id === p.id)
            return (
              /* Card Frame: vertical auto-layout, fixed 220px, min-height 260px, clip, white, #E2E8F0 stroke, 8px radius */
              <div
                key={p.id}
                style={{
                  width: "100%",
                  minHeight: 260,
                  boxSizing: "border-box",
                  background: "white",
                  border: `1px solid ${inCart ? "#C7D2FE" : "#E2E8F0"}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                  boxShadow: inCart
                    ? "0 0 0 3px rgba(79,70,229,0.08)"
                    : "0 1px 3px rgba(15,23,42,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(15,23,42,0.1)"
                  e.currentTarget.style.borderColor = inCart
                    ? "#A5B4FC"
                    : "#CBD5E1"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = inCart
                    ? "0 0 0 3px rgba(79,70,229,0.08)"
                    : "0 1px 3px rgba(15,23,42,0.06)"
                  e.currentTarget.style.borderColor = inCart
                    ? "#C7D2FE"
                    : "#E2E8F0"
                }}
              >
                {/* Thumbnail: fill width, fixed 100px height, cover */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 100,
                    flexShrink: 0,
                    overflow: "hidden",
                    background: "#F1F5F9",
                  }}
                >
                  <img
                    src={p.img}
                    alt={p.brand}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {/* Batch badge — dark translucent pill, top-left */}
                  <span
                    style={{
                      position: "absolute",
                      top: 7,
                      left: 7,
                      background: "rgba(15,23,42,0.7)",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 99,
                      fontFamily: "'JetBrains Mono', monospace",
                      backdropFilter: "blur(4px)",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.batch}
                  </span>
                  {inCart && (
                    <div
                      style={{
                        position: "absolute",
                        top: 7,
                        right: 7,
                        background: "#4F46E5",
                        color: "white",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 1px 4px rgba(79,70,229,0.5)",
                      }}
                    >
                      {inCart.qty}
                    </div>
                  )}
                </div>

                {/* Card Body: vertical auto-layout, fill width, flex 1, padding 12px, gap 6px */}
                <div
                  style={{
                    flex: 1,
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    overflow: "hidden",
                  }}
                >
                  {/* Brand Name: 14px bold, dark slate, single line truncate */}
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#1E293B",
                      lineHeight: "20px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.brand}
                  </div>

                  {/* Generic Name: 11.5px regular, muted #64748B, single line truncate */}
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 400,
                      color: "#64748B",
                      lineHeight: "16px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.generic}
                  </div>

                  {/* Meta Row: horizontal, space-between */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    {/* Price: 14px bold */}
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0D9488",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ${p.price.toFixed(2)}
                    </span>
                    {/* Stock tag: 11px pill */}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: p.stock > 0 ? "#ECFDF5" : "#FEF2F2",
                        color: p.stock > 0 ? "#059669" : "#DC2626",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        lineHeight: "16px",
                      }}
                    >
                      {p.stock > 0 ? `In Stock: ${p.stock}` : "Out of Stock"}
                    </span>
                  </div>

                  {/* Spacer pushes button to bottom */}
                  <div style={{ flex: 1, minHeight: 4 }} />

                  {/* Bottom Button: fill width, 34px, #EEF2FF fill, #C7D2FE stroke, 6px radius, #4F46E5 text */}
                  <button
                    onClick={() => addToCart(p)}
                    disabled={!canOperate || p.stock === 0}
                    title={
                      !canOperate
                        ? "Admin View Mode: adding items is restricted."
                        : p.stock === 0
                          ? "Out of stock"
                          : "Add to Cart"
                    }
                    style={{
                      width: "100%",
                      height: 34,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      borderRadius: 6,
                      border: `1px solid ${
                        p.stock === 0 ? "#E2E8F0" : "#C7D2FE"
                      }`,
                      background: p.stock === 0 ? "#F8FAFC" : "#EEF2FF",
                      color: p.stock === 0 ? "#94A3B8" : "#4F46E5",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor:
                        !canOperate || p.stock === 0
                          ? "not-allowed"
                          : "pointer",
                      opacity: canOperate ? 1 : 0.55,
                      fontFamily: "inherit",
                      transition: "background 0.13s, border-color 0.13s",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (p.stock > 0) {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          "#E0E7FF"
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          "#A5B4FC"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p.stock > 0) {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          "#EEF2FF"
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                          "#C7D2FE"
                      }
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M10 4v12M4 10h12"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    {inCart ? "Add More" : "Add to Cart"}
                  </button>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "60px 0",
                color: "#94A3B8",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                No medicines found
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Try a different search or category
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart & Billing (40%) ── */}
      <div
        style={{
          flex: "0 0 40%",
          display: "flex",
          flexDirection: "column",
          background: "white",
          overflow: "hidden",
          boxShadow: "-4px 0 24px rgba(15,23,42,0.04)",
        }}
      >
        {/* Cart Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              Cart
              {cart.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#4F46E5",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 8px",
                    borderRadius: 99,
                    verticalAlign: "middle",
                  }}
                >
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{
                  background: "none",
                  border: "none",
                  color: "#EF4444",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Customer Selector */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
              }}
            >
              <UserIcon />
            </span>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: 32,
                paddingRight: 32,
                paddingTop: 9,
                paddingBottom: 9,
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 10,
                fontSize: 13,
                color: "#334155",
                outline: "none",
                fontFamily: "inherit",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="walk-in">Walk-in Customer</option>
              <option value="01711123456">01711-123456 — Rafiq Hossain</option>
              <option value="01855987654">01855-987654 — Nadia Islam</option>
              <option value="01922334411">01922-334411 — Karim Uddin</option>
            </select>
            <span
              style={{
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            >
              <ChevronDown />
            </span>
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {cart.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "#CBD5E1",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                style={{ margin: "0 auto 12px", display: "block" }}
              >
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 6h18M16 10a4 4 0 01-8 0"
                  stroke="#E2E8F0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#94A3B8" }}>
                Your cart is empty
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4, color: "#CBD5E1" }}>
                Add medicines from the catalog
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <th
                    style={{
                      padding: "10px 14px 10px 22px",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: "left",
                    }}
                  >
                    Medicine
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: "center",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      padding: "10px 8px",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: "right",
                    }}
                  >
                    Total
                  </th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #F8FAFC" }}
                  >
                    <td style={{ padding: "12px 8px 12px 22px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#1E293B",
                        }}
                      >
                        {item.brand}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}
                      >
                        ${item.price.toFixed(2)} / unit
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0,
                          background: "#F8FAFC",
                          borderRadius: 9,
                          border: "1px solid #E2E8F0",
                          overflow: "hidden",
                        }}
                      >
                        <button
                          disabled={!canOperate}
                          title={
                            !canOperate
                              ? "Admin View Mode: quantity changes are restricted."
                              : "Decrease quantity"
                          }
                          onClick={() => updateQty(item.id, -1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "none",
                            border: "none",
                            cursor: canOperate ? "pointer" : "not-allowed",
                            color: "#64748B",
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "inherit",
                            opacity: canOperate ? 1 : 0.45,
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            width: 28,
                            textAlign: "center",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0F172A",
                          }}
                        >
                          {item.qty}
                        </span>
                        <button
                          disabled={!canOperate || item.qty >= item.stock}
                          title={
                            !canOperate
                              ? "Admin View Mode: quantity changes are restricted."
                              : "Increase quantity"
                          }
                          onClick={() => updateQty(item.id, 1)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "none",
                            border: "none",
                            cursor: canOperate ? "pointer" : "not-allowed",
                            color: "#64748B",
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "inherit",
                            opacity: canOperate ? 1 : 0.45,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "right",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0F172A",
                      }}
                    >
                      ${(item.price * item.qty).toFixed(2)}
                    </td>
                    <td style={{ paddingRight: 14 }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#CBD5E1",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          transition: "color 0.13s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#EF4444")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLButtonElement).style.color =
                            "#CBD5E1")
                        }
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Billing Summary */}
        <div
          style={{
            borderTop: "1px solid #E2E8F0",
            padding: "16px 22px",
            flexShrink: 0,
          }}
        >
          {/* Discount row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, color: "#64748B" }}>Subtotal</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "#334155",
              }}
            >
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Discount</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  disabled={!canOperate}
                  title={
                    !canOperate
                      ? "Admin View Mode: discounts are restricted."
                      : "Discount percentage"
                  }
                  style={{
                    width: 48,
                    padding: "3px 6px",
                    border: "none",
                    background: "none",
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#334155",
                    outline: "none",
                    textAlign: "right",
                    cursor: canOperate ? "text" : "not-allowed",
                    opacity: canOperate ? 1 : 0.5,
                  }}
                />
                <span
                  style={{
                    padding: "3px 8px 3px 2px",
                    fontSize: 12,
                    color: "#94A3B8",
                    fontWeight: 600,
                  }}
                >
                  %
                </span>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "#EF4444",
              }}
            >
              −${discountAmt.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px dashed #E2E8F0",
            }}
          >
            <span style={{ fontSize: 13, color: "#64748B" }}>VAT ({vatRate}%)</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "#334155",
              }}
            >
              +${vatAmt.toFixed(2)}
            </span>
          </div>

          {/* Net Payable */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Net Payable
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#4F46E5",
                letterSpacing: "-0.02em",
              }}
            >
              ${netPayable.toFixed(2)}
            </span>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Payment Method
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: `1.5px solid ${active ? "#4F46E5" : "#E2E8F0"}`,
                      background: active ? "#EEF2FF" : "#F8FAFC",
                      color: active ? "#4F46E5" : "#64748B",
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      transition: "all 0.13s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{ fontSize: 11 }}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {checkoutError && (
            <div style={{ color: "#DC2626", fontSize: 12.5, marginBottom: 10 }}>
              {checkoutError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={completeOrder}
            disabled={!canOperate || cart.length === 0}
            title={
              !canOperate
                ? "Admin View Mode: checkout is restricted to Cashiers and Pharmacists."
                : "Complete order"
            }
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background:
                cart.length === 0
                  ? "#E2E8F0"
                  : orderDone
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : "linear-gradient(135deg, #4F46E5 0%, #0D9488 100%)",
              color: cart.length === 0 ? "#94A3B8" : "white",
              fontSize: 14,
              fontWeight: 700,
              cursor:
                !canOperate || cart.length === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow:
                cart.length === 0 ? "none" : "0 4px 16px rgba(79,70,229,0.3)",
              transition: "all 0.2s",
            }}
          >
            {orderDone ? (
              <>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10l4.5 4.5L16 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Order Complete!
              </>
            ) : (
              <>
                <PrintIcon />
                Complete Order & Print Invoice
              </>
            )}
          </button>
        </div>
      </div>
      {receipt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 18,
              width: 420,
              maxWidth: "92vw",
              padding: "24px",
              boxShadow: "0 24px 80px rgba(15,23,42,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  Invoice Completed
                </div>
                <div style={{ color: "#94A3B8", fontSize: 12.5, marginTop: 3 }}>
                  Sale #{receipt.invoiceId}
                </div>
              </div>
              <span
                style={{
                  background: "#DCFCE7",
                  color: "#15803D",
                  padding: "4px 10px",
                  borderRadius: 99,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                Completed
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderTop: "1px solid #F1F5F9",
                borderBottom: "1px solid #F1F5F9",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#64748B" }}>Total paid</span>
              <strong style={{ color: "#4F46E5" }}>
                ${receipt.total.toFixed(2)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setReceipt(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "1.5px solid #E2E8F0",
                  background: "white",
                  color: "#64748B",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "none",
                  background: "linear-gradient(135deg,#4F46E5,#0D9488)",
                  color: "white",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <PrintIcon /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
