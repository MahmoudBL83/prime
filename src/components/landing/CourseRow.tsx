import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard as CourseCardType } from '@/types/landing';
import { CourseCard } from './CourseCard';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CourseRowProps {
    title: string;
    titleAr: string;
    courses: CourseCardType[];
    onCourseClick?: (courseId: string) => void;
    className?: string;
}

export function CourseRow({ title, titleAr, courses, onCourseClick, className }: CourseRowProps) {
    const { ref, inView, animationProps } = useScrollAnimation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.7;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            return () => container.removeEventListener('scroll', checkScroll);
        }
    }, []);

    return (
        <motion.section
            ref={ref}
            className={cn("py-8 px-4 md:px-8 bg-background", className)}
            {...animationProps}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-light text-foreground mb-1">
                        {titleAr}
                    </h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">
                        {title}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-card text-sm"
                >
                    عرض الكل
                </Button>
            </div>

            {/* Horizontal Scrolling Container */}
            <div className="relative group">
                {/* Left Scroll Button */}
                {canScrollLeft && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-card"
                        onClick={() => scroll('left')}
                    >
                        <ChevronLeft className="h-5 w-5 text-foreground" />
                    </Button>
                )}

                {/* Right Scroll Button */}
                {canScrollRight && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-card"
                        onClick={() => scroll('right')}
                    >
                        <ChevronRight className="h-5 w-5 text-foreground" />
                    </Button>
                )}

                {/* Scrollable Content */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                    onScroll={checkScroll}
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {courses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            className="flex-shrink-0 w-80"
                            initial={{ opacity: 0, x: 50 }}
                            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <CourseCard
                                course={course}
                                onClick={() => onCourseClick?.(course.id)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Gradient fade on sides */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
            </div>
        </motion.section>
    );
}
