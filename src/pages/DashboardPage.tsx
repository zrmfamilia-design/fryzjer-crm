import React from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ArrowRight, Calendar, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { ensureDate } from '../utils';
import { pl } from 'date-fns/locale';


import logo from '../assets/logo.png';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const now = new Date();

    const { data: visits } = useSupabaseData<any>('visits');
    const { data: clients } = useSupabaseData<any>('clients');
    const { data: services } = useSupabaseData<any>('services');
    const { data: products } = useSupabaseData<any>('products');

    const todaysVisits = React.useMemo(() => {
        if (!visits || !clients || !services) return [];
        return (visits as any[])
            .filter(v => isSameDay(ensureDate(v.date), now))
            .map(v => ({
                ...v,
                client: (clients as any[]).find(c => c.id === (v.client_id || v.clientId)),
                serviceDetails: (v.service_ids || v.serviceIds || []).map((sid: any) => (services as any[]).find(s => s.id === sid)).filter(Boolean)
            }))
            .sort((a, b) => ensureDate(a.date).getTime() - ensureDate(b.date).getTime());
    }, [visits, clients, services]);

    const lowStockAlerts = React.useMemo(() => {
        if (!products) return [];
        return products.filter(p => (p.current_stock || p.currentStock || 0) < ((p.base_weight || p.baseWeight || 0) * 0.3));
    }, [products]);

    const dashboardStats = React.useMemo(() => {
        if (!visits || !clients) return { revenue: 0, clientCount: 0, visitCount: 0 };

        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const monthVisits = visits.filter(v =>
            isWithinInterval(ensureDate(v.date), { start: monthStart, end: monthEnd })
        );

        return {
            revenue: monthVisits.reduce((sum, v) => sum + (v.final_price || v.finalPrice || 0), 0),
            clientCount: clients.length,
            visitCount: visits.length
        };
    }, [visits, clients]);

    return (
        <div className="min-h-full p-4 sm:p-8 space-y-6 pb-24 sm:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-surface p-4 sm:p-6 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-border-color transition-colors">
                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                    <div className="bg-surface p-2 rounded-2xl shadow-sm border border-border-color hidden xs:block">
                        <img src={logo} alt="S. Mazurkiewicz" className="h-10 sm:h-16 w-auto object-contain" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-black text-text-main flex items-center gap-2">
                            Witaj SYLWUTKA <span className="text-3xl animate-wave">👋</span>
                        </h1>
                        <p className="text-text-muted text-sm font-medium">Sprawdź co mamy zaplanowane na dzisiaj.</p>
                    </div>
                </div>
                <div className="text-sm font-black bg-primary/10 px-6 py-3 rounded-2xl text-primary border-2 border-primary/5 shadow-sm">
                    {format(now, 'dd.MM.yyyy', { locale: pl })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Summary & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Low Stock Alert */}
                    {lowStockAlerts.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 p-4 sm:p-5 rounded-2xl animate-pulse shadow-sm">
                            <h3 className="text-red-700 dark:text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                Uwaga! Kończące się produkty
                            </h3>
                            <div className="space-y-2">
                                {lowStockAlerts.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between items-center text-xs font-bold text-red-800 dark:text-red-300">
                                        <span>{p.name}</span>
                                        <span>{Math.round(p.current_stock || p.currentStock || 0)}g</span>
                                    </div>
                                ))}
                                {lowStockAlerts.length > 3 && (
                                    <div className="text-[10px] text-red-600 dark:text-red-400 pt-1 text-right">
                                        + {lowStockAlerts.length - 3} więcej...
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/products')}
                                className="w-full mt-4 bg-red-600 dark:bg-red-700 text-white py-2 rounded-xl text-xs font-black hover:bg-red-700 transition-colors"
                            >
                                Uzupełnij Magazyn
                            </button>
                        </div>
                    )}

                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-color">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-text-muted font-semibold uppercase text-xs tracking-wider">Podsumowanie 2026</h2>
                            <button onClick={() => navigate('/reports')} className="text-primary hover:text-primary-hover transition-colors flex items-center gap-1 text-sm font-medium">
                                Statystyki <ArrowRight size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-background rounded-lg border border-border-color group cursor-pointer hover:bg-surface hover:shadow-md transition-all" onClick={() => navigate('/reports')}>
                                <div className="text-xs text-text-muted uppercase mb-1">Przychód (Miesiąc)</div>
                                <div className="text-3xl font-black text-primary">{dashboardStats.revenue} <span className="text-text-muted text-sm font-normal">PLN</span></div>
                            </div>
                            <div className="p-4 bg-background rounded-lg border border-border-color group cursor-pointer hover:bg-surface hover:shadow-md transition-all" onClick={() => navigate('/clients')}>
                                <div className="text-xs text-text-muted uppercase mb-1">Baza Klientów</div>
                                <div className="text-2xl font-black text-text-main">{dashboardStats.clientCount} <span className="text-text-muted text-sm font-normal">osób</span></div>
                            </div>
                            <div className="p-4 bg-background rounded-lg border border-border-color">
                                <div className="text-xs text-text-muted uppercase mb-1">Wykonanych Usług (Total)</div>
                                <div className="text-2xl font-black text-text-main">{dashboardStats.visitCount}</div>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/calendar')}
                        className="group cursor-pointer bg-surface p-6 rounded-xl shadow-sm border border-border-color flex justify-between items-center hover:shadow-md transition-all hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Calendar size={24} />
                            </div>
                            <div className="font-semibold text-text-main">Kalendarz pracy</div>
                        </div>
                        <div className="bg-background p-2 rounded-full text-text-muted group-hover:text-primary transition-colors">
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/services')}
                        className="group cursor-pointer bg-surface p-6 rounded-xl shadow-sm border border-border-color flex justify-between items-center hover:shadow-md transition-all hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <div className="font-semibold text-text-main">Cennik usług</div>
                        </div>
                        <div className="bg-background p-2 rounded-full text-text-muted group-hover:text-blue-600 transition-colors">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </div>

                {/* Right Col: Today's Agenda */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock size={20} className="text-primary" /> Plan Dnia
                        </h2>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-widest">{format(now, 'EEEE, d MMMM', { locale: pl })}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {todaysVisits.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                    <Calendar size={32} className="opacity-20" />
                                </div>
                                <p>Brak zaplanowanych wizyt na dziś.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-4">
                                {/* Vertical Line timeline start */}
                                <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-gray-100 pointer-events-none"></div>

                                {todaysVisits.map((visit) => (
                                    <div key={visit.id} className="relative flex items-start gap-6 group">
                                        {/* Time Stamp */}
                                        <div className="flex-none w-12 sm:w-14 text-right pt-2 font-bold text-gray-900 text-xs sm:text-sm">
                                            {format(ensureDate(visit.date), 'HH:mm', { locale: pl })}
                                        </div>

                                        {/* Timeline Dot */}
                                        <div className="mt-2 sm:mt-2.5 z-10 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white bg-primary shadow-sm ring-4 ring-primary/10"></div>

                                        {/* Card */}
                                        <div className="flex-1 bg-gray-50/50 group-hover:bg-white border border-gray-100 group-hover:border-primary/20 p-4 rounded-xl transition-all group-hover:shadow-lg group-hover:shadow-primary/5 cursor-pointer" onClick={() => navigate('/calendar')}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-gray-800">{visit.client?.name || 'Nieznany Klient'}</div>
                                                <div className="text-xs bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-500 flex items-center gap-1 shadow-sm">
                                                    <Clock size={12} /> {visit.serviceDetails.reduce((sum: number, s: any) => sum + (s?.duration || 0), 0)} min
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {visit.serviceDetails.map((s: any, sIdx: number) => (
                                                    <span key={sIdx} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white text-gray-500 border border-gray-200">
                                                        {s?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes wave {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(14deg); }
                    20% { transform: rotate(-8deg); }
                    30% { transform: rotate(14deg); }
                    40% { transform: rotate(-4deg); }
                    50% { transform: rotate(10deg); }
                    60% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-wave {
                    display: inline-block;
                    animation-name: wave;
                    animation-duration: 2.5s;
                    animation-iteration-count: infinite;
                    transform-origin: 70% 70%;
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;
