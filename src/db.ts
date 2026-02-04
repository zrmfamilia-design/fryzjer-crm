import Dexie, { type Table } from 'dexie';
import type { Client, Service, Visit, Product, Expense } from './types';

export class SalonDatabase extends Dexie {
    clients!: Table<Client>;
    services!: Table<Service>;
    visits!: Table<Visit>;
    expenses!: Table<Expense>;
    products!: Table<Product>;

    constructor() {
        super('SalonDB');
        this.version(4).stores({
            clients: '++id, name, phone',
            services: '++id, name',
            visits: '++id, clientId, date, [date+clientId]',
            expenses: '++id, category, date',
            products: '++id, name, brand'
        }).upgrade(async tx => {
            // Migration: add default colors to existing services if they don't have one
            await tx.table('services').toCollection().modify(s => {
                if (!s.color) {
                    if (s.name === 'Dekoloryzacja') s.color = '#ef4444';
                    else if (s.name === 'Koloryzacja') s.color = '#7c3aed';
                    else if (s.name === 'Strzyżenie') s.color = '#3b82f6';
                    else if (s.name === 'Kuracja') s.color = '#10b981';
                    else s.color = '#f59e0b';
                }
            });

            // Migration from v2 to v3 if needed (Dexie handles versioning, but for clarity)
            await tx.table('products').toCollection().modify(p => {
                if (p.currentStock === undefined) {
                    p.currentStock = p.baseWeight || 0;
                }
            });
        });
    }
}

export const db = new SalonDatabase();

// Seed data
db.on('populate', async () => {
    await db.services.bulkAdd([
        { name: 'Strzyżenie', defaultPrice: 100, duration: 60, color: '#3b82f6' },
        { name: 'Koloryzacja', defaultPrice: 250, duration: 120, color: '#7c3aed' },
        { name: 'Dekoloryzacja', defaultPrice: 350, duration: 180, color: '#ef4444' },
        { name: 'Kuracja', defaultPrice: 150, duration: 45, color: '#10b981' },
        { name: 'Inne', defaultPrice: 50, duration: 30, color: '#f59e0b' },
    ]);
});
