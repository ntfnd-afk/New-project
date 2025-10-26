import React, { useState } from 'react';
import { LoadingIcon } from './icons.tsx';

interface LoginProps {
    onLoginSuccess: () => void;
}

// Конфигурация доступа.
const CORRECT_PIN = '164363';
// URL таблицы хранится в закодированном виде (base64), чтобы не быть в открытом виде в коде.
const ENCODED_ADS_URL = 'aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMUg2V3hLV200RWEzSVNoaFNLR3U2M09wWnV5Tk1aLVZTS21xVWp3em9GTFEvZWRpdCNnaWQ9MTg5NDI0MjcwOA==';
const URL_STORAGE_KEY = 'wb-ads-dashboard-urls';


const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Allow only digits
        if (value.length <= 6) {
            setAccessCode(value);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (accessCode !== CORRECT_PIN) {
            setError('Неверный PIN-код. Попробуйте еще раз.');
            setAccessCode('');
            return;
        }
        
        setLoading(true);
        
        // Симулируем небольшую задержку для UX
        setTimeout(() => {
            try {
                // Декодируем URL только после успешной аутентификации
                const sheetUrl = atob(ENCODED_ADS_URL);
                const urls = {
                    ads: sheetUrl,
                    orders: '', // Пока не используется
                };
                
                sessionStorage.setItem(URL_STORAGE_KEY, JSON.stringify(urls));
                sessionStorage.setItem('isAuthenticated', 'true');
                onLoginSuccess();
            } catch (e) {
                setError('Произошла ошибка при сохранении сессии.');
                setLoading(false);
            }
        }, 300);
    };

    const inputClass = "bg-slate-100 border-2 border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition duration-150 ease-in-out hover:border-slate-300 text-center tracking-[1em]";

    return (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 font-sans">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800">
                        Вход в дашборд
                    </h2>
                     <p className="mt-2 text-center text-sm text-slate-600">
                        Для доступа введите 6-значный PIN-код.
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="access-code" className="sr-only">
                            PIN-код
                        </label>
                        <input
                            id="access-code"
                            name="access-code"
                            type="text" // Using text to handle tracking style, but pattern restricts to numbers
                            inputMode="numeric"
                            pattern="\d{6}"
                            autoComplete="one-time-code"
                            required
                            className={inputClass}
                            placeholder="● ● ● ● ● ●"
                            value={accessCode}
                            onChange={handleCodeChange}
                            maxLength={6}
                            autoFocus
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || accessCode.length < 6}
                            className="flex w-full justify-center items-center h-12 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Войти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;