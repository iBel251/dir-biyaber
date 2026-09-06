import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ScanViewer from './ScanViewer';
import ScanSearchPanel from './ScanSearchPanel';
import useOldMembersStore from '../../../../../store/oldMembersStore';
import { fetchAllMembersForImport } from '../../../../../firebase/firebasePaymentsServices';
import { getCurrentUser } from '../../../../../firebase/authService';
import {
  fetchScanIndex,
  syncScanIndex,
  linkScanToReceipt,
  unlinkScan,
  skipScan,
  unskipScan,
  SyncResult,
} from '../../../../../firebase/firebaseReceiptScansServices';
import { ScanDoc, ScanStatus, ReceiptHit, hitKey } from '../../../../../utils/receiptScans';
import { normalizeReceipts } from '../../../../../utils/payments';

const TABS: Array<{ key: ScanStatus; label: string; hint: string }> = [
  { key: 'pending', label: 'Not linked yet', hint: 'Work through these' },
  { key: 'linked', label: 'Linked', hint: 'Already attached to a receipt' },
  { key: 'skipped', label: 'Skipped', hint: 'No record found — revisit later' },
];

interface PendingConfirm {
  hit: ReceiptHit;
  scan: ScanDoc;
}

/**
 * Links scanned receipt documents to the receipt records they belong to.
 *
 * The scans are already in Storage under receiptScans/<batch>/. This page keeps a
 * Firestore index of them (pending / linked / skipped) so the job is resumable: an admin
 * can close the tab after 200 scans and pick up exactly where they left off, and a scan
 * with no matching record can be parked with a note instead of blocking the queue.
 */
const ReceiptScansPage: React.FC = () => {
  const members = useOldMembersStore((state) => state.members);
  const setMembers = useOldMembersStore((state) => state.setMembers);

  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [tab, setTab] = useState<ScanStatus>('pending');
  const [batch, setBatch] = useState('');
  const [cursor, setCursor] = useState(0);

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [syncing, setSyncing] = useState(false);
  const [syncFound, setSyncFound] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const [linkingKey, setLinkingKey] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [skipNote, setSkipNote] = useState('');

  // ---- initial load --------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setScans(await fetchScanIndex());
      } catch (e: any) {
        setError('Could not load the scan index: ' + (e && e.message ? e.message : e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Members are fetched only when the store is empty, so moving between admin pages does
  // not re-download the whole roster.
  useEffect(() => {
    if (members.length) return;
    let cancelled = false;
    const load = async () => {
      setMembersLoading(true);
      try {
        const all = await fetchAllMembersForImport();
        if (!cancelled) setMembers(all);
      } catch (e: any) {
        if (!cancelled) setError('Could not load members: ' + (e && e.message ? e.message : e));
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [members.length, setMembers]);

  // ---- derived lists -------------------------------------------------------
  const counts = useMemo(() => {
    const c: Record<ScanStatus, number> = { pending: 0, linked: 0, skipped: 0 };
    scans.forEach((s) => {
      if (c[s.status] != null) c[s.status]++;
    });
    return c;
  }, [scans]);

  const batches = useMemo(() => {
    const set = new Set<string>();
    scans.forEach((s) => set.add(s.batch || ''));
    return Array.from(set).sort();
  }, [scans]);

  const queue = useMemo(() => {
    return scans
      .filter((s) => s.status === tab)
      .filter((s) => !batch || (s.batch || '') === batch)
      .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
  }, [scans, tab, batch]);

  // Clamp rather than reset: after linking the 40th scan the queue shrinks by one, and the
  // admin should land on what is now the 40th, not back at the top.
  useEffect(() => {
    setCursor((c) => Math.min(Math.max(c, 0), Math.max(queue.length - 1, 0)));
  }, [queue.length]);

  // A different tab or batch is a different job; start it at the beginning.
  useEffect(() => {
    setCursor(0);
  }, [tab, batch]);

  const current: ScanDoc | null = queue[cursor] || null;

  // ---- actions -------------------------------------------------------------
  const applyScanPatch = useCallback((scanId: string, patch: Partial<ScanDoc>) => {
    setScans((prev) => prev.map((s) => (s.scanId === scanId ? { ...s, ...patch } : s)));
  }, []);

  /**
   * Mirrors the receipt write into the member store so the "has file" badge is right on
   * the next search without re-reading every member document from Firestore.
   */
  const markReceiptLinkedLocally = useCallback(
    (memberId: string, receiptId: string, scan: ScanDoc) => {
      setMembers((prev: any[]) =>
        prev.map((m) => {
          if (m.id !== memberId) return m;
          const receipts = normalizeReceipts(m.receipts).map((r) =>
            r.receiptId === receiptId
              ? {
                  ...r,
                  imageUrl: scan.url,
                  imagePath: scan.path,
                  fileType: /\.pdf$/i.test(scan.name) ? ('pdf' as const) : ('image' as const),
                }
              : r
          );
          return { ...m, receipts };
        })
      );
    },
    [setMembers]
  );

  const doLink = useCallback(
    async (hit: ReceiptHit, scan: ScanDoc, replaceExisting: boolean) => {
      if (!hit.receipt) return;
      setLinkingKey(hitKey(hit));
      setError('');
      try {
        const user = getCurrentUser();
        const result = await linkScanToReceipt({
          scan,
          memberId: hit.memberId,
          receiptId: hit.receipt.receiptId,
          replaceExisting,
          linkedBy: user && user.email ? user.email : undefined,
        });

        applyScanPatch(scan.scanId, {
          status: 'linked',
          memberId: hit.memberId,
          receiptId: hit.receipt.receiptId,
          receiptNumber: hit.receipt.receiptNumber,
          linkedAt: new Date().toISOString(),
          note: undefined,
        });
        markReceiptLinkedLocally(hit.memberId, hit.receipt.receiptId, scan);

        if (result.replacedPath) {
          // The displaced file went back to pending in Firestore; keep the list in step.
          setScans((prev) =>
            prev.map((s) =>
              s.path === result.replacedPath
                ? { ...s, status: 'pending', memberId: undefined, receiptId: undefined }
                : s
            )
          );
        }

        setNotice(
          scan.name + ' → receipt #' + (hit.receipt.receiptNumber || '—') + ' (' + hit.memberId + ')'
        );
        setConfirm(null);
      } catch (e: any) {
        setError('Link failed: ' + (e && e.message ? e.message : e));
      } finally {
        setLinkingKey(null);
      }
    },
    [applyScanPatch, markReceiptLinkedLocally]
  );

  const handleLink = useCallback(
    (hit: ReceiptHit) => {
      if (!current || !hit.receipt) return;
      // Overwriting an attached file is a confirm, not a silent replace — the existing one
      // may be the correct scan and this one a duplicate.
      if (hit.receipt.imageUrl) {
        setConfirm({ hit, scan: current });
        return;
      }
      doLink(hit, current, false);
    },
    [current, doLink]
  );

  const handleSkip = useCallback(async () => {
    if (!current) return;
    setError('');
    try {
      await skipScan(current, skipNote.trim());
      applyScanPatch(current.scanId, {
        status: 'skipped',
        note: skipNote.trim() || 'No matching record found.',
      });
      setSkipNote('');
      setNotice(current.name + ' skipped.');
    } catch (e: any) {
      setError('Could not skip: ' + (e && e.message ? e.message : e));
    }
  }, [current, skipNote, applyScanPatch]);

  const handleUnlink = useCallback(async () => {
    if (!current) return;
    setError('');
    try {
      await unlinkScan(current);
      applyScanPatch(current.scanId, {
        status: 'pending',
        memberId: undefined,
        receiptId: undefined,
        receiptNumber: undefined,
        linkedAt: undefined,
        linkedBy: undefined,
      });
      setNotice(current.name + ' detached and back in the queue.');
    } catch (e: any) {
      setError('Could not unlink: ' + (e && e.message ? e.message : e));
    }
  }, [current, applyScanPatch]);

  const handleUnskip = useCallback(async () => {
    if (!current) return;
    setError('');
    try {
      await unskipScan(current);
      applyScanPatch(current.scanId, { status: 'pending', note: undefined });
      setNotice(current.name + ' back in the queue.');
    } catch (e: any) {
      setError('Could not return it to the queue: ' + (e && e.message ? e.message : e));
    }
  }, [current, applyScanPatch]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncFound(0);
    setSyncResult(null);
    setError('');
    try {
      const result = await syncScanIndex((found) => setSyncFound(found));
      setSyncResult(result);
      setScans(await fetchScanIndex());
    } catch (e: any) {
      setError('Sync failed: ' + (e && e.message ? e.message : e));
    } finally {
      setSyncing(false);
    }
  }, []);

  // ---- render --------------------------------------------------------------
  return (
    <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipt Scans</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Files in Storage under <code>receiptScans/</code>. Find the receipt each one belongs
            to and attach it.
          </p>
        </div>
        <div className="text-right shrink-0">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-semibold"
          >
            {syncing ? 'Scanning Storage… ' + syncFound + ' found' : 'Sync from Storage'}
          </button>
          {syncResult && (
            <div className="text-xs text-gray-600 mt-1">
              {syncResult.filesInStorage} files · {syncResult.added} new · {syncResult.refreshed} refreshed
              {syncResult.missingFromStorage.length > 0 && (
                <span className="text-amber-700">
                  {' '}
                  · {syncResult.missingFromStorage.length} indexed file(s) missing from Storage
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            title={t.hint}
            className={
              'px-4 py-2 rounded-t text-sm font-semibold border-b-2 ' +
              (tab === t.key
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-100')
            }
          >
            {t.label}
            <span className="ml-2 text-xs font-normal text-gray-500">{counts[t.key]}</span>
          </button>
        ))}
        {batches.length > 1 && (
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="ml-auto border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b || '(root)'}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="font-bold">
            ×
          </button>
        </div>
      )}
      {notice && !error && (
        <div className="mb-3 px-3 py-2 rounded bg-green-50 border border-green-200 text-sm text-green-800 flex justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="font-bold">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading scans…</div>
      ) : scans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600 gap-2">
          <div className="text-lg font-semibold">No scans indexed yet.</div>
          <div className="text-sm max-w-md">
            Upload the scanned files to Storage under <code>receiptScans/&lt;batch&gt;/</code>, then
            press <strong>Sync from Storage</strong> to pull them into the queue.
          </div>
        </div>
      ) : queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Nothing in this tab{batch ? ' for ' + batch : ''}.
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScanViewer
            scan={current}
            index={cursor}
            total={queue.length}
            onPrev={() => setCursor((c) => Math.max(0, c - 1))}
            onNext={() => setCursor((c) => Math.min(queue.length - 1, c + 1))}
          />

          <div className="flex flex-col min-h-0 bg-white border border-gray-200 rounded-lg p-4">
            {tab === 'pending' && (
              <>
                <ScanSearchPanel
                  members={members}
                  membersLoading={membersLoading}
                  disabled={!current || linkingKey !== null}
                  linkingKey={linkingKey}
                  onLink={handleLink}
                />
                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                  <input
                    type="text"
                    value={skipNote}
                    onChange={(e) => setSkipNote(e.target.value)}
                    placeholder="Why is this one being skipped? (optional)"
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={!current}
                    className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold whitespace-nowrap"
                  >
                    Skip this scan
                  </button>
                </div>
              </>
            )}

            {tab === 'linked' && current && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-gray-900">Linked</h3>
                <dl className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="font-semibold">Member:</span> {current.memberId || '—'}
                  </div>
                  <div>
                    <span className="font-semibold">Receipt #:</span> {current.receiptNumber || '—'}
                  </div>
                  <div>
                    <span className="font-semibold">Receipt id:</span> {current.receiptId || '—'}
                  </div>
                  <div>
                    <span className="font-semibold">Linked:</span>{' '}
                    {current.linkedAt ? current.linkedAt.slice(0, 19).replace('T', ' ') : '—'}
                    {current.linkedBy ? ' by ' + current.linkedBy : ''}
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="self-start px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                >
                  Unlink and return to queue
                </button>
              </div>
            )}

            {tab === 'skipped' && current && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-gray-900">Skipped</h3>
                <p className="text-sm text-gray-700">{current.note || 'No note.'}</p>
                <button
                  type="button"
                  onClick={handleUnskip}
                  className="self-start px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Return to queue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirm && confirm.hit.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Receipt already has a file</h3>
            <p className="text-sm text-gray-700 mb-3">
              Receipt #{confirm.hit.receipt.receiptNumber || '—'} for member {confirm.hit.memberId}{' '}
              is already showing a file. Attaching <strong>{confirm.scan.name}</strong> will replace
              it.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              The old file stays in Storage. If it came from this scan library it goes back to the
              &ldquo;not linked yet&rdquo; queue.{' '}
              <a
                href={confirm.hit.receipt.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View the current file
              </a>
              .
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => doLink(confirm.hit, confirm.scan, true)}
                disabled={linkingKey !== null}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold"
              >
                Replace it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptScansPage;
