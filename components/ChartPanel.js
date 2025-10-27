import React from 'react';

const ChartPanel = ({ title, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 w-full max-w-3xl flex flex-col h-full">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex-shrink-0">{title}</h3>
      <div className="flex-grow min-h-0">
        {children}
      </div>
    </div>
  );
};

export default ChartPanel;