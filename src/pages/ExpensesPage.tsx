import React, { useState } from 'react';
import type { ExpenseCategory } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Plus, Trash2, Calendar, DollarSign, Filter } from 'lucide-react';
import { format, isSameMonth, startOfMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ensureDate } from '../utils';

const CATEGORIES: ExpenseCategory[] = ['Czynsz', 'Podatki/ZUS', 'Energia/Woda', 'Produkty', 'Marketing', 'Inne'];

const ExpensesPage: React.FC = () => {
    const { data: expenses } = useSupabaseData<any>('expenses');
    const { data: visits } = useSupabaseData<any>('visits');

    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('Inne');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [dashboardMonth, setDashboardMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [typeFilter, setTypeFilter] = useState<'all' | 'recurring' | 'one-time'>('all');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) return alert('Podaj prawidłową kwotę.');

        const expenseData = {
            category,
            amount: Number(amount),
            date: date, // Keep as string for Supabase date column
            description: description || category,
            is_recurring: isRecurring
        };

        if (editingId) {
            const { error } = await supabase.from('expenses').update(expenseData).eq('id', editingId);
            if (error) return alert(`Błąd: ${error.message}`);
            setEditingId(null);
        } else {
            const { error } = await supabase.from('expenses').insert([expenseData]);
            if (error) return alert(`Błąd: ${error.message}`);
        }

        setAmount('');
        setDescription('');
        setCategory('Inne');
        setIsRecurring(false);
        setDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleEdit = (exp: any) => {
        setEditingId(exp.id);
        setAmount(exp.amount.toString());
        setCategory(exp.category);
        setDate(format(ensureDate(exp.date), 'yyyy-MM-dd'));
        setDescription(exp.description);
        setIsRecurring(!!(exp.is_recurring || exp.isRecurring));
    };

    const handleDelete = async (id: any) => {
        if (confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
            await supabase.from('expenses').delete().eq('id', id);
        }
    };

    // Dashboard Stats
    const stats = React.useMemo(() => {
        if (!expenses || !visits) return null;
        const [year, month] = dashboardMonth.split('-').map(Number);
        const targetDate = new Date(year, month - 1, 1);

        const currentMonthExpenses = expenses.filter(e =>
            isSameMonth(ensureDate(e.date), targetDate)
        );

        // Calculate Revenue from Visits
        const currentMonthVisits = visits.filter(v =>
            isSameMonth(ensureDate(v.date), targetDate)
        );
        const revenue = currentMonthVisits.reduce((sum: number, v: any) => sum + (v.final_price || v.finalPrice || 0), 0);

        // Calculate Material Costs from Visits
        const materialCosts = currentMonthVisits.reduce((sum: number, v: any) => sum + (v.material_cost || v.materialCost || 0), 0);

        const expensesTotal = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);
        const fixed = currentMonthExpenses.filter(e => e.isRecurring).reduce((acc, e) => acc + e.amount, 0);

        // Variable = Expenses Variable + Material Costs
        const variableExpenses = expensesTotal - fixed;
        const totalVariable = variableExpenses + materialCosts;

        const totalCosts = expensesTotal + materialCosts;
        const realProfit = revenue - totalCosts;

        return { total: totalCosts, fixed, variable: totalVariable, materialCosts, revenue, realProfit };
    }, [expenses, visits, dashboardMonth]);

    // Automation: Seed recurring expenses for current month
    React.useEffect(() => {
        const seedRecurring = async () => {
            if (!expenses) return;
            const now = new Date();
            const currentMonthStart = startOfMonth(now);

            // Find recurring items from previous months
            const recurringTemplates = expenses.filter(e => e.isRecurring && e.date < currentMonthStart);

            for (const tpl of recurringTemplates) {
                const alreadyExistsInCurrentMonth = expenses.some(e =>
                    e.description === tpl.description &&
                    e.category === tpl.category &&
                    isSameMonth(ensureDate(e.date), now)
                );

                if (!alreadyExistsInCurrentMonth) {
                    await supabase.from('expenses').insert({
                        category: tpl.category,
                        amount: tpl.amount,
                        description: tpl.description,
                        is_recurring: true,
                        date: format(currentMonthStart, 'yyyy-MM-dd')
                    });
                }
            }
        };
        seedRecurring();
    }, [expenses]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-8 space-y-6 sm:space-y-8 pb-32 overflow-y-auto scrollbar-hide">
            <div className="w-full">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                    <ShoppingBag className="text-primary" /> Wydatki Salonu
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">Zarządzaj kosztami stałymi i operacyjnymi.</p>
            </div>

            {/* Expenses Dashboard */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-surface p-4 rounded-2xl border border-border-color shadow-sm transition-colors gap-4">
                    <h3 className="text-xs sm:text-sm font-black text-text-main uppercase tracking-wider">Statystyki za okres:</h3>
                    <select
                        value={dashboardMonth}
                        onChange={e => setDashboardMonth(e.target.value)}
                        className="w-full sm:w-auto bg-background border-2 border-border-color rounded-xl px-4 py-2 font-bold text-text-main outline-none focus:border-primary transition-all"
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const d = new Date(2026, i, 1);
                            return <option key={i} value={format(d, 'yyyy-MM')}>{format(d, 'LLLL yyyy', { locale: pl })}</option>
                        })}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none transition-colors">
                        <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Przychód (Wizyty)</div>
                        <div className="text-2xl sm:text-3xl font-black text-green-600">{stats?.revenue || 0} <span className="text-xs sm:text-sm font-bold text-green-400">PLN</span></div>
                    </div>
                    <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none transition-colors">
                        <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Koszty Całkowite (Wydatki + Materiał)</div>
                        <div className="text-2xl sm:text-3xl font-black text-red-600">-{stats?.total || 0} <span className="text-xs sm:text-sm font-bold text-red-400">PLN</span></div>
                    </div>
                    <div className={`${(stats?.realProfit || 0) >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'} p-5 sm:p-6 rounded-3xl border transition-colors`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${(stats?.realProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>Zysk "Na Rękę"</div>
                        <div className={`text-2xl sm:text-3xl font-black ${(stats?.realProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{stats?.realProfit || 0} <span className={`text-xs sm:text-sm font-bold ${(stats?.realProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>PLN</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Col */}
                <div className="xl:col-span-1">
                    <form onSubmit={handleAdd} className="bg-surface p-5 sm:p-8 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none space-y-6 xl:sticky xl:top-0 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-text-main">{editingId ? 'Edytuj Wydatek' : 'Dodaj Nowy Wydatek'}</h3>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setAmount('');
                                        setDescription('');
                                        setIsRecurring(false);
                                    }}
                                    className="text-xs font-bold text-red-500 hover:underline"
                                >
                                    Anuluj
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-2 mb-1 block">Kwota (PLN)</label>
                                <div className="relative">
                                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-background border-2 border-border-color rounded-2xl pl-12 pr-4 py-4 font-bold text-text-main focus:border-primary outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-2 mb-1 block">Kategoria</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                                    className="w-full bg-background border-2 border-border-color rounded-2xl px-4 py-4 font-bold text-text-main focus:border-primary outline-none transition-all"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-2 mb-1 block">Data</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-background border-2 border-border-color rounded-2xl px-4 py-4 font-bold text-text-main focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-text-muted tracking-widest pl-2 mb-1 block">Opis (opcjonalnie)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Np. Faktura za prąd - styczeń"
                                    className="w-full bg-background border-2 border-border-color rounded-2xl px-4 py-4 font-bold text-text-main focus:border-primary outline-none transition-all resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-border-color cursor-pointer transition-colors" onClick={() => setIsRecurring(!isRecurring)}>
                                <div>
                                    <div className="text-xs font-black text-text-main">Płatność cykliczna</div>
                                    <div className="text-[10px] text-text-muted font-bold">Czynsz, ZUS, Podatki itp.</div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-all ${isRecurring ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        <button className={`w-full ${editingId ? 'bg-blue-600 shadow-blue-200' : 'bg-primary shadow-primary/20'} text-white py-5 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-1`}>
                            {editingId ? <ShoppingBag size={20} /> : <Plus size={20} />}
                            {editingId ? 'Zaktualizuj Wydatek' : 'Dodaj do Listy'}
                        </button>
                    </form>
                </div>

                {/* List Col */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex justify-start sm:justify-end mb-4">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="bg-surface border-2 border-border-color rounded-xl px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-main outline-none focus:border-primary transition-all shadow-sm w-full sm:w-auto"
                        >
                            <option value="all">Wszystkie wydatki</option>
                            <option value="recurring">Tylko Cykliczne</option>
                            <option value="one-time">Tylko Jednorazowe</option>
                        </select>
                    </div>

                    {!expenses || expenses.filter(exp => {
                        const [year, month] = dashboardMonth.split('-').map(Number);
                        return isSameMonth(exp.date, new Date(year, month - 1, 1)) && (
                            typeFilter === 'all' ||
                            (typeFilter === 'recurring' && exp.isRecurring) ||
                            (typeFilter === 'one-time' && !exp.isRecurring)
                        );
                    }).length === 0 ? (
                        <div className="bg-surface p-12 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none text-center text-text-muted font-bold transition-colors">
                            Brak wydatków spełniających wybrane kryteria w tym miesiącu.
                        </div>
                    ) : (
                        expenses
                            .filter(exp => {
                                // 1. Filter by Selected Month
                                const [year, month] = dashboardMonth.split('-').map(Number);
                                const itemMonth = isSameMonth(exp.date, new Date(year, month - 1, 1));
                                if (!itemMonth) return false;

                                // 2. Filter by Type
                                if (typeFilter === 'recurring') return exp.isRecurring;
                                if (typeFilter === 'one-time') return !exp.isRecurring;
                                return true;
                            })
                            .map(exp => (
                                <div key={exp.id} className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group hover:border-red-100 dark:hover:border-red-900 transition-all">
                                    {/* ... expense item ... */}
                                </div>
                            ))
                            // Prepend Material Costs
                            .concat(
                                (stats?.materialCosts || 0) > 0 && (typeFilter === 'all' || typeFilter === 'one-time') ? [(
                                    <div key="material-costs" className="bg-surface p-5 sm:p-6 rounded-3xl border border-purple-100 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group hover:border-purple-200 transition-all bg-purple-50/30">
                                        <div className="flex items-center gap-4 sm:gap-6 w-full">
                                            <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-2xl text-purple-600 shadow-sm border border-purple-200 dark:border-purple-900/30 transition-colors flex-none">
                                                <ShoppingBag size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-md">Produkty</span>
                                                    <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar size={12} /> {dashboardMonth}
                                                    </span>
                                                </div>
                                                <div className="text-base sm:text-lg font-black text-text-main truncate">Zużycie Materiałów (z Wizyt)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                                            <div className="text-xl sm:text-2xl font-black text-purple-600">-{stats?.materialCosts || 0} <span className="text-xs sm:text-sm">PLN</span></div>
                                            <div className="flex gap-2 opacity-50 cursor-not-allowed" title="To jest koszt automatyczny z wizyt">
                                                <button disabled className="p-3 bg-background text-gray-300 rounded-xl"><ShoppingBag size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                )] : []
                            )
                            .map((item, idx) => React.isValidElement(item) ? item : (
                                <div key={(item as any).id} /* ... existing expense render ... */ className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group hover:border-red-100 dark:hover:border-red-900 transition-all">
                                    <div className="flex items-center gap-4 sm:gap-6 w-full">
                                        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl text-rose-500 shadow-sm border border-rose-100 dark:border-rose-900/30 transition-colors flex-none">
                                            <Filter size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-50 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">{(item as any).category}</span>
                                                {(item as any).isRecurring && (
                                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Calendar size={10} /> Cykliczny
                                                    </span>
                                                )}
                                                <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar size={12} /> {format((item as any).date, 'dd.MM.yyyy')}
                                                </span>
                                            </div>
                                            <div className="text-base sm:text-lg font-black text-text-main truncate">{(item as any).description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                                        <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">-{(item as any).amount} <span className="text-xs sm:text-sm">PLN</span></div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-3 bg-background text-text-muted hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 rounded-xl transition-all"
                                            >
                                                <ShoppingBag size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete((item as any).id!)}
                                                className="p-3 bg-background text-text-muted hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpensesPage;
