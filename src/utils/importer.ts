/**
 * importer.ts
 * Engine Import Excel/CSV universal untuk SIM Remunerasi
 * Menggunakan library xlsx (sudah terpasang) untuk parsing file
 */

import * as XLSX from 'xlsx';

// ─── Tipe umum ─────────────────────────────────────────────────
export interface ImportColumn<T = string> {
  header: string;          // Nama kolom di file (case-insensitive)
  key: string;             // Key di objek hasil
  required?: boolean;
  type?: 'string' | 'number' | 'date';
  validate?: (val: any) => string | null;  // null = valid, string = pesan error
  transform?: (val: any) => T;             // transformasi nilai
}

export interface ImportRow {
  _rowNum: number;                  // nomor baris di file (mulai 2)
  [key: string]: any;
}

export interface ImportError {
  row: number;
  column: string;
  value: string;
  message: string;
}

export interface ImportResult<T = ImportRow> {
  valid: T[];
  errors: ImportError[];
  totalRows: number;
  skipped: number;
}

// ─── Parse file Excel atau CSV ─────────────────────────────────
export async function parseFile(file: File): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,          // baca semua sebagai string dulu
        });
        resolve(rows);
      } catch (err) {
        reject(new Error('File tidak dapat dibaca. Pastikan format file adalah .xlsx, .xls, atau .csv.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Normalisasi header (lowercase, trim, hilangkan spasi) ─────
function normalizeKey(str: string): string {
  return str.toString().toLowerCase().trim().replace(/\s+/g, '_');
}

// ─── Validasi & transform baris-per-baris ─────────────────────
export function processRows<T extends Record<string, any>>(
  rawRows: any[][],
  columns: ImportColumn[],
  startRow = 1              // baris ke-2 (index 1) adalah data pertama
): ImportResult<T> {
  if (rawRows.length === 0) {
    return { valid: [], errors: [{ row: 0, column: '', value: '', message: 'File kosong atau tidak memiliki data.' }], totalRows: 0, skipped: 0 };
  }

  // Mapping header baris pertama → index kolom
  const headerRow = rawRows[0].map((h: any) => normalizeKey(String(h)));
  const colIndexMap: Record<string, number> = {};
  columns.forEach((col) => {
    const normalizedExpected = normalizeKey(col.header);
    const idx = headerRow.findIndex(
      (h) => h === normalizedExpected ||
             h.includes(normalizedExpected) ||
             normalizedExpected.includes(h)
    );
    colIndexMap[col.key] = idx;
  });

  const valid: T[] = [];
  const errors: ImportError[] = [];
  let skipped = 0;
  const dataRows = rawRows.slice(startRow);

  dataRows.forEach((row, i) => {
    const rowNum = i + startRow + 1;  // nomor baris di file (1-based)

    // Skip baris kosong total
    const isEmpty = row.every((cell) => cell === '' || cell === null || cell === undefined);
    if (isEmpty) { skipped++; return; }

    const obj: Record<string, any> = { _rowNum: rowNum };
    let rowHasError = false;

    columns.forEach((col) => {
      const colIdx = colIndexMap[col.key];
      let rawVal = colIdx >= 0 ? row[colIdx] : undefined;
      rawVal = rawVal === null || rawVal === undefined ? '' : String(rawVal).trim();

      // Required check
      if (col.required && (rawVal === '' || rawVal === undefined)) {
        errors.push({ row: rowNum, column: col.header, value: '', message: `Kolom "${col.header}" wajib diisi` });
        rowHasError = true;
        return;
      }

      // Type coercion
      let coerced: any = rawVal;
      if (col.type === 'number') {
        const cleaned = String(rawVal).replace(/[^0-9.\-]/g, '');
        coerced = cleaned === '' ? 0 : parseFloat(cleaned);
        if (isNaN(coerced)) {
          errors.push({ row: rowNum, column: col.header, value: rawVal, message: `Kolom "${col.header}" harus berupa angka` });
          rowHasError = true;
          return;
        }
      }
      if (col.type === 'date' && rawVal !== '') {
        // Coba parse tanggal dari berbagai format
        const parsed = new Date(rawVal);
        if (isNaN(parsed.getTime())) {
          // Coba format DD/MM/YYYY
          const parts = rawVal.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const alt = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
            coerced = isNaN(alt.getTime()) ? rawVal : alt.toISOString().split('T')[0];
          } else {
            coerced = rawVal;
          }
        } else {
          coerced = parsed.toISOString().split('T')[0];
        }
      }

      // Custom validation
      if (col.validate) {
        const errMsg = col.validate(coerced);
        if (errMsg) {
          errors.push({ row: rowNum, column: col.header, value: rawVal, message: errMsg });
          rowHasError = true;
          return;
        }
      }

      // Custom transform
      obj[col.key] = col.transform ? col.transform(coerced) : coerced;
    });

    if (!rowHasError) {
      valid.push(obj as T);
    }
  });

  return { valid, errors, totalRows: dataRows.length - skipped, skipped };
}

// ─── Download template Excel ───────────────────────────────────
export function downloadTemplate(filename: string, columns: ImportColumn[], sampleRows: any[][]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template
  const headerRow = columns.map((c) => c.header);
  const aoa = [headerRow, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map(() => ({ wch: 20 }));

  // Bold style header (basic)
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cellAddr]) {
      ws[cellAddr].s = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: '0F766E' } } };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  // Sheet 2: Panduan
  const guide = [
    ['PANDUAN PENGISIAN TEMPLATE IMPORT'],
    [''],
    ['Kolom', 'Keterangan', 'Wajib', 'Format'],
    ...columns.map((c) => [
      c.header,
      c.validate?.toString().includes('required') ? `Wajib diisi` : 'Opsional',
      c.required ? 'Ya' : 'Tidak',
      c.type === 'number' ? 'Angka (tanpa titik/koma ribuan)' :
      c.type === 'date'   ? 'YYYY-MM-DD atau DD/MM/YYYY' :
                            'Teks bebas',
    ]),
    [''],
    ['CATATAN:'],
    ['- Jangan mengubah nama kolom di baris pertama'],
    ['- Baris kosong akan dilewati otomatis'],
    ['- Pastikan format angka tidak mengandung simbol mata uang'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 10 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan');

  XLSX.writeFile(wb, `Template_${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
