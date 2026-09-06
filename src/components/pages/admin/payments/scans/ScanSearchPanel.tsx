import React, { useMemo, useState } from 'react';
import {
  ReceiptHit,
  SearchMode,
  SEARCH_MODE_LABELS,
  describeReceipt,
  hitKey,
  receiptHasFile,
  searchReceipts,
} from '../../../../../utils/receiptScans';

const RESULT_LIMIT = 40;

interface ScanSearchPanelProps {
  members: Record<string, any>[];
  membersLoading: boolean;
  /** Disabled while a link write is in flight, or when no scan is on screen. */
  disabled: boolean;
  linkingKey: string | null;
  onLink: (hit: ReceiptHit) => void;
}

/**
 * Search half of the linking page: find the receipt the scan on the left belongs to.
 *
 * Runs entirely against the already-loaded member list. Every member document is in memory
 * for the payments pages anyway, and a Firestore query per keystroke over a collection that
 * has no index on receipt number would be both slower and more expensive.
 */
const ScanSearchPanel: React.FC<ScanSearchPanelProps> = ({
  members,
  membersLoading,
  disabled,
  linkingKey,
  onLink,
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('auto');
  const [memberIdFilter, setMemberIdFilter] = useState('');

  const hits = useMemo(
    () => searchReceipts(members, query, mode, memberIdFilter),
    [members, query, mode, memberIdFilter]
  );

  const shown = hits.slice(0, RESULT_LIMIT);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Receipt number, payment number, member ID or name"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-3 rounded bg-gray-200 hover:bg-gray-300 text-sm"
              title="Clear"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SearchMode)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
          >
            {(Object.keys(SEARCH_MODE_LABELS) as SearchMode[]).map((m) => (
              <option key={m} value={m}>
                Search: {SEARCH_MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={memberIdFilter}
            onChange={(e) => setMemberIdFilter(e.target.value)}
            placeholder="Narrow to member ID (optional)"
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 h-4">
        {membersLoading
          ? 'Loading members…'
          : query
          ? hits.length + ' match' + (hits.length === 1 ? '' : 'es') +
            (hits.length > RESULT_LIMIT ? ' · showing first ' + RESULT_LIMIT + ', narrow the search' : '')
          : members.length + ' members loaded'}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mt-1 divide-y divide-gray-100 border-t border-gray-200">
        {query && !membersLoading && hits.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-500">
            No receipt matches that. Try another number, or skip this scan.
          </div>
        )}

        {shown.map((hit) => {
          const key = hitKey(hit);
          const receipt = hit.receipt;
          const busy = linkingKey === key;
          // A hit with no receipt record has nothing to attach the file to — the receipt
          // has to be created first (payments page), so linking is offered but refused.
          const linkable = Boolean(receipt) && !disabled;

          return (
            <div key={key} className="py-2.5 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {receipt ? 'Receipt #' + (receipt.receiptNumber || '—') : 'No receipt record'}
                  {receipt && (
                    <span className="ml-2 font-normal text-gray-500">{receipt.date}</span>
                  )}
                  {receiptHasFile(receipt) && (
                    <span
                      className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 align-middle"
                      title="This receipt already has a file attached"
                    >
                      has file
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {receipt
                    ? describeReceipt(receipt)
                    : hit.orphanPaymentNumber
                    ? 'Payment #' + hit.orphanPaymentNumber + ' has no receipt record to attach to'
                    : 'This member has no receipts recorded'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {hit.memberId} · {hit.memberName || '—'}
                  {hit.memberNameAm ? ' · ' + hit.memberNameAm : ''}
                  {hit.memberStatus && hit.memberStatus.toLowerCase() !== 'active'
                    ? ' · ' + hit.memberStatus
                    : ''}
                  <span className="ml-2 text-gray-400">matched on {SEARCH_MODE_LABELS[hit.matchedOn]}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onLink(hit)}
                disabled={!linkable || busy}
                className="shrink-0 px-3 py-1.5 rounded text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                title={receipt ? 'Attach this scan to the receipt' : 'No receipt record to attach to'}
              >
                {busy ? '…' : 'Link'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScanSearchPanel;
