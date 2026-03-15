import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Phone,
  Search,
  Trash2,
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
}

function parseDateForFilter(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
}

function getOrderTime(order: LocalOrder): string {
  const d = new Date(order.createdAt);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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

function OrderCard({
  order,
  index,
  expanded,
  onToggle,
  onDelete,
  closed,
}: {
  order: LocalOrder;
  index: number;
  expanded: Record<string, "bricks" | "paid" | null>;
  onToggle: (id: string, tab: "bricks" | "paid") => void;
  onDelete: (id: string) => void;
  closed?: boolean;
}) {
  const due = order.dueAmount;
  const paid = order.paidAmount;
  const total = order.totalAmount;
  const currentExpanded = expanded[order.id] || null;
  const paymentHistory = order.paymentHistory || [];
  const orderTime = getOrderTime(order);
  const totalBricksInOrder = order.bricks.reduce((sum, b) => sum + b.qty, 0);

  return (
    <div
      key={order.id}
      data-ocid={`order_list.item.${index + 1}`}
      style={{
        backgroundColor: closed ? "#f0fdf4" : "#ffffff",
        borderRadius: "1rem",
        padding: "1rem",
        boxShadow: closed
          ? "0 2px 8px rgba(46,125,50,0.1)"
          : "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        border: closed ? "1.5px solid #a5d6a7" : "none",
      }}
    >
      {/* Closed badge */}
      {closed && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            marginBottom: "0.5rem",
          }}
        >
          <CheckCircle2 size={13} color="#2e7d32" />
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              backgroundColor: "#e8f5e9",
              borderRadius: "2rem",
              padding: "0.15rem 0.5rem",
            }}
          >
            Order Closed
          </span>
        </div>
      )}

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
            data-ocid={`order_list.delete_button.${index + 1}`}
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
          backgroundColor: "#f0f0f0",
          margin: "0.5rem 0",
        }}
      />

      {/* Brick Items */}
      {order.bricks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            marginBottom: "0.25rem",
          }}
        >
          {order.bricks.map((item) => (
            <p
              key={item.brickType}
              style={{
                fontSize: "0.875rem",
                color: "#212121",
                margin: 0,
                fontWeight: 500,
              }}
            >
              <span style={{ fontWeight: 700 }}>{item.brickType}:</span>{" "}
              {item.qty.toLocaleString()}
            </p>
          ))}
        </div>
      )}

      <div
        style={{
          height: "1px",
          backgroundColor: "#f0f0f0",
          margin: "0.5rem 0",
        }}
      />

      {/* 4-option row: Bricks Order | Total | Paid | Due */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
          alignItems: "stretch",
        }}
      >
        {/* Bricks Order */}
        <button
          type="button"
          data-ocid={`order_list.bricks_order_tab.${index + 1}`}
          onClick={() => onToggle(order.id, "bricks")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            padding: "0.25rem 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.55rem",
              color: currentExpanded === "bricks" ? "#2e7d32" : "#9e9e9e",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            BRICKS ORDER
          </p>
          <p
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: currentExpanded === "bricks" ? "#2e7d32" : "#212121",
              margin: 0,
            }}
          >
            {totalBricksInOrder.toLocaleString()}
          </p>
          {currentExpanded === "bricks" ? (
            <ChevronUp size={12} color="#2e7d32" />
          ) : (
            <ChevronDown size={12} color="#9e9e9e" />
          )}
        </button>

        <div style={{ backgroundColor: "#e0e0e0", width: "1px" }} />

        {/* Total */}
        <div style={{ textAlign: "center", padding: "0.25rem 0" }}>
          <p
            style={{
              fontSize: "0.6rem",
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
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "#212121",
              margin: 0,
            }}
          >
            ₹{total.toLocaleString()}
          </p>
        </div>

        <div style={{ backgroundColor: "#e0e0e0", width: "1px" }} />

        {/* Paid */}
        <button
          type="button"
          data-ocid={`order_list.paid_tab.${index + 1}`}
          onClick={() => onToggle(order.id, "paid")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "center",
            padding: "0.25rem 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.1rem",
          }}
        >
          <p
            style={{
              fontSize: "0.6rem",
              color: currentExpanded === "paid" ? "#2e7d32" : "#9e9e9e",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              fontWeight: 700,
              margin: 0,
            }}
          >
            PAID
          </p>
          <p
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "#2e7d32",
              margin: 0,
            }}
          >
            ₹{paid.toLocaleString()}
          </p>
          {currentExpanded === "paid" ? (
            <ChevronUp size={12} color="#2e7d32" />
          ) : (
            <ChevronDown size={12} color="#9e9e9e" />
          )}
        </button>

        <div style={{ backgroundColor: "#e0e0e0", width: "1px" }} />

        {/* Due */}
        <div style={{ textAlign: "center", padding: "0.25rem 0" }}>
          <p
            style={{
              fontSize: "0.6rem",
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
              fontSize: "0.95rem",
              fontWeight: 800,
              color: due > 0 ? "#c62828" : "#2e7d32",
              margin: 0,
            }}
          >
            ₹{due.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expanded: Bricks Order History */}
      {currentExpanded === "bricks" && (
        <div
          style={{
            marginTop: "0.75rem",
            borderTop: "1px solid #f0f0f0",
            paddingTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: 0,
            }}
          >
            Bricks Order History
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#e8f5e9",
              borderRadius: "0.75rem",
              padding: "0.65rem 0.875rem",
              marginBottom: "0.5rem",
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
              Total Bricks
            </span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#1b5e20",
              }}
            >
              {totalBricksInOrder.toLocaleString()}
            </span>
          </div>

          <div
            data-ocid={`order_list.bricks_history.item.${index + 1}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f1f8e9",
              borderRadius: "0.75rem",
              padding: "0.65rem 0.875rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Clock size={14} color="#2e7d32" />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#424242",
                  }}
                >
                  {order.date}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    color: "#9e9e9e",
                  }}
                >
                  {orderTime}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {order.bricks.map((item) => (
                <p
                  key={item.brickType}
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#1b5e20",
                  }}
                >
                  {item.brickType}: {item.qty.toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded: Payment History */}
      {currentExpanded === "paid" && (
        <div
          style={{
            marginTop: "0.75rem",
            borderTop: "1px solid #f0f0f0",
            paddingTop: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: 0,
            }}
          >
            Payment History
          </p>
          {paymentHistory.length === 0 ? (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#9e9e9e",
                margin: 0,
                textAlign: "center",
                padding: "0.5rem",
              }}
            >
              No payment history
            </p>
          ) : (
            paymentHistory.map((rec, i) => (
              <div
                key={`${rec.date}-${rec.time}-${i}`}
                data-ocid={`order_list.payment_history.item.${i + 1}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f1f8e9",
                  borderRadius: "0.75rem",
                  padding: "0.65rem 0.875rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Clock size={14} color="#2e7d32" />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#424242",
                      }}
                    >
                      {rec.date}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.7rem",
                        color: "#9e9e9e",
                      }}
                    >
                      {rec.time}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "#2e7d32",
                  }}
                >
                  +₹{rec.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ClosedOrderCard({
  order,
  index,
  onDelete,
}: {
  order: LocalOrder;
  index: number;
  onDelete: (id: string) => void;
}) {
  const totalBricksInOrder = order.bricks.reduce((sum, b) => sum + b.qty, 0);

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
        gap: "0.5rem",
      }}
    >
      {/* Header: Closed badge + delete */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <CheckCircle2 size={13} color="#2e7d32" />
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#2e7d32",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              backgroundColor: "#e8f5e9",
              borderRadius: "2rem",
              padding: "0.15rem 0.5rem",
            }}
          >
            Order Closed
          </span>
        </div>
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
          }}
        >
          <Trash2 size={13} color="#c62828" />
        </button>
      </div>

      <div style={{ height: "1px", backgroundColor: "#c8e6c9" }} />

      {/* Date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            color: "#757575",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Date
        </span>
        <span
          style={{ fontSize: "0.85rem", fontWeight: 700, color: "#212121" }}
        >
          {order.date}
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            color: "#757575",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Name
        </span>
        <span
          style={{ fontSize: "0.95rem", fontWeight: 800, color: "#2e7d32" }}
        >
          {order.customerName}
        </span>
      </div>

      {/* Phone */}
      {order.phone && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "#757575",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Phone
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Phone size={13} color="#616161" />
            <span
              style={{ fontSize: "0.85rem", fontWeight: 600, color: "#424242" }}
            >
              {order.phone}
            </span>
          </div>
        </div>
      )}

      {/* Address */}
      {order.address && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "#757575",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            Address
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#424242",
              textAlign: "right",
            }}
          >
            {order.address}
          </span>
        </div>
      )}

      <div style={{ height: "1px", backgroundColor: "#c8e6c9" }} />

      {/* Bricks Type & Quantity */}
      <div>
        <span
          style={{
            fontSize: "0.7rem",
            color: "#757575",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Bricks
        </span>
        <div
          style={{
            marginTop: "0.35rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {order.bricks.map((b) => (
            <div
              key={b.brickType}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#e8f5e9",
                borderRadius: "0.5rem",
                padding: "0.3rem 0.6rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#2e7d32",
                }}
              >
                {b.brickType}
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#1b5e20",
                }}
              >
                {b.qty.toLocaleString()}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.2rem 0.6rem",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#388e3c",
                textTransform: "uppercase",
              }}
            >
              Total
            </span>
            <span
              style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1b5e20" }}
            >
              {totalBricksInOrder.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: "1px", backgroundColor: "#c8e6c9" }} />

      {/* Rate */}
      {order.rate !== undefined && order.rate > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "#757575",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Rate
          </span>
          <span
            style={{ fontSize: "0.85rem", fontWeight: 700, color: "#424242" }}
          >
            ₹{order.rate.toLocaleString()}/brick
          </span>
        </div>
      )}

      {/* Payment */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0.4rem",
          marginTop: "0.25rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            padding: "0.5rem 0.4rem",
            textAlign: "center",
            border: "1px solid #c8e6c9",
          }}
        >
          <p
            style={{
              fontSize: "0.55rem",
              color: "#757575",
              fontWeight: 700,
              textTransform: "uppercase",
              margin: "0 0 0.2rem",
            }}
          >
            TOTAL
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#212121",
              margin: 0,
            }}
          >
            ₹{order.totalAmount.toLocaleString()}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            padding: "0.5rem 0.4rem",
            textAlign: "center",
            border: "1px solid #c8e6c9",
          }}
        >
          <p
            style={{
              fontSize: "0.55rem",
              color: "#757575",
              fontWeight: 700,
              textTransform: "uppercase",
              margin: "0 0 0.2rem",
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
            }}
          >
            ₹{order.paidAmount.toLocaleString()}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            padding: "0.5rem 0.4rem",
            textAlign: "center",
            border: "1px solid #c8e6c9",
          }}
        >
          <p
            style={{
              fontSize: "0.55rem",
              color: "#757575",
              fontWeight: 700,
              textTransform: "uppercase",
              margin: "0 0 0.2rem",
            }}
          >
            DUE
          </p>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#2e7d32",
              margin: 0,
            }}
          >
            ₹{order.dueAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderListPage({ onBack, filterClosed }: Props) {
  const [orders, setOrders] = useState<LocalOrder[]>(() => getLocalOrders());
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState<
    Record<string, "bricks" | "paid" | null>
  >({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  function toggleExpanded(orderId: string, tab: "bricks" | "paid") {
    setExpanded((prev) => ({
      ...prev,
      [orderId]: prev[orderId] === tab ? null : tab,
    }));
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
        {/* Search Bar */}
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

        {/* Date Filters */}
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
        {/* filterClosed mode: only show closed orders */}
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
                {/* Completed Orders header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#c8e6c9",
                    borderRadius: "0.75rem",
                    padding: "0.6rem 0.875rem",
                  }}
                >
                  <CheckCircle2 size={16} color="#2e7d32" />
                  <p
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "#1b5e20",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      margin: 0,
                    }}
                  >
                    COMPLETED ORDERS ({displayOrders?.length ?? 0})
                  </p>
                </div>
                {displayOrders?.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    expanded={expanded}
                    onToggle={toggleExpanded}
                    onDelete={requestDelete}
                    closed
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {filtered.length === 0 && (
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

            {/* Active Orders */}
            {activeOrders.length > 0 && (
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
                    expanded={expanded}
                    onToggle={toggleExpanded}
                    onDelete={requestDelete}
                  />
                ))}
              </>
            )}

            {/* Closed Orders */}
            {closedOrders.length > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: activeOrders.length > 0 ? "0.5rem" : 0,
                  }}
                >
                  <CheckCircle2 size={15} color="#2e7d32" />
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
                    Order Closed ({closedOrders.length})
                  </p>
                </div>
                {closedOrders.map((order, index) => (
                  <ClosedOrderCard
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
