"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface GlobalLoaderContextType {
    isGlobalLoading: boolean;
    setIsGlobalLoading: (loading: boolean) => void;
    triggerLoader: (minDuration?: number) => void;
    stopLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const triggerLoader = (minDuration: number = 2000) => {
        setIsGlobalLoading(true);
        if (minDuration > 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setIsGlobalLoading(false);
            }, minDuration);
        }
    };

    const stopLoader = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGlobalLoading(false);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <GlobalLoaderContext.Provider value={{ isGlobalLoading, setIsGlobalLoading, triggerLoader, stopLoader }}>
            {children}
        </GlobalLoaderContext.Provider>
    );
}

export function useGlobalLoader() {
    const context = useContext(GlobalLoaderContext);
    if (context === undefined) {
        throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
    }
    return context;
}
