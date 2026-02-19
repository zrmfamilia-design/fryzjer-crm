// Product unit and sales deployment - build v1.2
import React, { useState } from 'react';
import { Box, Plus, Trash2, Package, DollarSign, Scale, Search, Upload, Download, Edit3, TrendingDown, AlertCircle, RefreshCcw } from 'lucide-react';
import { format, addDays, isAfter } from 'date-fns';
import { ensureDate } from '../utils';
import type { Product, Visit } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';

const ProductsPage: React.FC = () => {
    const { data: products } = useSupabaseData<Product>('products');

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form state
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [baseWeight, setBaseWeight] = useState<number | ''>('');
    const [currentStock, setCurrentStock] = useState<number | ''>('');
    const [unit, setUnit] = useState<'g' | 'szt'>('g');

    const { data: visits } = useSupabaseData<Visit>('visits');

    const resetForm = () => {
        setName('');
        setBrand('');
        setPrice('');
        setBaseWeight('');
        setCurrentStock('');
        setUnit('g');
        setEditingProduct(null);
        setShowAddForm(false);
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setBrand(product.brand || '');
        setPrice(product.price);
        setBaseWeight(product.baseWeight || (product as any).base_weight);
        setCurrentStock(product.currentStock || (product as any).current_stock);
        setUnit(product.unit || 'g');
        setShowAddForm(true);
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = Number(baseWeight);
        const stockValue = currentStock === '' ? weightValue : Number(currentStock);

        if (!name || isNaN(weightValue) || isNaN(Number(price))) return alert('Wypełnij wymagane pola');

        try {
            if (editingProduct?.id) {
                await supabase.from('products').update({
                    name, brand, price: Number(price), base_weight: weightValue, current_stock: stockValue, unit
                }).eq('id', editingProduct.id);
            } else {
                await supabase.from('products').insert({
                    name, brand, price: Number(price), base_weight: weightValue, current_stock: stockValue, unit
                });
            }
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Błąd podczas zapisywania produktu');
        }
    };

    const handleReplenish = async (product: Product) => {
        const addedGramsStr = prompt(`Ile gram/ml produktu "${product.name}" dodajesz do stanu?`, product.baseWeight.toString());
        if (!addedGramsStr) return;

        const addedGrams = parseFloat(addedGramsStr);
        if (isNaN(addedGrams) || addedGrams <= 0) return alert('Podaj prawidłową ilość');

        try {
            await supabase.from('products').update({
                current_stock: ((product as any).current_stock || product.currentStock) + addedGrams
            }).eq('id', product.id);
        } catch (err) {
            alert('Błąd aktualizacji stanu');
        }
    };

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newProducts: Product[] = [];

            // Skip header if exists
            const startIdx = lines[0].toLowerCase().includes('nazwa') ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const [pName, pBrand, pPrice, pWeight, pStock] = line.split(',').map(s => s.trim());
                const parsedPrice = parseFloat(pPrice?.replace(',', '.') || '');
                const parsedWeight = parseFloat(pWeight?.replace(',', '.') || '');
                const parsedStock = pStock ? parseFloat(pStock.replace(',', '.')) : parsedWeight;

                if (pName && !isNaN(parsedPrice) && !isNaN(parsedWeight)) {
                    newProducts.push({
                        name: pName,
                        brand: pBrand || '',
                        price: parsedPrice,
                        base_weight: parsedWeight,
                        current_stock: !isNaN(parsedStock) ? parsedStock : parsedWeight
                    } as any);
                }
            }

            if (newProducts.length > 0) {
                if (confirm(`Czy chcesz zaimportować ${newProducts.length} produktów?`)) {
                    const { error } = await supabase.from('products').insert(newProducts);
                    if (error) return alert(`Błąd importu: ${error.message}`);
                    alert('Import zakończony sukcesem!');
                }
            } else {
                alert('Nie znaleziono prawidłowych danych w pliku.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadCSVTemplate = () => {
        const header = "Nazwa,Marka,Cena,Waga,Stan Aktualny\n";
        const example = "Londa 7/7,Londa Professional,45.00,60,60\nWella Illumina 9/60,Wella,52.50,60,30";
        const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "wzor_produktow.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportLowStockCSV = () => {
        if (!products || products.length === 0) return;
        const lowStockItems = products.filter(p => p.currentStock < (p.baseWeight * 0.3)); // Below 30%
        if (lowStockItems.length === 0) {
            alert('Brak produktów o niskim stanie magazynowym (poniżej 30%).');
            return;
        }

        const header = "Nazwa,Marka,Stan Aktualny,Pojemność,Brakująca Ilość (do pełnej tubki)\n";
        const rows = lowStockItems.map(p =>
            `${p.name},${p.brand},${p.currentStock}g,${p.baseWeight}g,${Math.max(0, p.baseWeight - p.currentStock)}g`
        ).join('\n');

        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `lista_zakupowa_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (id: any) => {
        if (confirm('Czy na pewno chcesz usunąć ten produkt?')) {
            await supabase.from('products').delete().eq('id', id);
        }
    };

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // PREDICTION LOGIC
    const predictions = React.useMemo(() => {
        if (!products || !visits) return {};
        const now = new Date();
        const results: Record<number, { date: Date | null, reason: 'history' | 'upcoming' | 'none' }> = {};

        products.forEach(product => {
            // 1. Calculate historical global average usage
            let totalGramsUsed = 0;
            let usageCount = 0;
            const clientUsageMap: Record<number, number[]> = {};

            (visits as Visit[]).forEach(v => {
                const usedItem = v.usedProducts?.find(up => up.productId === product.id);
                if (usedItem) {
                    totalGramsUsed += usedItem.amountUsed;
                    usageCount++;
                    if (!clientUsageMap[v.clientId]) clientUsageMap[v.clientId] = [];
                    clientUsageMap[v.clientId].push(usedItem.amountUsed);
                }
            });

            const globalAvg = usageCount > 0 ? totalGramsUsed / usageCount : 0;
            if (globalAvg === 0) {
                results[product.id!] = { date: null, reason: 'none' };
                return;
            }

            // 2. Look at future visits
            const futureVisits = (visits as Visit[])
                .filter(v => isAfter(ensureDate(v.date), now))
                .sort((a, b) => ensureDate(a.date).getTime() - ensureDate(b.date).getTime());

            let simulatedStock = product.currentStock;
            let depletionDate: Date | null = null;
            let reason: 'history' | 'upcoming' = 'history';

            for (const v of futureVisits) {
                // If client used this product before, use their average. Otherwise global avg.
                const clientHistoricalUsage = clientUsageMap[v.clientId];
                const expectedUsage = clientHistoricalUsage
                    ? clientHistoricalUsage.reduce((a, b) => a + b, 0) / clientHistoricalUsage.length
                    : globalAvg;

                simulatedStock -= expectedUsage;
                if (simulatedStock <= 0) {
                    depletionDate = ensureDate(v.date);
                    reason = 'upcoming';
                    break;
                }
            }

            // 3. Fallback: If not depleted by future visits, project based on historical frequency
            if (!depletionDate && globalAvg > 0) {
                const dailyUsage = totalGramsUsed / 60; // Approximate daily usage over last 2 months
                if (dailyUsage > 0) {
                    const daysRemaining = Math.floor(product.currentStock / dailyUsage);
                    if (daysRemaining < 365) {
                        depletionDate = addDays(now, daysRemaining);
                        reason = 'history';
                    }
                }
            }

            results[product.id!] = { date: depletionDate, reason };
        });

        return results;
    }, [products, visits]);

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 pb-20 scrollbar-hide">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface p-4 sm:p-6 rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none transition-colors">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-text-main flex items-center gap-3">
                        <Package className="text-primary" /> Magazyn Produktów
                    </h1>
                    <p className="text-text-muted text-xs sm:text-sm font-medium">Zarządzaj farbami i preparatami używanymi w salonie.</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCSVImport}
                        className="hidden"
                    />
                    <button
                        onClick={exportLowStockCSV}
                        className="flex-1 sm:flex-none justify-center bg-red-50 text-red-600 px-4 py-3 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center gap-2 text-xs border-2 border-red-100 shadow-sm"
                        title="Eksportuj listę zakupową (produkty poniżej 30%)"
                    >
                        <AlertCircle size={18} /> Eksportuj Braki
                    </button>
                    <button
                        onClick={downloadCSVTemplate}
                        className="bg-white border-2 border-gray-100 text-gray-600 px-4 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                        <Download size={18} /> Wzór CSV
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border-2 border-gray-100 text-gray-600 px-4 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                        <Upload size={18} /> Import CSV
                    </button>
                    <button
                        onClick={() => {
                            if (showAddForm) resetForm();
                            else setShowAddForm(true);
                        }}
                        className="w-full sm:w-auto justify-center bg-primary hover:bg-primary-hover text-white px-6 py-4 sm:py-3 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} /> {showAddForm ? 'Anuluj' : 'Dodaj Produkt'}
                    </button>
                </div>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
                <div className="bg-surface p-4 sm:p-8 rounded-3xl border-2 border-primary/10 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 transition-colors">
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Typ / Jednostka</label>
                            <div className="flex bg-background border-2 border-border-color rounded-2xl p-1">
                                <button
                                    type="button"
                                    onClick={() => setUnit('g')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${unit === 'g' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    GRAMY/ML
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnit('szt')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${unit === 'szt' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    SZTUKI
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-1">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">Nazwa Produktu</label>
                            <input
                                placeholder={unit === 'g' ? "np. Londa 7/7" : "np. Peleryny jednorazowe"}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-background border-2 border-border-color rounded-2xl px-5 py-3 text-text-main focus:border-primary outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Marka</label>
                            <input
                                placeholder="np. Londa Professional"
                                value={brand}
                                onChange={e => setBrand(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-gray-900 focus:border-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cena za tubkę/opak. (PLN)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={e => setPrice(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-10 pr-5 py-3 text-gray-900 focus:border-primary outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                {unit === 'g' ? 'Pojemność tubki (g/ml)' : 'Ilość w opakowaniu (szt)'}
                            </label>
                            <div className="relative">
                                <Scale size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="number"
                                    placeholder={unit === 'g' ? "np. 60" : "np. 1"}
                                    value={baseWeight}
                                    onChange={e => setBaseWeight(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-10 pr-5 py-3 text-gray-900 focus:border-primary outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                {unit === 'g' ? 'Stan Aktualny (g/ml)' : 'Stan Aktualny (szt)'}
                            </label>
                            <div className="relative">
                                <Box size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="number"
                                    placeholder={unit === 'g' ? "Pozostaw puste aby użyć pełnej tubki" : "np. 10"}
                                    value={currentStock}
                                    onChange={e => setCurrentStock(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-10 pr-5 py-3 text-gray-900 border-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-5 flex justify-end gap-3">
                            {editingProduct && (
                                <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-8 py-3 rounded-2xl font-black hover:bg-gray-200 transition-all">
                                    Anuluj
                                </button>
                            )}
                            <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all">
                                {editingProduct ? 'Zaktualizuj Produkt' : 'Zapisz w Magazynie'}
                            </button>
                        </div>
                    </form>
                </div>
            )
            }

            {/* Products List */}
            <div className="bg-surface rounded-3xl border border-border-color shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden transition-colors">
                <div className="p-6 border-b border-border-color bg-background/50 flex justify-between items-center transition-colors">
                    <h3 className="text-sm font-black text-text-muted uppercase tracking-widest">Twoje Produkty</h3>
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            placeholder="Szukaj produktu..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-color rounded-xl pl-10 pr-4 py-2 text-xs focus:border-primary outline-none text-text-main transition-colors"
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Produkt</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Marka</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">Stan Magazynowy</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">Przewidywany Koniec</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">Koszt/1g</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts?.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                <Box size={16} />
                                            </div>
                                            <span className="font-bold text-gray-900">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-500 font-medium">{product.brand || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-black ${((product as any).current_stock || product.currentStock) < (((product as any).base_weight || product.baseWeight) * 0.2) ? 'text-red-500' : 'text-gray-900'}`}>
                                                    {Math.round((product as any).current_stock || product.currentStock)}{product.unit || 'g'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">/ {((product as any).base_weight || product.baseWeight)}{product.unit || 'g'}</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${((product as any).current_stock || product.currentStock) < (((product as any).base_weight || product.baseWeight) * 0.2) ? 'bg-red-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, (((product as any).current_stock || product.currentStock) / ((product as any).base_weight || product.baseWeight)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {predictions[product.id!]?.date ? (
                                            <div className={`flex flex-col items-center ${predictions[product.id!]?.reason === 'upcoming' ? 'text-orange-500' : 'text-gray-400'}`}>
                                                <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-tight">
                                                    {predictions[product.id!]?.reason === 'upcoming' ? <TrendingDown size={14} /> : <TrendingDown size={14} className="opacity-30" />}
                                                    {format(predictions[product.id!]!.date!, 'dd.MM.yyyy')}
                                                </div>
                                                <span className="text-[9px] font-black opacity-50">
                                                    {predictions[product.id!]?.reason === 'upcoming' ? 'WG TERMINARZA' : 'WG HISTORII'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] font-bold">BRAK DANYCH</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-primary font-bold text-xs">
                                            {(((product as any).price || product.price) / ((product as any).base_weight || product.baseWeight)).toFixed(2)} PLN
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 transition-opacity">
                                            <button
                                                onClick={() => handleReplenish(product)}
                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                title="Uzupełnij stan"
                                            >
                                                <RefreshCcw size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(product)}
                                                className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                title="Edytuj"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => product.id && handleDelete(product.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Usuń"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium font-bold">
                                        Nie znaleziono produktów.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default ProductsPage;
