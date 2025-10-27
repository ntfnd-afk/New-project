const parseCsvLine = (text) => {
    const result = [];
    let pos = 0;
    let inQuotes = false;
    let current = '';

    while (pos < text.length) {
        const char = text[pos];
        if (inQuotes) {
            if (char === '"') {
                if (pos + 1 < text.length && text[pos + 1] === '"') {
                    current += '"';
                    pos++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        pos++;
    }
    result.push(current);
    return result;
};


export const parseAdsCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    if (lines[0].charCodeAt(0) === 0xFEFF) {
        lines[0] = lines[0].substring(1);
    }

    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    
    const headerMap = {
        campaignId: headers.indexOf('ID кампании'),
        trafficSource: headers.indexOf('Источник трафика'),
        nmId: headers.indexOf('Артикул WB'),
        productName: headers.indexOf('Название товара'),
        date: headers.indexOf('Дата'),
        shows: headers.indexOf('Показы'),
        clicks: headers.indexOf('Клики'),
        ctr: headers.indexOf('CTR %'),
        spend: headers.indexOf('Затраты, ₽'),
        added_to_cart: headers.indexOf('Добавления в корзину'), // Updated to match TZ
        orderedItems: headers.indexOf('Заказано товаров, шт'),
        revenue: headers.indexOf('Заказано на сумму, ₽'),
    };
    
    const requiredHeaderMap = {
        campaignId: 'ID кампании',
        trafficSource: 'Источник трафика',
        nmId: 'Артикул WB',
        date: 'Дата',
        shows: 'Показы',
        clicks: 'Клики',
        spend: 'Затраты, ₽',
        revenue: 'Заказано на сумму, ₽'
    };
    
    const missingHeaders = Object.keys(requiredHeaderMap)
        .filter(key => headerMap[key] === -1)
        .map(key => requiredHeaderMap[key]);

    if (missingHeaders.length > 0) {
        throw new Error(`CSV должен содержать заголовки: ${missingHeaders.join(', ')}`);
    }

    const data = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const parseNumber = (index) => {
            if (values[index] === undefined) return 0;
            const value = values[index];
            return Number(value.replace(',', '.')) || 0;
        };
        const getString = (index) => values[index] || '';
        
        const dateString = getString(headerMap.date);
        let isoDate = dateString;
        // Handle DD.MM.YYYY format
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
            const parts = dateString.split('.');
            isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        return {
            campaignId: getString(headerMap.campaignId),
            trafficSource: getString(headerMap.trafficSource),
            nmId: getString(headerMap.nmId),
            productName: getString(headerMap.productName),
            date: isoDate,
            shows: parseNumber(headerMap.shows),
            clicks: parseNumber(headerMap.clicks),
            ctr: parseNumber(headerMap.ctr),
            spend: parseNumber(headerMap.spend),
            added_to_cart: parseNumber(headerMap.added_to_cart),
            orderedItems: parseNumber(headerMap.orderedItems),
            revenue: parseNumber(headerMap.revenue),
        };
    }).filter(row => row.date && row.nmId);

    return data;
};


export const getExportUrl = (userInput) => {
    if (!userInput) return '';

    if (userInput.includes('/pub?output=csv') || userInput.includes('/export?format=csv')) {
        return userInput;
    }

    let sheetId = '';
    let gid = '';
    
    const urlRegex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = userInput.match(urlRegex);
    
    if (match && match[1]) {
        sheetId = match[1];
        const gidRegex = /[#&]gid=([0-9]+)/;
        const gidMatch = userInput.match(gidRegex);
        if (gidMatch && gidMatch[1]) {
            gid = gidMatch[1];
        }
    } else if (/^[a-zA-Z0-9-_]{40,}$/.test(userInput.trim())) {
        sheetId = userInput.trim();
    }

    if (sheetId) {
        let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        if (gid) {
            url += `&gid=${gid}`;
        }
        return url;
    }

    return userInput;
};