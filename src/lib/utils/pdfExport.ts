/**
 * PDF Export utility using browser's print dialog.
 * Opens a new window with formatted HTML and triggers print.
 */

interface ReportData {
  title: string;
  period: string;
  vehicleName: string;
  rows: { label: string; value: string; bold?: boolean; color?: "green" | "red" | "amber" }[];
  generatedAt?: string;
}

export function exportToPDF(data: ReportData) {
  const colorMap = {
    green: "#10B981",
    red:   "#EF4444",
    amber: "#F59E0B",
  };

  const rowsHtml = data.rows.map((r) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;${r.bold ? "font-weight:700;" : ""}">${r.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right;font-weight:${r.bold ? "700" : "600"};color:${r.color ? colorMap[r.color] : "#0f172a"};">${r.value}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${data.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #0f172a; padding: 32px; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #10B981;">
        <div style="width:40px;height:40px;background:#d1fae5;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">🚗</div>
        <div>
          <h1 style="font-size:18px;font-weight:700;color:#0f172a;">Sawari Book</h1>
          <p style="font-size:11px;color:#64748b;">سواری بُک</p>
        </div>
      </div>

      <h2 style="font-size:16px;font-weight:700;margin-bottom:4px;">${data.title}</h2>
      <p style="font-size:12px;color:#64748b;margin-bottom:4px;">${data.vehicleName}</p>
      <p style="font-size:12px;color:#64748b;margin-bottom:20px;">${data.period}</p>

      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <tbody>${rowsHtml}</tbody>
      </table>

      <p style="font-size:10px;color:#94a3b8;margin-top:20px;text-align:right;">
        Generated: ${data.generatedAt ?? new Date().toLocaleString("en-PK")}
      </p>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=600,height=800");
  if (!win) { alert("Please allow popups to export PDF"); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}
