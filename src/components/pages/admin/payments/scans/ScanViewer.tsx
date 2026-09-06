import React from 'react';
import { ScanDoc, isPdf, formatSize } from '../../../../../utils/receiptScans';

interface ScanViewerProps {
  scan: ScanDoc | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * The document pane.
 *
 * PDFs are rendered in an iframe pointed at the Storage download URL — the browser's own
 * viewer handles paging and zoom, so there is no PDF library in the bundle. The URL
 * carries its access token, which is why the index caches it rather than resolving one per
 * render.
 */
const ScanViewer: React.FC<ScanViewerProps> = ({ scan, index, total, onPrev, onNext }) => {
  if (!scan) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 text-gray-500">
        Nothing to show in this tab.
      </div>
    );
  }

  const pdf = isPdf(scan);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate" title={scan.path}>
            {scan.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {scan.batch || 'root'}
            {scan.size ? ' · ' + formatSize(scan.size) : ''}
            {' · '}
            <a
              href={scan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              open in new tab
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={index <= 0}
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            title="Previous scan"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="text-sm text-gray-600 tabular-nums whitespace-nowrap">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            title="Next scan"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        {pdf ? (
          // key forces a reload when the file changes; without it some browsers keep
          // showing the previous document in the embedded viewer.
          <iframe
            key={scan.scanId}
            src={scan.url}
            title={scan.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full overflow-auto flex items-start justify-center p-2">
            <img src={scan.url} alt={scan.name} className="max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanViewer;
