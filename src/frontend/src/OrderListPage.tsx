import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  History,
  Package,
  Pencil,
  Phone,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getLocalDeliveries } from "./DeliveryPage";
import {
  deleteLocalOrder,
  getLocalOrders,
  isOrderClosed,
} from "./localOrderStore";
import type { LocalOrder } from "./localOrderStore";

interface Props {
  onBack: () => void;
  filterClosed?: boolean;
  onDelivery?: (orderId: string) => void;
}

function parseDateForFilter(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
}

// Confirmation Dialog Component
function DeleteConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      data-ocid="order_list.dialog"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1.25rem",
          padding: "1.75rem 1.5rem",
          width: "100%",
          maxWidth: "320px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            backgroundColor: "#fdecea",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Trash2 size={20} color="#c62828" />
        </div>
        <h3
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "#212121",
            margin: "0 0 0.5rem",
            textAlign: "center",
          }}
        >
          Delete Confirmation
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#757575",
            margin: "0 0 1.5rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to delete this? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            data-ocid="order_list.delete_dialog.cancel_button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1.5px solid #e0e0e0",
              borderRadius: "0.75rem",
              backgroundColor: "#ffffff",
              color: "#424242",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="order_list.delete_dialog.confirm_button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "none",
              borderRadius: "0.75rem",
              backgroundColor: "#c62828",
              color: "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment History Modal
function PaymentHistoryModal({
  order,
  onClose,
}: {
  order: LocalOrder;
  onClose: () => void;
}) {
  const payments = order.paymentHistory || [];

  return (
    <div
      data-ocid="order_list.payment_history.modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      role="presentation"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1.5rem 1.5rem 0 0",
          width: "100%",
          maxWidth: "430px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1rem 0.75rem",
            borderBottom: "1px solid #fce4e4",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "4px",
              backgroundColor: "#ffcdd2",
              borderRadius: "2px",
              margin: "0 auto 1rem",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#fdecea",
                  borderRadius: "50%",
                  width: "2.25rem",
                  height: "2.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={16} color="#c62828" />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "#b71c1c",
                    margin: 0,
                  }}
                >
                  Payment History
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#e53935",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {order.customerName}
                </p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="order_list.payment_history.close_button"
              onClick={onClose}
              style={{
                backgroundColor: "#f5f5f5",
                border: "none",
                borderRadius: "50%",
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#424242" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.75rem 1rem 1.5rem",
          }}
        >
          {payments.length === 0 ? (
            <div
              data-ocid="order_list.payment_history.empty_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2.5rem 1rem",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fdecea",
                  borderRadius: "50%",
                  width: "3.5rem",
                  height: "3.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={22} color="#c62828" />
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#9e9e9e",
                  fontWeight: 600,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                No payment records yet
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.4fr 1.2fr",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#fdecea",
                  borderRadius: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                {["Date", "Time", "Amount Paid"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      color: "#c62828",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {payments.map((p, i) => (
                  <div
                    key={`payment-${p.date}-${p.time}-${p.amount}-${i}`}
                    data-ocid={`order_list.payment_history.item.${i + 1}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1.4fr 1.2fr",
                      gap: "0.25rem",
                      padding: "0.65rem 0.75rem",
                      backgroundColor: i % 2 === 0 ? "#fff8f8" : "#ffffff",
                      borderRadius: "0.75rem",
                      border: "1px solid #fdecea",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Clock size={11} color="#9e9e9e" />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#424242",
                        }}
                      >
                        {p.date || "—"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#616161",
                      }}
                    >
                      {p.time || "—"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "#c62828",
                      }}
                    >
                      ₹{p.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.65rem 0.875rem",
                  backgroundColor: "#fdecea",
                  borderRadius: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#c62828",
                    textTransform: "uppercase",
                  }}
                >
                  Total Paid
                </span>
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "#b71c1c",
                  }}
                >
                  ₹{payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Delivery History Modal
function DeliveryHistoryModal({
  orderId,
  orders,
  onClose,
}: {
  orderId: string;
  orders: LocalOrder[];
  onClose: () => void;
}) {
  const deliveries = getLocalDeliveries();
  const order = orders.find((o) => o.id === orderId);
  const orderDeliveries = deliveries.filter(
    (d) => d.customerName === order?.customerName,
  );

  // Flatten: one row per brick type per delivery
  const rows: {
    date: string;
    brickType: string;
    qty: number;
    vehicleNumber: string;
  }[] = [];
  for (const d of orderDeliveries) {
    for (const b of d.bricks) {
      rows.push({
        date: d.date,
        brickType: b.brickType,
        qty: b.qty,
        vehicleNumber: d.vehicleNumber || "—",
      });
    }
  }

  return (
    <div
      data-ocid="order_list.history.modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1.5rem 1.5rem 0 0",
          width: "100%",
          maxWidth: "430px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1rem 0.75rem",
            borderBottom: "1px solid #e8f5e9",
            flexShrink: 0,
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: "3rem",
              height: "4px",
              backgroundColor: "#c8e6c9",
              borderRadius: "2px",
              margin: "0 auto 1rem",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  backgroundColor: "#e8f5e9",
                  borderRadius: "50%",
                  width: "2.25rem",
                  height: "2.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History size={16} color="#2e7d32" />
              </div>
              <div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "#1b5e20",
                    margin: 0,
                  }}
                >
                  Delivery History
                </h3>
                {order && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#2e7d32",
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    {order.customerName}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              data-ocid="order_list.history.close_button"
              onClick={onClose}
              style={{
                backgroundColor: "#f5f5f5",
                border: "none",
                borderRadius: "50%",
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#424242" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.75rem 1rem 1.5rem",
          }}
        >
          {rows.length === 0 ? (
            <div
              data-ocid="order_list.history.empty_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2.5rem 1rem",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e8f5e9",
                  borderRadius: "50%",
                  width: "3.5rem",
                  height: "3.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History size={22} color="#2e7d32" />
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#9e9e9e",
                  fontWeight: 600,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                No delivery history yet
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.8fr 1fr 1.6fr",
                  gap: "0.25rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                {["Date", "Bricks Type", "Qty", "Vehicle No."].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      color: "#2e7d32",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Table Rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {rows.map((row, i) => (
                  <div
                    key={`${row.date}-${row.brickType}-${i}`}
                    data-ocid={`order_list.history.item.${i + 1}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.8fr 1.8fr 1fr 1.6fr",
                      gap: "0.25rem",
                      padding: "0.65rem 0.75rem",
                      backgroundColor: i % 2 === 0 ? "#f9fafb" : "#ffffff",
                      borderRadius: "0.75rem",
                      border: "1px solid #e8f5e9",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Clock size={11} color="#9e9e9e" />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#424242",
                        }}
                      >
                        {row.date}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#2e7d32",
                      }}
                    >
                      {row.brickType}
                    </span>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#1b5e20",
                      }}
                    >
                      {row.qty.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#616161",
                        wordBreak: "break-all",
                      }}
                    >
                      {row.vehicleNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.65rem 0.875rem",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#2e7d32",
                    textTransform: "uppercase",
                  }}
                >
                  Total Delivered
                </span>
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "#1b5e20",
                  }}
                >
                  {rows.reduce((s, r) => s + r.qty, 0).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  index,
  onDelete,
}: {
  order: LocalOrder;
  index: number;
  onDelete: (id: string) => void;
}) {
  const due = order.dueAmount;
  const paid = order.paidAmount;
  const total = order.totalAmount;
  const totalBricksOrdered = order.bricks.reduce((sum, b) => sum + b.qty, 0);

  return (
    <div
      key={order.id}
      data-ocid={`order_list.item.${index + 1}`}
      style={{
        backgroundColor: "#f0fdf4",
        borderRadius: "1rem",
        padding: "1rem",
        boxShadow: "0 2px 12px rgba(46,125,50,0.1)",
        border: "1.5px solid #a5d6a7",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* ── Row 1: Name + INV badge | Date + Delete ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            flex: 1,
            minWidth: 0,
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: "#2e7d32",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexShrink: 1,
            }}
          >
            {order.customerName}
          </p>
          <span
            style={{
              flexShrink: 0,
              fontSize: "0.62rem",
              fontWeight: 800,
              color: "#c62828",
              backgroundColor: "#fdecea",
              borderRadius: "2rem",
              padding: "0.15rem 0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            {order.invoiceNo ? `INV #${order.invoiceNo}` : "INV #--"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              color: "#9e9e9e",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {order.date}
          </span>
          <button
            type="button"
            data-ocid={`order_list.delete_button.${index + 1}`}
            onClick={() => onDelete(order.id)}
            style={{
              backgroundColor: "#fdecea",
              border: "none",
              borderRadius: "50%",
              width: "1.9rem",
              height: "1.9rem",
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

      {/* ── Row 2: Phone | Edit button ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.65rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Phone size={13} color="#616161" />
          <span
            style={{
              fontSize: "0.8rem",
              color: "#616161",
              fontWeight: 500,
            }}
          >
            {order.phone || "—"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            type="button"
            data-ocid={`order_list.edit_button.${index + 1}`}
            onClick={() => toast.info("Edit coming soon")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              backgroundColor: "transparent",
              border: "1.5px solid #43a047",
              borderRadius: "2rem",
              padding: "0.2rem 0.65rem",
              color: "#2e7d32",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Pencil size={11} color="#2e7d32" />
            Edit
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#c8e6c9",
          marginBottom: "0.65rem",
        }}
      />

      {/* ── Middle: Brick types | Approx Delivery ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.75rem",
          marginBottom: "0.65rem",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {order.bricks.length > 0 ? (
            order.bricks.map((item) => (
              <p
                key={item.brickType}
                style={{
                  fontSize: "0.82rem",
                  color: "#424242",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                <span style={{ fontWeight: 700, color: "#2e7d32" }}>
                  {item.brickType}:
                </span>{" "}
                {item.qty.toLocaleString()}
              </p>
            ))
          ) : (
            <p style={{ fontSize: "0.82rem", color: "#9e9e9e", margin: 0 }}>
              —
            </p>
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              color: "#9e9e9e",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Approx Delivery Date
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: order.approxDeliveryDate ? "#2e7d32" : "#bdbdbd",
            }}
          >
            {order.approxDeliveryDate || "—"}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#c8e6c9",
          marginBottom: "0.5rem",
        }}
      />

      {/* ── Bottom: 4-column summary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
          alignItems: "stretch",
        }}
      >
        {/* Total Bricks */}
        <div
          style={{
            textAlign: "center",
            padding: "0.3rem 0.1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.47rem",
              color: "#9e9e9e",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            TOTAL BRICKS
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#424242",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {totalBricksOrdered.toLocaleString()}
          </p>
        </div>

        <div style={{ backgroundColor: "#c8e6c9", width: "1px" }} />

        {/* Total Amount */}
        <div
          style={{
            textAlign: "center",
            padding: "0.3rem 0.1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.47rem",
              color: "#9e9e9e",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            TOTAL AMT
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#424242",
              margin: 0,
              lineHeight: 1,
            }}
          >
            ₹{total.toLocaleString()}
          </p>
        </div>

        <div style={{ backgroundColor: "#c8e6c9", width: "1px" }} />

        {/* Paid */}
        <div
          style={{
            textAlign: "center",
            padding: "0.3rem 0.1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.47rem",
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            PAID
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#2e7d32",
              margin: 0,
              lineHeight: 1,
            }}
          >
            ₹{paid.toLocaleString()}
          </p>
        </div>

        <div style={{ backgroundColor: "#c8e6c9", width: "1px" }} />

        {/* Due */}
        <div
          style={{
            textAlign: "center",
            padding: "0.3rem 0.1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.2rem",
          }}
        >
          <p
            style={{
              fontSize: "0.47rem",
              color: due > 0 ? "#c62828" : "#9e9e9e",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            DUE
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: due > 0 ? "#c62828" : "#2e7d32",
              margin: 0,
              lineHeight: 1,
            }}
          >
            ₹{due.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function ClosedOrderHistoryModal({
  order,
  onClose,
}: {
  order: LocalOrder;
  onClose: () => void;
}) {
  const allDeliveries = getLocalDeliveries();
  const orderDeliveries = allDeliveries.filter(
    (d) => d.customerName === order.customerName,
  );
  const deliveryRows: {
    date: string;
    brickType: string;
    qty: number;
    vehicleNumber: string;
  }[] = [];
  for (const d of orderDeliveries) {
    for (const b of d.bricks) {
      deliveryRows.push({
        date: d.date,
        brickType: b.brickType,
        qty: b.qty,
        vehicleNumber: d.vehicleNumber || "-",
      });
    }
  }
  const payments = order.paymentHistory || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0.75rem 0 0.25rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "#e0e0e0",
            }}
          />
        </div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem 0.75rem",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: "1rem",
                color: "#1a1a1a",
              }}
            >
              Order History
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#757575",
                fontWeight: 500,
              }}
            >
              {order.customerName}
            </p>
          </div>
          <button
            type="button"
            data-ocid="closed_orders.history.close_button"
            onClick={onClose}
            style={{
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: "50%",
              width: "2rem",
              height: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={15} color="#424242" />
          </button>
        </div>
        {/* Scrollable body */}
        <div
          style={{
            overflowY: "auto",
            padding: "0 1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Delivery History Section */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.6rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e8f5e9",
                  borderRadius: "50%",
                  width: "1.5rem",
                  height: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Truck size={12} color="#2e7d32" />
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  color: "#2e7d32",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Delivery History
              </p>
            </div>
            {deliveryRows.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#9e9e9e",
                  fontStyle: "italic",
                  padding: "0.5rem 0",
                }}
              >
                No delivery records found.
              </p>
            ) : (
              <div
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid #c8e6c9",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 0.7fr 1fr",
                    backgroundColor: "#e8f5e9",
                    padding: "0.5rem 0.75rem",
                    gap: "0.25rem",
                  }}
                >
                  {["Date", "Brick Type", "Qty", "Vehicle"].map((h) => (
                    <p
                      key={h}
                      style={{
                        margin: 0,
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        color: "#2e7d32",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </p>
                  ))}
                </div>
                {deliveryRows.map((row, i) => (
                  <div
                    key={`delivery-${i}-${row.date}-${row.brickType}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.2fr 0.7fr 1fr",
                      padding: "0.5rem 0.75rem",
                      gap: "0.25rem",
                      backgroundColor: i % 2 === 0 ? "#fff" : "#f9fef9",
                      borderTop: "1px solid #e8f5e9",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 500,
                      }}
                    >
                      {row.date}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 500,
                      }}
                    >
                      {row.brickType}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 600,
                      }}
                    >
                      {row.qty.toLocaleString()}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 500,
                      }}
                    >
                      {row.vehicleNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History Section */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.6rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fce4ec",
                  borderRadius: "50%",
                  width: "1.5rem",
                  height: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={12} color="#c62828" />
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  color: "#c62828",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Payment History
              </p>
            </div>
            {payments.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#9e9e9e",
                  fontStyle: "italic",
                  padding: "0.5rem 0",
                }}
              >
                No payment records found.
              </p>
            ) : (
              <div
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid #f8bbd0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    backgroundColor: "#fce4ec",
                    padding: "0.5rem 0.75rem",
                    gap: "0.25rem",
                  }}
                >
                  {["Date", "Time", "Amount Paid"].map((h) => (
                    <p
                      key={h}
                      style={{
                        margin: 0,
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        color: "#c62828",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </p>
                  ))}
                </div>
                {payments.map((p, i) => (
                  <div
                    key={`payment-${i}-${p.date}-${p.time}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      padding: "0.5rem 0.75rem",
                      gap: "0.25rem",
                      backgroundColor: i % 2 === 0 ? "#fff" : "#fff9fb",
                      borderTop: "1px solid #fce4ec",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 500,
                      }}
                    >
                      {p.date}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#424242",
                        fontWeight: 500,
                      }}
                    >
                      {p.time}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "#c62828",
                        fontWeight: 700,
                      }}
                    >
                      ₹{p.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClosedOrderCard({
  order,
  index,
  onDelete,
  onHistory,
}: {
  order: LocalOrder;
  index: number;
  onDelete: (id: string) => void;
  onHistory: (order: LocalOrder) => void;
}) {
  return (
    <div
      data-ocid={`closed_orders.item.${index + 1}`}
      style={{
        backgroundColor: "#f0fdf4",
        borderRadius: "1rem",
        padding: "1rem",
        boxShadow: "0 2px 8px rgba(46,125,50,0.1)",
        border: "1.5px solid #a5d6a7",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              alignSelf: "flex-start",
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              backgroundColor: "#e8f5e9",
              borderRadius: "2rem",
              padding: "0.2rem 0.6rem",
            }}
          >
            ORDER CLOSED
          </span>
          <p
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: "#1a1a1a",
              margin: 0,
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.customerName}
          </p>
          {order.phone && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Phone size={13} color="#9e9e9e" />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#757575",
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
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.4rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              color: "#757575",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {order.date}
          </span>
          <button
            type="button"
            data-ocid={`closed_orders.delete_button.${index + 1}`}
            onClick={() => onDelete(order.id)}
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

      <div
        style={{
          height: "1px",
          backgroundColor: "#c8e6c9",
          margin: "0.75rem 0",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {order.bricks.map((b) => (
            <p
              key={b.brickType}
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#424242",
              }}
            >
              {b.brickType}: {b.qty.toLocaleString()}
            </p>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            textAlign: "right",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#1a1a1a",
            }}
          >
            Total ₹{order.totalAmount.toLocaleString()}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#2e7d32",
            }}
          >
            Paid ₹{order.paidAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* History button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "0.5rem",
        }}
      >
        <button
          type="button"
          data-ocid={`closed_orders.history_button.${index + 1}`}
          onClick={() => onHistory(order)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            backgroundColor: "#e8f5e9",
            border: "1px solid #a5d6a7",
            borderRadius: "2rem",
            padding: "0.35rem 0.8rem",
            cursor: "pointer",
            color: "#2e7d32",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          <Clock size={14} color="#2e7d32" />
          History
        </button>
      </div>
    </div>
  );
}

export default function OrderListPage({
  onBack,
  filterClosed,
  onDelivery: _onDelivery,
}: Props) {
  const [orders, setOrders] = useState<LocalOrder[]>(() => getLocalOrders());
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [historyOrderId, setHistoryOrderId] = useState<string | null>(null);
  const [paymentHistoryOrder, setPaymentHistoryOrder] =
    useState<LocalOrder | null>(null);
  const [closedHistoryOrder, setClosedHistoryOrder] =
    useState<LocalOrder | null>(null);

  const deliveries = getLocalDeliveries();
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);

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

  const activeOrders = filtered.filter(
    (o) => !isOrderClosed(o, deliveries, orders),
  );
  const closedOrders = filtered.filter((o) =>
    isOrderClosed(o, deliveries, orders),
  );

  const displayOrders = filterClosed ? closedOrders : null;

  function requestDelete(id: string) {
    setDeleteConfirmId(id);
  }

  function confirmDelete() {
    if (!deleteConfirmId) return;
    deleteLocalOrder(deleteConfirmId);
    setOrders(getLocalOrders());
    setDeleteConfirmId(null);
    toast.success("Order deleted");
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  const pageTitle = filterClosed ? "Order Closed" : "Order Details";

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
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      {/* Delivery History Modal */}
      {historyOrderId && (
        <DeliveryHistoryModal
          orderId={historyOrderId}
          orders={orders}
          onClose={() => setHistoryOrderId(null)}
        />
      )}

      {/* Payment History Modal */}
      {paymentHistoryOrder && (
        <PaymentHistoryModal
          order={paymentHistoryOrder}
          onClose={() => setPaymentHistoryOrder(null)}
        />
      )}
      {closedHistoryOrder && (
        <ClosedOrderHistoryModal
          order={closedHistoryOrder}
          onClose={() => setClosedHistoryOrder(null)}
        />
      )}

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
          {pageTitle}
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
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            color="#9e9e9e"
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
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
              border: "none",
              borderRadius: "2rem",
              padding: "0.7rem 1rem 0.7rem 2.5rem",
              fontSize: "0.875rem",
              color: "#424242",
              backgroundColor: "#f0f0f0",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
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
            <div style={{ position: "relative" }}>
              <input
                id="from-date"
                data-ocid="order_list.from_date.input"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  border: "1.5px solid #e8e8e8",
                  borderRadius: "0.875rem",
                  padding: "0.55rem 2rem 0.55rem 0.75rem",
                  fontSize: "0.8rem",
                  color: fromDate ? "#424242" : "#bdbdbd",
                  backgroundColor: "#f7f7f7",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              <ChevronDown
                size={14}
                color="#9e9e9e"
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
          <div
            style={{
              width: "1.25rem",
              height: "1.5px",
              backgroundColor: "#bdbdbd",
              marginBottom: "0.6rem",
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
            <div style={{ position: "relative" }}>
              <input
                id="to-date"
                data-ocid="order_list.to_date.input"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  border: "1.5px solid #e8e8e8",
                  borderRadius: "0.875rem",
                  padding: "0.55rem 2rem 0.55rem 0.75rem",
                  fontSize: "0.8rem",
                  color: toDate ? "#424242" : "#bdbdbd",
                  backgroundColor: "#f7f7f7",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
              <ChevronDown
                size={14}
                color="#9e9e9e"
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: filterClosed ? "1rem" : "0.75rem 1rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          backgroundColor: "#eaf4ea",
          borderRadius: "1.25rem 1.25rem 0 0",
        }}
      >
        {filterClosed ? (
          <>
            {displayOrders && displayOrders.length === 0 ? (
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
                  <CheckCircle2 size={28} color="#2e7d32" />
                </div>
                <p
                  style={{
                    color: "#757575",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  No closed orders found
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "#ffffff",
                    borderRadius: "2rem",
                    padding: "0.4rem 0.875rem",
                    border: "1.5px solid #a5d6a7",
                  }}
                >
                  <CheckCircle2 size={14} color="#2e7d32" />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#2e7d32",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Completed Orders ({displayOrders?.length ?? 0})
                  </span>
                </div>
                {displayOrders?.map((order, index) => (
                  <ClosedOrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    onDelete={requestDelete}
                    onHistory={(o) => setClosedHistoryOrder(o)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* Active Orders Only — closed orders NOT shown here */}
            {activeOrders.length === 0 ? (
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
                  No active orders found
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#2e7d32",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    margin: 0,
                  }}
                >
                  Active Orders ({activeOrders.length})
                </p>
                {activeOrders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    onDelete={requestDelete}
                  />
                ))}
              </>
            )}
          </>
        )}

        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
