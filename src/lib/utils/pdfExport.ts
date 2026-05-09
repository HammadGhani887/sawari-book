/**
 * PDF Export utility using browser's print dialog.
 */

interface ReportRow {
  label: string;
  value: string;
  bold?: boolean;
  color?: "green" | "red" | "amber";
}

interface RideDetail {
  time: string;
  platform: string;
  route: string;
  fare: number;
  fuelCost?: number;
  boostCost?: number;
  netProfit?: number;
  driver?: string;
  distance?: number;
}

interface ExpenseDetail {
  date: string;
  category: string;
  amount: number;
  note?: string;
  status: string;
}

interface FuelDetail {
  date: string;
  amount: number;
  litres: number;
  pump?: string;
}

export interface ReportData {
  title: string;
  period: string;
  vehicleName: string;
  rows: ReportRow[];
  rides?: RideDetail[];
  expenses?: ExpenseDetail[];
  fuelLogs?: FuelDetail[];
  generatedAt?: string;
}

export function exportToPDF(data: ReportData) {
  const colorMap = {
    green: "#10B981",
    red:   "#EF4444",
    amber: "#F59E0B",
  };

  const summaryRows = data.rows.map((r) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;${r.bold ? "font-weight:700;" : ""}">${r.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;font-weight:${r.bold ? "700" : "600"};color:${r.color ? colorMap[r.color] : "#0f172a"};">${r.value}</td>
    </tr>
  `).join("");

  const ridesSection = data.rides && data.rides.length > 0 ? `
    <h3 style="font-size:13px;font-weight:700;color:#0f172a;margin:24px 0 8px;">🚗 Rides (${data.rides.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Time</th>
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Platform</th>
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Route</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Fare</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Net</th>
        </tr>
      </thead>
      <tbody>
        ${data.rides.map((r) => `
          <tr>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${r.time}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${r.platform}${r.driver ? ` · ${r.driver}` : ""}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${r.route}${r.distance ? ` (${r.distance}km)` : ""}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;color:#0f172a;">Rs ${r.fare.toLocaleString()}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:700;color:${r.netProfit !== undefined ? (r.netProfit >= 0 ? "#10B981" : "#EF4444") : "#64748b"};">
              ${r.netProfit !== undefined ? `Rs ${r.netProfit.toLocaleString()}` : "—"}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const expensesSection = data.expenses && data.expenses.length > 0 ? `
    <h3 style="font-size:13px;font-weight:700;color:#0f172a;margin:24px 0 8px;">🧾 Expenses (${data.expenses.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Date</th>
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Category</th>
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Note</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Amount</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.expenses.map((e) => `
          <tr>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${e.date}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${e.category}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#94a3b8;">${e.note ?? "—"}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;color:#F59E0B;">Rs ${e.amount.toLocaleString()}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;color:${e.status === "approved" ? "#10B981" : e.status === "rejected" ? "#EF4444" : "#F59E0B"};">${e.status}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const fuelSection = data.fuelLogs && data.fuelLogs.length > 0 ? `
    <h3 style="font-size:13px;font-weight:700;color:#0f172a;margin:24px 0 8px;">⛽ Fuel Logs (${data.fuelLogs.length})</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Date</th>
          <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Pump</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Litres</th>
          <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.fuelLogs.map((f) => `
          <tr>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${f.date}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;color:#475569;">${f.pump ?? "—"}</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;color:#475569;">${f.litres}L</td>
            <td style="padding:5px 8px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;color:#F59E0B;">Rs ${f.amount.toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${data.title} — Sawari Book</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0f172a; padding: 32px; }
        @media print { body { padding: 16px; } @page { margin: 1cm; } }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #10B981;">
        <div style="width:40px;height:40px;background:#d1fae5;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">🚗</div>
        <div>
          <h1 style="font-size:18px;font-weight:700;color:#0f172a;">Sawari Book</h1>
          <p style="font-size:11px;color:#64748b;">سواری بُک</p>
        </div>
      </div>

      <!-- Title -->
      <h2 style="font-size:16px;font-weight:700;margin-bottom:4px;">${data.title}</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:2px;">${data.vehicleName}</p>
      <p style="font-size:12px;color:#64748b;margin-bottom:20px;">📅 ${data.period}</p>

      <!-- Summary -->
      <h3 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">📊 Summary</h3>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden;margin-bottom:8px;">
        <tbody>${summaryRows}</tbody>
      </table>

      ${ridesSection}
      ${expensesSection}
      ${fuelSection}

      <p style="font-size:10px;color:#94a3b8;margin-top:24px;text-align:right;">
        Generated: ${data.generatedAt ?? new Date().toLocaleString("en-PK")} · Sawari Book
      </p>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) { alert("Please allow popups to export PDF"); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
