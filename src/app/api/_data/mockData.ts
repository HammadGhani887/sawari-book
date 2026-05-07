/**
 * Shared in-memory data for all API routes.
 * Lives at module scope — resets on server restart.
 * TODO: Replace all arrays with Prisma queries + MySQL.
 */
import type {
  Vehicle, Ride, Expense, FuelLog, Settlement, Notification, User, DriverAssignment,
} from "@/lib/types";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users: User[] = [
  { id: "1", phone: "3001234567", name: "Khalid Mehmood", role: "owner",  language: "en", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "2", phone: "3009876543", name: "Ahmed Ali",      role: "driver", language: "ur", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "3", phone: "3331234567", name: "Farhan Khan",    role: "driver", language: "en", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "4", phone: "3451234567", name: "Bilal Raza",     role: "driver", language: "ur", createdAt: "2026-03-01T00:00:00.000Z" },
];

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const vehicles: Vehicle[] = [
  { id: "v1", ownerId: "1", plateNumber: "LEA-1234", makeModel: "Suzuki Alto 2022",  fuelType: "petrol", platforms: ["indrive", "yango"], isActive: true },
  { id: "v2", ownerId: "1", plateNumber: "LEB-5678", makeModel: "Honda City 2021",   fuelType: "petrol", platforms: ["indrive"],          isActive: true },
];

// ── Driver assignments ────────────────────────────────────────────────────────
export const assignments: DriverAssignment[] = [
  { id: "a1", driverId: "2", vehicleId: "v1", ownerId: "1", salaryType: "fixed", salaryAmount: 25000, startDate: "2026-01-15", isActive: true },
  { id: "a2", driverId: "3", vehicleId: "v2", ownerId: "1", salaryType: "fixed", salaryAmount: 22000, startDate: "2026-02-01", isActive: true },
  { id: "a3", driverId: "4", vehicleId: "",   ownerId: "1", salaryType: "fixed", salaryAmount: 20000, startDate: "2026-03-01", isActive: false },
];

// ── Rides ─────────────────────────────────────────────────────────────────────
export const rides: Ride[] = [
  // May 7
  { id: "r1",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 850,  paymentType: "cash",   pickupArea: "Johar Town",  dropoffArea: "Gulberg",           isDisputed: false, rideTime: "2026-05-07T06:15:00.000Z", loggedAt: "2026-05-07T06:15:00.000Z" },
  { id: "r2",  vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 680,  paymentType: "wallet", pickupArea: "Cavalry",     dropoffArea: "DHA",               isDisputed: false, rideTime: "2026-05-07T07:20:00.000Z", loggedAt: "2026-05-07T07:20:00.000Z" },
  { id: "r3",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 720,  paymentType: "cash",   pickupArea: "Model Town",  dropoffArea: "Bahria Town",       isDisputed: false, rideTime: "2026-05-07T08:00:00.000Z", loggedAt: "2026-05-07T08:00:00.000Z" },
  { id: "r4",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 620,  paymentType: "cash",   pickupArea: "Liberty",     dropoffArea: "Johar Town",        isDisputed: false, rideTime: "2026-05-07T08:30:00.000Z", loggedAt: "2026-05-07T08:30:00.000Z" },
  { id: "r5",  vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 580,  paymentType: "wallet", pickupArea: "Gulberg",     dropoffArea: "Cavalry",           isDisputed: true,  rideTime: "2026-05-07T09:15:00.000Z", loggedAt: "2026-05-07T09:15:00.000Z" },
  { id: "r6",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 780,  paymentType: "cash",   pickupArea: "DHA",         dropoffArea: "Model Town",        isDisputed: false, rideTime: "2026-05-07T10:00:00.000Z", loggedAt: "2026-05-07T10:00:00.000Z" },
  { id: "r7",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 640,  paymentType: "wallet", pickupArea: "Johar Town",  dropoffArea: "Allama Iqbal Town", isDisputed: false, rideTime: "2026-05-07T10:45:00.000Z", loggedAt: "2026-05-07T10:45:00.000Z" },
  { id: "r8",  vehicleId: "v1", driverId: "d1", platform: "other",   fareAmount: 450,  paymentType: "cash",   pickupArea: "Bahria Town", dropoffArea: "Liberty",           isDisputed: false, rideTime: "2026-05-07T11:30:00.000Z", loggedAt: "2026-05-07T11:30:00.000Z" },
  // May 6
  { id: "r9",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 800,  paymentType: "cash",   pickupArea: "Gulberg",     dropoffArea: "DHA",               isDisputed: false, rideTime: "2026-05-06T08:00:00.000Z", loggedAt: "2026-05-06T08:00:00.000Z" },
  { id: "r10", vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 720,  paymentType: "wallet", pickupArea: "DHA",         dropoffArea: "Cavalry",           isDisputed: false, rideTime: "2026-05-06T09:00:00.000Z", loggedAt: "2026-05-06T09:00:00.000Z" },
  { id: "r11", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 650,  paymentType: "cash",   pickupArea: "Cavalry",     dropoffArea: "Model Town",        isDisputed: false, rideTime: "2026-05-06T10:00:00.000Z", loggedAt: "2026-05-06T10:00:00.000Z" },
  { id: "r12", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 880,  paymentType: "cash",   pickupArea: "Liberty",     dropoffArea: "Johar Town",        isDisputed: false, rideTime: "2026-05-06T11:00:00.000Z", loggedAt: "2026-05-06T11:00:00.000Z" },
  { id: "r13", vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 590,  paymentType: "wallet", pickupArea: "Bahria Town", dropoffArea: "Gulberg",           isDisputed: false, rideTime: "2026-05-06T13:00:00.000Z", loggedAt: "2026-05-06T13:00:00.000Z" },
  { id: "r14", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 700,  paymentType: "cash",   pickupArea: "Johar Town",  dropoffArea: "Liberty",           isDisputed: false, rideTime: "2026-05-06T14:30:00.000Z", loggedAt: "2026-05-06T14:30:00.000Z" },
  // May 5
  { id: "r15", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 760,  paymentType: "cash",   pickupArea: "Model Town",  dropoffArea: "Gulberg",           isDisputed: false, rideTime: "2026-05-05T08:30:00.000Z", loggedAt: "2026-05-05T08:30:00.000Z" },
  { id: "r16", vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 610,  paymentType: "wallet", pickupArea: "Gulberg",     dropoffArea: "DHA",               isDisputed: false, rideTime: "2026-05-05T09:30:00.000Z", loggedAt: "2026-05-05T09:30:00.000Z" },
  { id: "r17", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 830,  paymentType: "cash",   pickupArea: "DHA",         dropoffArea: "Johar Town",        isDisputed: false, rideTime: "2026-05-05T11:00:00.000Z", loggedAt: "2026-05-05T11:00:00.000Z" },
  { id: "r18", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 680,  paymentType: "cash",   pickupArea: "Cavalry",     dropoffArea: "Model Town",        isDisputed: false, rideTime: "2026-05-05T13:00:00.000Z", loggedAt: "2026-05-05T13:00:00.000Z" },
  { id: "r19", vehicleId: "v1", driverId: "d1", platform: "other",   fareAmount: 450,  paymentType: "cash",   pickupArea: "Liberty",     dropoffArea: "Bahria Town",       isDisputed: false, rideTime: "2026-05-05T15:00:00.000Z", loggedAt: "2026-05-05T15:00:00.000Z" },
  // May 4
  { id: "r20", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 920,  paymentType: "cash",   pickupArea: "Gulberg",     dropoffArea: "DHA",               isDisputed: false, rideTime: "2026-05-04T09:00:00.000Z", loggedAt: "2026-05-04T09:00:00.000Z" },
  { id: "r21", vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 700,  paymentType: "wallet", pickupArea: "DHA",         dropoffArea: "Cavalry",           isDisputed: false, rideTime: "2026-05-04T10:30:00.000Z", loggedAt: "2026-05-04T10:30:00.000Z" },
  { id: "r22", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 550,  paymentType: "cash",   pickupArea: "Model Town",  dropoffArea: "Liberty",           isDisputed: false, rideTime: "2026-05-04T12:00:00.000Z", loggedAt: "2026-05-04T12:00:00.000Z" },
  { id: "r23", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 480,  paymentType: "cash",   pickupArea: "Johar Town",  dropoffArea: "Allama Iqbal Town", isDisputed: false, rideTime: "2026-05-04T14:00:00.000Z", loggedAt: "2026-05-04T14:00:00.000Z" },
  // May 3
  { id: "r24", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 1100, paymentType: "cash",   pickupArea: "Cantt",       dropoffArea: "DHA",               isDisputed: false, rideTime: "2026-05-03T09:30:00.000Z", loggedAt: "2026-05-03T09:30:00.000Z" },
  { id: "r25", vehicleId: "v2", driverId: "d2", platform: "other",   fareAmount: 600,  paymentType: "cash",   pickupArea: "Gulberg",     dropoffArea: "Model Town",        isDisputed: false, rideTime: "2026-05-03T11:00:00.000Z", loggedAt: "2026-05-03T11:00:00.000Z" },
];

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenses: Expense[] = [
  { id: "e1",  vehicleId: "v1", loggedBy: "d1", category: "tyre",        amount: 4500,  note: "Front tyre puncture",     status: "pending",  date: "2026-05-07T09:00:00.000Z" },
  { id: "e2",  vehicleId: "v2", loggedBy: "d2", category: "wash",        amount: 300,   note: "Full exterior wash",      status: "pending",  date: "2026-05-07T10:00:00.000Z" },
  { id: "e3",  vehicleId: "v1", loggedBy: "d1", category: "oil_change",  amount: 3200,  note: "Engine oil 1L",           status: "pending",  date: "2026-05-06T14:00:00.000Z" },
  { id: "e4",  vehicleId: "v1", loggedBy: "d1", category: "maintenance", amount: 2800,  note: "Brake pads replacement",  status: "approved", date: "2026-05-05T11:00:00.000Z" },
  { id: "e5",  vehicleId: "v2", loggedBy: "d2", category: "tyre",        amount: 9000,  note: "Two rear tyres",          status: "approved", date: "2026-05-04T12:00:00.000Z" },
  { id: "e6",  vehicleId: "v1", loggedBy: "d1", category: "wash",        amount: 250,   note: "",                        status: "approved", date: "2026-05-03T09:00:00.000Z" },
  { id: "e7",  vehicleId: "v2", loggedBy: "d2", category: "other",       amount: 1500,  note: "Parking permit renewal",  status: "approved", date: "2026-04-28T10:00:00.000Z" },
  { id: "e8",  vehicleId: "v1", loggedBy: "d1", category: "maintenance", amount: 5500,  note: "AC gas refill",           status: "approved", date: "2026-04-22T11:00:00.000Z" },
  { id: "e9",  vehicleId: "v2", loggedBy: "d2", category: "oil_change",  amount: 3000,  note: "Engine oil change",       status: "approved", date: "2026-04-15T08:30:00.000Z" },
  { id: "e10", vehicleId: "v1", loggedBy: "d1", category: "tyre",        amount: 4800,  note: "Front left tyre",         status: "approved", date: "2026-04-10T09:00:00.000Z" },
  { id: "e11", vehicleId: "v2", loggedBy: "d2", category: "wash",        amount: 300,   note: "",                        status: "approved", date: "2026-04-05T10:00:00.000Z" },
  { id: "e12", vehicleId: "v1", loggedBy: "d1", category: "other",       amount: 2000,  note: "Token tax",               status: "approved", date: "2026-03-20T12:00:00.000Z" },
  { id: "e13", vehicleId: "v2", loggedBy: "d2", category: "maintenance", amount: 3500,  note: "Suspension check",        status: "approved", date: "2026-03-10T11:00:00.000Z" },
  { id: "e14", vehicleId: "v1", loggedBy: "d1", category: "other",       amount: 800,   note: "Duplicate key",           status: "rejected", date: "2026-04-18T09:00:00.000Z" },
  { id: "e15", vehicleId: "v2", loggedBy: "d2", category: "other",       amount: 1200,  note: "Seat cover",              status: "rejected", date: "2026-04-01T10:00:00.000Z" },
];

// ── Fuel logs ─────────────────────────────────────────────────────────────────
export const fuelLogs: FuelLog[] = [
  { id: "f1", vehicleId: "v1", driverId: "d1", amountPkr: 3000, litres: 12.5, odometer: 45500, pumpName: "PSO Gulberg",    date: "2026-05-07T07:00:00.000Z" },
  { id: "f2", vehicleId: "v2", driverId: "d2", amountPkr: 2500, litres: 10.4, odometer: 62000, pumpName: "Shell DHA",      date: "2026-05-07T07:30:00.000Z" },
  { id: "f3", vehicleId: "v1", driverId: "d1", amountPkr: 3500, litres: 14.6, odometer: 45100, pumpName: "Total Cavalry",  date: "2026-05-05T06:45:00.000Z" },
  { id: "f4", vehicleId: "v2", driverId: "d2", amountPkr: 4000, litres: 16.7, odometer: 61500, pumpName: "PSO Johar Town", date: "2026-05-05T07:00:00.000Z" },
  { id: "f5", vehicleId: "v1", driverId: "d1", amountPkr: 2800, litres: 11.7, odometer: 44700, pumpName: "Shell Gulberg",  date: "2026-05-03T06:30:00.000Z" },
  { id: "f6", vehicleId: "v2", driverId: "d2", amountPkr: 3200, litres: 13.3, odometer: 61000, pumpName: "Total DHA",      date: "2026-05-03T07:00:00.000Z" },
  { id: "f7", vehicleId: "v1", driverId: "d1", amountPkr: 3800, litres: 15.8, odometer: 44300, pumpName: "PSO Model Town", date: "2026-05-01T07:15:00.000Z" },
  { id: "f8", vehicleId: "v2", driverId: "d2", amountPkr: 2600, litres: 10.8, odometer: 60500, pumpName: "Shell Liberty",  date: "2026-05-01T08:00:00.000Z" },
];

// ── Settlements ───────────────────────────────────────────────────────────────
export const settlements: Settlement[] = [
  { id: "s1", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-02-01", periodEnd: "2026-02-28", totalRevenue: 82000, totalExpenses: 8500,  driverSalary: 25000, ownerProfit: 48500, status: "settled", settledAt: "2026-03-02T10:00:00.000Z" },
  { id: "s2", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-03-01", periodEnd: "2026-03-31", totalRevenue: 91000, totalExpenses: 10000, driverSalary: 25000, ownerProfit: 56000, status: "settled", settledAt: "2026-04-01T10:00:00.000Z" },
  { id: "s3", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-04-01", periodEnd: "2026-04-30", totalRevenue: 88000, totalExpenses: 9500,  driverSalary: 25000, ownerProfit: 53500, status: "settled", settledAt: "2026-05-01T10:00:00.000Z" },
  { id: "s4", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-05-01", periodEnd: "2026-05-31", totalRevenue: 0,     totalExpenses: 0,     driverSalary: 25000, ownerProfit: 0,     status: "pending" },
  { id: "s5", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-02-01", periodEnd: "2026-02-28", totalRevenue: 74000, totalExpenses: 7000,  driverSalary: 22000, ownerProfit: 45000, status: "settled", settledAt: "2026-03-02T12:00:00.000Z" },
  { id: "s6", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-03-01", periodEnd: "2026-03-31", totalRevenue: 80000, totalExpenses: 8000,  driverSalary: 22000, ownerProfit: 50000, status: "settled", settledAt: "2026-04-01T12:00:00.000Z" },
  { id: "s7", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-04-01", periodEnd: "2026-04-30", totalRevenue: 77000, totalExpenses: 9000,  driverSalary: 22000, ownerProfit: 46000, status: "settled", settledAt: "2026-05-01T12:00:00.000Z" },
  { id: "s8", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-05-01", periodEnd: "2026-05-31", totalRevenue: 0,     totalExpenses: 0,     driverSalary: 22000, ownerProfit: 0,     status: "pending" },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications: Notification[] = [
  { id: "n1", userId: "1", type: "ride_logged",      title: "New Ride Logged",          body: "Ahmed logged a ₨850 inDrive ride from Johar Town",  isRead: false, createdAt: "2026-05-07T06:20:00.000Z" },
  { id: "n2", userId: "1", type: "anomaly",          title: "Revenue Anomaly Detected", body: "Vehicle LEA-1234 revenue is 30% below weekly average", isRead: false, createdAt: "2026-05-07T08:00:00.000Z" },
  { id: "n3", userId: "1", type: "expense_pending",  title: "Expense Pending Approval", body: "Ahmed submitted a ₨4,500 tyre expense",              isRead: false, createdAt: "2026-05-07T09:05:00.000Z" },
  { id: "n4", userId: "1", type: "ride_logged",      title: "New Ride Logged",          body: "Farhan logged a ₨800 inDrive ride from Gulberg",     isRead: true,  createdAt: "2026-05-06T08:05:00.000Z" },
  { id: "n5", userId: "1", type: "expense_pending",  title: "Expense Approved",         body: "Brake pads ₨2,800 expense approved for LEA-1234",    isRead: true,  createdAt: "2026-05-05T11:05:00.000Z" },
  { id: "n6", userId: "1", type: "settlement_ready", title: "Settlement Ready",         body: "April settlement ready for LEA-1234 — ₨53,500",      isRead: true,  createdAt: "2026-05-01T10:00:00.000Z" },
  { id: "n7", userId: "1", type: "settlement_ready", title: "Settlement Ready",         body: "April settlement ready for LEB-5678 — ₨46,000",      isRead: true,  createdAt: "2026-05-01T12:00:00.000Z" },
  { id: "n8", userId: "1", type: "anomaly",          title: "Ride Disputed",            body: "Farhan marked a ₨580 Yango ride as disputed",        isRead: true,  createdAt: "2026-05-07T09:20:00.000Z" },
];
