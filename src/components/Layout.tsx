import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserCircle, Scissors, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-background font-sans overflow-hidden transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="bg-nav-bg text-white shadow-md z-30 flex-none h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-12">
                    {/* Logo / Brand Name */}
                    <div className="flex items-center gap-3 font-bold text-lg tracking-tight select-none">
                        <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                            <Scissors size={20} className="text-primary" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 font-bold mb-0.5">
                                S.Mazurkiewicz CRM
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                                Pracownia
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-2">
                        <NavItem to="/" label="Dashboard" />
                        <NavItem to="/calendar" label="Kalendarz" />
                        <NavItem to="/clients" label="Klienci" />
                        <NavItem to="/services" label="Usługi" />
                        <NavItem to="/products" label="Produkty" />
                        <NavItem to="/reports" label="Statystyki" />
                        <NavItem to="/expenses" label="Wydatki" />
                        <NavItem to="/help" label="Instrukcja" />
                        <NavItem to="/settings" label="Baza" />
                    </nav>
                </div>

                {/* User Profile & Theme Toggle */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-700">
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        title={isDark ? "Tryb Jasny" : "Tryb Ciemny"}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-medium text-white">Sylwutka</div>
                            <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                {user?.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                            </div>
                        </div>
                        <div className="p-0.5 border border-gray-600 rounded-full">
                            <UserCircle size={28} className="text-gray-300" />
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-gray-400 hover:text-red-400"
                        title="Wyloguj się"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative bg-background transition-colors duration-300">
                <div className="max-w-7xl mx-auto h-full flex flex-col w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, label }: { to: string, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }: { isActive: boolean }) =>
            `px-4 py-2 text-sm font-medium transition-all rounded-lg
       ${isActive
                ? 'bg-white/10 text-white shadow-inner'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`
        }
    >
        {label}
    </NavLink>
);

export default Layout;
