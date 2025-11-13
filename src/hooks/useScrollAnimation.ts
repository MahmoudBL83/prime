import { useInView } from 'react-intersection-observer';
import { motion, Variants } from 'framer-motion';

export const useScrollAnimation = (threshold = 0.1) => {
    const { ref, inView, entry } = useInView({
        threshold,
        triggerOnce: true,
    });

    const variants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
    };

    const animationProps = {
        variants,
        initial: "hidden",
        animate: inView ? "visible" : "hidden",
        transition: { duration: 0.6, ease: "easeOut" as const },
    };

    return { ref, inView, animationProps };
};
