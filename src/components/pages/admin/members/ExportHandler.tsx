import React, { useState } from 'react';
import { fetchAllMembersListOld } from '../../../../firebase/firebaseMembersServices';

const ExportHandler: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'excel' | 'json'>('excel');

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const members = await fetchAllMembersListOld(100);
      if (format === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(members, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute('href', dataStr);
        dlAnchorElem.setAttribute('download', `members-backup-${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(dlAnchorElem);
        dlAnchorElem.click();
        document.body.removeChild(dlAnchorElem);
      } else {
        // Excel export using xlsx
        
        // Collect all unique payment numbers
        const allPaymentNumbers = Array.from(new Set(members.flatMap(m => Array.isArray(m.payments) ? m.payments.map((p: any) => p.paymentNumber) : []))).filter(Boolean);
        // Build export data
        const exportData = members.map(m => {
          const row: Record<string, any> = {
            id: m.id || '',
            fullName: m.fullName || '',
            fullNameAm: m.fullNameAm || '',
            newId: m.newId || '',
            email: m.email || '',
            phone: m.phone || '',
            status: m.status || '',
            address: m.addressLine1 || m.address || '',
          };
          // Add payment columns
          allPaymentNumbers.forEach((num) => {
            const payment = Array.isArray(m.payments) ? m.payments.find((p: any) => p && p.paymentNumber && p.paymentNumber.toString() === num.toString()) : undefined;
            row[`Payment ${num}`] = payment ? JSON.stringify(payment.data ?? payment) : '';
          });
          return row;
        });
        // Excel export using xlsx
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Members');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `members-backup-${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError('Failed to export members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={e => setFormat(e.target.value as 'json' | 'excel')}
        className="border px-2 py-1 rounded"
      >
        <option value="json">JSON</option>
        <option value="excel">Excel</option>
      </select>
      <button
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? 'Exporting...' : 'Export'}
      </button>
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
    </div>
  );
};

export default ExportHandler;
