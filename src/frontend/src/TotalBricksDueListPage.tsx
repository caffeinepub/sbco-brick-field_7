import {
  ArrowLeft,
  Calendar,
  FileText,
  IndianRupee,
  Layers,
  MapPin,
  Phone,
  Search,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type LocalOrder,
  addPaymentToOrder,
  getLocalOrders,
} from "./localOrderStore";

interface BricksDueCustomer {
  customerName: string;
  invoiceNo: string;
  phone: string;
  address: string;
  totalBricksDue: number;
  brickTypeBreakdown: { brickType: string; due: number }[];
  orderIds: string[];
  primaryOrderId: string;
}

function buildBricksDueList(): BricksDueCustomer[] {
  const orders = getLocalOrders();
  let deliveries: {
    customerName: string;
    totalBricks: number;
    bricks?: { brickType: string; qty: number }[];
  }[] = [];
  try {
    deliveries = JSON.parse(localStorage.getItem("sbco_deliveries") || "[]");
  } catch {
    deliveries = [];
  }

  // Group by customer
  const map = new Map<
    string,
    {
      orderedByType: Map<string, number>;
      deliveredByType: Map<string, number>;
      customer: BricksDueCustomer;
    }
  >();

  for (const order of orders) {
    const key = order.customerName.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        orderedByType: new Map(),
        deliveredByType: new Map(),
        customer: {
          customerName: order.customerName,
          invoiceNo: order.invoiceNo || "",
          phone: order.phone,
          address: order.address,
          totalBricksDue: 0,
          brickTypeBreakdown: [],
          orderIds: [],
          primaryOrderId: order.id,
        },
      });
    }
    const entry = map.get(key)!;
    entry.customer.orderIds.push(order.id);
    if (order.invoiceNo) entry.customer.invoiceNo = order.invoiceNo;
    // accumulate ordered bricks by type
    for (const b of order.bricks) {
      entry.orderedByType.set(
        b.brickType,
        (entry.orderedByType.get(b.brickType) || 0) + b.qty,
      );
    }
  }

  for (const delivery of deliveries) {
    const key = delivery.customerName.toLowerCase().trim();
    if (!map.has(key)) continue;
    const entry = map.get(key)!;
    // accumulate delivered bricks by type
    if (delivery.bricks && delivery.bricks.length > 0) {
      for (const b of delivery.bricks) {
        entry.deliveredByType.set(
          b.brickType,
          (entry.deliveredByType.get(b.brickType) || 0) + b.qty,
        );
      }
    } else {
      // fallback: subtract from total if no breakdown
      entry.deliveredByType.set(
        "__total__",
        (entry.deliveredByType.get("__total__") || 0) + delivery.totalBricks,
      );
    }
  }

  const result: BricksDueCustomer[] = [];
  for (const [, entry] of map) {
    const breakdown: { brickType: string; due: number }[] = [];
    let totalDue = 0;

    for (const [brickType, ordered] of entry.orderedByType) {
      const delivered = entry.deliveredByType.get(brickType) || 0;
      const due = Math.max(0, ordered - delivered);
      if (due > 0) {
        breakdown.push({ brickType, due });
        totalDue += due;
      }
    }

    // Handle fallback __total__ delivery subtraction
    const fallbackDelivered = entry.deliveredByType.get("__total__") || 0;
    if (fallbackDelivered > 0 && breakdown.length === 0) {
      const totalOrdered = Array.from(entry.orderedByType.values()).reduce(
        (s, v) => s + v,
        0,
      );
      totalDue = Math.max(0, totalOrdered - fallbackDelivered);
      if (totalDue > 0) {
        // distribute due proportionally across brick types
        let remaining = totalDue;
        for (const [brickType, ordered] of entry.orderedByType) {
          if (remaining <= 0) break;
          const due = Math.min(remaining, ordered);
          if (due > 0) breakdown.push({ brickType, due });
          remaining -= due;
        }
      }
    }

    if (totalDue > 0) {
      entry.customer.totalBricksDue = totalDue;
      entry.customer.brickTypeBreakdown = breakdown;
      result.push(entry.customer);
    }
  }
  return result;
}

type PaymentMethod = "cash" | "upi" | "bank";

export default function TotalBricksDueListPage({
  onBack,
  onDelivery,
}: {
  onBack: () => void;
  onDelivery?: (orderId: string) => void;
}) {
  const [list, setList] = useState<BricksDueCustomer[]>(buildBricksDueList);
  const [search, setSearch] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [invoiceCustomer, setInvoiceCustomer] =
    useState<BricksDueCustomer | null>(null);
  const [invoiceOrders, setInvoiceOrders] = useState<LocalOrder[]>([]);

  const [payCustomer, setPayCustomer] = useState<BricksDueCustomer | null>(
    null,
  );
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setList(buildBricksDueList());
    window.addEventListener("storage", refresh);
    window.addEventListener("localOrdersUpdated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("localOrdersUpdated", refresh);
    };
  }, []);

  const filtered = list.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  function openInvoice(customer: BricksDueCustomer) {
    const allOrders = getLocalOrders();
    const orders = allOrders.filter((o) => customer.orderIds.includes(o.id));
    setInvoiceOrders(orders);
    setInvoiceCustomer(customer);
  }

  function openPayment(customer: BricksDueCustomer) {
    setPayCustomer(customer);
    setPayAmount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayMethod("cash");
    setPayNote("");
    setPayError("");
  }

  function handleSavePayment() {
    if (!payCustomer) return;
    const amt = Number.parseFloat(payAmount);
    if (!payAmount || Number.isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid payment amount.");
      return;
    }
    const allOrders = getLocalOrders();
    const customerOrders = allOrders
      .filter((o) => payCustomer.orderIds.includes(o.id) && o.dueAmount > 0)
      .sort((a, b) => a.createdAt - b.createdAt);
    const totalDue = customerOrders.reduce((s, o) => s + o.dueAmount, 0);
    if (amt > totalDue) {
      setPayError(
        `Amount cannot exceed due ₹${totalDue.toLocaleString("en-IN")}.`,
      );
      return;
    }
    let remaining = amt;
    const time = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    for (const order of customerOrders) {
      if (remaining <= 0) break;
      const pay = Math.min(remaining, order.dueAmount);
      addPaymentToOrder(order.id, pay, payDate, time);
      remaining -= pay;
    }
    window.dispatchEvent(new Event("localOrdersUpdated"));
    setList(buildBricksDueList());
    setPayCustomer(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2800);
  }

  const overlayKeyDown = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") fn();
  };

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
          background: "linear-gradient(135deg, #b71c1c 0%, #e53935 100%)",
          padding: "clamp(10px,3vw,18px) clamp(12px,4vw,20px)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(183,28,28,0.3)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="bricks_due_list.back_button"
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={20} color="#fff" />
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(1rem,4vw,1.25rem)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Total Bricks Due List
          </h1>
        </div>
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
            id="bricks-due-search"
            data-ocid="bricks_due_list.search_input"
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

      {/* Count row */}
      <div style={{ padding: "6px 14px 4px", flexShrink: 0 }}>
        <p
          style={{
            fontSize: "13px",
            color: "#546e7a",
            margin: 0,
            fontWeight: 600,
          }}
        >
          Customers with Bricks Due ({filtered.length})
        </p>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div
          data-ocid="bricks_due_list.success_state"
          style={{
            margin: "0 14px 6px",
            background: "linear-gradient(90deg, #2e7d32, #43a047)",
            color: "#fff",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(46,125,50,0.3)",
            flexShrink: 0,
          }}
        >
          ✅ Payment saved successfully!
        </div>
      )}

      {/* List */}
      <div
        data-ocid="bricks_due_list.list"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {filtered.length === 0 ? (
          <div
            data-ocid="bricks_due_list.empty_state"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#90a4ae",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🧱</div>
            <p style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}>
              {search ? "No matching customers found" : "No bricks due!"}
            </p>
            <p style={{ fontSize: "13px", marginTop: "6px" }}>
              {search
                ? "Try a different name"
                : "All bricks have been delivered."}
            </p>
          </div>
        ) : (
          filtered.map((customer, idx) => (
            <div
              key={customer.customerName}
              data-ocid={`bricks_due_list.item.${idx + 1}`}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.09)",
                borderLeft: "4px solid #e53935",
              }}
            >
              {/* Row 1: Name + Invoice badge */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
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
                      padding: "3px 9px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                      border: "1px solid #ef9a9a",
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
                  marginBottom: "5px",
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
                  marginBottom: "10px",
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

              {/* Row 4: Bricks Due box with type breakdown */}
              <div
                style={{
                  background: "#fff5f5",
                  border: "1px solid #ffcdd2",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom:
                      customer.brickTypeBreakdown.length > 0 ? "8px" : "0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Layers size={15} color="#e53935" />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#e53935",
                        fontWeight: 600,
                      }}
                    >
                      Total Bricks Due
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#c62828",
                    }}
                  >
                    {customer.totalBricksDue.toLocaleString("en-IN")} Bricks
                  </span>
                </div>
                {/* Brick type breakdown */}
                {customer.brickTypeBreakdown.length > 0 && (
                  <div
                    style={{
                      borderTop: "1px solid #ffcdd2",
                      paddingTop: "7px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {customer.brickTypeBreakdown.map((b) => (
                      <div
                        key={b.brickType}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#78909c" }}>
                          {b.brickType}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#c62828",
                          }}
                        >
                          {b.due.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons — 3 in one row */}
              <div style={{ display: "flex", gap: "8px" }}>
                {/* View Invoice */}
                <button
                  type="button"
                  data-ocid={`bricks_due_list.view_invoice.button.${idx + 1}`}
                  onClick={() => openInvoice(customer)}
                  style={{
                    flex: 1,
                    padding: "9px 4px",
                    border: "1.5px solid #1565c0",
                    borderRadius: "10px",
                    background: "#fff",
                    color: "#1565c0",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <FileText size={14} />
                  View Invoice
                </button>

                {/* Delivery */}
                <button
                  type="button"
                  data-ocid={`bricks_due_list.delivery.button.${idx + 1}`}
                  onClick={() => onDelivery?.(customer.primaryOrderId)}
                  style={{
                    flex: 1,
                    padding: "9px 4px",
                    border: "1.5px solid #e65100",
                    borderRadius: "10px",
                    background: "#fff3e0",
                    color: "#e65100",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <Truck size={14} />
                  Delivery
                </button>

                {/* Add Payment */}
                <button
                  type="button"
                  data-ocid={`bricks_due_list.add_payment.button.${idx + 1}`}
                  onClick={() => openPayment(customer)}
                  style={{
                    flex: 1,
                    padding: "9px 4px",
                    border: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #2e7d32, #43a047)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    boxShadow: "0 3px 8px rgba(46,125,50,0.3)",
                  }}
                >
                  <IndianRupee size={14} />
                  Add Payment
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== VIEW INVOICE BOTTOM SHEET ===== */}
      {invoiceCustomer && (
        <div
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            aria-label="Close invoice"
            onClick={() => setInvoiceCustomer(null)}
            onKeyDown={overlayKeyDown(() => setInvoiceCustomer(null))}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              maxHeight: "80dvh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 4px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  borderRadius: "2px",
                  background: "#ddd",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 18px 10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={18} color="#1565c0" />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#1a237e",
                  }}
                >
                  Invoice Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceCustomer(null)}
                style={{
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} color="#546e7a" />
              </button>
            </div>
            <div
              style={{
                margin: "0 16px 10px",
                background: "#e8f5e9",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#1b5e20",
                }}
              >
                {invoiceCustomer.customerName}
              </p>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "12px",
                  color: "#388e3c",
                }}
              >
                📞 {invoiceCustomer.phone}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "#388e3c",
                }}
              >
                📍 {invoiceCustomer.address}
              </p>
            </div>
            <div style={{ overflowY: "auto", padding: "0 16px 20px", flex: 1 }}>
              {invoiceOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: "12px",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        background: "#fce4ec",
                        color: "#c62828",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "20px",
                      }}
                    >
                      INV #{order.invoiceNo}
                    </span>
                    <span style={{ fontSize: "12px", color: "#78909c" }}>
                      {order.date}
                    </span>
                  </div>
                  {order.bricks.map((b) => (
                    <p
                      key={b.brickType}
                      style={{
                        margin: "0 0 2px",
                        fontSize: "13px",
                        color: "#37474f",
                      }}
                    >
                      {b.brickType}:{" "}
                      <strong>{b.qty.toLocaleString("en-IN")}</strong>
                    </p>
                  ))}
                  <div
                    style={{ display: "flex", gap: "6px", marginTop: "8px" }}
                  >
                    {[
                      {
                        label: "Total",
                        value: `₹${order.totalAmount.toLocaleString("en-IN")}`,
                        color: "#37474f",
                      },
                      {
                        label: "Paid",
                        value: `₹${order.paidAmount.toLocaleString("en-IN")}`,
                        color: "#2e7d32",
                      },
                      {
                        label: "Due",
                        value: `₹${order.dueAmount.toLocaleString("en-IN")}`,
                        color: "#c62828",
                      },
                    ].map((col) => (
                      <div
                        key={col.label}
                        style={{
                          flex: 1,
                          background: "#fafafa",
                          borderRadius: "8px",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "10px",
                            color: "#90a4ae",
                            fontWeight: 600,
                          }}
                        >
                          {col.label}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: col.color,
                          }}
                        >
                          {col.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD PAYMENT BOTTOM SHEET ===== */}
      {payCustomer && (
        <div
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            aria-label="Close payment form"
            onClick={() => setPayCustomer(null)}
            onKeyDown={overlayKeyDown(() => setPayCustomer(null))}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              maxHeight: "90dvh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 4px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  borderRadius: "2px",
                  background: "#ddd",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 18px 10px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#90a4ae",
                    fontWeight: 500,
                  }}
                >
                  Add Payment for
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1a237e",
                  }}
                >
                  {payCustomer.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayCustomer(null)}
                style={{
                  background: "#f5f5f5",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} color="#546e7a" />
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "0 18px 24px", flex: 1 }}>
              <label
                htmlFor="bricks-pay-amount"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#546e7a",
                  marginBottom: "6px",
                }}
              >
                Payment Amount *
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f5f7fa",
                  borderRadius: "10px",
                  border: "1.5px solid #e0e0e0",
                  marginBottom: "14px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    color: "#78909c",
                  }}
                >
                  <IndianRupee size={16} />
                </div>
                <input
                  id="bricks-pay-amount"
                  data-ocid="bricks_due_payment.amount.input"
                  type="number"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setPayError("");
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1a237e",
                    padding: "12px 12px 12px 0",
                    outline: "none",
                  }}
                />
              </div>

              <label
                htmlFor="bricks-pay-date"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#546e7a",
                  marginBottom: "6px",
                }}
              >
                Payment Date *
              </label>
              <div
                onClick={() => dateRef.current?.showPicker()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    dateRef.current?.showPicker();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f5f7fa",
                  borderRadius: "10px",
                  border: "1.5px solid #e0e0e0",
                  marginBottom: "14px",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    color: "#78909c",
                  }}
                >
                  <Calendar size={16} />
                </div>
                <input
                  ref={dateRef}
                  id="bricks-pay-date"
                  data-ocid="bricks_due_payment.date.input"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    color: "#37474f",
                    padding: "12px 12px 12px 0",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#546e7a",
                  margin: "0 0 8px",
                }}
              >
                Payment Method
              </p>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "14px" }}
              >
                {[
                  {
                    key: "cash" as PaymentMethod,
                    label: "💵 Cash",
                    ocid: "bricks_due_payment.method.cash",
                  },
                  {
                    key: "upi" as PaymentMethod,
                    label: "📱 UPI",
                    ocid: "bricks_due_payment.method.upi",
                  },
                  {
                    key: "bank" as PaymentMethod,
                    label: "🏦 Bank Transfer",
                    ocid: "bricks_due_payment.method.bank_transfer",
                  },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    data-ocid={m.ocid}
                    onClick={() => setPayMethod(m.key)}
                    style={{
                      flex: 1,
                      padding: "9px 4px",
                      border:
                        payMethod === m.key
                          ? "1.5px solid #1565c0"
                          : "1.5px solid #e0e0e0",
                      borderRadius: "10px",
                      background: payMethod === m.key ? "#e3f2fd" : "#f5f7fa",
                      color: payMethod === m.key ? "#1565c0" : "#78909c",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <label
                htmlFor="bricks-pay-note"
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#546e7a",
                  marginBottom: "6px",
                }}
              >
                Note (Optional)
              </label>
              <textarea
                id="bricks-pay-note"
                data-ocid="bricks_due_payment.note.textarea"
                rows={2}
                placeholder="Add a note..."
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                style={{
                  width: "100%",
                  background: "#f5f7fa",
                  border: "1.5px solid #e0e0e0",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "#37474f",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                  marginBottom: "14px",
                  fontFamily: "inherit",
                }}
              />

              {payError && (
                <p
                  style={{
                    color: "#c62828",
                    fontSize: "12px",
                    fontWeight: 600,
                    margin: "0 0 12px",
                  }}
                >
                  {payError}
                </p>
              )}

              <button
                type="button"
                data-ocid="bricks_due_payment.save.button"
                onClick={handleSavePayment}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2e7d32, #43a047)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(46,125,50,0.35)",
                }}
              >
                💾 Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
