import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { addPaymentToOrder, getLocalOrders } from "./localOrderStore";
import type { LocalOrder } from "./localOrderStore";

interface Props {
  onBack: () => void;
}

function todayDate() {
  const d = new Date();
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toInputValue(str: string): string {
  const parts = str.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function fromInputValue(str: string): string {
  if (!str) return "";
  const parts = str.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generatePaymentInvoiceNo(): string {
  const key = "sbco_payment_invoice_counter";
  const current = Number.parseInt(localStorage.getItem(key) || "0", 10);
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return `PAY-${String(next).padStart(3, "0")}`;
}

export default function AddPaymentPage({ onBack }: Props) {
  const [date, setDate] = useState(todayDate());
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<LocalOrder | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const allOrders = useMemo(() => getLocalOrders(), []);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return allOrders
      .filter((o) =>
        o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 8);
  }, [search, allOrders]);

  function handleSelectOrder(order: LocalOrder) {
    setSelectedOrder(order);
    setSearch(order.customerName);
    setShowDropdown(false);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSelectedOrder(null);
    setShowDropdown(true);
  }

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }

  function handleSave() {
    if (!selectedOrder) {
      toast.error("Please select a customer");
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    const invoiceNo = generatePaymentInvoiceNo();
    addPaymentToOrder(selectedOrder.id, amount, date, nowTime(), invoiceNo);
    toast.success(`Payment saved! Invoice: ${invoiceNo}`);
    onBack();
  }

  const paymentNum = Number(paymentAmount) || 0;
  const currentDue = selectedOrder ? selectedOrder.dueAmount : 0;
  const remainingDue = currentDue - paymentNum;

  const inputStyle = {
    border: "1.5px solid #a5d6a7",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    color: "#424242",
    backgroundColor: "#ffffff",
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#424242",
    marginBottom: "0.4rem",
    display: "block",
  };
  const sectionLabelStyle = {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#2e7d32",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    marginBottom: "1rem",
  };
  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "1.25rem 1rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.875rem",
  };
  const readonlyInputStyle = { ...inputStyle, backgroundColor: "#f1f8e9" };

  return (
    <div
      style={{
        backgroundColor: "#eef5ee",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Bricolage Grotesque', sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
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
          data-ocid="add_payment.back.button"
          onClick={onBack}
          style={{
            backgroundColor: "#e8f5e9",
            border: "none",
            borderRadius: "50%",
            width: "2.25rem",
            height: "2.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="#1b5e20" />
        </button>
        <h2
          style={{
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#1b5e20",
            margin: 0,
          }}
        >
          Add Payment
        </h2>
      </header>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Payment Information</p>

          {/* Date picker */}
          <div>
            <p style={labelStyle}>Date</p>
            <div style={{ position: "relative" }}>
              <input
                ref={dateInputRef}
                type="date"
                data-ocid="add_payment.date.input"
                value={toInputValue(date)}
                onChange={(e) => setDate(fromInputValue(e.target.value))}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  zIndex: 2,
                  cursor: "pointer",
                }}
              />
              <button
                type="button"
                onClick={openDatePicker}
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span>{date}</span>
                <CalendarDays size={16} color="#2e7d32" />
              </button>
            </div>
          </div>

          {/* Customer Name Search */}
          <div style={{ position: "relative" }}>
            <label htmlFor="payment-customer-search" style={labelStyle}>
              Customer Name
            </label>
            <input
              id="payment-customer-search"
              data-ocid="add_payment.customer_search.input"
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => search && setShowDropdown(true)}
              placeholder="Type to search customer..."
              style={inputStyle}
              autoComplete="off"
            />
            {showDropdown && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #a5d6a7",
                  borderRadius: "0.75rem",
                  marginTop: "0.25rem",
                  zIndex: 100,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                {suggestions.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    data-ocid="add_payment.customer_suggestion.item.1"
                    onMouseDown={() => handleSelectOrder(order)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.15rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#2e7d32",
                      }}
                    >
                      {order.customerName}
                    </span>
                    {order.phone && (
                      <span style={{ fontSize: "0.75rem", color: "#9e9e9e" }}>
                        {order.phone}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="payment-address" style={labelStyle}>
              Address
            </label>
            <input
              id="payment-address"
              data-ocid="add_payment.address.input"
              type="text"
              value={selectedOrder?.address || ""}
              readOnly
              placeholder="Address"
              style={readonlyInputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="payment-phone" style={labelStyle}>
              Phone Number
            </label>
            <input
              id="payment-phone"
              data-ocid="add_payment.phone.input"
              type="text"
              value={selectedOrder?.phone || ""}
              readOnly
              placeholder="Phone Number"
              style={readonlyInputStyle}
            />
          </div>

          {/* Invoice Number - auto-filled from order */}
          <div>
            <label htmlFor="payment-invoice" style={labelStyle}>
              Invoice Number
            </label>
            <input
              id="payment-invoice"
              data-ocid="add_payment.invoice.input"
              type="text"
              value={selectedOrder?.invoiceNo || ""}
              readOnly
              placeholder="Auto-filled from order"
              style={readonlyInputStyle}
            />
          </div>

          {/* Current Due */}
          {selectedOrder && (
            <div
              style={{
                backgroundColor: "#fff8e1",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#e65100",
                }}
              >
                Current Due
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: remainingDue <= 0 ? "#2e7d32" : "#c62828",
                }}
              >
                ₹{remainingDue.toLocaleString()}
              </span>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label htmlFor="payment-amount" style={labelStyle}>
              Payment Amount
            </label>
            <input
              id="payment-amount"
              data-ocid="add_payment.amount.input"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Payment History */}
        {selectedOrder && (selectedOrder.paymentHistory || []).length > 0 && (
          <div style={cardStyle}>
            <p style={sectionLabelStyle}>Payment History</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {(selectedOrder.paymentHistory || []).map((rec, i) => (
                <div
                  key={`${rec.date}-${rec.time}-${i}`}
                  data-ocid={`add_payment.history.item.${i + 1}`}
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
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          data-ocid="add_payment.save_payment.button"
          onClick={handleSave}
          style={{
            backgroundColor: "#2e7d32",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.875rem",
            padding: "1rem",
            width: "100%",
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "0.03em",
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          Save Payment
        </button>
        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
