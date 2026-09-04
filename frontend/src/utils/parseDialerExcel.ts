/**
 * Parsea el Excel del CRM (mismo formato que CrmImportPage) y extrae
 * las entradas para el marcador: un DialListEntry por teléfono por fila.
 *
 * Columnas del Excel (por posición, igual que la plantilla del CRM):
 *  0 Nombre*, 1 Apellidos*, 2 DNI/NIE*, 3 Teléfono 1*, 4 Teléfono 2,
 *  5 Teléfono 3, 6 Email, 7 Fecha nacimiento, 8 Dirección, 9 CUPS Gas,
 * 10 CUPS Luz, 11 Cuenta bancaria, 12 Empresa, 13 Autorizado, 14 Comentario
 */

import * as XLSX from 'xlsx';

export interface DialerEntry {
  phone:      string;
  clientName: string;
  notes?:     string;
}

export interface ParseDialerResult {
  entries:    DialerEntry[];
  skipped:    number;     // filas sin ningún teléfono válido
  total:      number;     // total de filas de datos (sin cabeceras/ejemplo)
  truncated:  boolean;    // si el archivo superaba MAX_ROWS
}

const MAX_ROWS = 5000;
// Fila de ejemplo del CRM (detectada por el primer campo)
const EXAMPLE_FIRST_CELL = 'María';

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function isValidPhone(p: string): boolean {
  return p.replace(/\D/g, '').length >= 9;
}

export function parseDialerExcel(file: File): Promise<ParseDialerResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));

    reader.onload = (ev) => {
      try {
        const wb  = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const all = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false }) as string[][];

        // Fila 0 = cabeceras; si fila 1 es el ejemplo del CRM, la saltamos
        const dataStart = str(all[1]?.[0]) === EXAMPLE_FIRST_CELL ? 2 : 1;
        const dataRows  = all.slice(dataStart).filter((r) => r.some((c) => str(c) !== ''));

        const truncated = dataRows.length > MAX_ROWS;
        const limited   = dataRows.slice(0, MAX_ROWS);

        const entries:   DialerEntry[] = [];
        let   skipped = 0;

        for (const row of limited) {
          const firstName   = str(row[0]);
          const lastName    = str(row[1]);
          const phone1      = str(row[3]);
          const phone2      = str(row[4]);
          const phone3      = str(row[5]);
          const businessName = str(row[12]);
          const comment     = str(row[14]);

          const clientName = businessName || `${firstName} ${lastName}`.trim() || '—';
          const notes      = comment || undefined;

          const phones = [phone1, phone2, phone3].filter((p) => p && isValidPhone(p));

          if (phones.length === 0) {
            skipped++;
            continue;
          }

          // One entry per phone (all linked to the same client name)
          for (const phone of phones) {
            entries.push({ phone, clientName, notes });
          }
        }

        resolve({ entries, skipped, total: limited.length, truncated });
      } catch {
        reject(new Error('Formato de Excel no válido. Usa la plantilla del CRM.'));
      }
    };

    reader.readAsBinaryString(file);
  });
}
