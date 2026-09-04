import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Button from '@/design-system/components/Button';
import { clientService } from '@/features/clientes/services/clientService';
import type { CreateClientData } from '@/types/sales';
import styles from './CrmImportPage.module.scss';

// ─── Columnas de la plantilla ─────────────────────────────────────────────────
// Orden exacto con el que se genera y se parsea el Excel.

const COLUMNS = [
  { key: 'firstName',    label: 'Nombre*',                       example: 'María',                       required: true  },
  { key: 'lastName',     label: 'Apellidos*',                    example: 'García López',                required: true  },
  { key: 'dni',          label: 'DNI/NIE*',                      example: '12345678Z',                   required: true  },
  { key: 'phone1',       label: 'Teléfono 1*',                   example: '612345678',                   required: true  },
  { key: 'phone2',       label: 'Teléfono 2',                    example: '',                            required: false },
  { key: 'phone3',       label: 'Teléfono 3',                    example: '',                            required: false },
  { key: 'email',        label: 'Email',                         example: 'maria@ejemplo.com',           required: false },
  { key: 'birthday',     label: 'Fecha nacimiento (DD/MM/AAAA)', example: '15/06/1985',                  required: false },
  { key: 'address',      label: 'Dirección',                     example: 'Calle Mayor 1, 28001 Madrid', required: false },
  { key: 'cupsGas',      label: 'CUPS Gas',                      example: '',                            required: false },
  { key: 'cupsLuz',      label: 'CUPS Luz',                      example: '',                            required: false },
  { key: 'bankAccount',  label: 'Cuenta bancaria (IBAN)',         example: 'ES9121000418450200051332',    required: false },
  { key: 'businessName', label: 'Empresa',                       example: '',                            required: false },
  { key: 'authorized',   label: 'Autorizado (LOPD)',              example: '',                            required: false },
  { key: 'comment',      label: 'Comentario',                    example: '',                            required: false },
] as const;

type ColKey = typeof COLUMNS[number]['key'];
type RawRow = Partial<Record<ColKey, string>>;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  index:      number;
  raw:        RawRow;
  errors:     string[];
  clientData: CreateClientData | null;
}

type RowStatus = 'pending' | 'ok' | 'error' | 'skip';

interface ImportRow extends ParsedRow {
  status:  RowStatus;
  message: string;
}

// ─── Constantes de concurrencia ───────────────────────────────────────────────
// Rate limit del backend: 100 req/min. Con lotes de 5 + 350 ms de pausa
// conseguimos ~85 req/min, dentro del límite con margen de seguridad.

const CONCURRENCY   = 5;
const BATCH_DELAY   = 350; // ms entre lotes
const MAX_ROWS      = 2000; // límite práctico por archivo

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function parseDateField(raw: string): string | undefined {
  if (!raw) return undefined;
  const dmy = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return raw.slice(0, 10);
  return undefined;
}

const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}[A-Z0-9]{1,9}$/i;

function validateRow(raw: RawRow, index: number): ParsedRow {
  const errors: string[] = [];

  if (!raw.firstName || raw.firstName.length < 2) errors.push('Nombre mínimo 2 caracteres');
  if (!raw.lastName  || raw.lastName.length  < 2) errors.push('Apellidos mínimo 2 caracteres');
  if (!raw.dni)                                    errors.push('DNI/NIE requerido');
  if (!raw.phone1)                                 errors.push('Teléfono 1 requerido');

  const phones: string[] = [];
  for (const key of ['phone1', 'phone2', 'phone3'] as ColKey[]) {
    const p = raw[key];
    if (!p) continue;
    if (p.replace(/\D/g, '').length < 9) {
      errors.push(`${key === 'phone1' ? 'Teléfono 1' : key === 'phone2' ? 'Teléfono 2' : 'Teléfono 3'} debe tener mínimo 9 dígitos`);
    } else {
      phones.push(p);
    }
  }

  if (raw.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
    errors.push('Email no válido');
  }

  if (raw.bankAccount && !IBAN_RE.test(raw.bankAccount)) {
    errors.push('IBAN no válido');
  }

  let clientData: CreateClientData | null = null;
  if (errors.length === 0) {
    clientData = {
      firstName:    raw.firstName!,
      lastName:     raw.lastName!,
      dni:          raw.dni!,
      email:        raw.email        || undefined,
      birthday:     parseDateField(raw.birthday ?? ''),
      businessName: raw.businessName || undefined,
      authorized:   raw.authorized   || undefined,
      phones,
      addresses:    raw.address ? [{ address: raw.address, cupsGas: raw.cupsGas ?? '', cupsLuz: raw.cupsLuz ?? '' }] : undefined,
      bankAccounts: raw.bankAccount ? [raw.bankAccount] : undefined,
      comments:     raw.comment ? [raw.comment] : undefined,
    };
  }

  return { index, raw, errors, clientData };
}

function parseSheet(wb: XLSX.WorkBook): { rows: ParsedRow[]; truncated: boolean } {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const all = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false }) as string[][];
  // Fila 0 = cabeceras; fila 1 puede ser ejemplo — la descartamos si empieza con el mismo texto
  const dataStart = all[1]?.[0] === COLUMNS[0].example ? 2 : 1;
  const dataRows  = all.slice(dataStart).filter((r) => r.some((c) => str(c) !== ''));
  const truncated = dataRows.length > MAX_ROWS;
  const limited   = dataRows.slice(0, MAX_ROWS);

  return {
    rows: limited.map((row, i) => {
      const raw: RawRow = {};
      COLUMNS.forEach((col, ci) => {
        const v = str(row[ci]);
        if (v) (raw as Record<string, string>)[col.key] = v;
      });
      return validateRow(raw, dataStart + i + 1);
    }),
    truncated,
  };
}

// ─── Descarga de plantilla ────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = COLUMNS.map((c) => c.label);
  const example = COLUMNS.map((c) => c.example);
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws['!cols'] = COLUMNS.map(() => ({ wch: 26 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'plantilla_clientes_crm.xlsx');
}

// ─── Estimación de tiempo ─────────────────────────────────────────────────────

function estimatedSeconds(n: number): string {
  const secs = Math.ceil((n / CONCURRENCY) * (BATCH_DELAY / 1000)) + Math.ceil(n / CONCURRENCY);
  if (secs < 60) return `~${secs} segundos`;
  return `~${Math.ceil(secs / 60)} minuto${Math.ceil(secs / 60) !== 1 ? 's' : ''}`;
}

// ─── Importación en lotes con concurrencia ────────────────────────────────────

async function importBatched(
  rows: ImportRow[],
  onProgress: (updated: ImportRow[]) => void,
): Promise<ImportRow[]> {
  const valid = rows.filter((r) => r.errors.length === 0);
  const result = rows.map((r) => ({ ...r }));

  for (let i = 0; i < valid.length; i += CONCURRENCY) {
    const batch = valid.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (row) => {
        const ri = result.findIndex((r) => r.index === row.index);
        try {
          await clientService.createClient(row.clientData!);
          result[ri] = { ...result[ri], status: 'ok', message: 'Importado' };
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Error al crear';
          result[ri] = { ...result[ri], status: 'error', message: msg };
        }
      }),
    );

    onProgress([...result]);

    // Pausa entre lotes (excepto en el último)
    if (i + CONCURRENCY < valid.length) {
      await new Promise((res) => setTimeout(res, BATCH_DELAY));
    }
  }

  // Marcar filas omitidas
  result.forEach((r) => {
    if (r.status === 'pending') {
      r.status  = 'skip';
      r.message = 'Omitida (errores)';
    }
  });

  return result;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CrmImportPage() {
  const navigate = useNavigate();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [rows,      setRows]      = useState<ImportRow[]>([]);
  const [fileName,  setFileName]  = useState('');
  const [truncated, setTruncated] = useState(false);
  const [phase,     setPhase]     = useState<'idle' | 'preview' | 'importing' | 'done'>('idle');
  const [progress,  setProgress]  = useState({ done: 0, total: 0 });

  // ── Carga del archivo ──────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target?.result, { type: 'binary' });
        const { rows: parsed, truncated: trunc } = parseSheet(wb);
        setRows(parsed.map((p) => ({ ...p, status: 'pending', message: '' })));
        setTruncated(trunc);
        setPhase('preview');
      } catch {
        alert('No se pudo leer el archivo. Asegúrate de que es un Excel válido (.xlsx / .xls).');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ── Importación ────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const validCount = rows.filter((r) => r.errors.length === 0).length;
    if (validCount === 0) return;

    setPhase('importing');
    setProgress({ done: 0, total: validCount });

    let doneCount = 0;
    const final = await importBatched(rows, (updated) => {
      doneCount = updated.filter((r) => r.status === 'ok' || r.status === 'error').length;
      setProgress({ done: doneCount, total: validCount });
      setRows(updated);
    });

    setRows(final);
    setPhase('done');
  };

  const reset = () => {
    setRows([]);
    setFileName('');
    setTruncated(false);
    setPhase('idle');
    setProgress({ done: 0, total: 0 });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const validCount   = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.filter((r) => r.errors.length > 0).length;
  const okCount      = rows.filter((r) => r.status === 'ok').length;
  const errCount     = rows.filter((r) => r.status === 'error').length;
  const pct          = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => navigate('/settings/crm')}>
          ← Volver
        </Button>
        <div>
          <h1 className={styles.title}>Importar clientes desde Excel</h1>
          <p className={styles.subtitle}>Carga masiva de clientes · máximo {MAX_ROWS.toLocaleString('es-ES')} registros por archivo</p>
        </div>
      </div>

      {/* ── Paso 1 — Plantilla ── */}
      <div className={styles.step}>
        <div className={styles.stepNum}>1</div>
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>Descarga la plantilla</h2>
          <p className={styles.stepDesc}>
            El archivo tiene {COLUMNS.length} columnas con una fila de ejemplo. Los campos marcados con * son obligatorios —
            incluyendo <strong>al menos un teléfono</strong> (mínimo 9 dígitos).
          </p>
          <Button variant="secondary" onClick={downloadTemplate}>
            ↓ Descargar plantilla Excel
          </Button>
        </div>
      </div>

      {/* ── Paso 2 — Subir ── */}
      <div className={styles.step}>
        <div className={styles.stepNum}>2</div>
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>Carga tu archivo</h2>
          <p className={styles.stepDesc}>
            Archivos .xlsx o .xls. Máximo {MAX_ROWS.toLocaleString('es-ES')} filas de datos.
            La importación usa {CONCURRENCY} conexiones en paralelo respetando el límite del servidor (100 req/min).
          </p>
          <div className={styles.uploadRow}>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className={styles.fileInput}
              id="excel-upload"
              disabled={phase === 'importing'}
            />
            <label htmlFor="excel-upload" className={styles.fileLabel}>
              {fileName || 'Seleccionar archivo…'}
            </label>
            {fileName && phase !== 'importing' && (
              <Button variant="secondary" onClick={reset}>Cambiar archivo</Button>
            )}
          </div>
          {truncated && (
            <p className={styles.warnMsg}>
              ⚠ El archivo tiene más de {MAX_ROWS.toLocaleString('es-ES')} filas. Solo se procesarán las primeras {MAX_ROWS.toLocaleString('es-ES')}.
            </p>
          )}
        </div>
      </div>

      {/* ── Paso 3 — Vista previa ── */}
      {phase !== 'idle' && (
        <div className={styles.step}>
          <div className={styles.stepNum}>3</div>
          <div className={styles.stepBody}>
            <h2 className={styles.stepTitle}>Vista previa y validación</h2>

            <div className={styles.summary}>
              <span className={styles.pill}>{rows.length} filas</span>
              <span className={`${styles.pill} ${styles.pillOk}`}>{validCount} correctas</span>
              {invalidCount > 0 && (
                <span className={`${styles.pill} ${styles.pillErr}`}>{invalidCount} con errores</span>
              )}
              {phase === 'done' && (
                <>
                  <span className={`${styles.pill} ${styles.pillOk}`}>{okCount} importadas</span>
                  {errCount > 0 && <span className={`${styles.pill} ${styles.pillErr}`}>{errCount} fallidas</span>}
                </>
              )}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Apellidos</th>
                    <th>DNI/NIE</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.index}
                      className={
                        row.status === 'ok'    ? styles.rowOk    :
                        row.status === 'error' ? styles.rowError :
                        row.status === 'skip'  ? styles.rowSkip  :
                        row.errors.length > 0  ? styles.rowInvalid : ''
                      }
                    >
                      <td className={styles.tdNum}>{row.index}</td>
                      <td>{row.raw.firstName ?? '—'}</td>
                      <td>{row.raw.lastName  ?? '—'}</td>
                      <td>{row.raw.dni       ?? '—'}</td>
                      <td>{[row.raw.phone1, row.raw.phone2, row.raw.phone3].filter(Boolean).join(' / ') || '—'}</td>
                      <td>{row.raw.email ?? ''}</td>
                      <td className={styles.tdAddr}>{row.raw.address ?? ''}</td>
                      <td className={styles.tdStatus}>
                        {row.status === 'pending' && row.errors.length > 0 && (
                          <span className={styles.errTag} title={row.errors.join(' | ')}>
                            ✕ {row.errors[0]}{row.errors.length > 1 ? ` +${row.errors.length - 1}` : ''}
                          </span>
                        )}
                        {row.status === 'pending' && row.errors.length === 0 && (
                          <span className={styles.pendingTag}>Lista</span>
                        )}
                        {row.status === 'ok'    && <span className={styles.okTag}>✓ Importado</span>}
                        {row.status === 'error' && <span className={styles.errTag} title={row.message}>✕ {row.message}</span>}
                        {row.status === 'skip'  && <span className={styles.skipTag}>— Omitida</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 4 — Importar ── */}
      {phase === 'preview' && (
        <div className={styles.step}>
          <div className={styles.stepNum}>4</div>
          <div className={styles.stepBody}>
            <h2 className={styles.stepTitle}>Importar</h2>
            {validCount === 0 ? (
              <p className={styles.warnMsg}>
                No hay filas válidas. Corrige los errores en el Excel y vuelve a cargarlo.
              </p>
            ) : (
              <>
                <p className={styles.stepDesc}>
                  Se importarán <strong>{validCount}</strong> cliente{validCount !== 1 ? 's' : ''} en lotes de {CONCURRENCY}.
                  Tiempo estimado: <strong>{estimatedSeconds(validCount)}</strong>.
                  {invalidCount > 0 && ` Las ${invalidCount} filas con errores serán omitidas.`}
                </p>
                <Button variant="primary" onClick={handleImport}>
                  Importar {validCount} cliente{validCount !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Progreso ── */}
      {phase === 'importing' && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.progressLabel}>
            {progress.done} / {progress.total} clientes importados ({Math.round(pct)}%)
          </span>
        </div>
      )}

      {/* ── Resultado final ── */}
      {phase === 'done' && (
        <div className={`${styles.result} ${errCount > 0 ? styles.resultWarn : ''}`}>
          <span className={styles.resultIcon}>{errCount === 0 ? '✓' : '⚠'}</span>
          <div>
            <p className={styles.resultTitle}>
              {okCount} cliente{okCount !== 1 ? 's' : ''} importado{okCount !== 1 ? 's' : ''} correctamente
              {errCount > 0 && ` · ${errCount} con error (ver tabla)`}
            </p>
            <Button variant="secondary" onClick={reset}>Nueva importación</Button>
          </div>
        </div>
      )}
    </div>
  );
}
