import React from 'react';

interface ChartPanelProps {
  title: string;
  children: React.ReactNode;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 w-full max-w-3xl">
      <h3 className="font-bold text-slate-800 text-lg mb-4">{title}</h3>
      <div className="h-96">
        {children}
      </div>
    </div>
  );
};

export default ChartPanel;
