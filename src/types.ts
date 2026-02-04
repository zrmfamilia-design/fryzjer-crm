export interface Client {
    id?: number;
    name: string;
    phone: string;
    notes: string;
    lastVisit?: Date;
}

export type ServiceType = 'Koloryzacja' | 'Dekoloryzacja' | 'Strzyżenie' | 'Kuracja' | 'Inne';

export interface Service {
    id?: number;
    name: ServiceType;
    defaultPrice: number;
    duration: number; // in minutes
    color?: string;
}

export interface Product {
    id?: number;
    name: string;
    brand: string;
    price: number;
    baseWeight: number; // e.g. 60g tube
    currentStock: number; // in grams/ml
}

export interface UsedProduct {
    productId: number;
    amountUsed: number; // in grams/ml
    calculatedCost: number;
}

export interface Visit {
    id?: number;
    clientId: number;
    date: Date;
    serviceIds: number[]; // Array of Service IDs
    finalPrice: number;
    materialCost: number;
    technicalNotes?: string;
    photos?: string[]; // Base64 strings
    usedProducts?: UsedProduct[];
}

export type ExpenseCategory = 'Czynsz' | 'Energia/Woda' | 'Produkty' | 'Marketing' | 'Podatki/ZUS' | 'Inne';

export interface Expense {
    id?: number;
    category: ExpenseCategory;
    amount: number;
    date: Date;
    description: string;
    isRecurring?: boolean;
}
