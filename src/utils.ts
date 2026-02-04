import { isValid } from 'date-fns';

/**
 * Ensures that the input is a valid Date object.
 * If the input is already a Date, it is returned.
 * If the input is a string, it attempts to parse it.
 * If parsing fails or input is invalid, it returns a fallback Date (default: new Date()).
 */
export const ensureDate = (date: any, fallback: Date = new Date()): Date => {
    if (!date) return fallback;
    if (date instanceof Date) {
        if (isValid(date)) return date;
        return fallback;
    }

    if (typeof date === 'string') {
        const parsed = new Date(date);
        if (isValid(parsed)) return parsed;

        // Try date-fns parseISO for stricter ISO strings if needed, 
        // but new Date() usually handles standard formats well.
    }

    return fallback;
};

/**
 * Safely gets the time from a date-like object.
 */
export const safeGetTime = (date: any): number => {
    const d = ensureDate(date);
    return d.getTime();
};
