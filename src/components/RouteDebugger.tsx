import { useEffect } from 'react';
import { useLocation, useMatches } from 'react-router-dom';

export const RouteDebugger: React.FC = () => {
    const location = useLocation();
    const matches = useMatches();

    useEffect(() => {
        console.log('ğŸ” ROUTE DEBUG:', {
            currentPath: location.pathname,
            matchedRoutes: matches.map(m => ({
                path: m.pathname,
                id: m.id
            })),
            totalMatches: matches.length
        });
    }, [location, matches]);

    return null;
};
