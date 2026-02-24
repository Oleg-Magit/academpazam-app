
import React, { createContext, useContext, useEffect, useState } from 'react';

interface PwaContextType {
    canInstall: boolean;
    install: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextType>({
    canInstall: false,
    install: async () => false,
});

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setCanInstall(true);
            console.debug('🚀 PWA: beforeinstallprompt captured');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Cleanup: remove indicator if app is installed
        const installedHandler = () => {
            setCanInstall(false);
            setDeferredPrompt(null);
            console.debug('🚀 PWA: App installed successfully');
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return false;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.debug(`🚀 PWA: User choice outcome: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setCanInstall(false);

        return outcome === 'accepted';
    };

    return (
        <PwaContext.Provider value={{ canInstall, install }}>
            {children}
        </PwaContext.Provider>
    );
};

export const usePwa = () => useContext(PwaContext);
