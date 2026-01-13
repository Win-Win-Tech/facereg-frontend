import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to detect when a specific tab becomes active
 * @param {string} tabId - The tab identifier (e.g., 'records', 'generate')
 * @param {function} onActive - Callback function when tab becomes active
 */
export const useTabActive = (tabId, onActive) => {
    const location = useLocation();
    const wasActiveRef = useRef(false);
    const onActiveRef = useRef(onActive);

    // Keep onActive ref updated without causing re-renders
    useEffect(() => {
        onActiveRef.current = onActive;
    }, [onActive]);

    useEffect(() => {
        const isActive = location.pathname.includes(`/payslip/${tabId}`);
        
        // If tab just became active and wasn't before, trigger callback
        if (isActive && !wasActiveRef.current) {
            wasActiveRef.current = true;
            onActiveRef.current?.();
        } else if (!isActive) {
            wasActiveRef.current = false;
        }
    }, [location.pathname, tabId]); // Remove onActive from dependencies
};

export default useTabActive;
