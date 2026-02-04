import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData<T>(table: string) {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: result, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                setError(error);
            } else {
                setData(result as T[]);
            }
            setLoading(false);
        };

        fetchData();

        // Real-time subscription
        const channel = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, (_payload) => {
                // Refresh data on change or optimistically update
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table]);

    return { data, loading, error };
}
