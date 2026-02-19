// Build ID: 2026-02-13-22-24
// Build ID: 2026-02-13-22-25
import React, { useMemo, useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Link } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar
} from 'recharts';
import { DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Award, Info } from 'lucide-react';
import { format, isSameMonth, subMonths, isWithinInterval, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, eachMonthOfInterval, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ensureDate } from '../utils';



const ReportsPage: React.FC = () => {
    const { data: visits } = useSupabaseData<any>('visits');
    const { data: services } = useSupabaseData<any>('services');
    const { data: clients } = useSupabaseData<any>('clients');


    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [selectionMode, setSelectionMode] = useState<'month' | 'manual'>('month');
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Generate months for 2026
    const availableMonths = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const date = new Date(2026, i, 1);
            return {
                value: format(date, 'yyyy-MM'),
                label: format(date, 'LLLL yyyy', { locale: pl })
            };
        });
    }, []);

    const stats = useMemo(() => {
        if (!visits || !services || !clients) return null;

        let start: Date;
        let end: Date;

        if (selectionMode === 'month') {
            const [year, month] = selectedMonth.split('-').map(Number);
            const date = new Date(year, month - 1, 1);
            start = startOfMonth(date);
            end = endOfMonth(date);
        } else {
            start = ensureDate(new Date(startDate));
            end = ensureDate(new Date(endDate));
            end.setHours(23, 59, 59, 999);
        }

        // Filter visits by range
        const rangeVisits = (visits as any[]).filter(v =>
            isWithinInterval(ensureDate(v.date), { start, end })
        );

        // Previous month logic for data comparison
        const prevMonthStart = subMonths(start, 1);
        const prevMonthEnd = subMonths(end, 1);
        const prevVisits = (visits as any[]).filter(v =>
            isWithinInterval(ensureDate(v.date), { start: prevMonthStart, end: prevMonthEnd })
        );



        // Current stats
        const currentRevenue = rangeVisits.reduce((acc, v) => acc + (v.final_price || v.finalPrice || 0), 0);
        const currentVisitCosts = rangeVisits.reduce((acc, v) => acc + (v.material_cost || v.materialCost || 0), 0);
        const currentProfit = currentRevenue - currentVisitCosts; // EXCLUDED general expenses as requested
        const currentCount = rangeVisits.length;

        // Prev stats
        const prevRevenue = prevVisits.reduce((acc, v) => acc + (v.final_price || v.finalPrice || 0), 0);
        const prevVisitCosts = prevVisits.reduce((acc, v) => acc + (v.material_cost || v.materialCost || 0), 0);
        const prevProfit = prevRevenue - prevVisitCosts; // EXCLUDED general expenses as requested
        const prevCount = prevVisits.length;

        // MoM Changes
        const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const profitChange = prevProfit > 0 ? ((currentProfit - prevProfit) / prevProfit) * 100 : 0;
        const countChange = prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : 0;

        // Dynamic Trend (Daily or Monthly based on range)
        const daysDiff = differenceInDays(end, start);
        const dynamicTrend = daysDiff <= 31
            ? eachDayOfInterval({ start, end }).map(date => {
                const dayVisits = rangeVisits.filter(v => isSameDay(ensureDate(v.date), date));
                const revenue = dayVisits.reduce((acc, v) => acc + (v.final_price || v.finalPrice || 0), 0);
                const costs = dayVisits.reduce((acc, v) => acc + (v.material_cost || v.materialCost || 0), 0);
                return {
                    name: format(date, 'dd.MM', { locale: pl }),
                    Revenue: Number(revenue.toFixed(2)),
                    Costs: Number(costs.toFixed(2)),
                    Profit: Number((revenue - costs).toFixed(2)),
                };
            })
            : eachMonthOfInterval({ start, end }).map(date => {
                const monthVisits = visits.filter(v => isSameMonth(ensureDate(v.date), date));
                const revenue = monthVisits.reduce((acc, v) => acc + (v.final_price || v.finalPrice || 0), 0);
                const costs = monthVisits.reduce((acc, v) => acc + (v.material_cost || v.materialCost || 0), 0);
                return {
                    name: format(date, 'MMM yy', { locale: pl }),
                    Revenue: Number(revenue.toFixed(2)),
                    Costs: Number(costs.toFixed(2)),
                    Profit: Number((revenue - costs).toFixed(2)),
                };
            });

        // Service Distribution (in range) - Count based on occurrences, not revenue
        const serviceMap: Record<string, { count: number, color: string }> = {};
        rangeVisits.forEach(v => {
            const sid_list = v.service_ids || v.serviceIds || [];
            sid_list.forEach((sid: any) => {
                const s = (services as any[]).find(ser => String(ser.id) === String(sid));
                if (s) {
                    if (!serviceMap[s.name]) {
                        serviceMap[s.name] = { count: 0, color: s.color || s.colorCode || '#7c3aed' };
                    }
                    serviceMap[s.name].count += 1;
                }
            });
        });

        const totalServicesInPeriod = Object.values(serviceMap).reduce((acc, obj) => acc + obj.count, 0);
        const pieData = Object.entries(serviceMap)
            .map(([name, obj]) => ({
                name,
                value: obj.count,
                percent: totalServicesInPeriod > 0 ? (obj.count / totalServicesInPeriod) * 100 : 0,
                color: obj.color
            }))
            .sort((a, b) => b.value - a.value);

        // Client Statistics (Top Clients in range)
        const clientStatsMap: Record<number, any> = {};
        rangeVisits.forEach(v => {
            const cId = v.client_id || v.clientId;
            if (!clientStatsMap[cId]) {
                const c = (clients as any[]).find(cl => cl.id === cId);
                clientStatsMap[cId] = { id: cId, name: c?.name || '?', count: 0, total: 0, costs: 0, profit: 0 };
            }
            clientStatsMap[cId].count += 1;
            clientStatsMap[cId].total += (v.final_price || v.finalPrice || 0);
            clientStatsMap[cId].costs += (v.material_cost || v.materialCost || 0);
            clientStatsMap[cId].profit += ((v.final_price || v.finalPrice || 0) - (v.material_cost || v.materialCost || 0));
        });
        const topClients = Object.values(clientStatsMap).sort((a: any, b: any) => b.total - a.total).slice(0, 5);

        return {
            currentRevenue: Number(currentRevenue.toFixed(2)),
            currentCount,
            currentProfit: Number(currentProfit.toFixed(2)),
            revenueChange, profitChange, countChange,
            dynamicTrend, pieData, topClients,
            isDaily: daysDiff <= 31
        };
    }, [visits, services, clients, startDate, endDate, selectionMode, selectedMonth]);

    if (!stats) return <div className="p-10 text-center text-gray-500 font-bold">Analizowanie danych...</div>;

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 pb-20 scrollbar-hide">
            {/* Header with Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                        <TrendingUp className="text-primary" /> Analityka Biznesowa
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Śledź wyniki salonu i trendy sprzedaży.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full lg:w-auto">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                        <button
                            onClick={() => setSelectionMode('month')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${selectionMode === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            MIESIĘCZNIE
                        </button>
                        <button
                            onClick={() => setSelectionMode('manual')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${selectionMode === 'manual' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            MANUALNIE
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-gray-200 mx-2" />

                    {selectionMode === 'month' ? (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-primary outline-none shadow-sm cursor-pointer min-w-[150px] sm:min-w-[200px]"
                        >
                            {availableMonths.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-primary outline-none shadow-sm w-full sm:w-auto"
                            />
                            <span className="hidden sm:inline text-gray-300">—</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-primary outline-none shadow-sm w-full sm:w-auto"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Całkowity Przychód"
                    value={`${stats.currentRevenue.toFixed(2)} PLN`}
                    trend={stats.revenueChange}
                    icon={<DollarSign size={24} className="text-white" />}
                    iconBg="bg-primary"
                />
                <StatCard
                    title="Zysk z Usług"
                    value={`${stats.currentProfit.toFixed(2)} PLN`}
                    trend={stats.profitChange}
                    subvalue="Przychód pomniejszony o zużycie materiałów"
                    icon={<TrendingUp size={24} className="text-white" />}
                    iconBg="bg-green-500"
                />
                <StatCard
                    title="Zrealizowane Wizyty"
                    value={stats.currentCount.toString()}
                    trend={0}
                    icon={<Users size={24} className="text-white" />}
                    iconBg="bg-blue-500"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Trend Przychodów</h3>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 w-fit">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-sm" />
                            <span className="text-[10px] font-black uppercase text-gray-400">Przychód Netto</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dynamicTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#cbd5e1' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#cbd5e1' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, color: '#7c3aed' }}
                                />
                                <Area type="monotone" dataKey="Revenue" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Pie */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h3 className="text-lg font-black text-gray-900 mb-10 tracking-tight">Popularność Usług</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any, name: any, props: any) => {
                                        const percent = props.payload.percent;
                                        return [`${value} wizyt (${percent.toFixed(1)}%)`, name];
                                    }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    formatter={(value, entry: any) => {
                                        const { percent } = entry.payload;
                                        return <span className="text-gray-700">{value} ({percent.toFixed(1)}%)</span>;
                                    }}
                                    wrapperStyle={{ paddingLeft: '20px', fontSize: '12px', fontWeight: 800 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Financial Comparison Bar Chart */}
            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">
                        {stats.isDaily ? 'Analiza Dzienna' : 'Analiza Miesięczna'}: Przychody vs Koszty
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-blue-500" />
                            <span className="text-[10px] font-black uppercase text-gray-400 font-bold">Przychód</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-rose-400" />
                            <span className="text-[10px] font-black uppercase text-gray-400 font-bold">Koszty</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-gray-400 font-bold">Zysk</span>
                        </div>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dynamicTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#cbd5e1' }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: 800 }}
                            />
                            <Bar dataKey="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Przychód" />
                            <Bar dataKey="Costs" fill="#fb7185" radius={[6, 6, 0, 0]} name="Koszty" />
                            <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Zysk" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row: Client Ranking and Detailed Stats */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Top Clients */}
                <div className="xl:col-span-2 bg-white p-4 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <Award size={24} className="text-yellow-500" />
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Najlepsi Klienci w Okresie</h3>
                    </div>
                    <div className="table-container">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Klient</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Wizyty</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Przychód</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Koszty</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Zysk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.topClients.map((client: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-violet-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            <Link
                                                to={`/clients?id=${client.id}`}
                                                className="text-primary hover:underline hover:text-primary-hover flex items-center gap-2"
                                            >
                                                {client.name}
                                                <Info size={14} className="opacity-40" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-violet-100 text-violet-700 font-bold px-2 py-1 rounded-lg text-xs">
                                                {client.count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">{client.total} PLN</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-500">-{client.costs} PLN</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-500">{client.profit} PLN</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Efficiency Stats */}
                <div className="bg-primary p-6 sm:p-10 rounded-3xl shadow-2xl shadow-primary/30 flex flex-col justify-between text-white relative overflow-hidden">
                    <TrendingUp size={160} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
                    <div>
                        <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Info className="text-white" />
                        </div>
                        <h4 className="text-2xl font-black mb-2 leading-tight">Twój Salon się rozwija!</h4>
                        <p className="text-white/70 text-sm font-bold">W wybranym okresie obsłużyłaś o {Math.abs(stats.countChange).toFixed(1)}% {stats.countChange >= 0 ? 'więcej' : 'mniej'} klientów niż w zeszłym miesiącu (prognoza).</p>
                    </div>
                    <div className="mt-10 py-6 border-t border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Średni Przychód / Wizytę</div>
                        <div className="text-4xl font-black">{stats.currentCount > 0 ? Math.round(stats.currentRevenue / stats.currentCount) : 0} <span className="text-lg font-bold">PLN</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, subvalue, trend, icon, iconBg }: { title: string, value: string, subvalue?: string, trend: number, icon: React.ReactNode, iconBg: string }) => (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between group hover:border-primary/30 transition-all">
        <div className="flex justify-between items-start mb-6">
            <div className={`${iconBg} p-4 rounded-2xl shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            {trend !== 0 && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black
                    ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                `}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
        <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{title}</div>
            <div className="text-3xl font-black text-gray-900">{value}</div>
            {subvalue && <div className="text-xs font-bold text-gray-450 mt-2 flex items-center gap-1 opacity-40"><Info size={12} /> {subvalue}</div>}
        </div>
    </div>
);

export default ReportsPage;
