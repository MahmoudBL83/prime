import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

export const useResponsive = () => {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;

            if (width < 768) {
                setBreakpoint('mobile');
            } else if (width < 1024) {
                setBreakpoint('tablet');
            } else if (width < 1440) {
                setBreakpoint('desktop');
            } else {
                setBreakpoint('large-desktop');
            }
        };

        // Set initial breakpoint
        updateBreakpoint();

        // Add event listener
        window.addEventListener('resize', updateBreakpoint);

        // Cleanup
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);

    return {
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
        isLargeDesktop: breakpoint === 'large-desktop',
    };
};
