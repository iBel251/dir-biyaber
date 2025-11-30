import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { addMemberToMembersListOld } from './tempFunctions';

const Temp = () => {
  const [uploading, setUploading] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSuccessCount(0);
    setFailCount(0);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rows || rows.length < 2) {
          setErrors(['No data found in file.']);
          setUploading(false);
          return;
        }
        // Expect headers: id, Name (En), Name (Am), phone, status
        const header = rows[0].map((h: any) => h?.toString().trim().toLowerCase());
        const idx = {
          id: header.indexOf('id'),
          fullName: header.indexOf('name (en)'),
          fullNameAm: header.indexOf('name (am)'),
          phone: header.indexOf('phone'),
          status: header.indexOf('status'),
        };
        const missing = Object.entries(idx).filter(([k, v]) => v === -1).map(([k]) => k);
        if (missing.length > 0) {
          setErrors([`Missing columns: ${missing.join(', ')}`]);
          setUploading(false);
          return;
        }
        const now = new Date();
        let success = 0;
        let fail = 0;
        let errs: string[] = [];
        setTotal(rows.length - 1);
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const id = row[idx.id]?.toString().trim();
          if (!id) {
            fail++;
            errs.push(`Row ${i + 1}: Missing id.`);
            continue;
          }
          const data = {
            id,
            fullName: row[idx.fullName]?.toString().trim() || '',
            fullNameAm: row[idx.fullNameAm]?.toString().trim() || '',
            phone: row[idx.phone]?.toString().trim() || '',
            status: row[idx.status]?.toString().trim() || '',
            address: '',
            email: '',
            newId: '',
            createdAt: now.toISOString(),
          };
          try {
            const ok = await addMemberToMembersListOld(id, data);
            if (ok) success++;
            else {
              fail++;
              errs.push(`Row ${i + 1}: Firestore error.`);
            }
          } catch (err) {
            fail++;
            errs.push(`Row ${i + 1}: ${err}`);
          }
          setSuccessCount(success);
          setFailCount(fail);
        }
        setErrors(errs);
      } catch (err: any) {
        setErrors([err.message || 'Unknown error']);
      }
      setUploading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Bulk Member Excel Upload</h1>
      <input
        type="file"
        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-4"
      />
      {uploading && (
        <div className="mb-2 text-blue-600 font-semibold">Uploading... {successCount + failCount}/{total}</div>
      )}
      {!uploading && (successCount > 0 || failCount > 0) && (
        <div className="mb-2">
          <div className="text-green-700">Success: {successCount}</div>
          <div className="text-red-700">Failed: {failCount}</div>
        </div>
      )}
      {errors.length > 0 && (
        <div className="mb-2 text-red-600">
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}
      <div className="text-sm text-gray-600 mt-4">
        <div>Excel headers required: <b>id, fullName, fullNameAm, phone, status</b></div>
        <div>Fields <b>address, email, newId</b> will be added as empty, <b>createdAt</b> will be set to now.</div>
      </div>
    </div>
  );
};

export default Temp;