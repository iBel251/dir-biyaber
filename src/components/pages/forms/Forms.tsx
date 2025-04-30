import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { fetchForms } from '../../../firebase/firebaseAdminServices';

const Forms: React.FC<{ language: string }> = ({ language }) => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      try {
        const data = await fetchForms();
        setForms(data);
      } catch {
        setForms([]);
      }
      setLoading(false);
    };
    loadForms();
  }, []);

  return (
    <>
      <Helmet>
        <title>Forms - Dirbiyaber</title>
      </Helmet>
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{language === 'am' ? 'የማህበሩ ቅፆች' : 'Community Forms'}</h1>
        <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl">
          {language === 'am'
            ? 'እዚህ የድር ቢያብር እድር አስፈላጊ ቅፅዎችን ማግኘት እና ማውረድ ይችላሉ። ለተጨማሪ መረጃ ወይም ለእርዳታ እባክዎን ያናግሩን።'
            : 'Here you can find and download important forms for Dir Biyaber Edir. Please check back for updates or contact us if you need assistance with any forms.'}
        </p>
        <div className="bg-gray-50 rounded-lg shadow-md p-8 w-full max-w-lg text-center">
          {loading ? (
            <p className="text-gray-500">{language === 'am' ? 'ቅፆች በመጫን ላይ...' : 'Loading forms...'}</p>
          ) : forms.length === 0 ? (
            <p className="text-gray-500">{language === 'am' ? 'ለጊዜው ምንም ቅፅ የለም። ትንሽ ቆይተው ይሞክሩ።' : 'No forms available at this time.'}</p>
          ) : (
            <ul className="space-y-6">
              {forms.map(form => (
                <li key={form.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow flex flex-col items-start hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-blue-700">{form.nameEn}</span>
                    <span className="text-lg font-semibold text-blue-700">/ {form.nameAm}</span>
                  </div>
                  <div className="text-gray-600 text-sm mb-2 text-left w-full">{form.description}</div>
                  <a
                    href={form.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm font-medium transition-colors"
                  >
                    {language === 'am' ? 'አውርድ' : 'Download'}
                  </a>
                  <div className="text-xs text-gray-400 mt-2">Uploaded: {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Forms;
