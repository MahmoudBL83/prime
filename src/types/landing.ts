export interface CourseCard {
    id: string;
    thumbnail: string;
    titleAr: string;
    titleEn: string;
    instructor: string;
    duration: string;
    level: string;
    rating: number;
    category: string;
    hasProgress?: boolean;
    progress?: number;
}

export interface MentorCard {
    id: string;
    name: string;
    specialty: string;
    subscribers: number;
    avatar: string;
    channelPrice: number;
}

export interface ValueProp {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    icon: string;
    priceRange: string;
}

export interface PricingTier {
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
    currency: string;
    features: string[];
    popular?: boolean;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    contentAr: string;
    contentEn: string;
    avatar: string;
    rating: number;
}

export interface TrustIndicator {
    id: string;
    name: string;
    icon: string;
    description: string;
}
