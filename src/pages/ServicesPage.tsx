import React, { useState } from 'react';
import type { Service } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Search, Clock, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const ServicesPage: React.FC = () => {
    const { data: services } = useSupabaseData<Service>('services');

    // Add/Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [color, setColor] = useState('#7c3aed');
    const [search, setSearch] = useState('');

    const PRESET_COLORS = [
        '#7c3aed', // Purple
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#10b981', // Green
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#8b5cf6', // Violet
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(price);
        const durationNum = parseInt(duration);

        if (!name || isNaN(priceNum) || isNaN(durationNum)) {
            alert("Proszę wypełnić wszystkie pola poprawnie.");
            return;
        }

        if (editId) {
            const { error } = await supabase.from('services').update({
                name: name as any,
                default_price: priceNum,
                duration: durationNum,
                color
            }).eq('id', editId);
            if (error) return alert(`Błąd aktualizacji: ${error.message}`);
        } else {
            const { error } = await supabase.from('services').insert({
                name: name as any,
                default_price: priceNum,
                duration: durationNum,
                color
            });
            if (error) return alert(`Błąd dodawania: ${error.message}`);
        }

        resetForm();
    };

    const handleEdit = (service: Service) => {
        setEditId(service.id!);
        setName(service.name);
        setPrice((service as any).default_price?.toString() || service.defaultPrice?.toString() || '0');
        setDuration(service.duration.toString());
        setColor(service.color || '#7c3aed');
        setIsEditing(true);
    };

    const handleDelete = async (id: any) => {
        if (confirm("Czy na pewno chcesz usunąć tę usługę?")) {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) alert(`Błąd usuwania: ${error.message}`);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setName('');
        setPrice('');
        setDuration('');
        setColor('#7c3aed');
    };

    const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

    const filteredServices = services?.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cennik Usług</h1>
                    <p className="text-gray-500 mt-1">Zarządzaj ofertą swojego salonu.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Szukaj usługi..."
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                    >
                        <Plus size={18} /> <span className="hidden md:inline">Dodaj</span>
                    </button>
                </div>
            </div>

            {/* Modal / Form */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">{editId ? 'Edytuj Usługę' : 'Nowa Usługa'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nazwa Usługi</label>
                                <input
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="np. Strzyżenie Męskie"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Kolor w kalendarzu</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
                                                color === c ? "border-gray-900 scale-110" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        className="w-8 h-8 rounded-full cursor-pointer bg-white border border-gray-200 overflow-hidden"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ten kolor będzie widoczny na kafelku wizyty w kalendarzu.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cena (PLN)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400"><DollarSign size={16} /></div>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-xl p-3 pl-9 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            value={price} onChange={e => setPrice(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Czas (min)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400"><Clock size={16} /></div>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 rounded-xl p-3 pl-9 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            value={duration} onChange={e => setDuration(e.target.value)}
                                            placeholder="30"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={resetForm} className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">Anuluj</button>
                                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl hover:bg-primary-hover shadow-lg hover:shadow-primary/30 font-medium transition-all">Zapisz</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Card Grid view for mobile, Table for desktop - sticking to Table for now but styled better */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-8 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nazwa usługi</th>
                            <th className="px-8 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Czas</th>
                            <th className="px-8 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cena</th>
                            <th className="px-8 py-5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredServices?.map((service, idx) => (
                            <tr key={service.id} className={cn("hover:bg-purple-50/50 transition-colors group", idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                                <td className="px-8 py-5 font-medium text-gray-900 group-hover:text-primary transition-colors">{service.name}</td>
                                <td className="px-8 py-5 text-gray-600">
                                    <div className="flex items-center gap-2 bg-gray-100 w-fit px-2 py-1 rounded text-xs font-medium">
                                        <Clock size={12} /> {service.duration} min
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-gray-900 font-bold">{(service as any).default_price || service.defaultPrice} PLN</td>
                                <td className="px-8 py-5 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(service)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edytuj">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(service.id!)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Usuń">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {services?.length === 0 && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-4">
                        <div className="bg-gray-100 p-4 rounded-full">
                            <Plus size={32} className="text-gray-300" />
                        </div>
                        <p>Twój cennik jest pusty. Dodaj pierwszą usługę!</p>
                    </div>
                )}
            </div>

            <div className="text-center text-xs text-gray-400 mt-4">
                Pokazano {filteredServices?.length || 0} usług
            </div>
        </div>
    );
};

export default ServicesPage;
