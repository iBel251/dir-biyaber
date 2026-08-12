import React, { useState } from 'react';
import {
  fetchAllMembersForImport,
  addReceiptsForMember,
  BulkReceiptInput,
} from '../../../../firebase/firebasePaymentsServices';
import { getCurrentUser } from '../../../../firebase/authService';
import useOldMembersStore from '../../../../store/oldMembersStore';
import {
  ParsedRow,
  RowStatus,
  ImportSummary,
  SLOT_PRICE,
  detectColumns,
  missingRequiredColumns,
  parseSheet,
  buildMemberLookup,
  resolveAgainstMembers,
  summarize,
  groupForWrite,
  rowToReceipt,
  statusLabel,
  problemRowsCsv,
} from '../../../../utils/paymentImport';

type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

/** Members written at once. Keeps the browser responsive without hammering Firestore. */
const CONCURRENCY = 8;
const PAGE_SIZE = 50;

interface FailedMember {
  memberId: string;
  message: string;
}

interface ImportedMember {
  memberId: string;
  name: string;
  receipts: number;
  skipped: number;
  entries: number;
  dollars: number;
  ranges: string;
}

const ImportPayments: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [filter, setFilter] = useState<RowStatus | 'all-problems'>('all-problems');
  const [page, setPage] = useState(1);

  // Import controls and progress
  const [limitMembers, setLimitMembers] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, written: 0, skipped: 0 });
  const [failures, setFailures] = useState<FailedMember[]>([]);
  const [imported, setImported] = useState<ImportedMember[]>([]);
  const cancelRef = React.useRef(false);

  const reset = () => {
    setPhase('idle');
    setRows([]);
    setSummary(null);
    setError('');
    setFileName('');
    setFailures([]);
    setImported([]);
    setProgress({ done: 0, total: 0, written: 0, skipped: 0 });
    setPage(1);
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setPhase('parsing');
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      // raw:false so dates and amounts arrive as the strings the sheet displays.
      const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!raw.length) throw new Error('That sheet has no data rows.');

      const columns = detectColumns(Object.keys(raw[0]));
      const missing = missingRequiredColumns(columns);
      if (missing.length) {
        throw new Error(
          `Could not find these columns in the sheet: ${missing.join(', ')}. ` +
            `Found headers: ${Object.keys(raw[0]).join(', ')}`
        );
      }

      const parsed = parseSheet(raw, columns);

      // One bulk read of every member; per-row lookups would be thousands of reads.
      const members = await fetchAllMembersForImport();
      const lookup = buildMemberLookup(members);
      resolveAgainstMembers(parsed, lookup);

      setRows(parsed);
      setSummary(summarize(parsed));
      setPhase('preview');
    } catch (e: any) {
      setError(e.message || 'Could not read that file.');
      setPhase('idle');
    }
  };

  const downloadProblems = () => {
    const csv = problemRowsCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-import-problems-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadImported = () => {
    const escape = (v: any) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      ['Member ID', 'Name (sheet)', 'Receipts written', 'Already present', 'Payment entries', 'Dollars', 'Ranges'].join(','),
      ...imported.map((m) =>
        [m.memberId, m.name, m.receipts, m.skipped, m.entries, m.dollars, m.ranges].map(escape).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-import-written-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    cancelRef.current = false;
    setFailures([]);
    setPhase('importing');

    const grouped: Array<[string, ParsedRow[]]> = [];
    groupForWrite(rows).forEach((memberRows, memberId) => grouped.push([memberId, memberRows]));
    const limit = Number(limitMembers);
    const batch = limit > 0 ? grouped.slice(0, limit) : grouped;

    setProgress({ done: 0, total: batch.length, written: 0, skipped: 0 });
    setImported([]);
    const createdBy = getCurrentUser()?.email || undefined;
    const failed: FailedMember[] = [];
    const succeeded: ImportedMember[] = [];
    let cursor = 0;

    const worker = async () => {
      while (cursor < batch.length && !cancelRef.current) {
        const index = cursor++;
        const [memberId, memberRows] = batch[index];
        const inputs: BulkReceiptInput[] = memberRows.map((row) => ({
          receipt: rowToReceipt(row, createdBy),
          paymentNumbers: row.paymentNumbers,
          singleAmount: SLOT_PRICE,
        }));
        try {
          const result = await addReceiptsForMember(memberId, inputs);
          // Record exactly who was touched — a run that only reports a count leaves no way
          // to spot-check the result or to know where a stopped run got to.
          succeeded.push({
            memberId,
            name: memberRows[0].sheetName,
            receipts: result.written,
            skipped: result.skipped,
            entries: memberRows.reduce((sum, r) => sum + r.paymentNumbers.length, 0),
            dollars: memberRows.reduce((sum, r) => sum + r.amount, 0),
            ranges: memberRows
              .map((r) => `${r.paymentNumbers[0]}-${r.paymentNumbers[r.paymentNumbers.length - 1]}`)
              .join(', '),
          });
          setImported([...succeeded]);
          setProgress((p) => ({
            done: p.done + 1,
            total: p.total,
            written: p.written + result.written,
            skipped: p.skipped + result.skipped,
          }));
        } catch (e: any) {
          failed.push({ memberId, message: e.message || 'Unknown error' });
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setFailures(failed);
    setPhase('done');

    // Refresh the store so ActiveList reflects the import without a manual refetch.
    try {
      const members = await fetchAllMembersForImport();
      useOldMembersStore.getState().setMembers(members);
    } catch {
      /* the import itself succeeded; a stale store is only a display issue */
    }
  };

  // Which members a limited run would actually touch, in the order the importer uses.
  const previewBatch: Array<{ memberId: string; name: string }> = [];
  if (phase === 'preview' && Number(limitMembers) > 0) {
    groupForWrite(rows).forEach((memberRows, memberId) => {
      if (previewBatch.length < Number(limitMembers)) {
        previewBatch.push({ memberId, name: memberRows[0].sheetName });
      }
    });
  }

  const problemRows = rows.filter((r) => r.status !== 'ready' && r.status !== 'already-imported');
  const visible =
    filter === 'all-problems' ? problemRows : rows.filter((r) => r.status === filter);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageRows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statCard = (label: string, value: number | string, tone = 'bg-gray-100 text-gray-800') => (
    <div className={`rounded px-3 py-2 ${tone}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );

  return (
    <div className="mt-4 ml-2">
      <button
        className="px-6 py-3 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg"
        onClick={() => setOpen((v) => !v)}
      >
        Import Payments from Sheet
      </button>

      {open && (
        <div className="mt-4 border rounded-lg p-4 bg-white shadow-sm">
          {/* ---- file picker ---- */}
          {(phase === 'idle' || phase === 'parsing') && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Upload the payment spreadsheet (.xlsx or .csv). Nothing is written until you review
                the preview and confirm.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="border px-3 py-2 rounded bg-white"
                disabled={phase === 'parsing'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {phase === 'parsing' && (
                <div className="mt-3 text-blue-700">Reading sheet and loading members…</div>
              )}
              {error && <div className="mt-3 text-red-600 text-sm whitespace-pre-wrap">{error}</div>}
            </div>
          )}

          {/* ---- preview ---- */}
          {phase === 'preview' && summary && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-lg">{fileName}</div>
                <button className="text-sm text-gray-600 underline" onClick={reset}>
                  Choose a different file
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {statCard('Rows in sheet', summary.totalRows)}
                {statCard('Will import', summary.readyRows, 'bg-green-100 text-green-900')}
                {statCard('Members affected', summary.readyMembers, 'bg-green-100 text-green-900')}
                {statCard('Held back', summary.totalRows - summary.readyRows, 'bg-yellow-100 text-yellow-900')}
                {statCard('Payment entries', summary.paymentEntries)}
                {statCard('Total value', `$${summary.totalDollars.toLocaleString()}`)}
                {statCard('Ranges auto-corrected', summary.repairedRanges, 'bg-blue-100 text-blue-900')}
                {statCard('Already imported', summary.alreadyImported, 'bg-blue-100 text-blue-900')}
              </div>

              <div className="text-sm text-gray-700 mb-3 space-y-1">
                <div>
                  <b>{summary.duplicateRows.toLocaleString()}</b> identical duplicate rows collapsed ·{' '}
                  <b>{summary.invalidRows.toLocaleString()}</b> invalid ·{' '}
                  <b>{summary.memberNotFound.toLocaleString()}</b> member not found ·{' '}
                  <b>{summary.blockedRows.toLocaleString()}</b> rows from{' '}
                  <b>{summary.blockedMembers.toLocaleString()}</b> members with contradictory records
                </div>
                {summary.memberNotFound > summary.readyRows && (
                  <div className="text-red-700">
                    Most rows failed to match a member — the Id number column may not correspond to
                    the member IDs in the database. Check before importing.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  className="border px-2 py-1 rounded text-sm"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all-problems">All problem rows ({problemRows.length})</option>
                  <option value="ready">Ready ({summary.readyRows})</option>
                  <option value="blocked-member">Blocked members ({summary.blockedRows})</option>
                  <option value="invalid">Invalid ({summary.invalidRows})</option>
                  <option value="member-not-found">Member not found ({summary.memberNotFound})</option>
                  <option value="duplicate-row">Duplicate rows ({summary.duplicateRows})</option>
                  <option value="already-imported">Already imported ({summary.alreadyImported})</option>
                </select>
                <button
                  className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold"
                  onClick={downloadProblems}
                  disabled={!problemRows.length}
                >
                  Download problem rows CSV
                </button>
              </div>

              <div className="border rounded overflow-x-auto max-h-[45vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Row</th>
                      <th className="px-2 py-1 text-left">ID</th>
                      <th className="px-2 py-1 text-left">Name (sheet)</th>
                      <th className="px-2 py-1 text-left">Amount</th>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Range</th>
                      <th className="px-2 py-1 text-left">Receipt</th>
                      <th className="px-2 py-1 text-left">Status / problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr key={r.sheetRow} className="border-t align-top">
                        <td className="px-2 py-1">{r.sheetRow}</td>
                        <td className="px-2 py-1">{r.memberId}</td>
                        <td className="px-2 py-1">{r.sheetName}</td>
                        <td className="px-2 py-1">{isFinite(r.amount) ? `$${r.amount}` : '—'}</td>
                        <td className="px-2 py-1">{r.date || r.rawDate}</td>
                        <td className="px-2 py-1">
                          {r.originalRange}
                          {r.repairedRange && (
                            <span className="text-blue-700"> → {r.paymentNumbers[0]}-{r.paymentNumbers[r.paymentNumbers.length - 1]}</span>
                          )}
                        </td>
                        <td className="px-2 py-1">{r.receiptNumber}</td>
                        <td className="px-2 py-1">
                          <span className={r.status === 'ready' ? 'text-green-700' : 'text-red-700'}>
                            {statusLabel(r.status)}
                          </span>
                          {r.issues.length > 0 && (
                            <div className="text-gray-600">{r.issues.map((i) => i.message).join(' ')}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!pageRows.length && (
                      <tr>
                        <td colSpan={8} className="px-2 py-4 text-center text-gray-500">
                          Nothing in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <button className="px-2 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Prev
                  </button>
                  <span>
                    Page {page} of {pageCount}
                  </span>
                  <button className="px-2 py-1 border rounded" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>
                    Next
                  </button>
                </div>
              )}

              <div className="mt-4 border-t pt-4 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Import only the first N members <span className="text-gray-400">(blank = all {summary.readyMembers})</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 20 for a trial run"
                    className="border px-3 py-2 rounded w-64 text-sm"
                    value={limitMembers}
                    onChange={(e) => setLimitMembers(e.target.value)}
                  />
                </div>
                <button
                  className="px-5 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold disabled:bg-gray-400"
                  onClick={runImport}
                  disabled={!summary.readyRows}
                >
                  Import {limitMembers ? `first ${limitMembers} members` : `${summary.readyRows.toLocaleString()} rows`}
                </button>
              </div>
              {Number(limitMembers) > 0 && (
                <div className="mt-3 text-sm bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-semibold text-blue-900 mb-1">
                    A limited run takes the first {limitMembers} members in sheet order:
                  </div>
                  <div className="text-blue-900 max-h-24 overflow-y-auto">
                    {previewBatch
                      .map((m) => `${m.memberId} (${m.name})`)
                      .join(' · ')}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Only payment and receipt data is written. Names, phone numbers and every other member
                field are left untouched. Re-running the same file is safe: receipts already recorded
                are detected and skipped.
              </p>
            </div>
          )}

          {/* ---- progress / result ---- */}
          {(phase === 'importing' || phase === 'done') && (
            <div>
              <div className="font-semibold text-lg mb-2">
                {phase === 'importing' ? 'Importing…' : 'Import finished'}
              </div>
              <div className="w-full bg-gray-200 rounded h-4 overflow-hidden mb-2">
                <div
                  className="bg-green-600 h-4 transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <div className="text-sm text-gray-700">
                {progress.done.toLocaleString()} of {progress.total.toLocaleString()} members ·{' '}
                <b>{progress.written.toLocaleString()}</b> receipts written ·{' '}
                {progress.skipped.toLocaleString()} already present
              </div>

              {phase === 'importing' && (
                <button
                  className="mt-3 px-4 py-2 rounded bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm"
                  onClick={() => {
                    cancelRef.current = true;
                  }}
                >
                  Stop after current members
                </button>
              )}

              {imported.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-sm mb-1">
                    Members written ({imported.length.toLocaleString()})
                  </div>
                  <div className="border rounded overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Member ID</th>
                          <th className="px-2 py-1 text-left">Name (sheet)</th>
                          <th className="px-2 py-1 text-left">Receipts</th>
                          <th className="px-2 py-1 text-left">Payments</th>
                          <th className="px-2 py-1 text-left">Value</th>
                          <th className="px-2 py-1 text-left">Ranges</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imported.map((m) => (
                          <tr key={m.memberId} className="border-t">
                            <td className="px-2 py-1 font-mono">{m.memberId}</td>
                            <td className="px-2 py-1">{m.name}</td>
                            <td className="px-2 py-1">
                              {m.receipts}
                              {m.skipped > 0 && (
                                <span className="text-gray-500"> (+{m.skipped} already there)</span>
                              )}
                            </td>
                            <td className="px-2 py-1">{m.entries}</td>
                            <td className="px-2 py-1">${m.dollars.toLocaleString()}</td>
                            <td className="px-2 py-1 text-gray-600">{m.ranges}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {phase === 'done' && (
                <div className="mt-3">
                  {failures.length > 0 ? (
                    <div className="text-red-700 text-sm">
                      <div className="font-semibold mb-1">{failures.length} members failed:</div>
                      <ul className="max-h-40 overflow-y-auto list-disc ml-5">
                        {failures.slice(0, 50).map((f) => (
                          <li key={f.memberId}>
                            {f.memberId}: {f.message}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-gray-700">
                        Re-running the same file will retry these; anything already written is skipped.
                      </p>
                    </div>
                  ) : (
                    <div className="text-green-700 font-semibold">Every member written successfully.</div>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:bg-gray-400"
                      onClick={downloadImported}
                      disabled={!imported.length}
                    >
                      Download list of members written
                    </button>
                    <button className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold" onClick={downloadProblems}>
                      Download problem rows CSV
                    </button>
                    <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-semibold" onClick={reset}>
                      Import another file
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportPayments;
