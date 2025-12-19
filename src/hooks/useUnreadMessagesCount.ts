import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Hook to track unread contact messages count with realtime updates.
 * Messages with status = 'new' are considered unread.
 */
export const useUnreadMessagesCount = () => {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Fetch current unread count
    const fetchCount = useCallback(async () => {
        try {
            const { count: unreadCount, error } = await supabase
                .from('contact_messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            if (error) {
                console.error('[useUnreadMessagesCount] Error fetching count:', error);
                return;
            }

            setCount(unreadCount || 0);
        } catch (error) {
            console.error('[useUnreadMessagesCount] Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchCount();

        // Set up realtime subscription for INSERT, UPDATE, DELETE events
        const channel = supabase
            .channel('contact_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'contact_messages'
                },
                (payload) => {
                    console.log('[useUnreadMessagesCount] Realtime event:', payload.eventType);
                    // Refetch count on any change
                    fetchCount();
                }
            )
            .subscribe();

        // Fallback polling every 30 seconds in case realtime fails
        const pollInterval = setInterval(fetchCount, 30000);

        // Cleanup
        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [fetchCount]);

    // Function to manually refresh count (e.g., after marking as read)
    const refresh = useCallback(() => {
        fetchCount();
    }, [fetchCount]);

    return { count, loading, refresh };
};
