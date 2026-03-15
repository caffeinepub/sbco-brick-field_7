import { ArrowLeft, MapPin, Phone, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { LocalOrder, getLocalOrders } from "./localOrderStore";

interface DueCustomer {
  customerName: string;
  invoiceNo: string;
  phone: string;
  address: string;
  totalDue: number;
}

function buildDueList(): DueCustomer[] {
  const orders = getLocalOrders();
  // Group by customer name, sum up due amounts
  const map = new Map<string, DueCustomer>();
  for (const order of orders) {
    if (order.dueAmount > 0) {
      const key = order.customerName.toLowerCase().trim();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.totalDue += order.dueAmount;
        // Keep latest invoice
        if (order.invoiceNo) existing.invoiceNo = order.invoiceNo;
      } else {
        map.set(key, {
          customerName: order.customerName,
          invoiceNo: order.invoiceNo || "",
          phone: order.phone,
          address: order.address,
          totalDue: order.dueAmount,
        });
      }
    }
  }
  return Array.from(map.values());
}

export default function DueAmountListPage({ onBack }: { onBack: () => void }) {
  const [dueList, setDueList] = useState<DueCustomer[]>(buildDueList);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const refresh = () => setDueList(buildDueList());
    window.addEventListener("storage", refresh);
    window.addEventListener("localOrdersUpdated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("localOrdersUpdated", refresh);
    };
  }, []);

  const filtered = dueList.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f0f4f8",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)",
          padding: "clamp(10px,3vw,18px) clamp(12px,4vw,20px)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(21,101,192,0.3)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="due_list.back_button"
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(1rem,4vw,1.25rem)",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Due Amount List
        </h1>
      </div>

      {/* Search */}
      <div style={{ padding: "14px 14px 6px", flexShrink: 0 }}>
        <div
          style={{
            position: "relative",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#90a4ae",
            }}
          />
          <input
            data-ocid="due_list.search_input"
            type="text"
            placeholder="Search Customer Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 12px 11px 36px",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              outline: "none",
              background: "transparent",
              color: "#37474f",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Count */}
      <div style={{ padding: "6px 14px 4px", flexShrink: 0 }}>
        <p
          style={{
            fontSize: "13px",
            color: "#546e7a",
            margin: 0,
            fontWeight: 600,
          }}
        >
          Due Customers ({filtered.length})
        </p>
      </div>

      {/* List */}
      <div
        data-ocid="due_list.list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {filtered.length === 0 ? (
          <div
            data-ocid="due_list.empty_state"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#90a4ae",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
            <p style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}>
              {search ? "No matching customers found" : "No due amounts!"}
            </p>
            <p style={{ fontSize: "13px", marginTop: "6px" }}>
              {search ? "Try a different name" : "All payments are up to date."}
            </p>
          </div>
        ) : (
          filtered.map((customer, idx) => (
            <div
              key={customer.customerName}
              data-ocid={`due_list.item.${idx + 1}`}
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "14px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderLeft: "4px solid #e53935",
              }}
            >
              {/* Row 1: Name + Invoice */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#1a237e",
                    flex: 1,
                    marginRight: "8px",
                  }}
                >
                  {customer.customerName}
                </span>
                {customer.invoiceNo && (
                  <span
                    style={{
                      background: "#fce4ec",
                      color: "#c62828",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    INV #{customer.invoiceNo}
                  </span>
                )}
              </div>

              {/* Row 2: Phone */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <Phone size={13} color="#78909c" />
                <span style={{ fontSize: "13px", color: "#546e7a" }}>
                  {customer.phone}
                </span>
              </div>

              {/* Row 3: Address */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  marginBottom: "8px",
                }}
              >
                <MapPin
                  size={13}
                  color="#78909c"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: "#546e7a" }}>
                  {customer.address}
                </span>
              </div>

              {/* Row 4: Due Amount */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  paddingTop: "8px",
                  borderTop: "1px solid #f5f5f5",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#78909c",
                    marginRight: "8px",
                  }}
                >
                  Total Due:
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#e53935",
                  }}
                >
                  ₹{customer.totalDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
