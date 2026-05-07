export type UserRole = "owner" | "driver";
export type Language = "ur" | "en";
export type FuelType = "petrol" | "diesel" | "cng" | "hybrid";
export type PlatformId = "indrive" | "yango" | "other" | "private";
export type PaymentType = "cash" | "wallet" | "card";
export type SalaryType = "fixed" | "percentage" | "hybrid";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type SettlementStatus = "pending" | "settled";

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  language: Language;
  photoUrl?: string;
  cnic?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  plateNumber: string;
  makeModel: string;
  fuelType: FuelType;
  platforms: string[];
  insuranceExpiry?: string;
  photoUrl?: string;
  isActive: boolean;
}

export interface DriverAssignment {
  id: string;
  driverId: string;
  vehicleId: string;
  ownerId: string;
  salaryType: SalaryType;
  salaryAmount: number;
  hybridBase?: number;
  hybridPercent?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Ride {
  id: string;
  vehicleId: string;
  driverId: string;
  platform: PlatformId;
  fareAmount: number;
  paymentType: PaymentType;
  pickupArea?: string;
  dropoffArea?: string;
  distanceKm?: number;
  isDisputed: boolean;
  rideTime: string;
  loggedAt: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  loggedBy: string;
  category: string;
  amount: number;
  note?: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  date: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  amountPkr: number;
  litres: number;
  odometer?: number;
  pumpName?: string;
  date: string;
}

export interface Settlement {
  id: string;
  ownerId: string;
  driverId: string;
  vehicleId: string;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  totalExpenses: number;
  driverSalary: number;
  ownerProfit: number;
  status: SettlementStatus;
  settledAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalRides: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  weeklyData: { day: string; revenue: number }[];
}
