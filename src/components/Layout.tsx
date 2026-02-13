// Update for KALENDARZ labels and colors
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserCircle, Scissors, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <div className="flex flex-col min-h-screen bg-background font-sans transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="bg-nav-bg text-white shadow-md z-40 flex-none h-16 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4 sm:gap-12">
                    {/* Hamburger Menu (Mobile) */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl transition-all text-white active:scale-90 z-50"
                        aria-label="Menu"
                    >
                        {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>

                    {/* Logo / Brand Name */}
                    <div className="flex items-center gap-2 sm:gap-3 font-bold text-lg tracking-tight select-none">
                        <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 hidden sm:block">
                            <Scissors size={18} className="text-primary" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 font-bold mb-0.5 text-xs sm:text-base whitespace-nowrap">
                                S.Mazurkiewicz CRM
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                                Pracownia
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links (Desktop) */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
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
                <div className="flex items-center gap-1 sm:gap-3 pl-3 sm:pl-6 border-l border-gray-700">
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        title={isDark ? "Tryb Jasny" : "Tryb Ciemny"}
                    >
                        {isDark ? <Sun className="w-5 h-5 sm:w-[20px] sm:h-[20px]" /> : <Moon className="w-5 h-5 sm:w-[20px] sm:h-[20px]" />}
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="text-right hidden xl:block">
                            <div className="text-sm font-medium text-white">Sylwutka</div>
                            <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                {user?.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                            </div>
                        </div>
                        <div className="p-0.5 border border-gray-600 rounded-full">
                            <UserCircle className="text-gray-300 w-6 h-6 sm:w-[28px] sm:h-[28px]" />
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-gray-400 hover:text-red-400"
                        title="Wyloguj się"
                    >
                        <LogOut className="w-5 h-5 sm:w-[20px] sm:h-[20px]" />
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
                    <div
                        className="absolute left-0 top-0 bottom-0 w-72 bg-nav-bg shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 font-bold text-lg mb-10 pb-6 border-b border-gray-800">
                            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                                <Scissors size={20} className="text-primary" />
                            </div>
                            <span className="text-white">Menu</span>
                        </div>
                        <nav className="flex flex-col gap-2">
                            <MobileNavItem to="/" label="Dashboard" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/calendar" label="Kalendarz" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/clients" label="Klienci" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/services" label="Usługi" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/products" label="Produkty" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/reports" label="Statystyki" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/expenses" label="Wydatki" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/help" label="Instrukcja" onClick={() => setIsMenuOpen(false)} />
                            <MobileNavItem to="/settings" label="Baza" onClick={() => setIsMenuOpen(false)} />
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 relative bg-background transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex flex-col w-full px-0 sm:px-6 lg:px-8 h-full">
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
            `px-3 xl:px-4 py-2 text-xs xl:text-sm font-medium transition-all rounded-lg whitespace-nowrap
       ${isActive
                ? 'bg-white/10 text-white shadow-inner'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`
        }
    >
        {label}
    </NavLink>
);

const MobileNavItem = ({ to, label, onClick }: { to: string, label: string, onClick: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }: { isActive: boolean }) =>
            `px-5 py-4 text-base font-bold transition-all rounded-2xl flex items-center justify-between
       ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`
        }
    >
        {label}
        <ArrowRight size={18} className="opacity-40" />
    </NavLink>
);

import { ArrowRight } from 'lucide-react';

export default Layout;
