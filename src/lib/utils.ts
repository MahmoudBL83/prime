import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = "EGP"): string {
    return new Intl.NumberFormat("ar-EG", {
        style: "currency",
        currency: currency,
    }).format(price)
}

export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date))
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
}
