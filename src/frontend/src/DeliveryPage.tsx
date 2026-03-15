import { ArrowLeft, CalendarDays, Check, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getLocalVehicles } from "./AddVehiclePage";
import { getLocalOrders } from "./localOrderStore";

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

const DELIVERY_KEY = "sbco_deliveries";

export interface DeliveryRecord {
  id: string;
  date: string;
  customerName: string;
  address: string;
  phone: string;
  invoiceNo: string;
  vehicleNumber: string;
  bricks: { brickType: string; qty: number }[];
  totalBricks: number;
  createdAt: number;
}

export function getLocalDeliveries(): DeliveryRecord[] {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDelivery(
  d: Omit<DeliveryRecord, "id" | "createdAt">,
): DeliveryRecord {
  const all = getLocalDeliveries();
  const rec: DeliveryRecord = {
    ...d,
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  all.unshift(rec);
  localStorage.setItem(DELIVERY_KEY, JSON.stringify(all));
  return rec;
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

interface Props {
  onBack: () => void;
  preloadOrderId?: string;
}

function stopEvent(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function DatePickerField({
  label,
  value,
  onChange,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  ocid?: string;
}) {
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
  return (
    <div>
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#2e7d32",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </p>
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
            border: "1.5px solid #a5d6a7",
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
          <CalendarDays size={16} color="#2e7d32" />
        </button>
      </div>
    </div>
  );
}

export default function DeliveryPage({ onBack, preloadOrderId }: Props) {
  const [date, setDate] = useState(todayDate());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [selectedBricks, setSelectedBricks] = useState<Record<string, number>>(
    {},
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const vehicles = getLocalVehicles();
  const allOrders = getLocalOrders();

  // Preload order details when navigating from Order Details page
  useEffect(() => {
    if (!preloadOrderId) return;
    const order = allOrders.find((o) => o.id === preloadOrderId);
    if (order) {
      setCustomerName(order.customerName);
      setAddress(order.address || "");
      setPhone(order.phone || "");
      setInvoiceNo(order.invoiceNo || "");
      setSelectedOrderId(order.id);
    }
  }, [preloadOrderId, allOrders]);

  const totalBricksQty = Object.values(selectedBricks).reduce(
    (a, b) => a + b,
    0,
  );

  // Customer history for selected order
  const customerOrders = selectedOrderId
    ? allOrders.filter((o) => o.id === selectedOrderId)
    : allOrders.filter(
        (o) =>
          o.customerName.toLowerCase() === customerName.trim().toLowerCase(),
      );

  const customerDeliveries = getLocalDeliveries().filter(
    (d) => d.customerName.toLowerCase() === customerName.trim().toLowerCase(),
  );

  const totalOrdered = customerOrders.reduce((s, o) => s + o.totalBricks, 0);
  const totalAmount = customerOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = customerOrders.reduce((s, o) => s + o.paidAmount, 0);
  const totalDue = customerOrders.reduce((s, o) => s + o.dueAmount, 0);
  const totalDelivered = customerDeliveries.reduce(
    (s, d) => s + d.totalBricks,
    0,
  );
  const bricksRemaining = Math.max(0, totalOrdered - totalDelivered);

  // Aggregate brick type breakdown from all customer orders
  const brickTypeBreakdown: Record<string, number> = {};
  for (const order of customerOrders) {
    for (const b of order.bricks) {
      brickTypeBreakdown[b.brickType] =
        (brickTypeBreakdown[b.brickType] || 0) + b.qty;
    }
  }
  const brickBreakdownEntries = Object.entries(brickTypeBreakdown).filter(
    ([, qty]) => qty > 0,
  );

  // Aggregate delivered brick type breakdown from all customer deliveries
  const deliveredBrickBreakdown: Record<string, number> = {};
  for (const del of customerDeliveries) {
    for (const b of del.bricks) {
      deliveredBrickBreakdown[b.brickType] =
        (deliveredBrickBreakdown[b.brickType] || 0) + b.qty;
    }
  }
  const deliveredBreakdownEntries = Object.entries(
    deliveredBrickBreakdown,
  ).filter(([, qty]) => qty > 0);

  function handleNameChange(val: string) {
    setCustomerName(val);
    setSelectedOrderId(null);
    if (val.trim().length >= 1) {
      const matches = [
        ...new Set(
          allOrders
            .filter((o) =>
              o.customerName.toLowerCase().includes(val.toLowerCase()),
            )
            .map((o) => o.customerName),
        ),
      ];
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setAddress("");
      setPhone("");
      setInvoiceNo("");
    }
  }

  function selectSuggestion(name: string) {
    setCustomerName(name);
    setShowSuggestions(false);
    const order = allOrders.find((o) => o.customerName === name);
    if (order) {
      setAddress(order.address || "");
      setPhone(order.phone || "");
      setInvoiceNo(order.invoiceNo || "");
      setSelectedOrderId(order.id);
    }
  }

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
    if (!vehicleNumber) {
      toast.error("Please select a vehicle number");
      return;
    }
    const bricks = Object.entries(selectedBricks)
      .filter(([, qty]) => qty > 0)
      .map(([brickType, qty]) => ({ brickType, qty }));
    saveDelivery({
      date,
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      invoiceNo: invoiceNo.trim(),
      vehicleNumber,
      bricks,
      totalBricks: totalBricksQty,
    });
    toast.success("Delivery saved successfully!");
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
    boxSizing: "border-box" as const,
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
      {/* Header */}
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
          data-ocid="delivery.back.button"
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Truck size={20} color="#1b5e20" />
          <h2
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "#1b5e20",
              margin: 0,
            }}
          >
            Delivery
          </h2>
        </div>
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
        {/* Customer Info */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Customer Information</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <DatePickerField
              label="Delivery Date"
              value={date}
              onChange={setDate}
              ocid="delivery.date.input"
            />

            {/* Customer Name with autocomplete */}
            <div style={{ position: "relative" }}>
              <label htmlFor="del-customer-name" style={labelStyle}>
                Customer Name
              </label>
              <input
                id="del-customer-name"
                data-ocid="delivery.customer_name.input"
                type="text"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Enter customer name"
                style={inputStyle}
                autoComplete="off"
              />
              {showSuggestions && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #a5d6a7",
                    borderRadius: "0.75rem",
                    zIndex: 10,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      data-ocid={`delivery.customer_suggestion.item.${i + 1}`}
                      onMouseDown={() => selectSuggestion(s)}
                      style={{
                        width: "100%",
                        padding: "0.7rem 1rem",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "0.875rem",
                        color: "#1b5e20",
                        fontWeight: 600,
                        cursor: "pointer",
                        borderBottom:
                          i < suggestions.length - 1
                            ? "1px solid #e8f5e9"
                            : "none",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="del-address" style={labelStyle}>
                Address
              </label>
              <input
                id="del-address"
                data-ocid="delivery.address.input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="del-phone" style={labelStyle}>
                Phone Number
              </label>
              <input
                id="del-phone"
                data-ocid="delivery.phone.input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="del-invoice" style={labelStyle}>
                Invoice No
              </label>
              <input
                id="del-invoice"
                data-ocid="delivery.invoice_no.input"
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Invoice number"
                style={{
                  ...inputStyle,
                  backgroundColor: invoiceNo ? "#f1f8e9" : "#ffffff",
                }}
                readOnly={!!invoiceNo && !!selectedOrderId}
              />
            </div>
          </div>
        </div>

        {/* Brick Types */}
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
              const brickId = `del-brick-qty-${idx}`;
              return (
                <button
                  key={type}
                  type="button"
                  data-ocid={`delivery.brick.item.${idx + 1}`}
                  onClick={() => toggleBrick(type)}
                  style={{
                    border: isSelected
                      ? "2px solid #2e7d32"
                      : "1.5px solid #e0e0e0",
                    borderRadius: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: isSelected ? "#e8f5e9" : "#fafafa",
                    cursor: "pointer",
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
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: "#2e7d32",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.08em",
                          marginBottom: "0.2rem",
                          display: "block",
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
                          border: "1.5px solid #a5d6a7",
                          borderRadius: "0.75rem",
                          padding: "0.4rem 0.6rem",
                          fontSize: "0.8rem",
                          color: "#212121",
                          backgroundColor: "#ffffff",
                          width: "100%",
                          outline: "none",
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total Bricks */}
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

        {/* Vehicle Number Select */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Vehicle Number</p>
          {vehicles.length === 0 ? (
            <p
              style={{
                fontSize: "0.82rem",
                color: "#9e9e9e",
                textAlign: "center",
                padding: "0.75rem 0",
              }}
            >
              No vehicles saved. Add a vehicle first.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {vehicles.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  data-ocid={`delivery.vehicle.item.${i + 1}`}
                  onClick={() => setVehicleNumber(v.vehicleNumber)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    border:
                      vehicleNumber === v.vehicleNumber
                        ? "2px solid #2e7d32"
                        : "1.5px solid #e0e0e0",
                    backgroundColor:
                      vehicleNumber === v.vehicleNumber ? "#e8f5e9" : "#fafafa",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      backgroundColor:
                        vehicleNumber === v.vehicleNumber
                          ? "#2e7d32"
                          : "#e8f5e9",
                      borderRadius: "50%",
                      width: "2rem",
                      height: "2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Truck
                      size={14}
                      color={
                        vehicleNumber === v.vehicleNumber ? "#fff" : "#2e7d32"
                      }
                    />
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color:
                        vehicleNumber === v.vehicleNumber
                          ? "#1b5e20"
                          : "#424242",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {v.vehicleNumber}
                  </span>
                  {vehicleNumber === v.vehicleNumber && (
                    <span
                      style={{
                        marginLeft: "auto",
                        backgroundColor: "#2e7d32",
                        borderRadius: "50%",
                        width: "1.2rem",
                        height: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer History */}
        {customerName.trim() && customerOrders.length > 0 && (
          <div style={{ ...cardStyle, border: "1.5px solid #a5d6a7" }}>
            <p style={sectionLabelStyle}>
              Customer History — {customerName.trim()}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.6rem",
              }}
            >
              {/* Total Bricks Ordered - full width with breakdown */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#f9fbe7",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  border: "1px solid #dcedc8",
                }}
              >
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "#757575",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 0.25rem 0",
                  }}
                >
                  Total Bricks Ordered
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#1b5e20",
                    margin: "0 0 0.5rem 0",
                    lineHeight: 1.2,
                  }}
                >
                  {totalOrdered.toLocaleString()}{" "}
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#9e9e9e",
                      fontWeight: 400,
                    }}
                  >
                    bricks
                  </span>
                </p>
                {brickBreakdownEntries.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      borderTop: "1px solid #dcedc8",
                      paddingTop: "0.4rem",
                      marginTop: "0.1rem",
                    }}
                  >
                    {brickBreakdownEntries.map(([bType, qty]) => (
                      <div
                        key={bType}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#424242",
                            fontWeight: 600,
                          }}
                        >
                          {bType}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#1b5e20",
                            fontWeight: 800,
                          }}
                        >
                          {qty.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <HistoryBox
                label="Total Amount"
                value={`₹${totalAmount.toLocaleString()}`}
                color="#1565c0"
              />
              <HistoryBox
                label="Total Paid"
                value={`₹${totalPaid.toLocaleString()}`}
                color="#2e7d32"
              />
              <HistoryBox
                label="Total Due"
                value={`₹${totalDue.toLocaleString()}`}
                color={totalDue > 0 ? "#c62828" : "#2e7d32"}
              />
              <HistoryBox
                label="Bricks Remaining"
                value={bricksRemaining.toLocaleString()}
                unit="bricks"
                color="#6a1b9a"
              />

              {/* Bricks Delivered - full width with breakdown */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "#f9fbe7",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  border: "1px solid #dcedc8",
                }}
              >
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "#757575",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 0.25rem 0",
                  }}
                >
                  Bricks Delivered
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#e65100",
                    margin: "0 0 0.5rem 0",
                    lineHeight: 1.2,
                  }}
                >
                  {totalDelivered.toLocaleString()}{" "}
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#9e9e9e",
                      fontWeight: 400,
                    }}
                  >
                    bricks
                  </span>
                </p>
                {deliveredBreakdownEntries.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      borderTop: "1px solid #dcedc8",
                      paddingTop: "0.4rem",
                      marginTop: "0.1rem",
                    }}
                  >
                    {deliveredBreakdownEntries.map(([bType, qty]) => (
                      <div
                        key={bType}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#424242",
                            fontWeight: 600,
                          }}
                        >
                          {bType}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#e65100",
                            fontWeight: 800,
                          }}
                        >
                          {qty.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          data-ocid="delivery.save_delivery.button"
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
          Save Delivery
        </button>
        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}

function HistoryBox({
  label,
  value,
  unit,
  color,
}: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "#f9fbe7",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        border: "1px solid #dcedc8",
      }}
    >
      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#757575",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 0.25rem 0",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "1rem",
          fontWeight: 900,
          color,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      {unit && (
        <p style={{ fontSize: "0.6rem", color: "#9e9e9e", margin: 0 }}>
          {unit}
        </p>
      )}
    </div>
  );
}
