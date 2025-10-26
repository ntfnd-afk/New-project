import { getExportUrl } from './parsers';

/**
 * Этот файл симулирует вызов API на бэкенд.
 * В реальном приложении этот код выполнялся бы на сервере (например, в Node.js),
 * а не в браузере. Это позволило бы безопасно хранить URL таблицы
 * и проверять аутентификацию пользователя.
 */

const URL_STORAGE_KEY = 'wb-ads-dashboard-urls';

/**
 * Проверяет, аутентифицирован ли пользователь.
 */
const isUserAuthenticated = (): boolean => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
};

// Простой CORS-прокси для обхода ограничений браузера.
// Внимание: бесплатные прокси могут быть ненадежными.
const CORS_PROXY = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

/**
 * Симулирует получение данных с бэкенда.
 * @param dataType Тип запрашиваемых данных ('ads' или 'orders').
 * @returns Текст CSV файла.
 */
export const fetchDataFromApi = async (dataType: 'ads' | 'orders'): Promise<string> => {
    if (!isUserAuthenticated()) {
        throw new Error('Пользователь не авторизован.');
    }

    const storedUrls = sessionStorage.getItem(URL_STORAGE_KEY);
    if (!storedUrls) {
        throw new Error('URL таблицы не найден. Пожалуйста, войдите снова.');
    }
    
    const urls = JSON.parse(storedUrls);
    const sheetUrl = urls[dataType];

    if (!sheetUrl) {
      // Это предотвратит ненужные запросы, если URL не задан в конфигурации.
      return '';
    }

    const exportUrl = getExportUrl(sheetUrl);
    const proxiedUrl = CORS_PROXY(exportUrl);

    try {
        const response = await fetch(proxiedUrl);
        
        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
             throw new Error('Источник данных вернул пустой ответ. Проверьте ссылку.');
        }

        // Проверяем, не получили ли мы HTML-страницу вместо CSV (частый признак закрытого доступа)
        if (csvText.trim().toLowerCase().startsWith('<html')) {
            throw new Error('Не удалось загрузить данные.\n\nПожалуйста, убедитесь, что доступ к Google Таблице открыт по ссылке (Anyone with the link can view).');
        }

        return csvText;

    } catch (error) {
        console.error("Failed to fetch data from Google Sheets:", error);
        if (error instanceof Error) {
            // Переформатируем сообщение для большей ясности
            throw new Error(`Не удалось загрузить данные. Причина: ${error.message}\n\nПроверьте ваше интернет-соединение и правильность ссылки.`);
        }
        throw new Error("Произошла неизвестная ошибка при загрузке данных.");
    }
};