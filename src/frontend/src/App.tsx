import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  Layers,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import AddOrderPage from "./AddOrderPage";
import AddPaymentPage from "./AddPaymentPage";
import AddVehiclePage from "./AddVehiclePage";
import DeliveryPage from "./DeliveryPage";
import DueAmountListPage from "./DueAmountListPage";
import OrderListPage from "./OrderListPage";
import { getLocalMetrics } from "./localOrderStore";

type Page =
  | "dashboard"
  | "addOrder"
  | "orderList"
  | "closedOrders"
  | "addPayment"
  | "addVehicle"
  | "delivery"
  | "dueAmountList";

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatDateTime(date: Date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = days[date.getDay()];
  const d = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}, ${d} ${month} ${year} · ${hours}:${minutes} ${ampm}`;
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  ocid,
  onClick,
  tappable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  ocid: string;
  onClick?: () => void;
  tappable?: boolean;
}) {
  const inner = (
    <>
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: iconBg,
          width: "clamp(1.8rem, 5.5vw, 2.5rem)",
          height: "clamp(1.8rem, 5.5vw, 2.5rem)",
        }}
      >
        <span
          style={{ color: iconColor, display: "flex", alignItems: "center" }}
        >
          {icon}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <p
          className="font-bold tracking-wider uppercase leading-tight"
          style={{
            fontSize: "clamp(0.55rem, 1.8vw, 0.7rem)",
            color: "#757575",
          }}
        >
          {label}
        </p>
        <p
          className="font-bold leading-none mt-0.5"
          style={{ color: "#212121", fontSize: "clamp(1.2rem, 4vw, 1.8rem)" }}
        >
          {value}
        </p>
      </div>
      {tappable && (
        <ChevronRight style={{ color: "#bdbdbd", flexShrink: 0 }} size={16} />
      )}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        data-ocid={ocid}
        onClick={onClick}
        className="rounded-2xl shadow-sm flex flex-col justify-between active:scale-95 transition-transform text-left"
        style={{
          padding: "clamp(0.5rem, 1.8vh, 1rem)",
          backgroundColor: "#ffffff",
          border: "none",
          cursor: "pointer",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      data-ocid={ocid}
      className="rounded-2xl shadow-sm flex flex-col justify-between"
      style={{
        padding: "clamp(0.5rem, 1.8vh, 1rem)",
        backgroundColor: "#ffffff",
      }}
    >
      {inner}
    </div>
  );
}

function ActionCard({
  icon,
  label,
  ocid,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  ocid: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className="rounded-2xl shadow-sm flex flex-col items-center justify-center w-full active:scale-95 transition-transform"
      style={{
        padding: "clamp(0.5rem, 1.8vh, 1rem)",
        gap: "clamp(0.3rem, 1vh, 0.6rem)",
        backgroundColor: "#ffffff",
      }}
    >
      <span style={{ color: "#1b5e20", display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      <p
        className="font-bold tracking-wider uppercase text-center leading-tight"
        style={{ color: "#1b5e20", fontSize: "clamp(0.55rem, 1.8vw, 0.72rem)" }}
      >
        {label}
      </p>
    </button>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const now = useLiveClock();
  const metrics = getLocalMetrics();
  const fmt = (v: number | undefined) => (v !== undefined ? v.toString() : "0");

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="w-full max-w-[430px]"
        style={{
          backgroundColor: "#ffffff",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          className="flex items-center justify-between flex-shrink-0"
          style={{
            paddingLeft: "clamp(0.75rem, 3vw, 1.25rem)",
            paddingRight: "clamp(0.75rem, 3vw, 1.25rem)",
            paddingTop: "clamp(0.6rem, 2.5vh, 1.5rem)",
            paddingBottom: "clamp(0.4rem, 1.5vh, 0.75rem)",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            <h1
              className="font-extrabold leading-tight tracking-tight"
              style={{
                color: "#1b5e20",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: "clamp(0.95rem, 3.5vw, 1.25rem)",
              }}
            >
              SBCO BRICK FIELD
            </h1>
            <p
              className="font-semibold"
              style={{
                color: "#2e7d32",
                fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
              }}
            >
              Order Management
            </p>
          </div>
          <button
            type="button"
            data-ocid="profile.button"
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "#e8f5e9",
              width: "clamp(2rem, 6vw, 2.75rem)",
              height: "clamp(2rem, 6vw, 2.75rem)",
              border: "1.5px solid #a5d6a7",
            }}
          >
            <User
              style={{
                color: "#2e7d32",
                width: "clamp(1rem, 3vw, 1.375rem)",
                height: "clamp(1rem, 3vw, 1.375rem)",
              }}
            />
          </button>
        </header>

        <div
          className="flex-shrink-0"
          style={{
            paddingLeft: "clamp(0.75rem, 3vw, 1.25rem)",
            paddingRight: "clamp(0.75rem, 3vw, 1.25rem)",
            paddingBottom: "clamp(0.5rem, 1.8vh, 1.25rem)",
            backgroundColor: "#ffffff",
          }}
        >
          <p
            style={{
              color: "#757575",
              fontSize: "clamp(0.65rem, 2vw, 0.875rem)",
              marginTop: "0.15rem",
            }}
          >
            Welcome back,
          </p>
          <p
            className="font-extrabold leading-tight"
            style={{
              color: "#1b5e20",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(1.3rem, 5vw, 1.875rem)",
            }}
          >
            Admin
          </p>
          <div
            className="inline-flex items-center gap-1.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              fontSize: "clamp(0.6rem, 1.8vw, 0.75rem)",
              marginTop: "clamp(0.3rem, 1vh, 0.75rem)",
              paddingLeft: "clamp(0.5rem, 2vw, 1rem)",
              paddingRight: "clamp(0.5rem, 2vw, 1rem)",
              paddingTop: "clamp(0.2rem, 0.6vh, 0.375rem)",
              paddingBottom: "clamp(0.2rem, 0.6vh, 0.375rem)",
            }}
          >
            <span
              className="rounded-full flex-shrink-0"
              style={{
                backgroundColor: "#43a047",
                width: "clamp(0.4rem, 1.2vw, 0.5rem)",
                height: "clamp(0.4rem, 1.2vw, 0.5rem)",
              }}
            />
            {formatDateTime(now)}
          </div>
        </div>

        <main
          className="flex flex-col flex-1 overflow-hidden"
          style={{
            paddingLeft: "clamp(0.6rem, 2.5vw, 1rem)",
            paddingRight: "clamp(0.6rem, 2.5vw, 1rem)",
            paddingTop: "clamp(0.5rem, 1.8vh, 1.25rem)",
            paddingBottom: "clamp(0.3rem, 1vh, 0.6rem)",
            gap: "clamp(0.3rem, 1vh, 0.75rem)",
            backgroundColor: "#f1f8e9",
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
          }}
        >
          <p
            className="font-bold tracking-widest uppercase flex-shrink-0"
            style={{
              color: "#2e7d32",
              fontSize: "clamp(0.55rem, 1.8vw, 0.7rem)",
            }}
          >
            Dashboard Overview
          </p>

          <div
            className="grid grid-cols-2 flex-1"
            style={{ gap: "clamp(0.35rem, 1.2vw, 0.65rem)" }}
          >
            <StatCard
              ocid="stats.total_orders.button"
              icon={
                <Package
                  style={{
                    width: "clamp(0.9rem, 2.8vw, 1.375rem)",
                    height: "clamp(0.9rem, 2.8vw, 1.375rem)",
                  }}
                />
              }
              label="TOTAL BRICKS ORDER"
              value={fmt(metrics?.totalOrders)}
              iconBg="#ff9800"
              iconColor="#ffffff"
              onClick={() => onNavigate("orderList")}
              tappable
            />
            <StatCard
              ocid="stats.item.2"
              icon={
                <CheckCircle2
                  style={{
                    width: "clamp(0.9rem, 2.8vw, 1.375rem)",
                    height: "clamp(0.9rem, 2.8vw, 1.375rem)",
                  }}
                />
              }
              label="ORDER CLOSED"
              value={fmt(metrics?.orderClosed)}
              iconBg="#43a047"
              iconColor="#ffffff"
              onClick={() => onNavigate("closedOrders")}
              tappable
            />
            <StatCard
              ocid="stats.item.3"
              icon={
                <Layers
                  style={{
                    width: "clamp(0.9rem, 2.8vw, 1.375rem)",
                    height: "clamp(0.9rem, 2.8vw, 1.375rem)",
                  }}
                />
              }
              label="TOTAL DUE AMOUNT"
              value={fmt(metrics?.totalDueAmount)}
              iconBg="#1e88e5"
              iconColor="#ffffff"
              onClick={() => onNavigate("dueAmountList")}
              tappable
            />
            <StatCard
              ocid="stats.item.4"
              icon={
                <IndianRupee
                  style={{
                    width: "clamp(0.9rem, 2.8vw, 1.375rem)",
                    height: "clamp(0.9rem, 2.8vw, 1.375rem)",
                  }}
                />
              }
              label="TOTAL PAID AMOUNT"
              value={fmt(metrics?.totalPaidAmount)}
              iconBg="#1b5e20"
              iconColor="#ffffff"
            />
          </div>

          <p
            className="font-bold tracking-widest uppercase flex-shrink-0"
            style={{
              color: "#2e7d32",
              fontSize: "clamp(0.55rem, 1.8vw, 0.7rem)",
            }}
          >
            Quick Actions
          </p>

          <div
            className="grid grid-cols-2 flex-1"
            style={{ gap: "clamp(0.35rem, 1.2vw, 0.65rem)" }}
          >
            <ActionCard
              ocid="action.add_order.button"
              icon={
                <ShoppingCart
                  strokeWidth={1.8}
                  style={{
                    width: "clamp(1rem, 3.2vw, 1.625rem)",
                    height: "clamp(1rem, 3.2vw, 1.625rem)",
                  }}
                />
              }
              label="ADD ORDER"
              onClick={() => onNavigate("addOrder")}
            />
            <ActionCard
              ocid="action.delivery.button"
              icon={
                <Truck
                  strokeWidth={1.8}
                  style={{
                    width: "clamp(1rem, 3.2vw, 1.625rem)",
                    height: "clamp(1rem, 3.2vw, 1.625rem)",
                  }}
                />
              }
              label="DELIVERY"
              onClick={() => onNavigate("delivery")}
            />
            <ActionCard
              ocid="action.add_vehicle.button"
              icon={
                <span className="relative flex items-center">
                  <Truck
                    strokeWidth={1.8}
                    style={{
                      width: "clamp(1rem, 3.2vw, 1.625rem)",
                      height: "clamp(1rem, 3.2vw, 1.625rem)",
                    }}
                  />
                  <Plus
                    strokeWidth={2.5}
                    className="absolute -top-1 -right-2"
                    style={{
                      width: "clamp(0.6rem, 1.8vw, 0.8rem)",
                      height: "clamp(0.6rem, 1.8vw, 0.8rem)",
                    }}
                  />
                </span>
              }
              label="ADD VEHICLE"
              onClick={() => onNavigate("addVehicle")}
            />
            <ActionCard
              ocid="action.add_payment.button"
              icon={
                <span className="relative flex items-center">
                  <IndianRupee
                    strokeWidth={1.8}
                    style={{
                      width: "clamp(1rem, 3.2vw, 1.625rem)",
                      height: "clamp(1rem, 3.2vw, 1.625rem)",
                    }}
                  />
                  <Plus
                    strokeWidth={2.5}
                    className="absolute -top-1 -right-2"
                    style={{
                      width: "clamp(0.6rem, 1.8vw, 0.8rem)",
                      height: "clamp(0.6rem, 1.8vw, 0.8rem)",
                    }}
                  />
                </span>
              }
              label="ADD PAYMENT"
              onClick={() => onNavigate("addPayment")}
            />
          </div>
        </main>

        <footer
          className="text-center flex-shrink-0"
          style={{
            fontSize: "clamp(0.5rem, 1.5vw, 0.625rem)",
            paddingTop: "clamp(0.2rem, 0.8vh, 0.4rem)",
            paddingBottom: "clamp(0.2rem, 0.8vh, 0.4rem)",
            backgroundColor: "#f1f8e9",
            color: "#558b2f",
          }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <>
      <Toaster />
      {page === "dashboard" && <Dashboard onNavigate={setPage} />}
      {page === "addOrder" && (
        <AddOrderPage onBack={() => setPage("dashboard")} />
      )}
      {page === "orderList" && (
        <OrderListPage onBack={() => setPage("dashboard")} />
      )}
      {page === "closedOrders" && (
        <OrderListPage
          onBack={() => setPage("dashboard")}
          filterClosed={true}
        />
      )}
      {page === "addPayment" && (
        <AddPaymentPage onBack={() => setPage("dashboard")} />
      )}
      {page === "addVehicle" && (
        <AddVehiclePage onBack={() => setPage("dashboard")} />
      )}
      {page === "delivery" && (
        <DeliveryPage onBack={() => setPage("dashboard")} />
      )}
      {page === "dueAmountList" && (
        <DueAmountListPage onBack={() => setPage("dashboard")} />
      )}
    </>
  );
}
