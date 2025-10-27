import { useMemo } from 'react';
import { calculateMetricsSet, getBannerAndStatus } from '../utils/analytics.js';

const aggregateRows = (rows) => {
    return rows.reduce((acc, item) => {
        acc.spend += item.spend;
        acc.impressions += item.shows;
        acc.clicks += item.clicks;
        acc.orderedItems += item.orderedItems;
        acc.revenue += item.revenue;
        acc.added_to_cart += item.added_to_cart;
        return acc;
    }, {
        spend: 0,
        impressions: 0,
        clicks: 0,
        orderedItems: 0,
        revenue: 0,
        added_to_cart: 0
    });
};

export const useAnalytics = (
    allData,
    filters,
    config
) => {

    return useMemo(() => {
        if (!allData) return null;

        const dateFrom = new Date(filters.dateFrom);
        const dateTo = new Date(filters.dateTo);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
     
        if (dateFrom > endDate) return [];
     
        const filteredData = allData.filter(item => {
            const itemDate = new Date(item.date);
            const isDateInRange = !isNaN(itemDate.getTime()) && itemDate >= dateFrom && itemDate <= endDate;
            const isCampaignIdMatch = filters.campaignId === 'all' || item.campaignId === filters.campaignId;
            const isNmIdMatch = filters.nmId === 'all' || item.nmId === filters.nmId;
            const isAppTypeMatch = filters.appType === 'all' || item.trafficSource === filters.appType;
            return isDateInRange && isCampaignIdMatch && isNmIdMatch && isAppTypeMatch;
        });

        if (filteredData.length === 0) return [];

        const groupedBySku = {};
        for (const item of filteredData) {
            if (!item.nmId) continue;
            if (!groupedBySku[item.nmId]) {
                groupedBySku[item.nmId] = [];
            }
            groupedBySku[item.nmId].push(item);
        }
        
        const analyzedResults = [];
        for (const nmId in groupedBySku) {
            const skuRows = groupedBySku[nmId];

            const groupedByDay = {};
            for (const item of skuRows) {
                const day = item.date.split('T')[0];
                if (!groupedByDay[day]) {
                    groupedByDay[day] = [];
                }
                groupedByDay[day].push(item);
            }

            const daily = Object.entries(groupedByDay).map(([date, rows]) => {
                const dailyAggregates = aggregateRows(rows);
                const metricsSet = calculateMetricsSet(dailyAggregates, config);
                return { date, ...metricsSet };
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const periodAggregates = aggregateRows(skuRows);
            const periodTotals = calculateMetricsSet(periodAggregates, config);
            
            const { banner } = getBannerAndStatus(periodAggregates, periodTotals);

            analyzedResults.push({
                nmId,
                productName: skuRows[0]?.productName || `Название товара (заглушка)`,
                productImageUrl: null,
                banner,
                periodTotals,
                daily,
            });
        }
        
        return analyzedResults.sort((a, b) => b.periodTotals.revenue - a.periodTotals.revenue);

    }, [allData, filters, config]);
};