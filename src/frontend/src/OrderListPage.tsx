import {
  ArrowLeft,
  Package,
  Pencil,
  Phone,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useOrders } from "./hooks/useQueries";

interface Props {
  onBack: () => void;
}

function parseDateForFilter(dateStr: string): string {
  // Support DD/MM/YYYY or YYYY-MM-DD
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
}

export default function OrderListPage({ onBack }: Props) {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const sorted = orders
    ? [...orders].sort((a, b) => (a.id < b.id ? 1 : -1))
    : [];

  const filtered = useMemo(() => {
    return sorted.filter((order) => {
      const matchName = order.customerName
        .toLowerCase()
        .includes(search.toLowerCase());
      const orderDateISO = parseDateForFilter(order.date);
      const matchFrom = fromDate ? orderDateISO >= fromDate : true;
      const matchTo = toDate ? orderDateISO <= toDate : true;
      return matchName && matchFrom && matchTo;
    });
  }, [sorted, search, fromDate, toDate]);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Bricolage Grotesque', sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#ffffff",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="order_list.back.button"
          onClick={onBack}
          style={{
            backgroundColor: "#2e7d32",
            border: "none",
            borderRadius: "50%",
            width: "2.5rem",
            height: "2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </button>
        <h2
          style={{
            fontWeight: 800,
            fontSize: "1.3rem",
            color: "#2e7d32",
            margin: 0,
          }}
        >
          Order Details
        </h2>
      </header>

      {/* Search & Filters */}
      <div
        style={{
          padding: "0 1rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            color="#9e9e9e"
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            data-ocid="order_list.search_input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Customer Name..."
            style={{
              width: "100%",
              border: "1.5px solid #e8e8e8",
              borderRadius: "2rem",
              padding: "0.65rem 1rem 0.65rem 2.5rem",
              fontSize: "0.875rem",
              color: "#424242",
              backgroundColor: "#f7f7f7",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Date Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <label
              htmlFor="from-date"
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#9e9e9e",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              FROM DATE
            </label>
            <input
              id="from-date"
              data-ocid="order_list.from_date.input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                border: "1.5px solid #e8e8e8",
                borderRadius: "0.875rem",
                padding: "0.55rem 0.75rem",
                fontSize: "0.8rem",
                color: "#424242",
                backgroundColor: "#f7f7f7",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
          <div
            style={{
              width: "1.5rem",
              height: "1.5px",
              backgroundColor: "#bdbdbd",
              marginTop: "1.25rem",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <label
              htmlFor="to-date"
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#9e9e9e",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              TO DATE
            </label>
            <input
              id="to-date"
              data-ocid="order_list.to_date.input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                border: "1.5px solid #e8e8e8",
                borderRadius: "0.875rem",
                padding: "0.55rem 0.75rem",
                fontSize: "0.8rem",
                color: "#424242",
                backgroundColor: "#f7f7f7",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem 1rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          backgroundColor: "#eaf4ea",
          borderRadius: "1.25rem 1.25rem 0 0",
        }}
      >
        {isLoading && (
          <div data-ocid="order_list.loading_state">
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "1rem",
                  padding: "1rem",
                  marginBottom: "0.875rem",
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    height: "1rem",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "0.5rem",
                    width: "50%",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  style={{
                    height: "0.75rem",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "0.5rem",
                    width: "70%",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            data-ocid="order_list.empty_state"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "3rem 1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#e8f5e9",
                borderRadius: "50%",
                width: "4rem",
                height: "4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={28} color="#2e7d32" />
            </div>
            <p
              style={{
                color: "#757575",
                fontSize: "0.9rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              No orders found
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((order, index) => {
            const due = Number(order.dueAmount);
            const paid = Number(order.paidAmount);
            const total = Number(order.totalAmount);
            return (
              <div
                key={order.id.toString()}
                data-ocid={`order_list.item.${index + 1}`}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "1rem",
                  padding: "1rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {/* Top: Name + Date + Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "0.375rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 800,
                        fontSize: "1.05rem",
                        color: "#2e7d32",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {order.customerName}
                    </p>
                    {order.phone && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          marginTop: "0.3rem",
                        }}
                      >
                        <Phone size={13} color="#616161" />
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#616161",
                            fontWeight: 500,
                          }}
                        >
                          {order.phone}
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#9e9e9e",
                        fontWeight: 500,
                        marginRight: "0.25rem",
                      }}
                    >
                      {order.date}
                    </span>
                    <button
                      type="button"
                      data-ocid={`order_list.edit_button.${index + 1}`}
                      onClick={() => toast.info("Edit coming soon")}
                      style={{
                        backgroundColor: "#e3f0fd",
                        border: "none",
                        borderRadius: "50%",
                        width: "2rem",
                        height: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Pencil size={13} color="#1565c0" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`order_list.delete_button.${index + 1}`}
                      onClick={() => toast.info("Delete coming soon")}
                      style={{
                        backgroundColor: "#fdecea",
                        border: "none",
                        borderRadius: "50%",
                        width: "2rem",
                        height: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} color="#c62828" />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#f0f0f0",
                    margin: "0.5rem 0",
                  }}
                />

                {/* Brick Items */}
                {order.brickItems.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {order.brickItems.map((item) => (
                      <p
                        key={item.brickType}
                        style={{
                          fontSize: "0.875rem",
                          color: "#212121",
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>
                          {item.brickType}:
                        </span>{" "}
                        {item.qty.toString()}
                      </p>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#f0f0f0",
                    margin: "0.5rem 0",
                  }}
                />

                {/* Total / Paid / Due */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ textAlign: "center", paddingBottom: "0.25rem" }}
                  >
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: "#9e9e9e",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        fontWeight: 700,
                        margin: "0 0 0.2rem",
                      }}
                    >
                      TOTAL
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#212121",
                        margin: 0,
                        textDecoration: "underline dotted",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      ₹{total.toLocaleString()}
                    </p>
                  </div>
                  <div
                    style={{ backgroundColor: "#e0e0e0", height: "2.5rem" }}
                  />
                  <div
                    style={{ textAlign: "center", paddingBottom: "0.25rem" }}
                  >
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: "#9e9e9e",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        fontWeight: 700,
                        margin: "0 0 0.2rem",
                      }}
                    >
                      PAID
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#2e7d32",
                        margin: 0,
                        textDecoration: "underline dotted",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      ₹{paid.toLocaleString()}
                    </p>
                  </div>
                  <div
                    style={{ backgroundColor: "#e0e0e0", height: "2.5rem" }}
                  />
                  <div
                    style={{ textAlign: "center", paddingBottom: "0.25rem" }}
                  >
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: "#9e9e9e",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        fontWeight: 700,
                        margin: "0 0 0.2rem",
                      }}
                    >
                      DUE
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: due > 0 ? "#c62828" : "#2e7d32",
                        margin: 0,
                        textDecoration: "underline dotted",
                        textUnderlineOffset: "3px",
                      }}
                    >
                      ₹{due.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
