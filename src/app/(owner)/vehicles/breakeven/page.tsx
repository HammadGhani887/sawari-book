"use client";

import { useState, useMemo } from "react";
import { ScreenHeader, Card } from "@/components/ui";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

function InputRow({ label, labelUrdu, value, onChange, prefix, suffix, placeholder }: {
  label: string; labelUrdu?: string; value: string;
  onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm text-slate-900">{label}</p>
        {labelUrdu && <p className="text-[10px] text-slate-400 mt-0.5" dir="rtl">{labelUrdu}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className="w-20 bg-white border border-slate-200 text-slate-900 text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-green tabular-nums"
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

export default function BreakevenPage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers  = useDriverStore((s) => s.drivers);

  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id ?? "");

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const driver  = drivers.find((d) => d.vehicleId === selectedVehicleId);

  // Monthly fixed costs
  const [installment,  setInstallment]  = useState("");
  const [insurance,    setInsurance]    = useState("");
  const [tokenTax,     setTokenTax]     = useState("");
  const [otherFixed,   setOtherFixed]   = useState("");

  // Variable costs per ride (auto-filled from vehicle settings)
  const [fuelPerRide,  setFuelPerRide]  = useState(
    vehicle?.fuelAverageKmL && vehicle?.petrolPricePkrL
      ? String(Math.round((15 / vehicle.fuelAverageKmL) * vehicle.petrolPricePkrL)) // assume 15km avg ride
      : ""
  );
  const [avgFare,      setAvgFare]      = useState("");
  const [ridesPerDay,  setRidesPerDay]  = useState("");
  const [workingDays,  setWorkingDays]  = useState("26");

  const salary = driver?.salaryType === "fixed" ? driver.salaryAmount : 0;

  const calc = useMemo(() => {
    const fixedMonthly =
      Number(installment) + Number(insurance) + Number(tokenTax) +
      Number(otherFixed) + salary;

    const varPerRide   = Number(fuelPerRide);
    const fare         = Number(avgFare);
    const days         = Number(workingDays);
    const ridesPD      = Number(ridesPerDay);

    if (fare <= 0 || varPerRide < 0) return null;

    // Profit per ride
    const profitPerRide = fare - varPerRide;

    // Monthly revenue & variable costs
    const monthlyRides   = ridesPD * days;
    const monthlyRevenue = monthlyRides * fare;
    const monthlyVar     = monthlyRides * varPerRide;
    const monthlyTotal   = fixedMonthly + monthlyVar;
    const monthlyProfit  = monthlyRevenue - monthlyTotal;

    // Break-even rides per month
    const breakevenRides = profitPerRide > 0
      ? Math.ceil(fixedMonthly / profitPerRide)
      : null;

    // Break-even days
    const breakevenDays = breakevenRides && ridesPD > 0
      ? Math.ceil(breakevenRides / ridesPD)
      : null;

    // Revenue needed per day to break even
    const dailyBreakevenRevenue = breakevenRides && days > 0
      ? Math.round((fixedMonthly / days) + (ridesPD * varPerRide))
      : null;

    return {
      fixedMonthly,
      profitPerRide,
      monthlyRides,
      monthlyRevenue,
      monthlyVar,
      monthlyTotal,
      monthlyProfit,
      breakevenRides,
      breakevenDays,
      dailyBreakevenRevenue,
    };
  }, [installment, insurance, tokenTax, otherFixed, salary, fuelPerRide, avgFare, workingDays, ridesPerDay]);

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Break-Even Calculator" titleUrdu="نقصان نہ منافع" showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">

        {/* Vehicle selector */}
        {vehicles.length > 1 && (
          <div className="relative">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-accent-green shadow-sm"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.makeModel} · {v.plateNumber}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        )}

        {/* Fixed monthly costs */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Monthly Fixed Costs
          </p>
          <InputRow label="Car Installment"  labelUrdu="قسط"         value={installment} onChange={setInstallment} prefix="Rs" placeholder="e.g. 25000" />
          <InputRow label="Insurance"        labelUrdu="انشورنس"     value={insurance}   onChange={setInsurance}   prefix="Rs" placeholder="e.g. 1500"  />
          <InputRow label="Token Tax"        labelUrdu="ٹوکن ٹیکس"  value={tokenTax}    onChange={setTokenTax}    prefix="Rs" placeholder="e.g. 500"   />
          <InputRow label="Other Fixed"      labelUrdu="دیگر"        value={otherFixed}  onChange={setOtherFixed}  prefix="Rs" placeholder="e.g. 1000"  />
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm text-slate-600">Driver Salary</p>
              <p className="text-[10px] text-slate-400">From driver profile</p>
            </div>
            <p className="text-sm font-semibold text-accent-blue">{formatCurrency(salary)}</p>
          </div>
          {calc && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Total Fixed</p>
              <p className="text-sm font-bold text-status-red">{formatCurrency(calc.fixedMonthly)}</p>
            </div>
          )}
        </Card>

        {/* Per-ride variables */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Per Ride Estimates
          </p>
          <InputRow label="Avg Fuel Cost / Ride" labelUrdu="فی سواری تیل" value={fuelPerRide} onChange={setFuelPerRide} prefix="Rs" placeholder="e.g. 80" />
          <InputRow label="Avg Fare / Ride"       labelUrdu="اوسط کرایہ"   value={avgFare}     onChange={setAvgFare}     prefix="Rs" placeholder="e.g. 600" />
          {calc && avgFare && fuelPerRide && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-600">Profit per ride</p>
              <p className={`text-sm font-bold ${calc.profitPerRide >= 0 ? "text-accent-green" : "text-status-red"}`}>
                {formatCurrency(calc.profitPerRide)}
              </p>
            </div>
          )}
        </Card>

        {/* Working pattern */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Working Pattern
          </p>
          <InputRow label="Rides per Day"   labelUrdu="روزانہ سواریاں" value={ridesPerDay} onChange={setRidesPerDay} suffix="rides/day" placeholder="e.g. 8" />
          <InputRow label="Working Days"    labelUrdu="کام کے دن"      value={workingDays} onChange={setWorkingDays} suffix="days/mo"  placeholder="26" />
        </Card>

        {/* Results */}
        {calc && calc.breakevenRides !== null && (
          <div className="bg-accent-greenDim border border-accent-green/30 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-green mb-4">
              Break-Even Analysis
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-700">Break-even rides/month</p>
                <p className="text-lg font-bold text-slate-900">{calc.breakevenRides} rides</p>
              </div>
              {calc.breakevenDays !== null && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">Break-even in</p>
                  <p className="text-lg font-bold text-slate-900">{calc.breakevenDays} days</p>
                </div>
              )}
              {calc.dailyBreakevenRevenue !== null && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">Daily revenue needed</p>
                  <p className="text-lg font-bold text-accent-green">{formatCurrency(calc.dailyBreakevenRevenue)}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-accent-green/20 my-4" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Monthly Revenue (est.)</p>
                <p className="text-sm font-semibold text-accent-green">{formatCurrency(calc.monthlyRevenue)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Monthly Costs (est.)</p>
                <p className="text-sm font-semibold text-status-red">{formatCurrency(calc.monthlyTotal)}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-accent-green/20">
                <p className="text-sm font-bold text-slate-900">Monthly Profit (est.)</p>
                <p className={`text-base font-bold ${calc.monthlyProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                  {formatCurrency(calc.monthlyProfit)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!calc && (
          <div className="flex flex-col items-center py-8 gap-2">
            <span className="text-4xl opacity-20">🧮</span>
            <p className="text-sm text-slate-500 text-center">Fill in the costs above to see your break-even point</p>
          </div>
        )}

      </div>
    </div>
  );
}
