import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface ExportData {
  title: string;
  subtitle: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(data.title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(data.subtitle, 14, 30);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 36);

  // Table
  autoTable(doc, {
    startY: 45,
    head: [data.headers],
    body: data.rows,
    theme: "striped",
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`${data.filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportToExcel(data: ExportData) {
  const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  
  XLSX.writeFile(wb, `${data.filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}
