import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Phone, Calendar as CalendarIcon, Info, FileText, Camera, Trash2, Plus, Package, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { UsedProduct } from '../types';

interface VisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
    visitId?: string | number;
}

const VisitModal: React.FC<VisitModalProps> = ({ isOpen, onClose, initialDate, visitId }) => {
    const { data: clients } = useSupabaseData<any>('clients');
    const { data: services } = useSupabaseData<any>('services');
    const { data: products } = useSupabaseData<any>('products');
    const [existingVisit, setExistingVisit] = useState<any>(null);

    useEffect(() => {
        if (visitId && isOpen) {
            supabase.from('visits').select('*').eq('id', visitId).single().then(({ data }) => {
                if (data) setExistingVisit(data);
            });
        } else {
            setExistingVisit(null);
        }
    }, [visitId, isOpen]);

    const [date, setDate] = useState('');
    const [clientId, setClientId] = useState<string | number | ''>('');
    const [serviceIds, setServiceIds] = useState<number[]>([]);
    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [materialCost, setMaterialCost] = useState<number>(0);
    const [technicalNotes, setTechnicalNotes] = useState('');
    const [clientGlobalNotes, setClientGlobalNotes] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [usedProducts, setUsedProducts] = useState<UsedProduct[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const productDropdownRef = useRef<HTMLDivElement>(null);

    // New Client Mode
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    // Load existing visit or initial date
    useEffect(() => {
        if (visitId && existingVisit) {
            setDate(format(new Date(existingVisit.date), "yyyy-MM-dd'T'HH:mm"));
            setClientId(existingVisit.client_id || existingVisit.clientId);
            setServiceIds(existingVisit.service_ids || existingVisit.serviceIds || []);
            setFinalPrice(existingVisit.final_price || existingVisit.finalPrice);
            setMaterialCost(existingVisit.material_cost || existingVisit.materialCost);
            setTechnicalNotes(existingVisit.technical_notes || existingVisit.technicalNotes || '');
            setPhotos(existingVisit.photos || []);
            setUsedProducts(existingVisit.used_products || existingVisit.usedProducts || []);
            setIsNewClient(false);

            // Fetch client specific notes
            const cId = existingVisit.client_id || existingVisit.clientId;
            supabase.from('clients').select('notes').eq('id', cId).single().then(({ data }) => setClientGlobalNotes(data?.notes || ''));
        } else {
            setDate(initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"));
            setClientId('');
            setServiceIds([]);
            setFinalPrice(0);
            setMaterialCost(0);
            setTechnicalNotes('');
            setClientGlobalNotes('');
            setPhotos([]);
            setUsedProducts([]);
            setIsNewClient(false);
        }
    }, [visitId, existingVisit, initialDate, isOpen]);

    // Auto-calculate price when service changes (only for new visits or if user selects more)
    useEffect(() => {
        if (!services || visitId) return;
        const selectedServices = (services as any[]).filter(s => serviceIds.includes(s.id!));
        const total = selectedServices.reduce((sum, s) => sum + (s.default_price || s.defaultPrice || 0), 0);
        setFinalPrice(total);
    }, [serviceIds, services, visitId]);

    // Load client global notes on selection
    useEffect(() => {
        if (clientId && !isNewClient) {
            const client = clients?.find(c => c.id === clientId);
            if (client) setClientGlobalNotes(client.notes || '');
        }
    }, [clientId, isNewClient, clients]);

    // Close product dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-calculate material cost when products change
    useEffect(() => {
        if (!usedProducts) return;
        const totalProductCost = usedProducts.reduce((sum, p) => sum + (p.calculatedCost || 0), 0);
        setMaterialCost(Math.round(totalProductCost * 100) / 100);
    }, [usedProducts]);

    const handleAddUsedProduct = (productId: number) => {
        const product = products?.find(p => p.id === productId);
        if (!product) return;

        setShowProductDropdown(false);
        setProductSearch('');

        const isUnit = product.unit === 'szt';
        const promptMsg = isUnit
            ? `Ile sztuk produktu "${product.name}" sprzedajesz/używasz?`
            : `Ile gram/ml wykorzytałaś produktu: ${product.name}?`;

        const amountStr = prompt(promptMsg, isUnit ? "1" : "30");
        if (!amountStr) return;

        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) return alert('Podaj prawidłową ilość');

        let cost = 0;
        if (isUnit) {
            cost = amount * product.price;
            // For unit products (sales), we ADD IT to the final price automatically
            setFinalPrice(prev => Number(prev) + cost);
        } else {
            cost = (amount / (product.base_weight || product.baseWeight)) * product.price;
        }

        setUsedProducts(prev => [
            ...prev,
            {
                productId,
                amountUsed: amount,
                calculatedCost: Math.round(cost * 100) / 100,
                name: product.name,
                unit: product.unit || 'g'
            }
        ]);
    };

    const handleRemoveUsedProduct = (index: number) => {
        const item = usedProducts[index];
        if (item && item.unit === 'szt') {
            setFinalPrice(prev => Math.max(0, Number(prev) - (item.calculatedCost || 0)));
        }
        setUsedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleServiceToggle = (id: number) => {
        setServiceIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, reader.result as string].slice(0, 4)); // Limit to 4 photos
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the input so the same file can be selected again
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const validatePhone = (phone: string) => {
        if (!phone) return true; // Allow empty
        const regex = /^\+48\d{9}$/;
        return regex.test(phone);
    };

    const handleDelete = async () => {
        if (!visitId || !existingVisit) return;
        if (!confirm('Czy na pewno chcesz usunąć tę wizytę? Tej operacji nie można cofnąć.')) return;

        try {
            // Restore product stock
            const oldUsed = existingVisit.used_products || existingVisit.usedProducts || [];
            for (const oldProd of oldUsed) {
                const p = products?.find(prod => prod.id === (oldProd.productId || oldProd.product_id));
                if (p) {
                    const cur = p.current_stock || p.currentStock || 0;
                    await supabase.from('products').update({
                        current_stock: cur + oldProd.amountUsed
                    }).eq('id', (oldProd.productId || oldProd.product_id));
                }
            }

            // Delete visit
            const { error } = await supabase.from('visits').delete().eq('id', visitId);
            if (error) throw error;

            handleClose();
        } catch (err: any) {
            console.error(err);
            alert(`Błąd usuwania: ${err.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let finalClientId = clientId;
            const visitDate = new Date(date);

            if (isNaN(visitDate.getTime())) return alert('Nieprawidłowa data');
            if (serviceIds.length === 0) return alert('Wybierz przynajmniej jedną usługę');

            if (isNewClient) {
                if (!newClientName) return alert('Podaj imię klienta');
                if (newClientPhone && !validatePhone(newClientPhone)) return alert('Numer telefonu musi zaczynać się od +48 i zawierać 9 cyfr.');

                const { data: newClient, error: clientErr } = await supabase.from('clients').insert({
                    name: newClientName,
                    phone: newClientPhone,
                    notes: clientGlobalNotes,
                    last_visit: visitDate
                }).select().single();

                if (clientErr) {
                    alert(`Błąd dodawania klienta: ${clientErr.message}`);
                    throw clientErr;
                }
                finalClientId = newClient.id;
            } else {
                if (!finalClientId) return alert('Wybierz klienta');
                const { error: clientUpdErr } = await supabase.from('clients').update({
                    last_visit: visitDate,
                    notes: clientGlobalNotes
                }).eq('id', finalClientId);
                if (clientUpdErr) {
                    alert(`Błąd aktualizacji klienta: ${clientUpdErr.message}`);
                    throw clientUpdErr;
                }
            }

            const visitData = {
                client_id: finalClientId,
                date: visitDate,
                service_ids: serviceIds,
                final_price: Number(finalPrice),
                material_cost: Number(materialCost),
                technical_notes: technicalNotes,
                photos: photos,
                used_products: usedProducts
            };

            // Check if client already has a visit on this day
            let existingDayVisit = null;
            if (!visitId && finalClientId) {
                const dayStart = new Date(visitDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(visitDate);
                dayEnd.setHours(23, 59, 59, 999);

                const { data: found } = await supabase
                    .from('visits')
                    .select('*')
                    .eq('client_id', finalClientId)
                    .gte('date', dayStart.toISOString())
                    .lte('date', dayEnd.toISOString())
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 or >1 (though >1 shouldn't happen ideally, if so we take one)

                existingDayVisit = found;
            }

            if (existingDayVisit) {
                // MERGE with existing visit
                const confirmMerge = confirm('Ten klient ma już wizytę w tym dniu. Czy chcesz dołączyć te usługi do istniejącej wizyty?');
                if (confirmMerge) {
                    const mergedServices = [...(existingDayVisit.service_ids || existingDayVisit.serviceIds || []), ...serviceIds];
                    // Filter duplicates? Maybe user WANTS 2 cuts? Let's keep them unless exactly same? 
                    // Usually distinct services. Let's make them unique just in case.
                    const uniqueServices = Array.from(new Set(mergedServices));

                    const mergedPrice = (existingDayVisit.final_price || existingDayVisit.finalPrice || 0) + Number(finalPrice);
                    const mergedCost = (existingDayVisit.material_cost || existingDayVisit.materialCost || 0) + Number(materialCost);

                    // Helper to normalize used products
                    const normalize = (up: any) => ({ productId: up.productId || up.product_id, amountUsed: up.amountUsed, calculatedCost: up.calculatedCost });
                    const oldUsed = (existingDayVisit.used_products || existingDayVisit.usedProducts || []).map(normalize);
                    const newUsed = usedProducts.map(normalize);
                    const mergedProducts = [...oldUsed, ...newUsed];

                    const mergedNotes = [existingDayVisit.technical_notes, technicalNotes].filter(Boolean).join('\n---\n');
                    const mergedPhotos = [...(existingDayVisit.photos || []), ...photos];

                    const updateData = {
                        service_ids: uniqueServices,
                        final_price: mergedPrice,
                        material_cost: mergedCost,
                        technical_notes: mergedNotes,
                        photos: mergedPhotos,
                        used_products: mergedProducts
                        // Keep original date/time of the first visit? Or update to latest? 
                        // Usually keep original time, just add services.
                    };

                    const { error: mergeErr } = await supabase.from('visits').update(updateData).eq('id', existingDayVisit.id);
                    if (mergeErr) {
                        alert(`Błąd łączenia wizyt: ${mergeErr.message}`);
                        throw mergeErr;
                    }
                } else {
                    // User said NO, create separate visit
                    const { error: visitInsErr } = await supabase.from('visits').insert([visitData]);
                    if (visitInsErr) {
                        alert(`Błąd dodawania wizyty: ${visitInsErr.message}`);
                        throw visitInsErr;
                    }
                }
            } else if (visitId && existingVisit) {
                // Refund old products stock
                const oldUsed = existingVisit.used_products || existingVisit.usedProducts || [];
                for (const oldProd of oldUsed) {
                    const p = products?.find(prod => prod.id === (oldProd.productId || oldProd.product_id));
                    if (p) {
                        const cur = p.current_stock || p.currentStock || 0;
                        await supabase.from('products').update({
                            current_stock: cur + oldProd.amountUsed
                        }).eq('id', (oldProd.productId || oldProd.product_id));
                    }
                }
                const { error: visitUpdErr } = await supabase.from('visits').update(visitData).eq('id', visitId);
                if (visitUpdErr) {
                    alert(`Błąd aktualizacji wizyty: ${visitUpdErr.message}`);
                    throw visitUpdErr;
                }
            } else {
                const { error: visitInsErr } = await supabase.from('visits').insert([visitData]);
                if (visitInsErr) {
                    alert(`Błąd dodawania wizyty: ${visitInsErr.message}`);
                    throw visitInsErr;
                }
            }

            // Deduct new products stock
            for (const newProd of (usedProducts || [])) {
                const p = products?.find(prod => prod.id === newProd.productId);
                if (p) {
                    const cur = p.current_stock || p.currentStock;
                    await supabase.from('products').update({
                        current_stock: Math.max(0, cur - newProd.amountUsed)
                    }).eq('id', newProd.productId);
                }
            }

            handleClose();
        } catch (err) {
            console.error(err);
            alert('Błąd podczas zapisywania wizyty');
        }
    };

    const handleWhatsAppReminder = () => {
        if (isNewClient || !clientId) return alert('Wybierz klienta z listy');
        const client = clients?.find(c => c.id === clientId);
        if (!client || !client.phone) return alert('Klient nie ma numeru telefonu');

        const dateObj = new Date(date);
        const formattedDate = format(dateObj, 'd MMMM', { locale: pl });
        const formattedTime = format(dateObj, 'HH:mm');

        const message = `Cześć ${client.name}! Przypominam o wizycie w Pracowni S.Mazurkiewicz dnia ${formattedDate} o godzinie ${formattedTime}. Do zobaczenia! 👋`;
        const encodedMessage = encodeURIComponent(message);
        const phone = client.phone.replace(/\+/g, ''); // Remove + for wa.me link

        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const handleClose = () => {
        setClientId('');
        setServiceIds([]);
        setFinalPrice(0);
        setIsNewClient(false);
        setNewClientName('');
        setNewClientPhone('');
        onClose();
    };

    if (!isOpen) return null;

    const cn = (...inputs: (string | undefined | null | false)[]) => inputs.filter(Boolean).join(' ');

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300" onClick={handleClose}>
            <div className="bg-surface w-full max-w-xl rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-border-color transition-colors" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-8 border-b border-border-color flex justify-between items-center bg-background/50">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-text-main">{visitId ? 'Edytuj Wizytę' : 'Nowa Wizyta'}</h2>
                        <p className="text-text-muted text-xs sm:text-sm font-medium">Uzupełnij szczegóły rezerwacji.</p>
                    </div>
                    <div className="flex gap-2">
                        {visitId && (
                            <button
                                onClick={handleDelete}
                                className="p-3 bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"
                                title="Usuń wizytę"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={handleClose} className="p-3 bg-surface border border-border-color text-text-muted hover:text-red-500 hover:border-red-100 rounded-2xl transition-all shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
                    {visitId && !isNewClient && (
                        <button
                            onClick={handleWhatsAppReminder}
                            className="w-full p-4 bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.001.332.005c.109.004.253-.041.397.303.145.348.496 1.215.539 1.302.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.289.073.398-.051c.109-.124.462-.536.585-.717.123-.181.246-.152.412-.094.167.058 1.062.5 1.243.593.182.094.303.141.346.215.043.075.043.433-.101.838z" />
                            </svg>
                            <span className="text-sm font-black">Wyślij przypomnienie WhatsApp</span>
                        </button>
                    )}
                    {/* Date Section */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <CalendarIcon size={16} className="text-primary" /> Data i Godzina
                        </label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                    </div>

                    {/* Client Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                <UserPlus size={16} className="text-primary" /> Klient
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsNewClient(!isNewClient)}
                                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1.5"
                            >
                                {isNewClient ? 'Wybierz z listy' : 'Nowy Klient'}
                            </button>
                        </div>

                        {isNewClient ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                                <input
                                    placeholder="Imię i Nazwisko"
                                    value={newClientName}
                                    onChange={e => setNewClientName(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-medium focus:border-primary focus:bg-white outline-none"
                                />
                                <div className="relative">
                                    <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder="+48123456789"
                                        value={newClientPhone}
                                        onChange={e => setNewClientPhone(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-12 py-4 text-gray-900 font-medium focus:border-primary focus:bg-white outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <select
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-primary focus:bg-white outline-none appearance-none cursor-pointer"
                            >
                                <option value="">-- Wybierz klienta --</option>
                                {clients?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                            </select>
                        )}
                        {isNewClient && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 ml-2">
                                <Info size={12} /> Format: +48 oraz 9 cyfr
                            </p>
                        )}
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Usługi
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services?.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleServiceToggle(s.id!)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-sm font-bold flex flex-col gap-1 text-left",
                                        serviceIds.includes(s.id!)
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-primary/30 hover:bg-primary/5'
                                    )}
                                >
                                    <span>{s.name}</span>
                                    <span className={cn("text-[10px] uppercase tracking-widest", serviceIds.includes(s.id!) ? 'text-white/70' : 'text-gray-400')}>
                                        {s.duration} min • {s.defaultPrice} PLN
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Financials Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-background p-5 sm:p-6 rounded-3xl border border-border-color transition-colors">
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-widest">Cena Finalna (PLN)</label>
                            <input
                                type="number"
                                value={finalPrice}
                                onChange={e => setFinalPrice(Number(e.target.value))}
                                className="w-full bg-surface border-2 border-border-color rounded-xl px-4 py-3 text-text-main font-black text-lg sm:text-xl focus:border-primary outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-widest">Koszt Materiałów (PLN)</label>
                            <input
                                type="number"
                                value={materialCost}
                                onChange={e => setMaterialCost(Number(e.target.value))}
                                className="w-full bg-surface border-2 border-border-color rounded-xl px-4 py-3 text-red-500 font-black text-lg sm:text-xl focus:border-red-200 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Paint & Product Calculator */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center relative" ref={productDropdownRef}>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                <Package size={16} className="text-primary" /> Zużyte Produkty
                            </label>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                                    className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Dodaj produkt / farbę
                                </button>

                                {showProductDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[110] p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                            <input
                                                autoFocus
                                                placeholder="Szukaj (nazwa lub marka)..."
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-primary focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {products?.filter(p =>
                                                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                p.brand.toLowerCase().includes(productSearch.toLowerCase())
                                            ).map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleAddUsedProduct(p.id!)}
                                                    className="w-full text-left p-2 hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-between group"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-900 group-hover:text-primary">{p.name}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">{p.brand}</span>
                                                    </div>
                                                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.currentStock}g</span>
                                                </button>
                                            ))}
                                            {products?.filter(p =>
                                                p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                p.brand.toLowerCase().includes(productSearch.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="text-center py-4 text-gray-400 text-xs font-medium">Nie znaleziono produktów</div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {usedProducts.length > 0 ? (
                            <div className="space-y-2">
                                {usedProducts.map((up, idx) => {
                                    const p = products?.find(prod => prod.id === up.productId);
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{p?.name}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-black">{p?.brand}</span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="font-black text-gray-900">{up.amountUsed}g</div>
                                                    <div className="text-[10px] text-primary font-bold">{up.calculatedCost} PLN</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUsedProduct(idx)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                <Package size={24} className="mb-2 opacity-30" />
                                <span className="text-xs font-bold">Brak dodanych produktów</span>
                            </div>
                        )}
                    </div>

                    {/* Technical Notes / Formulation (Visit Specific) */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <FileText size={16} className="text-primary" /> Notatki z Wizyty
                        </label>
                        <textarea
                            value={technicalNotes}
                            onChange={e => setTechnicalNotes(e.target.value)}
                            placeholder="Co zrobiliśmy na tej konkretnej wizycie?"
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-medium focus:border-primary focus:bg-white outline-none resize-none text-sm"
                            rows={2}
                        />
                    </div>

                    {/* Technical Notes (Global Client Formula) */}
                    <div className="space-y-3 bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 shadow-sm animate-in zoom-in-95 duration-300">
                        <label className="flex items-center gap-2 text-sm font-black text-purple-900 uppercase tracking-widest">
                            <Info size={16} className="text-purple-600" /> Karta Techniczna Klienta (Receptura)
                        </label>
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-tight -mt-2">Te informacje zostaną zapisane na stałe w profilu klienta</p>
                        <textarea
                            value={clientGlobalNotes}
                            onChange={e => setClientGlobalNotes(e.target.value)}
                            placeholder="Wpisz odcienie farb, proporcje lub szczególne życzenia klienta..."
                            className="w-full bg-white border-2 border-purple-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-primary outline-none resize-none shadow-inner"
                            rows={4}
                        />
                    </div>

                    {/* Photos */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                                <Camera size={16} className="text-primary" /> Zdjęcia Przed / Po
                            </label>
                            <label className="cursor-pointer text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1.5">
                                <Plus size={14} /> Dodaj Zdjęcia
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    multiple
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {photos.map((photo, pIdx) => (
                                <div key={pIdx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group border border-gray-100">
                                    <img src={photo} alt={`Przed/Po ${pIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(pIdx)}
                                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {photos.length === 0 && (
                                <div className="col-span-4 py-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                                    <Camera size={24} className="mb-2 opacity-30" />
                                    <span className="text-xs font-bold">Brak zdjęć</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 sm:p-8 border-t border-border-color bg-background/50 flex flex-col sm:flex-row gap-3 sm:gap-4 transition-colors">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:flex-1 py-4 px-6 rounded-2xl text-text-muted font-bold hover:bg-background transition-all border border-border-color order-2 sm:order-1"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="w-full sm:flex-[2] bg-primary hover:bg-primary-hover text-white py-4 px-6 rounded-2xl shadow-xl shadow-primary/30 font-black text-lg transition-all active:scale-[0.98] order-1 sm:order-2"
                    >
                        {visitId ? 'Zapisz Zmiany' : 'Zapisz Wizytę'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisitModal;
