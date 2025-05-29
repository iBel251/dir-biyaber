import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const Temp = () => {
  const [csvData, setCsvData] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [duplicates, setDuplicates] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setParsedRows(rows);
      // Find duplicates by id (id is in the 4th column, index 3)
      const idCount: Record<string, number> = {};
      const idToRows: Record<string, string[][]> = {};
      rows.slice(1).forEach(row => {
        const id = row[3]?.toString().trim();
        if (id) {
          idCount[id] = (idCount[id] || 0) + 1;
          if (!idToRows[id]) idToRows[id] = [];
          idToRows[id].push(row);
        }
      });
      // Collect all rows for ids that appear more than once
      const dups: string[][] = [];
      Object.keys(idToRows).forEach(id => {
        if (idCount[id] > 1) {
          dups.push(...idToRows[id]);
        }
      });
      setDuplicates([
        ['ID', 'Name (En)', 'Name (Am)', 'Phone'],
        ...dups.map(row => [row[3] || '', row[0] || '', row[1] || '', row[2] || '']) // id(4th), nameEn(1st), nameAm(2nd), phone(3rd)
      ]);
    };
    reader.readAsArrayBuffer(file);
  };

  // Helper to format phone as xxx-xxx-xxxx
  function formatPhone(phone: any): string {
    if (typeof phone !== 'string') phone = phone ? String(phone) : '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  // Helper to clean nameEn
  function cleanNameEn(name: string): string {
    // Remove leading/trailing spaces, double spaces, and anything after ' -'
    let cleaned = name.trim();
    cleaned = cleaned.replace(/\s{2,}/g, ' '); // double spaces to single
    cleaned = cleaned.replace(/\s*-.*$/, ''); // remove ' -...' and after
    return cleaned;
  }

  // Remove a row by index
  const handleDelete = (rowIdx: number) => {
    setDuplicates(prev => {
      // Remove the row at rowIdx+1 (since prev[0] is header)
      return prev.filter((_, idx) => idx !== rowIdx + 1);
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">CSV Duplicate ID Finder</h1>
      <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} className="mb-4" />
      {duplicates.length > 1 && (
        <div>
          <button
            className="mb-4 bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold"
            onClick={() => {
              const ws = XLSX.utils.aoa_to_sheet(duplicates);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Duplicates');
              XLSX.writeFile(wb, `filtered_duplicates_${new Date().toISOString().slice(0,10)}.xlsx`);
            }}
          >
            Export as Excel
          </button>
          <div className="mb-2 text-red-600 font-semibold">Found {duplicates.length - 1} rows with duplicate IDs</div>
          <table className="table-auto w-full mt-2 border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1">ID</th>
                <th className="border border-gray-300 px-2 py-1">Name (En)</th>
                <th className="border border-gray-300 px-2 py-1">Name (Am)</th>
                <th className="border border-gray-300 px-2 py-1">Phone</th>
                <th className="border border-gray-300 px-2 py-1">Delete</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.slice(1).map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-yellow-100 transition-colors duration-150"
                >
                  <td className="border border-gray-300 px-2 py-1">{row[0]}</td>
                  <td className="border border-gray-300 px-2 py-1">{cleanNameEn(row[1])}</td>
                  <td className="border border-gray-300 px-2 py-1">{row[2]}</td>
                  <td className="border border-gray-300 px-2 py-1">{formatPhone(row[3])}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDelete(rowIdx)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Temp;