import React, { useState } from 'react';
import type { SkuAnalysisResult, Status, Metric } from '../types.ts';
import { ChevronDownIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon } from './icons.tsx';
import Tooltip from './Tooltip.tsx';

const statusClasses: Record<Status, string> = {
    good: 'bg-green-500',
    warn: 'bg-yellow-500',
    bad: 'bg-red-500',
    neutral: 'bg-slate-400',
    info: 'bg-blue-500',
};

const statusBadgeStyles: Record<Status, {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    bgColor: string;
    textColor: string;
}> = {
    good: { Icon: CheckCircleIcon, bgColor: 'bg-green-100', textColor: 'text-green-800' },
    warn: { Icon: ExclamationTriangleIcon, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    bad: { Icon: XCircleIcon, bgColor: 'bg-red-100', textColor: 'text-red-800' },
    neutral: { Icon: CheckCircleIcon, bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
    info: { Icon: CheckCircleIcon, bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
};

// --- Trend Indicator Logic ---
const betterIfHigher = new Set([
    'impressions', 'clicks', 'ctr', 'cart_rate', 'cr',
    'orderedItems', 'avg_check', 'revenue', 'roas'
]);

const TrendIndicator: React.FC<{
    current: Metric;
    previous: Metric;
    metricKey: string;
}> = ({ current, previous, metricKey }) => {
    const currentValue = current.value;
    const previousValue = previous.value;

    // A value of 0 is a valid number and should be used for comparison.
    // An arrow is not shown only if a value is null (metric couldn't be calculated, e.g., '—')
    // or if the values are identical.
    const isCurrentValid = typeof currentValue === 'number' && isFinite(currentValue);
    const isPreviousValid = typeof previousValue === 'number' && isFinite(previousValue);

    if (!isCurrentValid || !isPreviousValid || currentValue === previousValue) {
        return null;
    }

    const isUp = currentValue > previousValue;
    const isGood = betterIfHigher.has(metricKey) ? isUp : !isUp;
    
    const colorClass = isGood ? 'text-green-600' : 'text-red-600';
    
    if (isUp) {
        return <ArrowUpIcon className={`w-3 h-3 ml-1 flex-shrink-0 ${colorClass}`} aria-label="Рост" />;
    } else {
        return <ArrowDownIcon className={`w-3 h-3 ml-1 flex-shrink-0 ${colorClass}`} aria-label="Падение" />;
    }
};


// --- Unified Column Configuration ---
const columnsConfig = [
    { key: 'product', title: 'Товар', width: '250px' },
    { key: 'status', title: 'Статус / Рекомендация', width: '210px' },
    { key: 'impressions', title: 'Показы', width: '90px' },
    { key: 'clicks', title: 'Клики', width: '90px' },
    { key: 'ctr', title: 'CTR', width: '80px' },
    { key: 'cpc', title: 'CPC', width: '90px' },
    { key: 'cpm', title: 'CPM', width: '90px' },
    { key: 'cart_rate', title: 'Корзина', width: '120px' },
    { key: 'cr', title: 'CR', width: '80px' },
    { key: 'orderedItems', title: 'Заказы', width: '90px' },
    { key: 'avg_check', title: 'Ср. чек', width: '100px' },
    { key: 'revenue', title: 'Выручка', width: '110px' },
    { key: 'spend', title: 'Затраты', width: '100px' },
    { key: 'cpa', title: 'CPA', width: '90px' },
    { key: 'roas', title: 'ROAS', width: '90px' },
    { key: 'drr', title: 'ДРР', width: '80px' },
];

const metricKeys = columnsConfig
  .map(c => c.key)
  .filter(key => key !== 'product' && key !== 'status');


const MetricCell: React.FC<{ 
    metric: Metric,
    previousMetric: Metric | null,
    metricKey: string,
}> = ({ metric, previousMetric, metricKey }) => (
    <Tooltip content={metric.tooltip}>
        <div className="flex items-center gap-2 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusClasses[metric.status]}`}></span>
            <span className="font-medium text-slate-700">{metric.displayValue}</span>
            {previousMetric && <TrendIndicator current={metric} previous={previousMetric} metricKey={metricKey} />}
        </div>
    </Tooltip>
);

const StatusBadge: React.FC<{ banner: SkuAnalysisResult['banner'] }> = ({ banner }) => {
    const { Icon, bgColor, textColor } = statusBadgeStyles[banner.status] || statusBadgeStyles.neutral;
    return (
        <Tooltip content={banner.tooltip}>
            <div className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full ${bgColor} ${textColor}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">{banner.shortText}</span>
            </div>
        </Tooltip>
    );
};

const SkuTableRow: React.FC<{ sku: SkuAnalysisResult }> = ({ sku }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { periodTotals: pt } = sku;
    
    return (
        <>
            {/* Main Summary Row */}
            <tr onClick={() => setIsOpen(!isOpen)} className="bg-white hover:bg-slate-50 cursor-pointer transition-colors group">
                <td className="sticky left-0 bg-white group-hover:bg-slate-50 px-3 py-2.5 z-10 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-slate-200 flex-shrink-0"></div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Артикул: {sku.nmId}</p>
                            <p className="text-xs text-slate-500 truncate" style={{maxWidth: '150px'}}>{sku.productName}</p>
                        </div>
                    </div>
                </td>
                <td className="px-3 py-2.5 border-b border-slate-200">
                    <StatusBadge banner={sku.banner} />
                </td>
                {metricKeys.map(key => (
                    <td key={key} className="px-3 py-2.5 text-sm border-b border-slate-200">
                        <MetricCell metric={pt.metrics[key as keyof typeof pt.metrics]} previousMetric={null} metricKey={key} />
                    </td>
                ))}
                <td className="px-3 py-2.5 text-center border-b border-slate-200">
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </td>
            </tr>

            {/* Daily Data Rows (rendered directly in the main tbody) */}
            {isOpen && sku.daily.map((day, index) => {
                 const previousDay = index > 0 ? sku.daily[index - 1] : null;

                 return (
                     <tr key={day.date} className="bg-slate-50 hover:bg-slate-100 transition-colors group">
                        <td className="sticky left-0 bg-slate-50 group-hover:bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-600 whitespace-nowrap z-10 border-b border-slate-200">
                            {new Date(day.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-200">—</td>
                        {metricKeys.map(key => {
                            const currentMetric = day.metrics[key as keyof typeof day.metrics];
                            const previousMetric = previousDay ? previousDay.metrics[key as keyof typeof day.metrics] : null;

                            return (
                                <td key={key} className="px-3 py-2.5 text-sm border-b border-slate-200">
                                    <MetricCell 
                                        metric={currentMetric} 
                                        previousMetric={previousMetric} 
                                        metricKey={key} 
                                    />
                                </td>
                            );
                        })}
                        <td className="px-3 py-2.5 border-b border-slate-200"></td>
                    </tr>
                 );
            })}
        </>
    );
};

interface SkuTableProps {
    data: SkuAnalysisResult[];
}

const SkuCard: React.FC<SkuTableProps> = ({ data }) => {
    return (
        <div className="h-full overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full border-collapse">
                <thead className="bg-slate-50/75 sticky top-0 z-20">
                    <tr>
                        {columnsConfig.map((col, index) => (
                             <th 
                                key={col.key} 
                                scope="col" 
                                className={`px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 ${index === 0 ? 'sticky left-0 z-10 bg-slate-50/75' : ''}`}
                                style={{width: col.width, minWidth: col.width}}
                            >
                                {col.title}
                            </th>
                        ))}
                        <th scope="col" className="relative px-3 py-3 w-12 border-b border-slate-200"><span className="sr-only">Раскрыть</span></th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(sku => (
                        <SkuTableRow key={sku.nmId} sku={sku} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SkuCard;