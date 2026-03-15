// Local order storage using localStorage as primary store
// This ensures orders save instantly without depending on canister availability

export interface PaymentRecord {
  date: string;
  time: string;
  amount: number;
  invoiceNo?: string;
}

export interface LocalOrder {
  id: string;
  date: string;
  customerName: string;
  address: string;
  phone: string;
  invoiceNo?: string;
  approxDeliveryDate?: string;
  bricks: { brickType: string; qty: number }[];
  totalBricks: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: number;
  paymentHistory?: PaymentRecord[];
}

const STORAGE_KEY = "sbco_orders";

export function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalOrder[];
  } catch {
    return [];
  }
}

export function saveLocalOrder(
  order: Omit<LocalOrder, "id" | "createdAt">,
): LocalOrder {
  const orders = getLocalOrders();
  const newOrder: LocalOrder = {
    ...order,
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    paymentHistory:
      order.paidAmount > 0
        ? [
            {
              date: order.date,
              time: new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              amount: order.paidAmount,
            },
          ]
        : [],
  };
  orders.unshift(newOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return newOrder;
}

export function addPaymentToOrder(
  orderId: string,
  amount: number,
  date: string,
  time: string,
  invoiceNo?: string,
): void {
  const orders = getLocalOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;
  const order = orders[idx];
  const newPaid = order.paidAmount + amount;
  const newDue = Math.max(0, order.totalAmount - newPaid);
  orders[idx] = {
    ...order,
    paidAmount: newPaid,
    dueAmount: newDue,
    paymentHistory: [
      ...(order.paymentHistory || []),
      { date, time, amount, invoiceNo },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function deleteLocalOrder(id: string): void {
  const orders = getLocalOrders().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getLocalMetrics() {
  const orders = getLocalOrders();
  return {
    totalOrders: orders.length,
    totalPaidAmount: orders.reduce((s, o) => s + o.paidAmount, 0),
    totalDueAmount: orders.reduce((s, o) => s + o.dueAmount, 0),
    bricksDispatched: orders.reduce((s, o) => s + o.totalBricks, 0),
    orderClosed: 0,
  };
}
