import { usePrefsStore } from "@/lib/store/prefsStore";

type TranslationMap = Record<string, string>;

const en: TranslationMap = {
  // ── App ──────────────────────────────────────────────────────────────
  "app.name":                  "Sawari Book",
  "app.tagline":               "Track rides. Know your profit.",
  "app.greeting":              "Assalam o Alaikum",

  // ── Navigation ───────────────────────────────────────────────────────
  "nav.dashboard":             "Dashboard",
  "nav.vehicles":              "Vehicles",
  "nav.drivers":               "Drivers",
  "nav.rides":                 "Rides",
  "nav.expenses":              "Expenses",
  "nav.reports":               "Reports",
  "nav.settings":              "Settings",
  "nav.notifications":         "Notifications",
  "nav.subscription":          "Subscription",
  "nav.home":                  "Home",
  "nav.addRide":               "Add Ride",
  "nav.fuel":                  "Fuel",
  "nav.myDay":                 "My Day",
  "nav.profile":               "Profile",
  "nav.earnings":              "Earnings",

  // ── Buttons ──────────────────────────────────────────────────────────
  "btn.save":                  "Save",
  "btn.cancel":                "Cancel",
  "btn.add":                   "Add",
  "btn.edit":                  "Edit",
  "btn.delete":                "Delete",
  "btn.submit":                "Submit",
  "btn.signIn":                "Sign In",
  "btn.signOut":               "Sign Out",
  "btn.confirm":               "Confirm",
  "btn.back":                  "Back",
  "btn.next":                  "Next",
  "btn.done":                  "Done",
  "btn.settle":                "Settle",
  "btn.addRide":               "Add Ride",
  "btn.addFuel":               "Add Fuel",
  "btn.addExpense":            "Add Expense",
  "btn.addVehicle":            "Add Vehicle",
  "btn.addDriver":             "Add Driver",
  "btn.viewAll":               "View All",
  "btn.retry":                 "Retry",

  // ── Form labels ──────────────────────────────────────────────────────
  "label.phone":               "Phone Number",
  "label.password":            "Password",
  "label.name":                "Full Name",
  "label.cnic":                "CNIC",
  "label.plateNumber":         "Plate Number",
  "label.makeModel":           "Make & Model",
  "label.fuelType":            "Fuel Type",
  "label.platform":            "Platform",
  "label.amount":              "Amount (PKR)",
  "label.fareAmount":          "Fare Amount",
  "label.date":                "Date",
  "label.note":                "Note",
  "label.category":            "Category",
  "label.vehicle":             "Vehicle",
  "label.driver":              "Driver",
  "label.litres":              "Litres",
  "label.odometer":            "Odometer (km)",
  "label.pumpName":            "Pump / Station",
  "label.pickupArea":          "Pickup Area",
  "label.dropoffArea":         "Dropoff Area",
  "label.paymentType":         "Payment Type",
  "label.salaryType":          "Salary Type",
  "label.salaryAmount":        "Salary Amount",
  "label.startDate":           "Start Date",
  "label.endDate":             "End Date",
  "label.language":            "Language",

  // ── KPI labels ───────────────────────────────────────────────────────
  "kpi.totalRevenue":          "Total Revenue",
  "kpi.totalExpenses":         "Total Expenses",
  "kpi.netProfit":             "Net Profit",
  "kpi.totalRides":            "Total Rides",
  "kpi.activeVehicles":        "Active Vehicles",
  "kpi.activeDrivers":         "Active Drivers",
  "kpi.todayEarnings":         "Today's Earnings",
  "kpi.weeklyRevenue":         "Weekly Revenue",
  "kpi.driverSalary":          "Driver Salary",
  "kpi.ownerProfit":           "Owner Profit",

  // ── Empty states ─────────────────────────────────────────────────────
  "empty.rides":               "No rides logged yet",
  "empty.vehicles":            "No vehicles added yet",
  "empty.drivers":             "No drivers assigned yet",
  "empty.expenses":            "No expenses recorded",
  "empty.notifications":       "You're all caught up!",
  "empty.fuelLogs":            "No fuel logs yet",
  "empty.settlements":         "No settlements yet",

  // ── Error messages ───────────────────────────────────────────────────
  "error.required":            "This field is required",
  "error.invalidPhone":        "Enter a valid Pakistani phone number",
  "error.invalidAmount":       "Enter a valid amount",
  "error.networkError":        "Network error. Check your connection.",
  "error.loginFailed":         "Incorrect phone or password",
  "error.generic":             "Something went wrong. Please try again.",
  "error.unauthorized":        "Session expired. Please sign in again.",

  // ── Success messages ─────────────────────────────────────────────────
  "success.rideSaved":         "Ride saved successfully",
  "success.expenseSaved":      "Expense saved",
  "success.fuelSaved":         "Fuel log saved",
  "success.vehicleSaved":      "Vehicle saved",
  "success.driverSaved":       "Driver saved",
  "success.settled":           "Settlement completed",
  "success.profileUpdated":    "Profile updated",

  // ── Expense categories ───────────────────────────────────────────────
  "category.fuel":             "Fuel",
  "category.maintenance":      "Maintenance",
  "category.oil_change":       "Oil Change",
  "category.tyre":             "Tyre",
  "category.wash":             "Car Wash",
  "category.fine":             "Fine / Challan",
  "category.insurance":        "Insurance",
  "category.token_tax":        "Token Tax",
  "category.other":            "Other",

  // ── Status labels ────────────────────────────────────────────────────
  "status.pending":            "Pending",
  "status.approved":           "Approved",
  "status.rejected":           "Rejected",
  "status.settled":            "Settled",
  "status.active":             "Active",
  "status.inactive":           "Inactive",
  "status.disputed":           "Disputed",

  // ── Platforms ────────────────────────────────────────────────────────
  "platform.indrive":          "inDrive",
  "platform.yango":            "Yango",
  "platform.other":            "Other",
  "platform.private":          "Private",

  // ── Salary types ─────────────────────────────────────────────────────
  "salary.fixed":              "Fixed Salary",
  "salary.percentage":         "Percentage",
  "salary.hybrid":             "Hybrid (Base + %)",

  // ── Payment types ────────────────────────────────────────────────────
  "payment.cash":              "Cash",
  "payment.wallet":            "Wallet",
  "payment.card":              "Card",

  // ── Roles ────────────────────────────────────────────────────────────
  "role.owner":                "Car Owner",
  "role.driver":               "Driver",

  // ── Fuel types ───────────────────────────────────────────────────────
  "fuel.petrol":               "Petrol",
  "fuel.diesel":               "Diesel",
  "fuel.cng":                  "CNG",
  "fuel.hybrid":               "Hybrid",

  // ── Common ───────────────────────────────────────────────────────────
  "common.today":              "Today",
  "common.yesterday":          "Yesterday",
  "common.all":                "All",
  "common.loading":            "Loading...",
  "common.noData":             "No data available",
  "common.search":             "Search",
  "common.filter":             "Filter",
  "common.total":              "Total",
  "common.profit":             "Profit",
  "common.loss":               "Loss",
  "common.or":                 "or",
  "common.of":                 "of",

  // ── Pages ────────────────────────────────────────────────────────────
  "page.selectRole":           "Who are you?",
  "page.selectRoleSub":        "Select your role to continue",
  "page.login":                "Welcome back",
  "page.loginSub":             "Sign in to Sawari Book",
  "page.addRide":              "Add Ride",
  "page.myDay":                "My Day",
  "page.settlement":           "Settlement",
};

const ur: TranslationMap = {
  // ── App ──────────────────────────────────────────────────────────────
  "app.name":                  "سواری بُک",
  "app.tagline":               "سواریاں ریکارڈ کریں، منافع جانیں",
  "app.greeting":              "السلام و علیکم",

  // ── Navigation ───────────────────────────────────────────────────────
  "nav.dashboard":             "ڈیش بورڈ",
  "nav.vehicles":              "گاڑیاں",
  "nav.drivers":               "ڈرائیور",
  "nav.rides":                 "سواریاں",
  "nav.expenses":              "اخراجات",
  "nav.reports":               "رپورٹ",
  "nav.settings":              "سیٹنگز",
  "nav.notifications":         "اطلاعات",
  "nav.subscription":          "سبسکرپشن",
  "nav.home":                  "ہوم",
  "nav.addRide":               "سواری ڈالیں",
  "nav.fuel":                  "تیل",
  "nav.myDay":                 "میرا دن",
  "nav.profile":               "پروفائل",
  "nav.earnings":              "کمائی",

  // ── Buttons ──────────────────────────────────────────────────────────
  "btn.save":                  "محفوظ کریں",
  "btn.cancel":                "منسوخ",
  "btn.add":                   "شامل کریں",
  "btn.edit":                  "ترمیم",
  "btn.delete":                "حذف کریں",
  "btn.submit":                "جمع کریں",
  "btn.signIn":                "لاگ ان",
  "btn.signOut":               "لاگ آؤٹ",
  "btn.confirm":               "تصدیق",
  "btn.back":                  "واپس",
  "btn.next":                  "آگے",
  "btn.done":                  "مکمل",
  "btn.settle":                "حساب کریں",
  "btn.addRide":               "سواری ڈالیں",
  "btn.addFuel":               "تیل ڈالیں",
  "btn.addExpense":            "خرچ ڈالیں",
  "btn.addVehicle":            "گاڑی شامل کریں",
  "btn.addDriver":             "ڈرائیور شامل کریں",
  "btn.viewAll":               "سب دیکھیں",
  "btn.retry":                 "دوبارہ کوشش",

  // ── Form labels ──────────────────────────────────────────────────────
  "label.phone":               "فون نمبر",
  "label.password":            "پاس ورڈ",
  "label.name":                "پورا نام",
  "label.cnic":                "شناختی کارڈ",
  "label.plateNumber":         "نمبر پلیٹ",
  "label.makeModel":           "گاڑی کی قسم",
  "label.fuelType":            "ایندھن کی قسم",
  "label.platform":            "پلیٹ فارم",
  "label.amount":              "رقم (روپے)",
  "label.fareAmount":          "کرایہ",
  "label.date":                "تاریخ",
  "label.note":                "نوٹ",
  "label.category":            "قسم",
  "label.vehicle":             "گاڑی",
  "label.driver":              "ڈرائیور",
  "label.litres":              "لیٹر",
  "label.odometer":            "اوڈومیٹر (کلومیٹر)",
  "label.pumpName":            "پیٹرول پمپ",
  "label.pickupArea":          "اٹھانے کی جگہ",
  "label.dropoffArea":         "چھوڑنے کی جگہ",
  "label.paymentType":         "ادائیگی کا طریقہ",
  "label.salaryType":          "تنخواہ کی قسم",
  "label.salaryAmount":        "تنخواہ کی رقم",
  "label.startDate":           "شروع تاریخ",
  "label.endDate":             "آخری تاریخ",
  "label.language":            "زبان",

  // ── KPI labels ───────────────────────────────────────────────────────
  "kpi.totalRevenue":          "کل آمدنی",
  "kpi.totalExpenses":         "کل اخراجات",
  "kpi.netProfit":             "خالص منافع",
  "kpi.totalRides":            "کل سواریاں",
  "kpi.activeVehicles":        "فعال گاڑیاں",
  "kpi.activeDrivers":         "فعال ڈرائیور",
  "kpi.todayEarnings":         "آج کی کمائی",
  "kpi.weeklyRevenue":         "ہفتہ وار آمدنی",
  "kpi.driverSalary":          "ڈرائیور تنخواہ",
  "kpi.ownerProfit":           "مالک منافع",

  // ── Empty states ─────────────────────────────────────────────────────
  "empty.rides":               "ابھی تک کوئی سواری نہیں",
  "empty.vehicles":            "ابھی تک کوئی گاڑی نہیں",
  "empty.drivers":             "ابھی تک کوئی ڈرائیور نہیں",
  "empty.expenses":            "کوئی خرچ درج نہیں",
  "empty.notifications":       "کوئی نئی اطلاع نہیں",
  "empty.fuelLogs":            "ابھی تک کوئی تیل ریکارڈ نہیں",
  "empty.settlements":         "ابھی تک کوئی حساب نہیں",

  // ── Error messages ───────────────────────────────────────────────────
  "error.required":            "یہ خانہ ضروری ہے",
  "error.invalidPhone":        "درست پاکستانی فون نمبر درج کریں",
  "error.invalidAmount":       "درست رقم درج کریں",
  "error.networkError":        "نیٹ ورک خرابی۔ کنکشن چیک کریں۔",
  "error.loginFailed":         "غلط فون نمبر یا پاس ورڈ",
  "error.generic":             "کچھ غلط ہوا۔ دوبارہ کوشش کریں۔",
  "error.unauthorized":        "سیشن ختم ہو گیا۔ دوبارہ لاگ ان کریں۔",

  // ── Success messages ─────────────────────────────────────────────────
  "success.rideSaved":         "سواری محفوظ ہو گئی",
  "success.expenseSaved":      "خرچ محفوظ ہو گیا",
  "success.fuelSaved":         "تیل ریکارڈ محفوظ ہو گیا",
  "success.vehicleSaved":      "گاڑی محفوظ ہو گئی",
  "success.driverSaved":       "ڈرائیور محفوظ ہو گیا",
  "success.settled":           "حساب مکمل ہو گیا",
  "success.profileUpdated":    "پروفائل اپڈیٹ ہو گئی",

  // ── Expense categories ───────────────────────────────────────────────
  "category.fuel":             "تیل",
  "category.maintenance":      "مرمت",
  "category.oil_change":       "آئل چینج",
  "category.tyre":             "ٹائر",
  "category.wash":             "گاڑی دھونا",
  "category.fine":             "جرمانہ",
  "category.insurance":        "انشورنس",
  "category.token_tax":        "ٹوکن ٹیکس",
  "category.other":            "دیگر",

  // ── Status labels ────────────────────────────────────────────────────
  "status.pending":            "زیر التواء",
  "status.approved":           "منظور",
  "status.rejected":           "مسترد",
  "status.settled":            "حساب مکمل",
  "status.active":             "فعال",
  "status.inactive":           "غیر فعال",
  "status.disputed":           "متنازعہ",

  // ── Platforms ────────────────────────────────────────────────────────
  "platform.indrive":          "اِن ڈرائیو",
  "platform.yango":            "یانگو",
  "platform.other":            "دیگر",
  "platform.private":          "پرائیویٹ",

  // ── Salary types ─────────────────────────────────────────────────────
  "salary.fixed":              "مقررہ تنخواہ",
  "salary.percentage":         "فیصد",
  "salary.hybrid":             "مکس (بنیادی + فیصد)",

  // ── Payment types ────────────────────────────────────────────────────
  "payment.cash":              "نقد",
  "payment.wallet":            "والیٹ",
  "payment.card":              "کارڈ",

  // ── Roles ────────────────────────────────────────────────────────────
  "role.owner":                "گاڑی مالک",
  "role.driver":               "ڈرائیور",

  // ── Fuel types ───────────────────────────────────────────────────────
  "fuel.petrol":               "پیٹرول",
  "fuel.diesel":               "ڈیزل",
  "fuel.cng":                  "سی این جی",
  "fuel.hybrid":               "ہائبرڈ",

  // ── Common ───────────────────────────────────────────────────────────
  "common.today":              "آج",
  "common.yesterday":          "کل",
  "common.all":                "سب",
  "common.loading":            "لوڈ ہو رہا ہے...",
  "common.noData":             "کوئی ڈیٹا نہیں",
  "common.search":             "تلاش",
  "common.filter":             "فلٹر",
  "common.total":              "کل",
  "common.profit":             "منافع",
  "common.loss":               "نقصان",
  "common.or":                 "یا",
  "common.of":                 "میں سے",

  // ── Pages ────────────────────────────────────────────────────────────
  "page.selectRole":           "آپ کون ہیں؟",
  "page.selectRoleSub":        "جاری رکھنے کے لیے اپنا کردار منتخب کریں",
  "page.login":                "خوش آمدید",
  "page.loginSub":             "سواری بُک میں لاگ ان کریں",
  "page.addRide":              "سواری ڈالیں",
  "page.myDay":                "میرا دن",
  "page.settlement":           "حساب کتاب",
};

const translations: Record<"en" | "ur", TranslationMap> = { en, ur };

export type TranslationKey = keyof typeof en;

export function useTranslation() {
  const language = usePrefsStore((s) => s.language);
  const dict = translations[language] ?? en;

  function t(key: string, fallback?: string): string {
    return dict[key] ?? en[key] ?? fallback ?? key;
  }

  const dir: "ltr" | "rtl" = language === "ur" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  return { t, dir, isRtl, language };
}
