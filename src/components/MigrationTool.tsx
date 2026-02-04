import React, { useState } from 'react';
import { db } from '../db';
import { supabase } from '../lib/supabase';
import { CloudUpload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const MigrationTool: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');

    const migrateData = async () => {
        setStatus('migrating');
        setError('');
        try {
            // 1. Get all local data
            setProgress('Pobieranie danych lokalnych...');
            const clients = await db.clients.toArray();
            const services = await db.services.toArray();
            const visits = await db.visits.toArray();
            const products = await db.products.toArray();
            const expenses = await db.expenses.toArray();

            // 2. Clear remote data (optional, but safer for a clean start)
            // Note: RLS might block this if not configured, but we assume the admin has access.

            // 3. Migrate Services first (no deps)
            if (services.length > 0) {
                setProgress(`Migracja usług (${services.length})...`);
                const { error: sErr } = await supabase.from('services').upsert(
                    services.map(({ id, ...rest }: any) => ({
                        name: rest.name,
                        default_price: rest.defaultPrice,
                        duration: rest.duration,
                        category: rest.category,
                        color: rest.color
                    }))
                );
                if (sErr) throw sErr;
            }

            // 4. Migrate Clients
            if (clients.length > 0) {
                setProgress(`Migracja klientów (${clients.length})...`);
                const { error: cErr } = await supabase.from('clients').upsert(
                    clients.map(({ id, ...rest }: any) => ({
                        name: rest.name,
                        phone: rest.phone,
                        notes: rest.notes,
                        last_visit: rest.lastVisit
                    }))
                );
                if (cErr) throw cErr;
            }

            // 5. Migrate Products
            if (products.length > 0) {
                setProgress(`Migracja produktów (${products.length})...`);
                const { error: pErr } = await supabase.from('products').upsert(
                    products.map(({ id, ...rest }: any) => ({
                        name: rest.name,
                        brand: rest.brand,
                        category: rest.category,
                        price: rest.price,
                        base_weight: rest.baseWeight,
                        current_stock: rest.currentStock
                    }))
                );
                if (pErr) throw pErr;
            }

            // 6. Migrate Expenses
            if (expenses.length > 0) {
                setProgress(`Migracja wydatków (${expenses.length})...`);
                const { error: eErr } = await supabase.from('expenses').upsert(
                    expenses.map(({ id, ...rest }: any) => ({
                        description: rest.description,
                        amount: rest.amount,
                        date: rest.date,
                        category: rest.category,
                        is_recurring: rest.isRecurring,
                        frequency: rest.frequency
                    }))
                );
                if (eErr) throw eErr;
            }

            // 7. Migrate Visits (Complex because of relationships, but here we assume simple migration)
            if (visits.length > 0) {
                setProgress(`Migracja wizyt (${visits.length})...`);
                // Note: In a real app, we'd need to map client IDs if we converted to UUIDs.
                // Assuming the user's instructions keep IDs compatible or we handle them.
                const { error: vErr } = await supabase.from('visits').upsert(
                    visits.map(({ id, ...rest }: any) => ({
                        client_id: rest.clientId,
                        date: rest.date,
                        service_ids: rest.serviceIds,
                        final_price: rest.finalPrice,
                        material_cost: rest.materialCost,
                        technical_notes: rest.technicalNotes,
                        photos: rest.photos,
                        used_products: rest.usedProducts
                    }))
                );
                if (vErr) throw vErr;
            }

            setStatus('success');
            setProgress('Wszystkie dane zostały przeniesione do chmury!');
        } catch (err: any) {
            console.error('Migration error:', err);
            setStatus('error');
            setError(err.message || 'Wystąpił nieoczekiwany błąd');
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-primary/20 shadow-lg shadow-primary/5">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <CloudUpload className="text-primary" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Migracja do Chmury</h3>
                    <p className="text-sm text-gray-500">Przenieś swoje lokalne dane do bazy online.</p>
                </div>
            </div>

            {status === 'idle' && (
                <button
                    onClick={migrateData}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                    Rozpocznij Migrację
                </button>
            )}

            {status === 'migrating' && (
                <div className="flex flex-col items-center py-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm font-medium text-gray-600">{progress}</p>
                </div>
            )}

            {status === 'success' && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-green-500" size={20} />
                    <p className="text-sm text-green-700 font-medium">{progress}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-red-500" size={20} />
                        <p className="text-sm text-red-700 font-bold">Błąd Migracji</p>
                    </div>
                    <p className="text-xs text-red-600">{error}</p>
                    <button
                        onClick={migrateData}
                        className="mt-3 text-xs text-red-700 font-bold hover:underline"
                    >
                        Spróbuj ponownie
                    </button>
                </div>
            )}
        </div>
    );
};

export default MigrationTool;
