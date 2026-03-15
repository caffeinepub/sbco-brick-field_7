import { ArrowLeft, CalendarDays, Check } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { saveLocalOrder } from "./localOrderStore";

const BRICK_TYPES = [
  "1 No Bricks",
  "2 No Bricks",
  "3 No Bricks",
  "1 No Picket",
  "2 No Picket",
  "Crack",
  "Goria",
  "Bats",
];

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

interface Props {
  onBack: () => void;
}

function stopEvent(e: React.SyntheticEvent) {
  e.stopPropagation();
}

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  borderColor?: string;
  ocid?: string;
}

function DatePickerField({
  label,
  value,
  onChange,
  borderColor,
  ocid,
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }

  const border = `1.5px solid ${borderColor || "#a5d6a7"}`;
  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#2e7d32",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "0.3rem",
    display: "block",
  };

  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="date"
          data-ocid={ocid}
          value={toInputValue(value)}
          onChange={(e) => onChange(fromInputValue(e.target.value))}
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
          onClick={openPicker}
          style={{
            border,
            borderRadius: "0.75rem",
            padding: "0.6rem 0.875rem",
            fontSize: "0.875rem",
            color: value ? "#212121" : "#9e9e9e",
            backgroundColor: "#ffffff",
            width: "100%",
            cursor: "pointer",
            boxSizing: "border-box" as const,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{value || "Select date"}</span>
          <CalendarDays
            size={16}
            color={borderColor === "#ffb74d" ? "#e65100" : "#2e7d32"}
          />
        </button>
      </div>
    </div>
  );
}

export default function AddOrderPage({ onBack }: Props) {
  const [date, setDate] = useState(todayDate());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [approxDeliveryDate, setApproxDeliveryDate] = useState("");
  const [selectedBricks, setSelectedBricks] = useState<Record<string, number>>(
    {},
  );
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const dueAmount = Math.max(
    0,
    (Number(totalAmount) || 0) - (Number(paidAmount) || 0),
  );
  const totalBricksQty = Object.values(selectedBricks).reduce(
    (a, b) => a + b,
    0,
  );

  function toggleBrick(type: string) {
    setSelectedBricks((prev) => {
      if (type in prev) {
        const next = { ...prev };
        delete next[type];
        return next;
      }
      return { ...prev, [type]: 0 };
    });
  }

  function setBrickQty(type: string, qty: number) {
    setSelectedBricks((prev) => ({ ...prev, [type]: qty }));
  }

  function handleSave() {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (Object.keys(selectedBricks).length === 0) {
      toast.error("Please select at least one brick type");
      return;
    }
    if (!totalAmount) {
      toast.error("Total amount is required");
      return;
    }

    const bricks = Object.entries(selectedBricks)
      .filter(([, qty]) => qty > 0)
      .map(([brickType, qty]) => ({ brickType, qty }));

    saveLocalOrder({
      date,
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      invoiceNo: invoiceNo.trim(),
      approxDeliveryDate: approxDeliveryDate.trim(),
      bricks,
      totalBricks: totalBricksQty,
      totalAmount: Number(totalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      dueAmount,
    });
    toast.success("Order saved successfully!");
    onBack();
  }

  const inputStyle = {
    border: "1.5px solid #a5d6a7",
    borderRadius: "0.75rem",
    padding: "0.6rem 0.875rem",
    fontSize: "0.875rem",
    color: "#212121",
    backgroundColor: "#ffffff",
    width: "100%",
    outline: "none",
  };
  const labelStyle = {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#2e7d32",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "0.3rem",
    display: "block",
  };
  const sectionLabelStyle = {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#2e7d32",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    marginBottom: "0.75rem",
  };
  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  };

  return (
    <div
      style={{
        backgroundColor: "#f1f8e9",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}
    >
      <header
        style={{
          backgroundColor: "#ffffff",
          padding: "0.875rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          borderBottom: "1.5px solid #e8f5e9",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="add_order.back.button"
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
            fontSize: "1.1rem",
            color: "#1b5e20",
            margin: 0,
          }}
        >
          Add Order
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
          <p style={sectionLabelStyle}>Customer Information</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <DatePickerField
              label="Order Date"
              value={date}
              onChange={setDate}
              borderColor="#a5d6a7"
              ocid="add_order.date.input"
            />
            <div>
              <label htmlFor="order-customer-name" style={labelStyle}>
                Customer Name
              </label>
              <input
                id="order-customer-name"
                data-ocid="add_order.customer_name.input"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-address" style={labelStyle}>
                Address
              </label>
              <input
                id="order-address"
                data-ocid="add_order.address.input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-phone" style={labelStyle}>
                Phone Number
              </label>
              <input
                id="order-phone"
                data-ocid="add_order.phone.input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-invoice-no" style={labelStyle}>
                Invoice No
              </label>
              <input
                id="order-invoice-no"
                data-ocid="add_order.invoice_no.input"
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Enter invoice number"
                style={inputStyle}
              />
            </div>
            <DatePickerField
              label="Approx Delivery Date"
              value={approxDeliveryDate}
              onChange={setApproxDeliveryDate}
              borderColor="#ffb74d"
              ocid="add_order.approx_delivery_date.input"
            />
          </div>
        </div>

        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Brick Types</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.625rem",
            }}
          >
            {BRICK_TYPES.map((type, idx) => {
              const isSelected = type in selectedBricks;
              const qty = selectedBricks[type] ?? 0;
              const brickId = `brick-qty-${idx}`;
              return (
                <button
                  key={type}
                  type="button"
                  data-ocid={`add_order.brick.item.${idx + 1}`}
                  onClick={() => toggleBrick(type)}
                  style={{
                    border: isSelected
                      ? "2px solid #2e7d32"
                      : "1.5px solid #e0e0e0",
                    borderRadius: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: isSelected ? "#e8f5e9" : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: isSelected ? "#1b5e20" : "#424242",
                      }}
                    >
                      {type}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          backgroundColor: "#2e7d32",
                          borderRadius: "50%",
                          width: "1.1rem",
                          height: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div
                      style={{ marginTop: "0.5rem" }}
                      onClick={stopEvent}
                      onKeyDown={stopEvent}
                    >
                      <label
                        htmlFor={brickId}
                        style={{
                          ...labelStyle,
                          fontSize: "0.6rem",
                          marginBottom: "0.2rem",
                        }}
                        onClick={stopEvent}
                        onKeyDown={stopEvent}
                      >
                        Qty
                      </label>
                      <input
                        id={brickId}
                        type="number"
                        min={0}
                        value={qty === 0 ? "" : qty}
                        onChange={(e) =>
                          setBrickQty(type, Number(e.target.value) || 0)
                        }
                        onClick={stopEvent}
                        placeholder="0"
                        style={{
                          ...inputStyle,
                          padding: "0.4rem 0.6rem",
                          fontSize: "0.8rem",
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#2e7d32",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Total Bricks
          </span>
          <span
            style={{ color: "#ffffff", fontWeight: 900, fontSize: "1.5rem" }}
          >
            {totalBricksQty.toLocaleString()}
          </span>
        </div>

        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Payment</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div>
              <label htmlFor="order-total-amount" style={labelStyle}>
                Total Amount (₹)
              </label>
              <input
                id="order-total-amount"
                data-ocid="add_order.total_amount.input"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-paid-amount" style={labelStyle}>
                Paid Amount (₹)
              </label>
              <input
                id="order-paid-amount"
                data-ocid="add_order.paid_amount.input"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-due-amount" style={labelStyle}>
                Due Amount (₹)
              </label>
              <input
                id="order-due-amount"
                data-ocid="add_order.due_amount.input"
                type="number"
                value={dueAmount}
                readOnly
                style={{
                  ...inputStyle,
                  backgroundColor: "#f1f8e9",
                  color: dueAmount > 0 ? "#c62828" : "#2e7d32",
                  fontWeight: 700,
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          data-ocid="add_order.save_order.button"
          onClick={handleSave}
          style={{
            backgroundColor: "#1b5e20",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.875rem",
            padding: "0.875rem",
            width: "100%",
            fontWeight: 800,
            fontSize: "0.9rem",
            letterSpacing: "0.05em",
            cursor: "pointer",
          }}
        >
          Save Order
        </button>
        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
