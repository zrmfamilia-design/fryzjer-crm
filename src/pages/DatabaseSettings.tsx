import React, { useState } from 'react';
import { db } from '../db';
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import MigrationTool from '../components/MigrationTool';

const DatabaseSettings: React.FC = () => {
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleExport = async () => {
        try {
            const data = {
                clients: await db.clients.toArray(),
                services: await db.services.toArray(),
                visits: await db.visits.toArray(),
                expenses: await db.expenses.toArray(),
                exportDate: new Date().toISOString(),
                version: 2
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SalonDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            setStatus({ type: 'success', msg: 'Baza została pomyślnie wyeksportowana!' });
        } catch (err: any) {
            setStatus({ type: 'error', msg: `Błąd eksportu: ${err.message}` });
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('UWAGA! Import bazy zastąpi wszystkie obecne dane. Czy na pewno chcesz kontynuować?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);

                // Nuclear reset
                await db.transaction('rw', [db.clients, db.services, db.visits, db.expenses], async () => {
                    await db.clients.clear();
                    await db.services.clear();
                    await db.visits.clear();
                    await db.expenses.clear();

                    if (data.clients) await db.clients.bulkAdd(data.clients);
                    if (data.services) await db.services.bulkAdd(data.services);
                    if (data.visits) await db.visits.bulkAdd(data.visits);
                    if (data.expenses) await db.expenses.bulkAdd(data.expenses);
                });

                setStatus({ type: 'success', msg: 'Dane zostały pomyślnie przywrócone!' });
                setTimeout(() => window.location.reload(), 2000);
            } catch (err: any) {
                setStatus({ type: 'error', msg: `Błąd importu: ${err.message}` });
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full p-8 max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary/10 p-4 rounded-2xl">
                        <Database className="text-primary" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Ustawienia Bazy Danych</h1>
                        <p className="text-gray-400 font-medium">Zarządzaj bezpieczeństwem swoich danych.</p>
                    </div>
                </div>

                {status && (
                    <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 font-bold border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        {status.msg}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export Section */}
                    <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-primary/20 transition-all group">
                        <Download size={40} className="text-primary mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-lg font-black text-gray-900 mb-2">Eksport Danych</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Pobierz kopię zapasową całej bazy (klienci, wizyty, usługi) do jednego bezpiecznego pliku.</p>
                        <button
                            onClick={handleExport}
                            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                        >
                            <Download size={20} /> Eksportuj do JSON
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-red-200 transition-all group">
                        <Upload size={40} className="text-red-500 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-lg font-black text-gray-900 mb-2">Import Danych</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Wgraj poprzednio pobrany plik kopii zapasowej. <span className="text-red-500">Uwaga: Zastępuje obecne dane!</span></p>
                        <label className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-red-500 text-gray-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-red-50/50">
                            <Upload size={20} /> Wybierz plik
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            <MigrationTool />

            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                <AlertTriangle className="text-amber-500 flex-none" size={24} />
                <div className="text-amber-800 text-sm font-medium leading-relaxed">
                    <p className="font-black mb-1">Rekomendacja:</p>
                    Pobieraj kopię zapasową przynajmniej raz w tygodniu i trzymaj ją na zewnętrznym dysku lub w chmurze (Google Drive/Dropbox). Dzięki temu Twoja baza klientów będzie bezpieczna nawet w przypadku awarii przeglądarki.
                </div>
            </div>
        </div>
    );
};

export default DatabaseSettings;
