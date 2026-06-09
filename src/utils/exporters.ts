/**
 * exporters.ts
 * Engine ekspor terpusat untuk Excel (.xlsx) dan PDF (.pdf).
 * Tipe ExportColumn dipakai bersama oleh semua modul.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, formatDateShort } from './helpers';

// ─── Tipe kolom tunggal (dipakai di seluruh app) ────────────────────────────
export interface ExportColumn {
  header: string;
  key: string;
  format?: 'currency' | 'number' | 'date' | 'text';
  width?: number;
}

// ─── Metadata dokumen ────────────────────────────────────────────────────────
export interface ExportMeta {
  title?: string;
  subtitle?: string;
  orientation?: 'p' | 'l';
}

// ─── Helpers internal ────────────────────────────────────────────────────────
function cellValue(val: unknown, format?: string): string | number {
  if (val === null || val === undefined) return '';
  if (format === 'currency') return Number(val);
  if (format === 'number')   return Number(val);
  if (format === 'date')     return formatDateShort(String(val));
  return String(val);
}

function cellValuePDF(val: unknown, format?: string): string {
  if (val === null || val === undefined) return '-';
  if (format === 'currency') return formatRupiah(Number(val));
  if (format === 'number')   return new Intl.NumberFormat('id-ID').format(Number(val));
  if (format === 'date')     return formatDateShort(String(val));
  return String(val);
}

// ─── Export ke Excel ─────────────────────────────────────────────────────────
export function exportToExcel<T extends Record<string, any>>(
  filename: string,
  sheetName: string,
  columns: ExportColumn[],
  data: T[],
  meta?: ExportMeta
) {
  // 1. Bangun array-of-arrays
  const aoa: (string | number)[][] = [];

  let metaRowCount = 0;
  if (meta?.title) {
    aoa.push([meta.title]);
    metaRowCount++;
    if (meta.subtitle) {
      aoa.push([meta.subtitle]);
      metaRowCount++;
    }
    aoa.push([`Diekspor: ${new Date().toLocaleString('id-ID')}`]);
    metaRowCount++;
    aoa.push([]);          // baris kosong
    metaRowCount++;
  }

  // 2. Header kolom
  aoa.push(columns.map((c) => c.header));
  const headerRowIdx = metaRowCount; // 0-based index baris header

  // 3. Data rows
  const dataRows = data.map((row) =>
    columns.map((col) => cellValue(row[col.key], col.format))
  );
  aoa.push(...dataRows);

  // 4. Buat worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 5. Lebar kolom
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 18 }));

  // 6. Format angka per sel data
  dataRows.forEach((_, ri) => {
    const rowIdx = headerRowIdx + 1 + ri; // 0-based
    columns.forEach((col, ci) => {
      if (col.format === 'currency' || col.format === 'number') {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c: ci });
        if (ws[addr] && ws[addr].t === 'n') {
          ws[addr].z =
            col.format === 'currency'
              ? '"Rp "#,##0;[Red]-"Rp "#,##0'
              : '#,##0';
        }
      }
    });
  });

  // 7. Style header (bold)
  const headerAddr = XLSX.utils.encode_cell({ r: headerRowIdx, c: 0 });
  if (!ws[headerAddr]) ws[headerAddr] = {};

  // 8. Auto-filter pada baris header
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIdx, c: 0 },
      e: { r: headerRowIdx, c: columns.length - 1 },
    }),
  };

  // 9. Simpan workbook → trigger download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  // writeFile menggunakan FileSaver / anchor-click di browser
  XLSX.writeFile(wb, `${sanitize(filename)}_${today()}.xlsx`);
}

// ─── Export ke PDF ────────────────────────────────────────────────────────────
export function exportToPDF<T extends Record<string, any>>(
  filename: string,
  title: string,
  columns: ExportColumn[],
  data: T[],
  meta?: ExportMeta
) {
  const orientation = meta?.orientation ?? 'l';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, PW, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('RSUD MIMIKA', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sistem Informasi Manajemen Remunerasi', 14, 17);

  const stamp = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(stamp, PW - 14, 17, { align: 'right' });

  // ── Judul laporan ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 14, 34);

  let startY = 40;
  if (meta?.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    // Bungkus teks panjang agar tidak terpotong
    const wrapped = doc.splitTextToSize(meta.subtitle, PW - 28);
    doc.text(wrapped, 14, 40);
    startY = 40 + wrapped.length * 5;
  }

  // ── Tabel ─────────────────────────────────────────────────────────────────
  const head = [columns.map((c) => c.header)];
  const body = data.map((row) =>
    columns.map((col) => cellValuePDF(row[col.key], col.format))
  );

  // Column styles (rata kanan untuk angka)
  const colStyles: Record<number, any> = {};
  columns.forEach((col, i) => {
    if (col.format === 'currency' || col.format === 'number') {
      colStyles[i] = { halign: 'right' };
    }
  });

  // Hitung lebar relatif berdasarkan col.width
  const totalW = columns.reduce((s, c) => s + (c.width ?? 18), 0);
  const availW = PW - 28;                     // margin kiri+kanan 14mm masing-masing
  const colWidths: Record<number, any> = {};
  columns.forEach((col, i) => {
    colWidths[i] = { cellWidth: ((col.width ?? 18) / totalW) * availW };
  });
  const mergedColStyles = columns.reduce((acc, _, i) => {
    acc[i] = { ...colWidths[i], ...(colStyles[i] ?? {}) };
    return acc;
  }, {} as Record<number, any>);

  autoTable(doc, {
    startY: startY + 4,
    head,
    body,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: mergedColStyles,
    didDrawPage: (hookData: any) => {
      // Footer di setiap halaman
      const pageNum   = hookData.pageNumber;
      const pageTotal = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${pageNum} dari ${pageTotal}`,
        PW / 2,
        PH - 6,
        { align: 'center' }
      );
      doc.text('© RSUD Mimika — SIM Remunerasi', 14, PH - 6);
      doc.text(stamp, PW - 14, PH - 6, { align: 'right' });
    },
  });

  // ── Trigger download ──────────────────────────────────────────────────────
  doc.save(`${sanitize(filename)}_${today()}.pdf`);
}

// ─── Cetak halaman ────────────────────────────────────────────────────────────
export function printPage() {
  window.print();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
}
