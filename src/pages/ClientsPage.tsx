import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Client } from '../types';
import { Search, UserPlus, Phone, DollarSign, Calendar as CalendarIcon, FileText, Info, Upload, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ensureDate } from '../utils';

import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const ClientsPage: React.FC = () => {
    const { data: clients } = useSupabaseData<Client>('clients');
    const { data: visits } = useSupabaseData<any>('visits');

    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handle initial client selection from URL
    useEffect(() => {
        const idParam = searchParams.get('id');
        if (idParam && clients) {
            const client = clients.find(c => String(c.id) === String(idParam));
            if (client) {
                openClientProfile(client);
            }
        }
    }, [clients, searchParams]);

    // New/Edit Client State
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editNotes, setEditNotes] = useState('');

    const filteredClients = clients?.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    ).sort((a, b) => a.name.localeCompare(b.name));

    const validatePhone = (phone: string) => {
        const regex = /^\+48\d{9}$/;
        return regex.test(phone);
    };

    const handleSaveClient = async () => {
        if (!editName) return alert('Imię i nazwisko jest wymagane.');
        if (!validatePhone(editPhone)) return alert('Numer telefonu musi zaczynać się od +48 i składać się z 9 cyfr po prefiksie.');

        if (selectedClient && selectedClient.id) {
            const { error } = await supabase.from('clients').update({
                name: editName,
                phone: editPhone,
                notes: editNotes
            }).eq('id', selectedClient.id);

            if (error) return alert(`Błąd aktualizacji: ${error.message}`);
            setSelectedClient({ ...selectedClient, name: editName, phone: editPhone, notes: editNotes });
        } else {
            const { error } = await supabase.from('clients').insert([{
                name: editName,
                phone: editPhone,
                notes: editNotes
            }]);

            if (error) return alert(`Błąd dodawania: ${error.message}`);
        }
        setIsEditing(false);
        setEditName('');
        setEditPhone('');
        setEditNotes('');
        if (!selectedClient) setSelectedClient(null);
    };

    const openNewClient = () => {
        setSelectedClient(null);
        setEditName('');
        setEditPhone('+48');
        setEditNotes('');
        setIsEditing(true);
    };

    const openClientProfile = (client: Client) => {
        setSelectedClient(client);
        setEditName(client.name);
        setEditPhone(client.phone);
        setEditNotes(client.notes);
        setIsEditing(false);
        // On mobile, scroll to top when opening profile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculate LTV & History
    const clientVisits = visits?.filter(v => (v.client_id || v.clientId) === selectedClient?.id).sort((a, b) => {
        const dateA = ensureDate(a.date);
        const dateB = ensureDate(b.date);
        return dateB.getTime() - dateA.getTime();
    }) || [];
    const ltv = clientVisits.reduce((sum, v) => sum + (v.final_price || v.finalPrice || 0), 0);

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newClients: Client[] = [];

            // Header: Nazwisko i Imię,Telefon,Notatki
            const startIdx = lines[0].toLowerCase().includes('imię') || lines[0].toLowerCase().includes('name') ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                let [cName, cPhone, cNotes] = line.split(',').map(s => s.trim());
                if (cName && cPhone) {
                    // Normalize phone: if it doesn't start with +, assume it needs +48
                    if (!cPhone.startsWith('+')) {
                        cPhone = '+48' + cPhone.replace(/\D/g, '');
                    }

                    if (validatePhone(cPhone)) {
                        newClients.push({
                            name: cName,
                            phone: cPhone,
                            notes: cNotes || '',
                            lastVisit: undefined
                        });
                    }
                }
            }

            if (newClients.length > 0) {
                if (confirm(`Czy chcesz zaimportować ${newClients.length} klientów?`)) {
                    const { error } = await supabase.from('clients').insert(
                        newClients.map((client: any) => ({
                            name: client.name,
                            phone: client.phone,
                            notes: client.notes
                        }))
                    );
                    if (error) return alert(`Błąd importu: ${error.message}`);
                    alert('Import zakończony sukcesem!');
                }
            } else {
                alert('Nie znaleziono prawidłowych danych w pliku. Upewnij się, że format to: Imię i Nazwisko, Telefon, Notatki');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadCSVTemplate = () => {
        const header = "Imię i Nazwisko,Telefon,Notatki\n";
        const example = "Anna Nowak,789456123,Preferuje ciepłe odcienie\nJan Kowalski,+48500100200,Strzyżenie maszynką 6mm";
        const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "wzor_klientow.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-full flex flex-col lg:flex-row gap-0 lg:gap-8 p-0 lg:p-8">
            {/* Left: Client List */}
            <div className={cn(
                "flex-1 flex flex-col bg-white lg:rounded-3xl border-b lg:border border-gray-100 shadow-xl shadow-gray-200/50 lg:overflow-hidden pb-20 lg:pb-0",
                (selectedClient || isEditing) ? "hidden lg:flex" : "flex min-h-[500px]"
            )}>
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col gap-4 sm:gap-6 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Baza Klientów</h2>
                            <p className="text-xs text-gray-400 font-medium">Zarządzaj swoją listą kontaktów.</p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                onChange={handleCSVImport}
                                className="hidden"
                            />
                            <button onClick={downloadCSVTemplate} title="Pobierz wzór CSV" className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-primary rounded-2xl transition-all shadow-sm">
                                <Download size={20} />
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} title="Importuj z CSV" className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-primary rounded-2xl transition-all shadow-sm">
                                <Upload size={20} />
                            </button>
                            <button onClick={openNewClient} className="bg-primary hover:bg-primary-hover text-white p-3 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
                                <UserPlus size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Szukaj po nazwie lub telefonie..."
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-gray-900 font-medium outline-none focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                    {filteredClients?.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10 opacity-50">
                            <Search size={48} className="mb-2" />
                            <p>Brak wyników wyszukiwania.</p>
                        </div>
                    )}
                    {filteredClients?.map((client, cIdx) => (
                        <div
                            key={client.id || cIdx}
                            onClick={() => openClientProfile(client)}
                            className={`p-4 rounded-2xl cursor-pointer flex justify-between items-center transition-all group
                                ${selectedClient?.id === client.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1'
                                    : 'hover:bg-gray-50 text-gray-600 hover:translate-x-1 border border-transparent hover:border-gray-100'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs
                                    ${selectedClient?.id === client.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}
                                `}>
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className={`font-bold ${selectedClient?.id === client.id ? 'text-white' : 'text-gray-900'}`}>{client.name}</div>
                                    <div className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 opacity-70`}>
                                        <Phone size={10} /> {client.phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Client Profile / Edit Form */}
            <div className={cn(
                "flex-[2] bg-white lg:rounded-3xl lg:border border-gray-100 shadow-2xl shadow-gray-200/50 lg:overflow-hidden flex flex-col pb-20 lg:pb-0",
                (!selectedClient && !isEditing) ? "hidden lg:flex opacity-30" : "flex min-h-[500px]"
            )}>
                {(isEditing || selectedClient) ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (isEditing && selectedClient) setIsEditing(false);
                                        else setSelectedClient(null);
                                        setIsEditing(false);
                                    }}
                                    className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                                        {isEditing ? (selectedClient ? 'Edycja Klienta' : 'Nowy Klient') : selectedClient?.name}
                                    </h1>
                                    <p className="text-gray-400 text-[10px] sm:text-sm font-medium">Informacje szczegółowe i historia wizyt.</p>
                                </div>
                            </div>
                            <div className="flex gap-1 sm:gap-2">
                                {!isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition-all text-xs sm:text-sm whitespace-nowrap">
                                        Edytuj Profil
                                    </button>
                                )}
                                {isEditing && (
                                    <button onClick={() => { setIsEditing(false); if (!selectedClient?.id) setSelectedClient(null); }} className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-gray-400 font-bold hover:text-red-500 transition-all text-xs sm:text-sm whitespace-nowrap">
                                        Anuluj
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="p-8 space-y-8 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Imię i Nazwisko</label>
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            placeholder="np. Anna Nowak"
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                                            <span>Telefon</span>
                                            {editPhone && !validatePhone(editPhone) && <span className="text-red-400 normal-case font-bold flex items-center gap-1"><Info size={10} /> Niepoprawny format</span>}
                                        </label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                value={editPhone}
                                                onChange={e => setEditPhone(e.target.value)}
                                                placeholder="+48123456789"
                                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-gray-900 font-bold focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">Wymagany prefiks +48 oraz 9 cyfr.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Notatki (Receptury, preferencje)</label>
                                    <textarea
                                        rows={6}
                                        value={editNotes}
                                        onChange={e => setEditNotes(e.target.value)}
                                        placeholder="Pisz śmiało..."
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-medium focus:border-primary focus:bg-white outline-none transition-all resize-none"
                                    />
                                </div>
                                <button onClick={handleSaveClient} className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 font-black text-lg transition-all hover:-translate-y-1 active:translate-y-0">
                                    Zapisz Profil
                                </button>
                            </div>
                        ) : (
                            selectedClient && (
                                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10 scrollbar-hide font-sans">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <div className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LTV (Suma wydana)</div>
                                            <div className="text-2xl sm:text-3xl text-gray-900 font-black flex items-center gap-1">
                                                <DollarSign className="text-primary w-5 h-5 sm:w-[24px] sm:h-[24px]" /> {ltv} <span className="text-xs sm:text-sm font-bold text-gray-400">PLN</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <div className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ostatnia wizyta</div>
                                            <div className="text-xl sm:text-2xl text-gray-900 font-black flex items-center gap-2">
                                                <CalendarIcon className="text-blue-500 w-4.5 h-4.5 sm:w-[20px] sm:h-[20px]" />
                                                {selectedClient.lastVisit ? format(ensureDate(selectedClient.lastVisit), 'dd.MM.yyyy') : <span className="text-gray-300">Brak</span>}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <div className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kontakt</div>
                                            <div className="text-lg sm:text-xl text-gray-900 font-black flex items-center gap-2">
                                                <Phone className="text-green-500 w-4.5 h-4.5 sm:w-[20px] sm:h-[20px]" />
                                                {selectedClient.phone}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Two Columns Layout */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Left: Notes */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={16} className="text-primary" /> Notatki Techniczne
                                            </h3>
                                            <div className="bg-white p-6 rounded-3xl border-2 border-gray-50 text-gray-700 font-medium min-h-[200px] whitespace-pre-wrap leading-relaxed shadow-inner">
                                                {selectedClient.notes || <span className="text-gray-300 italic">Brak notatek dla tego klienta.</span>}
                                            </div>
                                        </div>

                                        {/* Right: History */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                <CalendarIcon size={16} className="text-primary" /> Historia Wizyt
                                            </h3>
                                            <div className="space-y-3">
                                                {clientVisits.length === 0 && <div className="text-gray-300 italic py-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">Brak zarejestrowanych wizyt.</div>}
                                                {clientVisits.map(visit => {
                                                    const vDate = ensureDate(visit.date);
                                                    const visitServices = (visit.service_ids || visit.serviceIds || []).map((sid: any) => {
                                                        const s = (visits as any[]).find(v => v.id === sid); // This is wrong, should be from services
                                                        return s?.name;
                                                    }).filter(Boolean).join(', ');

                                                    return (
                                                        <div key={visit.id} className="flex justify-between items-center p-5 bg-white rounded-3xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-default">
                                                            <div className="flex items-center gap-5">
                                                                <div className="flex flex-col items-center justify-center bg-gray-50 group-hover:bg-primary group-hover:text-white transition-colors w-14 h-14 rounded-2xl border border-gray-100 group-hover:border-primary text-center">
                                                                    <div className="text-xl font-black leading-none">{format(vDate, 'dd')}</div>
                                                                    <div className="text-[9px] font-black uppercase tracking-widest">{format(vDate, 'MMM', { locale: pl })}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-900 font-black">Wizyta - {format(vDate, 'HH:mm', { locale: pl })}</div>
                                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block max-w-[200px] truncate">
                                                                        {visitServices || visit.technicalNotes || visit.technical_notes || 'Brak notatek'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-gray-900 font-black text-base sm:text-lg">{visit.finalPrice || visit.final_price || 0} PLN</div>
                                                                <div className="text-[8px] sm:text-[10px] text-red-400 font-bold uppercase tracking-widest">Koszt: {visit.materialCost || visit.material_cost || 0} PLN</div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                        <div className="bg-gray-50 p-10 rounded-full mb-6 border-2 border-white shadow-inner">
                            <UserPlus size={64} className="opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Profil Klienta</h3>
                        <p className="max-w-xs font-medium">Wybierz osobę z bazy danych po lewej stronie, aby zobaczyć jej historię lub notatki techniczne.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientsPage;
