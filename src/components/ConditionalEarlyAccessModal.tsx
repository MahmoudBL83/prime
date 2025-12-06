'use client';

import { useEffect, useState } from 'react';
import EarlyAccessModal from './EarlyAccessModal';

export function ConditionalEarlyAccessModal() {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkEarlyAccess = async () => {
            try {
                const response = await fetch('/api/platform-settings');
                if (response.ok) {
                    const data = await response.json();
                    setShowModal(data.earlyAccessEnabled === true);
                } else {
                    // Default to showing modal if fetch fails
                    setShowModal(true);
                }
            } catch (error) {
                console.error('Error fetching platform settings:', error);
                // Default to showing modal on error
                setShowModal(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkEarlyAccess();
    }, []);

    // Don't render anything while loading to prevent flash
    if (isLoading) {
        return null;
    }

    // Only render modal if enabled
    return showModal ? <EarlyAccessModal /> : null;
}
