import React from 'react';
import {
  MemberFilters,
  PaymentFilterMode,
  PAYMENT_MODE_LABELS,
} from '../../../../utils/memberFilters';
import { parsePaymentNumberList } from '../../../../utils/payments';

interface SearchAndFilterProps {
  filters: MemberFilters;
  onChange: (filters: MemberFilters) => void;
  resultCount: number;
  totalCount: number;
  onExport?: () => void;
}

/**
 * Controlled filter bar. It reports criteria upward instead of rewriting the shared member
 * store: the previous version filtered by calling setMembers with a subset and restoring a
 * ref on unmount, which meant every other reader of the store saw the search results as if
 * they were the full member list.
 */
const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onChange,
  resultCount,
  totalCount,
  onExport,
}) => {
  const set = (patch: Partial<MemberFilters>) => onChange({ ...filters, ...patch });
  const parsedNumbers = parsePaymentNumberList(filters.paymentInput);
  const filtering = filters.query.trim() !== '' || (filters.mode !== 'off' && parsedNumbers.length > 0);

  return (
    <form className="mb-4 space-y-2" onSubmit={(e) => e.preventDefault()}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by ID, Name, Name (Am), phone or email..."
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          className="border px-3 py-2 rounded w-full"
        />
        {filtering && (
          <button
            type="button"
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold whitespace-nowrap"
            onClick={() => onChange({ query: '', paymentInput: '', mode: 'off' })}
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border px-2 py-2 rounded text-sm"
          value={filters.mode}
          onChange={(e) => set({ mode: e.target.value as PaymentFilterMode })}
        >
          {(Object.keys(PAYMENT_MODE_LABELS) as PaymentFilterMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {PAYMENT_MODE_LABELS[mode]}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Payment numbers, e.g. 131-140, 145"
          value={filters.paymentInput}
          onChange={(e) => set({ paymentInput: e.target.value })}
          disabled={filters.mode === 'off'}
          className="border px-3 py-2 rounded text-sm flex-1 min-w-[220px] disabled:bg-gray-100"
        />

        {onExport && (
          <button
            type="button"
            className="px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold"
            onClick={onExport}
            disabled={!resultCount}
          >
            Export result
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 flex flex-wrap gap-x-3">
        <span>
          Showing <b>{resultCount.toLocaleString()}</b> of {totalCount.toLocaleString()} active members
        </span>
        {filters.mode !== 'off' && parsedNumbers.length > 0 && (
          <span className="text-blue-700">
            {PAYMENT_MODE_LABELS[filters.mode]}: {parsedNumbers.length} number
            {parsedNumbers.length === 1 ? '' : 's'} ({parsedNumbers[0]}
            {parsedNumbers.length > 1 ? `–${parsedNumbers[parsedNumbers.length - 1]}` : ''})
          </span>
        )}
        {filters.mode !== 'off' && parsedNumbers.length === 0 && filters.paymentInput.trim() !== '' && (
          <span className="text-red-600">No payment numbers recognised in that box.</span>
        )}
      </div>
    </form>
  );
};

export default SearchAndFilter;
