import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppInfo {
    name: string;
    description: string;
    author: string;
    version: string;
}
export interface BrickItem {
    qty: bigint;
    brickType: string;
}
export interface Order {
    id: bigint;
    customerName: string;
    brickItems: Array<BrickItem>;
    date: string;
    createdAt: bigint;
    totalAmount: bigint;
    address: string;
    phone: string;
    paidAmount: bigint;
    totalBricks: bigint;
    dueAmount: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Metrics {
    totalOrders: bigint;
    bricksDispatched: bigint;
    orderClosed: bigint;
    totalPaidAmount: bigint;
    totalDueAmount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrder(date: string, customerName: string, address: string, phone: string, brickItems: Array<BrickItem>, totalBricks: bigint, totalAmount: bigint, paidAmount: bigint, dueAmount: bigint): Promise<bigint>;
    getAppInfo(): Promise<AppInfo>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMetrics(): Promise<Metrics>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listOrders(): Promise<Array<Order>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMetrics(updatedMetrics: Metrics): Promise<void>;
}
