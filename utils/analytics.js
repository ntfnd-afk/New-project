import type { Status, AnalyticsConfig, Metric, SkuMetricsSet, SkuAnalysisResult } from '../types.js';

// Helper for safe division
const safeDivide = (numerator: number, denominator: number): number | null => {
    if (denominator === 0) {
        // Handle 0/0 as 0, and N/0 (where N>0) as null (infinity)
        return numerator === 0 ? 0 : null;
    }
    if (!isFinite(denominator) || !isFinite(numerator)) return null;
    return numerator / denominator;
};

// --- Metric Configuration ---

interface AggregatedData {
    impressions: number;
    clicks: number;
    orderedItems: number;
    spend: number;
    revenue: number;
    added_to_cart: number;
}

const metricConfig: Record<string, {
    formula: string;
    canCalculate: (d: AggregatedData) => boolean;
    nullTooltip: string;
    statusTexts: Partial<Record<Status, string>>;
    getStatus?: (value: number, config: AnalyticsConfig, data: AggregatedData) => Status;
    unit?: '%' | '₽' | '';
    isSimple?: boolean;
}> = {
    // Traffic
    impressions: {
        formula: 'Сумма показов за период.',
        canCalculate: d => true,
        nullTooltip: '',
        statusTexts: {
            good: 'Достаточное количество показов.',
            warn: 'Показов маловато для репрезентативной статистики.',
            bad: 'Мало показов — товар проигрывает аукцион. Проверьте CPM/лимит/ставку.',
        },
        isSimple: true,
    },
    clicks: {
        formula: 'Сумма кликов за период.',
        canCalculate: d => true,
        nullTooltip: '',
        statusTexts: {
            good: 'Достаточное количество кликов.',
            warn: 'Кликов маловато для принятия решений.',
            bad: 'Низкая вовлечённость. Если CTR ок — поднимите CPM; если CTR низкий — правьте фото/заголовок.',
        },
        isSimple: true,
    },
    ctr: {
        formula: 'CTR = Клики / Показы × 100%',
        canCalculate: d => d.impressions > 0 || (d.impressions === 0 && d.clicks === 0),
        nullTooltip: 'Нет показов — CTR не рассчитывается.',
        statusTexts: {
            good: 'CTR высокий: карточка хорошо привлекает внимание.',
            warn: 'CTR средний: можно усилить фото/заголовок.',
            bad: 'CTR низкий: объявление не кликают. Обновите обложку, цену, текст.',
        },
        unit: '%',
    },
    cpc: {
        formula: 'CPC = Затраты / Клики',
        canCalculate: d => d.clicks > 0 || (d.clicks === 0 && d.spend === 0),
        nullTooltip: 'Клики отсутствуют — CPC не рассчитывается.',
        statusTexts: {
            good: 'Стоимость клика низкая.',
            warn: 'Стоимость клика средняя.',
            bad: 'Клик дорогой. Ставка/аукцион высокие.',
        },
        unit: '₽',
    },
    cpm: {
        formula: 'CPM = Затраты / (Показы / 1000)',
        canCalculate: d => d.impressions > 0 || (d.impressions === 0 && d.spend === 0),
        nullTooltip: 'Нет показов — CPM не рассчитывается.',
        statusTexts: {
            neutral: 'Стоимость 1000 показов. Помогает оценить конкуренцию и ставку в аукционе.',
        },
        unit: '₽',
    },
    // Conversions
    cart_rate: {
        formula: '% в корзину = Добавления в корзину / Клики × 100%',
        canCalculate: d => d.clicks > 0 || (d.clicks === 0 && d.added_to_cart === 0),
        nullTooltip: 'Нет кликов — нельзя оценить интерес к товару после перехода.',
        statusTexts: {
            good: 'Показывает, как много людей добавили товар в корзину после клика.',
            warn: 'Показывает, как много людей добавили товар в корзину после клика. Если низко: возможно цена/наличие/размеры не устраивают.',
            bad: 'Показывает, как много людей добавили товар в корзину после клика. Если низко: возможно цена/наличие/размеры не устраивают.',
        },
        unit: '%',
    },
    orderedItems: {
        formula: 'Сумма заказанных товаров за период.',
        canCalculate: d => true,
        nullTooltip: '',
        statusTexts: {
            good: 'Достаточное количество заказов для анализа.',
            warn: 'Мало заказов для уверенных выводов.',
            bad: 'Мало статистики — не делайте жёстких выводов, увеличьте охват/время теста.',
        },
        isSimple: true,
    },
    cr: {
        formula: 'CR = Заказы / Клики × 100%',
        canCalculate: d => d.clicks > 0 || (d.clicks === 0 && d.orderedItems === 0),
        nullTooltip: 'Нет кликов — CR не рассчитывается.',
        statusTexts: {
            good: 'Карточка хорошо конвертирует в заказ.',
            warn: 'Конверсия средняя.',
            bad: 'Низкая конверсия в заказ — карточка не убеждает (цена, отзывы, фото, наличие размеров).',
        },
        unit: '%',
    },
    // Finance
    spend: {
        formula: 'Затраты = сумма рекламных расходов.',
        canCalculate: d => true,
        nullTooltip: '',
        statusTexts: { neutral: 'Сколько потрачено на рекламу за выбранный период. Это та сумма, которую мы сожгли на показы и клики.' },
        unit: '₽',
        isSimple: true,
    },
    revenue: {
        formula: 'Сумма выручки от заказов за период.',
        canCalculate: d => true,
        nullTooltip: '',
        statusTexts: { neutral: 'Общая выручка от заказов, ассоциированных с рекламой.' },
        unit: '₽',
        isSimple: true,
    },
    avg_check: {
        formula: 'Ср. чек = Выручка / Заказы',
        canCalculate: d => d.orderedItems > 0 || (d.orderedItems === 0 && d.revenue === 0),
        nullTooltip: 'Нет заказов — средний чек не рассчитывается.',
        statusTexts: { neutral: 'Средняя сумма одного заказа по этому товару.' },
        unit: '₽',
    },
    cpa: {
        formula: 'CPA = Затраты / Заказы',
        canCalculate: d => d.orderedItems > 0 || (d.orderedItems === 0 && d.spend === 0),
        nullTooltip: 'Нет заказов из рекламы или реклама не откручивалась — CPA не рассчитывается.',
        statusTexts: {
            good: 'Стоимость одного заказа низкая.',
            warn: 'Стоимость заказа на грани нормы.',
            bad: 'Заказ выходит слишком дорогим.',
            neutral: 'Нет заказов из рекламы или реклама не откручивалась — CPA не рассчитывается.',
        },
        unit: '₽',
    },
    roas: {
        formula: 'ROAS = Выручка / Затраты',
        canCalculate: d => d.spend > 0 || (d.spend === 0 && d.revenue === 0),
        nullTooltip: 'Реклама не откручивалась / расхода не было — ROAS не рассчитывается.',
        statusTexts: {
            good: 'Окупаемость рекламы в норме.',
            warn: 'Окупаемость на грани, контролируйте ставки.',
            bad: 'Реклама не отбивает затраты.',
            neutral: 'Реклама не откручивалась / расхода не было — ROAS не рассчитывается.',
        },
    },
    drr: {
        formula: 'ДРР = Затраты / Выручка × 100%',
        canCalculate: d => d.revenue > 0 || (d.revenue === 0 && d.spend === 0),
        nullTooltip: 'Нет продаж из рекламы или реклама не откручивалась — ДРР не рассчитывается.',
        statusTexts: {
            good: 'Доля рекламных расходов низкая — реклама прибыльна.',
            warn: 'ДРР допустима, но требует оптимизации.',
            bad: 'ДРР слишком высокая — реклама съедает маржу.',
            neutral: 'Нет продаж из рекламы или реклама не откручивалась — ДРР не рассчитывается.',
        },
        unit: '%',
    },
};

// --- Status Calculation Logic ---

const getStatusForMetric = (metricName: string, value: number, config: AnalyticsConfig): Status => {
    if (value === null || !isFinite(value)) return 'neutral';
    switch (metricName) {
        case 'impressions':
            if (value >= 5000) return 'good';
            if (value >= 2000) return 'warn';
            return 'bad';
        case 'clicks':
            if (value >= 150) return 'good';
            if (value >= 50) return 'warn';
            return 'bad';
        case 'ctr':
            if (value >= 0.025) return 'good';
            if (value >= 0.015) return 'warn';
            return 'bad';
        case 'cpc':
            if (value < 10) return 'good';
            if (value <= 15) return 'warn';
            return 'bad';
        case 'cr':
            if (value >= 0.05) return 'good';
            if (value >= 0.02) return 'warn';
            return 'bad';
        case 'cart_rate':
            if (value >= 0.10) return 'good';
            if (value >= 0.05) return 'warn';
            return 'bad';
        case 'orderedItems':
            if (value >= 10) return 'good';
            if (value >= 3) return 'warn';
            return 'bad';
        case 'cpa':
            if (value < 200) return 'good';
            if (value <= 400) return 'warn';
            return 'bad';
        case 'roas':
            if (value >= 8) return 'good';
            if (value >= 4) return 'warn';
            return 'bad';
        case 'drr':
            const margin = config.margin_pct;
            if (margin == null || margin <= 0) {
                if (value < 0.10) return 'good';
                if (value <= 0.25) return 'warn';
                return 'bad';
            }
            const margin_fraction = margin / 100;
            const green_threshold_fraction = 0.7 * margin_fraction;
            if (value <= green_threshold_fraction) return 'good';
            if (value <= margin_fraction) return 'warn';
            return 'bad';
        default:
            return 'neutral';
    }
};

const getTooltip = (metricKey: string, status: Status, isCalculable: boolean): string => {
    const config = metricConfig[metricKey];
    if (!config) return '';

    if (!isCalculable) {
        return `${config.nullTooltip}\nФормула: ${config.formula}`;
    }

    const statusText = config.statusTexts[status] || '';
    if (config.isSimple) { // For raw metrics, don't add "Formula:" prefix for clarity
        return `${statusText}\n${config.formula}`;
    }
    return `${statusText}\nФормула: ${config.formula}`;
};


export const calculateMetricsSet = (aggregatedData: AggregatedData, config: AnalyticsConfig): SkuMetricsSet => {
    
    const values: Record<string, number | null> = {
        ...aggregatedData,
        ctr: safeDivide(aggregatedData.clicks, aggregatedData.impressions),
        cpc: safeDivide(aggregatedData.spend, aggregatedData.clicks),
        cpm: aggregatedData.impressions > 0 ? safeDivide(aggregatedData.spend, aggregatedData.impressions / 1000) : safeDivide(aggregatedData.spend, 0),
        cr: safeDivide(aggregatedData.orderedItems, aggregatedData.clicks),
        avg_check: safeDivide(aggregatedData.revenue, aggregatedData.orderedItems),
        cpa: safeDivide(aggregatedData.spend, aggregatedData.orderedItems),
        roas: safeDivide(aggregatedData.revenue, aggregatedData.spend),
        drr: safeDivide(aggregatedData.spend, aggregatedData.revenue),
        cart_rate: safeDivide(aggregatedData.added_to_cart, aggregatedData.clicks),
    };

    const metrics = Object.keys(metricConfig).reduce((acc, key) => {
        const configEntry = metricConfig[key];
        const value = values[key];
        const isCalculable = value !== null;

        let status: Status = 'neutral';
        if (isCalculable && value !== null && isFinite(value)) {
             status = getStatusForMetric(key, value, config);
        }

        if (aggregatedData.impressions === 0 && aggregatedData.spend === 0 && ['cpa', 'roas', 'drr'].includes(key)) {
            status = 'neutral';
        }
        
        if (key === 'cpm' || key === 'avg_check' || key === 'spend' || key === 'revenue') {
            status = 'neutral';
        }

        const tooltip = getTooltip(key, status, isCalculable);
        
        let displayValue: string;
        if (!isCalculable || value === null || !isFinite(value)) {
            displayValue = '—';
        } else {
            switch(configEntry.unit) {
                case '%': displayValue = `${(value * 100).toFixed(1)}%`; break;
                case '₽': displayValue = `${value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₽`; break;
                default: displayValue = value.toLocaleString('ru-RU');
            }
        }
        
        if (key === 'spend' || key === 'revenue' || key === 'avg_check' || key === 'cpa' || key === 'cpc' || key === 'cpm') {
            displayValue = `${(value ?? 0).toLocaleString('ru-RU', {maximumFractionDigits: 1})} ₽`;
        }
        
        if (key === 'roas') {
             displayValue = (value ?? 0).toLocaleString('ru-RU', {maximumFractionDigits: 2});
        }


        if (key === 'cart_rate') {
             const absValue = aggregatedData.added_to_cart.toLocaleString('ru-RU');
             const pctValue = (!isCalculable || value === null) ? '—' : `${(value * 100).toFixed(1)}%`;
             displayValue = `${absValue} (${pctValue})`;
        }


        acc[key as keyof SkuMetricsSet['metrics']] = { value, status, tooltip, displayValue };
        return acc;
    }, {} as SkuMetricsSet['metrics']);
    
    return { ...aggregatedData, metrics };
};

const getRecommendationTooltip = (status: Status, metricsSet: SkuMetricsSet, aggregates: AggregatedData): string => {
  const { metrics } = metricsSet;
  const { impressions, revenue, spend, orderedItems } = aggregates;

  // Case D: "Реклама не откручивается"
  if (impressions === 0) {
    const rows = [
      'Реклама не крутится: нет показов.',
      'Проверьте дневной бюджет, ставку CPM и статус кампании (не в паузе ли?).'
    ];
    if (revenue > 0) {
      rows.push('Продажи в таблице пришли не из рекламы, а органически.');
    }
    return rows.join('\n');
  }

  // Case C: "Неэффективно"
  if (status === 'bad') {
    const rows = [
      'Расход есть, продаж нет / реклама не отбивается.',
      'Действие: Остановить этот SKU в рекламе.',
      'Перед перезапуском доработайте карточку: фото, отзывы, цену, наличие размеров, упаковку оффера.'
    ];
    if (spend > 0 && orderedItems === 0) {
      rows[0] = 'Деньги тратятся, заказов ноль — это слив.';
    }
    return rows.join('\n');
  }

  // Case A: "Масштабировать"
  if (status === 'good') {
    return [
      'Реклама окупается. Карточка продаёт стабильно.',
      'Действие: Увеличьте бюджет / CPM на 10–20%, но контролируйте ROAS и ДРР.',
      'Следите, чтобы CPA не рос и ACoS не выходил за маржу.'
    ].join('\n');
  }

  // Case B: "Требует внимания"
  if (status === 'warn') {
    const tips: string[] = [];
    if (metrics.ctr.status === 'warn' || metrics.ctr.status === 'bad') {
      tips.push('Низкая кликабельность. Проверьте 1-е фото и заголовок (цена/УТП).');
    }
    if (metrics.cpc.status === 'warn' || metrics.cpc.status === 'bad') {
      tips.push('Клик дорогой. Попробуйте снизить CPM / вынести товар в отдельную кампанию.');
    }
    if (metrics.cr.status === 'warn' || metrics.cr.status === 'bad') {
      tips.push('Конверсия средняя. Доработайте карточку: фото в рост, таблица размеров, отзывы, наличие размеров.');
    }
    if (metrics.cpa.status === 'warn' || metrics.cpa.status === 'bad') {
      tips.push('Стоимость заказа высокая. Снижайте ставку или усиливайте карточку, чтобы покупать быстрее.');
    }
    if (metrics.roas.status === 'warn' || metrics.roas.status === 'bad') {
      tips.push('Окупаемость на грани. Снижайте CPC или поднимайте средний чек (комплекты, аксессуары).');
    }
    if (metrics.drr.status === 'warn' || metrics.drr.status === 'bad') {
      tips.push('ДРР близко к марже. Не масштабируйте пока не улучшите карточку.');
    }

    if (tips.length === 0) {
      tips.push('Есть зоны роста. Проверьте ставку / креатив / карточку.');
    }

    tips.unshift('Нужна оптимизация: есть метрики в жёлтой или красной зоне.');
    return tips.join('\n');
  }

  return 'Статус не определен. Проверьте данные.';
};


export const getBannerAndStatus = (aggregatedData: AggregatedData, metricsSet: SkuMetricsSet): { banner: SkuAnalysisResult['banner'] } => {
    
    const { spend, impressions, orderedItems } = aggregatedData;
    const { metrics } = metricsSet;
    
    let overallStatus: Status = 'neutral';
    
    const financialMetrics = { cpa: metrics.cpa.status, roas: metrics.roas.status, drr: metrics.drr.status };
    const performanceMetrics = { ctr: metrics.ctr.status, cr: metrics.cr.status };
    const allKeyStatuses = Object.values({ ...financialMetrics, ...performanceMetrics });

    if (spend > 0 && orderedItems === 0) {
        overallStatus = 'bad';
    } else if (allKeyStatuses.includes('bad')) {
        overallStatus = 'bad';
    } else if (allKeyStatuses.includes('warn')) {
        overallStatus = 'warn';
    } else if (financialMetrics.cpa === 'good' && financialMetrics.roas === 'good' && financialMetrics.drr === 'good' && performanceMetrics.cr === 'good') {
        overallStatus = 'good';
    }
    
    let shortText: string;
    
    if (impressions === 0) {
        shortText = 'Реклама не откручивается';
        overallStatus = 'warn'; 
    } else {
        switch(overallStatus) {
            case 'good': shortText = 'Масштабировать'; break;
            case 'warn': shortText = 'Требует внимания'; break;
            case 'bad': shortText = 'Неэффективно'; break;
            default: shortText = 'Проанализировать'; break;
        }
    }

    const tooltip = getRecommendationTooltip(overallStatus, metricsSet, aggregatedData);

    return {
        banner: {
            status: overallStatus,
            shortText,
            tooltip,
        }
    };
};