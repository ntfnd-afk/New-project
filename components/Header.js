import React from 'react';
import type { Filters, AnalyticsConfig } from '../types.js';
import { RefreshIcon, ResetIcon, LogoutIcon } from './icons.js';

type Tab = 'ads' | 'orders';

interface HeaderProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onReload: () => void;
  loading: boolean;
  campaignIdOptions: string[];
  nmIdOptions: string[];
  appTypeOptions: string[];
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  onLogout: () => void;
  analyticsConfig: AnalyticsConfig;
  setAnalyticsConfig: React.Dispatch<React.SetStateAction<AnalyticsConfig>>;
}

interface ControlGroupProps {
    label: string;
    children: React.ReactNode;
}

const ControlGroup: React.FC<ControlGroupProps> = ({ label, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
        {children}
    </div>
);

const TabButton: React.FC<{
  tabId: Tab;
  activeTab: Tab;
  onClick: (tabId: Tab) => void;
  children: React.ReactNode;
}> = ({ tabId, activeTab, onClick, children }) => {
  const isActive = tabId === activeTab;
  return (
    <button
      onClick={() => onClick(tabId)}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200 ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
};


const Header: React.FC<HeaderProps> = ({ 
    filters, setFilters, onReload, loading, campaignIdOptions, nmIdOptions, 
    appTypeOptions, activeTab, setActiveTab, onLogout, analyticsConfig, setAnalyticsConfig 
}) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, name, value, type } = e.target;
    const key = name || id;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
          setAnalyticsConfig(prev => ({...prev, [id]: numValue}));
      }
  }

  const handleReset = () => {
    const today = new Date();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(today.getDate() - 3);
    setFilters(prev => ({
      ...prev,
      campaignId: 'all',
      nmId: 'all',
      appType: 'all',
      dateFrom: fourDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      compare: false,
    }));
  }

  const inputClass = "bg-slate-50 border-2 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 transition duration-150 ease-in-out hover:border-slate-300";

  return (
    <>
      <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-10">
        <div className="px-3 pt-2 border-b border-slate-200">
            <div className="flex items-center">
                 <TabButton tabId="ads" activeTab={activeTab} onClick={setActiveTab}>Реклама</TabButton>
                 <TabButton tabId="orders" activeTab={activeTab} onClick={setActiveTab}>Заказы</TabButton>
            </div>
        </div>
        <div className="p-3">
            <div className="flex flex-wrap items-end gap-3 w-full">
                <ControlGroup label="ID кампании">
                    <select id="campaignId" className={inputClass} value={filters.campaignId} onChange={handleInputChange} disabled={activeTab !== 'ads'}>
                    <option value="all">Все кампании</option>
                    {campaignIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                </ControlGroup>

                <ControlGroup label="Артикул WB (nmId)">
                    <select id="nmId" className={inputClass} value={filters.nmId} onChange={handleInputChange} disabled={activeTab !== 'ads'}>
                    <option value="all">Все артикулы</option>
                    {nmIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>
                </ControlGroup>
                
                <ControlGroup label="Источник трафика">
                    <select id="appType" className={inputClass} value={filters.appType} onChange={handleInputChange} disabled={activeTab !== 'ads'}>
                    <option value="all">Все источники</option>
                    {appTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </ControlGroup>
                
                <ControlGroup label="Период">
                    <div className="flex items-center">
                        <input id="dateFrom" type="date" className={`${inputClass} rounded-r-none`} value={filters.dateFrom} onChange={handleInputChange} />
                        <input id="dateTo" type="date" className={`${inputClass} rounded-l-none border-l-0`} value={filters.dateTo} onChange={handleInputChange} />
                    </div>
                </ControlGroup>
                
                <ControlGroup label="Маржа, %">
                    <div className="relative">
                        <input
                            id="margin_pct"
                            type="number"
                            className={`${inputClass} pr-7 w-28`}
                            value={analyticsConfig.margin_pct}
                            onChange={handleConfigChange}
                            step="1"
                            min="0"
                            max="100"
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-sm">%</span>
                    </div>
                </ControlGroup>


                <div className="flex-grow"></div>

                <div className="flex items-end gap-2">
                    <button
                    onClick={handleReset}
                    disabled={loading}
                    title="Сбросить фильтры"
                    className="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 transition-all"
                    >
                    <ResetIcon className="w-4 h-4" />
                    </button>
                    <button
                    onClick={onReload}
                    disabled={loading}
                    title="Обновить данные"
                    className="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                    >
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onLogout}
                        title="Выйти"
                        className="flex items-center justify-center h-10 w-10 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 transition-all"
                    >
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </header>
    </>
  );
};

export default Header;