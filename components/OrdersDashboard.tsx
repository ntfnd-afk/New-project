import React from 'react';
import ChartPanel from './ChartPanel.tsx';

const OrdersDashboard: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <ChartPanel title="Аналитика по Заказам">
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                    <p className="text-lg font-semibold">Раздел в разработке</p>
                    <p className="mt-2 text-sm max-w-md">
                        Здесь будет располагаться дашборд для анализа данных по заказам. Чтобы его активировать, укажите ссылку на соответствующую Google Таблицу в настройках (⚙️).
                    </p>
                </div>
            </ChartPanel>
        </div>
    );
};

export default OrdersDashboard;