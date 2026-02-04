import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scissors, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const { login, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isResetMode) {
                await resetPassword(email);
                setResetSent(true);
            } else {
                const success = await login(email, password);
                if (success) {
                    navigate('/');
                } else {
                    setError('Nieprawidłowy e-mail lub hasło');
                }
            }
        } catch (err) {
            setError('Wystąpił błąd podczas logowania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-height-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface rounded-2xl shadow-xl overflow-hidden border border-[var(--border-color)]">
                    <div className="bg-primary p-8 text-white text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-xl mb-4">
                            <Scissors className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold">S.Mazurkiewicz CRM</h1>
                        <p className="text-white/80 mt-1">
                            {isResetMode ? 'Resetowanie hasła' : 'Panel Zarządzania Salonem'}
                        </p>
                    </div>

                    <div className="p-8">
                        {resetSent ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-600 rounded-full mb-4">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">E-mail został wysłany</h3>
                                <p className="text-text-muted mb-6">
                                    Jeśli adres {email} istnieje w naszej bazie, otrzymasz instrukcje resetu hasła.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsResetMode(false);
                                        setResetSent(false);
                                    }}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Wróć do logowania
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-main mb-1">E-mail</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                                placeholder="twoj@email.com"
                                            />
                                        </div>
                                    </div>

                                    {!isResetMode && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-sm font-medium text-text-main">Hasło</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsResetMode(true)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Zapomniałeś?
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        isResetMode ? 'Wyślij instrukcje' : 'Zaloguj się'
                                    )}
                                </button>

                                {isResetMode && (
                                    <button
                                        type="button"
                                        onClick={() => setIsResetMode(false)}
                                        className="w-full text-center text-sm text-text-muted hover:text-text-main mt-4"
                                    >
                                        Wróć do logowania
                                    </button>
                                )}
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-text-muted text-sm px-4">
                    <p>© 2026 S.Mazurkiewicz. Wszystkie prawa zastrzeżone.</p>
                    <p className="mt-1">Bezpieczne logowanie administratora</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
