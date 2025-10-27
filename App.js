import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.js';
import AdsDashboard from './components/Dashboard.js';
import OrdersDashboard from './components/OrdersDashboard.js';
import Login from './components/Login.js';
import { fetchDataFromApi } from './api.js';
import type { Filters, RawDataRow, AnalyticsConfig, SkuAnalysisResult } from './types.js';
import { LoadingIcon } from './components/icons.js';
import { parseAdsCSV } from './parsers.js';
import { useAnalytics } from './hooks/useAnalytics.js';

type Tab = 'ads' | 'orders';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('isAuthenticated') === 'true');
  const [activeTab, setActiveTab] = useState<Tab>('ads');
  const [allData, setAllData] = useState<RawDataRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [campaignIdOptions, setCampaignIdOptions] = useState<string[]>([]);
  const [nmIdOptions, setNmIdOptions] = useState<string[]>([]);
  const [appTypeOptions, setAppTypeOptions] = useState<string[]>([]);

  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('wbAdsDashboardConfig');
      if (savedConfig) return JSON.parse(savedConfig);
    } catch (e) { console.error(e) }
    return { margin_pct: 25, min_clicks_for_cr: 30 };
  });

  const [filters, setFilters] = useState<Filters>(() => {
    try {
        const savedFilters = localStorage.getItem('wbAdsDashboardFilters');
        const savedTab = localStorage.getItem('wbAdsDashboardActiveTab');
        if (savedFilters) {
            const parsed = JSON.parse(savedFilters);
            if(savedTab) setActiveTab(savedTab as Tab);
            delete parsed.dataSources; 
            return parsed;
        }
    } catch (error) {
        console.error("Failed to parse filters from localStorage", error);
    }
    const today = new Date();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(today.getDate() - 3);
    return {
      campaignId: 'all',
      nmId: 'all',
      appType: 'all',
      dateFrom: fourDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      compare: false,
    }
  });
  
  useEffect(() => {
    localStorage.setItem('wbAdsDashboardFilters', JSON.stringify(filters));
    localStorage.setItem('wbAdsDashboardActiveTab', activeTab);
    localStorage.setItem('wbAdsDashboardConfig', JSON.stringify(analyticsConfig));
  }, [filters, activeTab, analyticsConfig]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setStatus(null);

    try {
        const csvText = await fetchDataFromApi(activeTab);
        
        if (!csvText) {
          setAllData(null);
          setLoading(false);
          return;
        }

        let parsedData: RawDataRow[] = [];
        if (activeTab === 'ads') {
            parsedData = parseAdsCSV(csvText);
            setCampaignIdOptions([...new Set(parsedData.map(item => item.campaignId).filter(Boolean))]);
            setNmIdOptions([...new Set(parsedData.map(item => item.nmId).filter(Boolean))]);
            setAppTypeOptions([...new Set(parsedData.map(item => item.trafficSource).filter(Boolean))]);
        }
        
        setAllData(parsedData);
        setStatus({ message: 'Данные успешно загружены!', type: 'success' });
    } catch (error) {
        if (error instanceof Error) {
            setStatus({ message: error.message, type: 'error' });
        } else {
            setStatus({ message: 'Произошла неизвестная ошибка', type: 'error' });
        }
        setAllData(null);
    } finally {
        setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if(isAuthenticated) fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchData, isAuthenticated]);
  
  const analyzedData: SkuAnalysisResult[] | null = useAnalytics(allData, filters, analyticsConfig);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('wb-ads-dashboard-urls'); // Clear sheet URL
      setIsAuthenticated(false);
      setAllData(null);
  };

  if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const WelcomeMessage = () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-2xl">
            <h2 className="text-xl font-bold text-slate-700 mb-2">Добро пожаловать в WB Ads Dashboard</h2>
            <p className="text-slate-600 mb-4">
              Нет данных для отображения. Проверьте выбранные фильтры или источник данных.
            </p>
             <p className="text-xs text-slate-500 mt-4">
                Если данные не загружаются, возможно, неверно указана ссылка на Google Таблицу в файле `api.ts`.
             </p>
        </div>
      </div>
  );

  const hasDataForCurrentTab = activeTab === 'ads' ? !!analyzedData && analyzedData.length > 0 : false;

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans text-slate-800">
        <Header 
            filters={filters}
            setFilters={setFilters}
            onReload={fetchData}
            loading={loading}
            campaignIdOptions={campaignIdOptions}
            nmIdOptions={nmIdOptions}
            appTypeOptions={appTypeOptions}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            analyticsConfig={analyticsConfig}
            setAnalyticsConfig={setAnalyticsConfig}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-h-0 relative">
            {status && (
                <div className={`fixed top-20 right-6 p-4 rounded-lg shadow-lg text-white z-50 transition-all max-w-md ${status.type === 'error' ? 'bg-red-600' : 'bg-green-500'}`}>
                    {status.message.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
            )}
            
            <div className="h-full w-full">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <LoadingIcon className="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                )}
                
                {!hasDataForCurrentTab && !loading && <WelcomeMessage />}
                
                {activeTab === 'ads' && analyzedData && <AdsDashboard data={analyzedData} />}
                {activeTab === 'orders' && <OrdersDashboard />}
            </div>
        </main>
    </div>
  );
};

export default App;