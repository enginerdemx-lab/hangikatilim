import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi, type FavoriteItemType } from '../services/api/favorites';

interface FavoriteButtonProps {
    itemType: FavoriteItemType;
    itemId: string;
    size?: number;
    showCount?: boolean;
    className?: string;
    onAuthRequired?: () => void; // Login modal tetiklemek için
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    itemType,
    itemId,
    size = 18,
    showCount = false,
    className = '',
    onAuthRequired,
}) => {
    const { user } = useAuth();
    const [isFavorited, setIsFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (user) {
            favoritesApi.isFavorited(user.id, itemType, itemId).then(setIsFavorited);
        }
        if (showCount) {
            favoritesApi.getFavoriteCount(itemType, itemId).then(setCount);
        }
    }, [user, itemType, itemId, showCount]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            onAuthRequired?.();
            return;
        }

        if (loading) return;

        setLoading(true);
        setAnimating(true);

        try {
            const newState = await favoritesApi.toggleFavorite(user.id, itemType, itemId);
            setIsFavorited(newState);
            if (showCount) {
                setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Favori değiştirilemedi:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setAnimating(false), 300);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`group inline-flex items-center gap-1.5 transition-all duration-200 ${className}`}
            title={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
            <Heart
                size={size}
                className={`transition-all duration-300 ${animating ? 'scale-125' : 'scale-100'} ${
                    isFavorited
                        ? 'text-red-500 fill-red-500'
                        : 'text-slate-400 group-hover:text-red-400'
                }`}
            />
            {showCount && count > 0 && (
                <span className="text-xs text-slate-500 font-medium">{count}</span>
            )}
        </button>
    );
};
