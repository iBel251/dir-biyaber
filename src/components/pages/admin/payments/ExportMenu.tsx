import React, { useEffect, useRef, useState } from 'react';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Export button that asks for a format instead of assuming one. Both the filter bar and
 * the full-sheet overlay use it, so the choice is offered in the same shape wherever an
 * export is available.
 */
const ExportMenu: React.FC<ExportMenuProps> = ({
  onExport,
  disabled,
  label = 'Export result',
  className = 'px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold disabled:bg-gray-300',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // A click anywhere else (or Esc) dismisses the menu, so it never sits open over the table.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (format: ExportFormat) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button type="button" className={className} onClick={() => setOpen((v) => !v)} disabled={disabled}>
        {label}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-40 w-52 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Choose a format</div>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
            onClick={() => choose('xlsx')}
          >
            <span className="font-semibold text-gray-800">Excel</span>
            <span className="text-gray-500"> (.xlsx)</span>
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-t"
            onClick={() => choose('csv')}
          >
            <span className="font-semibold text-gray-800">CSV</span>
            <span className="text-gray-500"> (.csv)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
