import React from 'react';
import { Helmet } from 'react-helmet';

const Forms: React.FC<{ language: string }> = ({ language }) => {
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
        {/* Example placeholder for downloadable forms */}
        <div className="bg-gray-50 rounded-lg shadow-md p-8 w-full max-w-lg text-center">
          <p className="text-gray-500">{language === 'am' ? 'ለጊዜው ምንም ቅፅ የለም። ትንሽ ቆይተው ይሞክሩ።' : 'No forms available at this time.'}</p>
        </div>
      </div>
    </>
  );
};

export default Forms;
