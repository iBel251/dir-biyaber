import React, { useState, useRef, useEffect, useMemo } from 'react';
import useOldMembersStore from '../../../../store/oldMembersStore';
import { fetchAllMembersForImport } from '../../../../firebase/firebasePaymentsServices';
import SearchAndFilter from './SearchAndFilter';
import PaymentDetail from './PaymentDetail';
import {
  MemberFilters,
  EMPTY_FILTERS,
  filterAndRankMembers,
  membersToCsv,
  membersToRows,
  paidNumbersOf,
} from '../../../../utils/memberFilters';
import { normalizePayments, parsePaymentNumberList } from '../../../../utils/payments';
import ExportMenu, { ExportFormat } from './ExportMenu';

const PAGE_SIZE = 20;
const FULL_MODE_CHUNK = 100;

const ActiveList: React.FC = () => {
  const members = useOldMembersStore((state) => state.members);
  const setMembers = useOldMembersStore((state) => state.setMembers);

  // Pagination state
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<MemberFilters>(EMPTY_FILTERS);

  // Only show members with status 'active'
  const activeMembers = useMemo(
    () => members.filter((m) => (m.status || '').toLowerCase() === 'active'),
    [members]
  );

  // Search and payment filtering are derived here rather than written back into the store,
  // so the shared member list always means "every member", not "the current search".
  const visibleMembers = useMemo(
    () => filterAndRankMembers(activeMembers, filters),
    [activeMembers, filters]
  );

  const totalPages = Math.ceil((visibleMembers.length || 0) / PAGE_SIZE);
  const paginatedMembers = visibleMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to the first page whenever the filter changes, otherwise a narrow result can
  // land the viewer on an empty page.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Collect all unique payment numbers across active members, for the column headers.
  const allPaymentNumbers = useMemo(() => {
    const set = new Set<string>();
    activeMembers.forEach((m) => {
      normalizePayments(m.payments).forEach((p) => set.add(String(p.paymentNumber)));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [activeMembers]);

  const filteredNumbers = parsePaymentNumberList(filters.paymentInput);

  // Which payment columns the table shows. When the admin has filtered on specific payment
  // numbers, those are the only columns worth looking at — otherwise the answer to "who
  // hasn't paid 131-140" is buried among a hundred other columns.
  const [visiblePaymentNumber, setVisiblePaymentNumber] = useState<string>('');

  // Full-sheet mode: every matching row in one continuous, Excel-like scroll surface
  // instead of 20-row pages. Rows are appended in chunks as the viewer scrolls, so a
  // few thousand members times a hundred payment columns doesn't lock up the browser.
  const [fullMode, setFullMode] = useState(false);
  const [visibleRowCount, setVisibleRowCount] = useState(FULL_MODE_CHUNK);
  const displayedColumns = useMemo(() => {
    if (visiblePaymentNumber) return [visiblePaymentNumber];
    if (filters.mode !== 'off' && filteredNumbers.length) return filteredNumbers;
    return allPaymentNumbers;
  }, [visiblePaymentNumber, filters.mode, filteredNumbers, allPaymentNumbers]);

  const displayedRows = fullMode ? visibleMembers.slice(0, visibleRowCount) : paginatedMembers;
  const hasMoreRows = fullMode && visibleRowCount < visibleMembers.length;

  // A changed filter (or a fresh entry into full mode) starts the sheet back at one chunk.
  useEffect(() => {
    setVisibleRowCount(FULL_MODE_CHUNK);
  }, [filters, fullMode, activeMembers]);

  // Append the next chunk once the viewer nears the bottom of the sheet.
  const handleSheetScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMoreRows) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) {
      setVisibleRowCount((c) => Math.min(c + FULL_MODE_CHUNK, visibleMembers.length));
    }
  };

  // Esc leaves full mode, and the page behind it shouldn't scroll while the sheet is open.
  useEffect(() => {
    if (!fullMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullMode(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullMode]);

  // Same filtered rows either way; only the container differs. xlsx is loaded on demand so
  // the sheet library stays out of the initial bundle.
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: ExportFormat) => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      const csv = membersToCsv(visibleMembers, filteredNumbers);
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `members-filtered-${stamp}.csv`);
      return;
    }
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(membersToRows(visibleMembers, filteredNumbers));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([out], { type: 'application/octet-stream' }), `members-filtered-${stamp}.xlsx`);
  };

  // Re-fetch all members from Firestore and update Zustand store
  const [isRefetching, setIsRefetching] = useState(false);
  const [refetchError, setRefetchError] = useState<string | null>(null);

  const handleRefetchMembers = async () => {
    setIsRefetching(true);
    setRefetchError(null);
    try {
      // fetchAllMembersForImport rather than fetchAllMembersListOld: the latter pages with
      // orderBy('createdAt'), which silently omits any member document lacking that field.
      const allMembers = await fetchAllMembersForImport();
      setMembers(allMembers);
      setPage(1);
    } catch (err: any) {
      setRefetchError(err?.message || 'Failed to re-fetch members');
    } finally {
      setIsRefetching(false);
    }
  };

  // The store no longer persists to localStorage, so this page loads its own data.
  useEffect(() => {
    if (members.length === 0 && !isRefetching) {
      handleRefetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replace drag-to-scroll logic with a ref-based approach
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // For row click without disrupting drag-to-scroll
  const [clickedMember, setClickedMember] = useState<any>(null);
  const dragThreshold = 5; // px
  let dragMoved = false;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    dragMoved = false;
    scrollContainerRef.current.style.cursor = 'grabbing';
    const onMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !scrollContainerRef.current) return;
      const dx = moveEvent.pageX - startX.current;
      if (Math.abs(dx) > dragThreshold) dragMoved = true;
      scrollContainerRef.current.scrollLeft = scrollLeft.current - dx;
    };
    const onUp = (upEvent: MouseEvent) => {
      isDragging.current = false;
      if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Row click handler
  const handleRowClick = (member: any, e: React.MouseEvent) => {
    if (dragMoved) return; // Don't trigger on drag
    setClickedMember(member);
  };

  // One table body shared by the paged view and the full-sheet overlay. In full mode the
  // header row also sticks to the top of the scroll container, so column numbers stay
  // readable however far down the sheet you are.
  const renderTable = (sticky: boolean) => {
    const headerTop = sticky ? 'sticky top-0 z-20' : '';
    const headerZ = sticky ? 'sticky top-0 z-30' : 'z-10';
    return (
      <table className="min-w-full border border-gray-300 select-none">
        <thead>
          <tr>
            <th className={`border px-3 py-2 bg-white sticky left-0 ${headerZ}`} style={{ left: 0, minWidth: 80 }}>ID</th>
            <th className={`border px-3 py-2 bg-white sticky left-[80px] ${headerZ}`} style={{ left: 80, minWidth: 160 }}>Full Name</th>
            <th className={`border px-3 py-2 bg-white sticky left-[240px] ${headerZ}`} style={{ left: 240, minWidth: 160 }}>Full Name (Am)</th>
            {displayedColumns.map((num) => (
              <th
                key={num}
                className={`border px-3 py-2 min-w-[60px] text-center ${headerTop} ${
                  filteredNumbers.includes(num) && filters.mode !== 'off'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-50'
                }`}
              >
                {num}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((m) => {
            const paid = paidNumbersOf(m);
            return (
            <tr key={m.id}
              onClick={e => handleRowClick(m, e)}
              style={{ cursor: 'pointer' }}
            >
              <td className="border px-3 py-1 whitespace-nowrap max-w-[5ch] overflow-hidden text-ellipsis bg-white sticky left-0 z-10" style={{ left: 0, minWidth: 80 }}>{m.id}</td>
              <td className="border px-3 py-1 bg-white sticky left-[80px] z-10" style={{ left: 80, minWidth: 160 }}>{m.fullName}</td>
              <td className="border px-3 py-1 bg-white sticky left-[240px] z-10" style={{ left: 240, minWidth: 160 }}>{m.fullNameAm}</td>
              {displayedColumns.map((num) => {
                const isPaid = paid.has(num);
                const highlighted = filters.mode !== 'off' && filteredNumbers.includes(num);
                return (
                  <td
                    key={num}
                    className={`border px-3 py-1 min-w-[60px] text-center ${
                      highlighted ? (isPaid ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'
                    }`}
                  >
                    {isPaid ? <span title="Paid">✔️</span> : highlighted ? <span title="Not paid" className="text-red-400">—</span> : ''}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Active Members List</h2>
      <SearchAndFilter
        filters={filters}
        onChange={setFilters}
        resultCount={visibleMembers.length}
        totalCount={activeMembers.length}
        onExport={handleExport}
      />
      <div className="mb-2 flex gap-2 items-center">
        <label className="text-sm font-medium">Payment:</label>
        <select
          value={visiblePaymentNumber}
          onChange={e => setVisiblePaymentNumber(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="">All</option>
          {allPaymentNumbers.map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>

        <button
          className={`px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 ${isRefetching ? 'bg-gray-300 text-gray-500' : 'bg-green-200 hover:bg-green-300 text-green-900'}`}
          onClick={handleRefetchMembers}
          disabled={isRefetching}
        >
          {isRefetching && (
            <svg className="animate-spin h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {isRefetching ? 'Refreshing...' : 'Refresh List'}
        </button>
        <button
          className="px-3 py-1 rounded text-sm font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-900"
          onClick={() => setFullMode((v) => !v)}
          title="Show every matching row in one scrollable sheet"
        >
          {fullMode ? 'Exit Full Sheet' : 'Full Sheet View'}
        </button>
        {refetchError && <span className="text-red-500 text-xs ml-2">{refetchError}</span>}
        <span className="text-sm text-gray-500">
          {fullMode
            ? `Showing ${displayedRows.length} of ${visibleMembers.length}`
            : `Page ${page} of ${totalPages || 1}`}
        </span>
      </div>
      {/* The paged view unmounts while the full sheet is open so only one heavy table exists at a time. */}
      {fullMode ? null : visibleMembers.length > 0 ? (
        <>
          <div className="flex flex-col-reverse" style={{ maxWidth: '100%' }}>
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto"
              style={{ cursor: 'grab' }}
              onMouseDown={handleMouseDown}
            >
              {renderTable(false)}
            </div>
          </div>
          {/* Pagination controls */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-300 text-blue-900 font-semibold disabled:bg-gray-200"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-300 text-blue-900 font-semibold disabled:bg-gray-200"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-500">
          {activeMembers.length === 0
            ? 'No active members data available.'
            : 'No members match this search or payment filter.'}
        </p>
      )}

      {fullMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-gray-50 shrink-0">
            <h3 className="font-semibold">Full Sheet — Active Members</h3>
            <span className="text-sm text-gray-500">
              {displayedRows.length} of {visibleMembers.length} rows · {displayedColumns.length} payment columns
            </span>
            <div className="ml-auto">
              <ExportMenu
                onExport={handleExport}
                disabled={!visibleMembers.length}
                label="Export"
                className="px-3 py-1 rounded text-sm font-semibold bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            <button
              className="px-3 py-1 rounded text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-900"
              onClick={() => setFullMode(false)}
            >
              Close (Esc)
            </button>
          </div>
          <div className="flex-1 overflow-auto" onScroll={handleSheetScroll}>
            {renderTable(true)}
            {hasMoreRows && (
              <div className="py-3 text-center text-sm text-gray-500">
                Scroll for more rows…
              </div>
            )}
          </div>
        </div>
      )}

      {clickedMember && (
        <PaymentDetail id={clickedMember.id} onClose={() => setClickedMember(null)} />
      )}
    </div>
  );
};

export default ActiveList;
