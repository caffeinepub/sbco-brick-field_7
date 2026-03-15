import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { BrickItem } from "./backend.d";
import { useActor } from "./hooks/useActor";

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

function isCanisterStoppedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("IC0508") ||
    msg.includes("Canister is stopped") ||
    msg.includes("canister is stopped")
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Props {
  onBack: () => void;
}

function stopEvent(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export default function AddOrderPage({ onBack }: Props) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(todayDate());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedBricks, setSelectedBricks] = useState<Record<string, number>>(
    {},
  );
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

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

  async function callCreateOrder() {
    if (!actor) throw new Error("No actor");
    const brickItems: BrickItem[] = Object.entries(selectedBricks)
      .filter(([, qty]) => qty > 0)
      .map(([brickType, qty]) => ({ brickType, qty: BigInt(qty) }));

    // Retry up to 3 times with delay if canister is stopped
    const maxRetries = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          await sleep(2000 * attempt);
        }
        const result = await actor.createOrder(
          date,
          customerName,
          address,
          phone,
          brickItems,
          BigInt(totalBricksQty),
          BigInt(Number(totalAmount) || 0),
          BigInt(Number(paidAmount) || 0),
          BigInt(dueAmount),
        );
        setIsRetrying(false);
        return result;
      } catch (err) {
        lastError = err;
        if (isCanisterStoppedError(err) && attempt < maxRetries - 1) {
          // Will retry after delay
          continue;
        }
        break;
      }
    }
    setIsRetrying(false);
    throw lastError;
  }

  const createOrderMutation = useMutation({
    mutationFn: callCreateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order saved successfully!");
      setRetryCount(0);
      onBack();
    },
    onError: (error: unknown) => {
      if (isCanisterStoppedError(error)) {
        setRetryCount((c) => c + 1);
        toast.error(
          "Service is temporarily unavailable. Please tap 'Retry' to try again.",
        );
      } else {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(message || "Failed to save order. Please try again.");
      }
    },
  });

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

  const isPending = createOrderMutation.isPending || isRetrying;

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
        {/* Customer Information */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Customer Information</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div>
              <label htmlFor="order-date" style={labelStyle}>
                Date
              </label>
              <input
                id="order-date"
                data-ocid="add_order.date.input"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                style={inputStyle}
              />
            </div>
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
                          padding: "0.35rem 0.5rem",
                          fontSize: "0.8rem",
                          border: "1.5px solid #a5d6a7",
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
          data-ocid="add_order.total_bricks.panel"
          style={{
            backgroundColor: "#2e7d32",
            borderRadius: "1rem",
            padding: "0.875rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.75rem",
              color: "#c8e6c9",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Total Bricks
          </span>
          <span
            style={{ fontWeight: 900, fontSize: "1.5rem", color: "#ffffff" }}
          >
            {totalBricksQty.toLocaleString()}
          </span>
        </div>

        {/* Payment */}
        <div style={cardStyle}>
          <p style={sectionLabelStyle}>Payment</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div>
              <label htmlFor="order-total-amount" style={labelStyle}>
                Total Amount (৳)
              </label>
              <input
                id="order-total-amount"
                data-ocid="add_order.total_amount.input"
                type="number"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-paid-amount" style={labelStyle}>
                Paid Amount (৳)
              </label>
              <input
                id="order-paid-amount"
                data-ocid="add_order.paid_amount.input"
                type="number"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="order-due-amount" style={labelStyle}>
                Due Amount (৳)
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

        {createOrderMutation.isSuccess ? (
          <div
            data-ocid="add_order.save_order.success_state"
            style={{
              backgroundColor: "#e8f5e9",
              border: "1.5px solid #a5d6a7",
              borderRadius: "0.875rem",
              padding: "0.875rem",
              textAlign: "center",
              color: "#1b5e20",
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          >
            Order saved successfully!
          </div>
        ) : createOrderMutation.isError &&
          isCanisterStoppedError(createOrderMutation.error) ? (
          <button
            type="button"
            data-ocid="add_order.retry.button"
            disabled={isPending}
            onClick={() => createOrderMutation.mutate()}
            style={{
              backgroundColor: isPending ? "#e65100" : "#bf360c",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.875rem",
              padding: "0.875rem",
              width: "100%",
              fontWeight: 800,
              fontSize: "0.9rem",
              letterSpacing: "0.05em",
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {isPending ? (
              <>
                <span data-ocid="add_order.save_order.loading_state">
                  <Loader2 size={16} className="animate-spin" />
                </span>
                {isRetrying ? "Retrying..." : "Saving..."}
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Retry Save Order {retryCount > 0 ? `(${retryCount})` : ""}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            data-ocid="add_order.save_order.button"
            disabled={isPending}
            onClick={() => createOrderMutation.mutate()}
            style={{
              backgroundColor: isPending ? "#558b2f" : "#1b5e20",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.875rem",
              padding: "0.875rem",
              width: "100%",
              fontWeight: 800,
              fontSize: "0.9rem",
              letterSpacing: "0.05em",
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {isPending ? (
              <>
                <span data-ocid="add_order.save_order.loading_state">
                  <Loader2 size={16} className="animate-spin" />
                </span>
                {isRetrying ? "Retrying..." : "Saving..."}
              </>
            ) : (
              "Save Order"
            )}
          </button>
        )}

        <div style={{ height: "1rem" }} />
      </main>
    </div>
  );
}
