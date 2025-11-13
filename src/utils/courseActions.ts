import { toast } from 'react-hot-toast';

/**
 * Course Actions Utility
 * Centralized functions for course interaction buttons
 */

// Storage keys
const WISHLIST_STORAGE_KEY = 'edtech_wishlist';
const LIKED_COURSES_KEY = 'edtech_liked_courses';

// Get wishlist from localStorage
export function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return [];
  }
}

// Add to wishlist
export function addToWishlist(courseId: string, courseTitle?: string): boolean {
  try {
    const wishlist = getWishlist();
    if (wishlist.includes(courseId)) {
      toast('Already in your wishlist', { icon: 'ℹ️' });
      return false;
    }
    
    wishlist.push(courseId);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    
    toast.success(courseTitle ? `"${courseTitle}" added to wishlist` : 'Added to wishlist');
    return true;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    toast.error('Failed to add to wishlist');
    return false;
  }
}

// Remove from wishlist
export function removeFromWishlist(courseId: string, courseTitle?: string): boolean {
  try {
    const wishlist = getWishlist();
    const newWishlist = wishlist.filter(id => id !== courseId);
    
    if (wishlist.length === newWishlist.length) {
      return false; // Item wasn't in wishlist
    }
    
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newWishlist));
    toast.success(courseTitle ? `"${courseTitle}" removed from wishlist` : 'Removed from wishlist');
    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    toast.error('Failed to remove from wishlist');
    return false;
  }
}

// Check if course is in wishlist
export function isInWishlist(courseId: string): boolean {
  const wishlist = getWishlist();
  return wishlist.includes(courseId);
}

// Toggle wishlist
export function toggleWishlist(courseId: string, courseTitle?: string): boolean {
  if (isInWishlist(courseId)) {
    removeFromWishlist(courseId, courseTitle);
    return false;
  } else {
    addToWishlist(courseId, courseTitle);
    return true;
  }
}

// Get liked courses
export function getLikedCourses(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const liked = localStorage.getItem(LIKED_COURSES_KEY);
    return liked ? JSON.parse(liked) : [];
  } catch (error) {
    console.error('Error reading liked courses:', error);
    return [];
  }
}

// Like course
export function likeCourse(courseId: string, courseTitle?: string): boolean {
  try {
    const liked = getLikedCourses();
    if (liked.includes(courseId)) {
      toast('You already like this course', { icon: 'ℹ️' });
      return false;
    }
    
    liked.push(courseId);
    localStorage.setItem(LIKED_COURSES_KEY, JSON.stringify(liked));
    
    toast.success(courseTitle ? `You liked "${courseTitle}"` : 'Course liked!', {
      icon: '👍'
    });
    return true;
  } catch (error) {
    console.error('Error liking course:', error);
    toast.error('Failed to like course');
    return false;
  }
}

// Unlike course
export function unlikeCourse(courseId: string): boolean {
  try {
    const liked = getLikedCourses();
    const newLiked = liked.filter(id => id !== courseId);
    
    if (liked.length === newLiked.length) {
      return false;
    }
    
    localStorage.setItem(LIKED_COURSES_KEY, JSON.stringify(newLiked));
    toast.success('Like removed');
    return true;
  } catch (error) {
    console.error('Error unliking course:', error);
    toast.error('Failed to unlike course');
    return false;
  }
}

// Check if course is liked
export function isCourseLiked(courseId: string): boolean {
  const liked = getLikedCourses();
  return liked.includes(courseId);
}

// Toggle like
export function toggleLike(courseId: string, courseTitle?: string): boolean {
  if (isCourseLiked(courseId)) {
    unlikeCourse(courseId);
    return false;
  } else {
    likeCourse(courseId, courseTitle);
    return true;
  }
}

// Share course using Web Share API with fallback
export async function shareCourse(courseId: string, courseTitle: string, courseDescription?: string): Promise<boolean> {
  const shareUrl = `${window.location.origin}/courses/${courseId}`;
  const shareData = {
    title: courseTitle,
    text: courseDescription || `Check out this course: ${courseTitle}`,
    url: shareUrl
  };

  // Check if Web Share API is supported
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      toast.success('Course shared successfully');
      return true;
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        // User cancelled, don't show error
        return false;
      }
      console.error('Error sharing:', error);
      // Fall through to copy link
    }
  }

  // Fallback: Copy link to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard! 🔗\nShare it with your friends');
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Ultimate fallback: Show URL in a prompt
    toast(`Copy this link to share:\n${shareUrl}`, {
      duration: 10000,
      icon: '📋'
    });
    return false;
  }
}

// Enroll in course
export function enrollInCourse(courseId: string, isAuthenticated: boolean, locale: string = 'en'): void {
  if (!isAuthenticated) {
    toast.error('Please sign in to enroll in courses');
    setTimeout(() => {
      window.location.href = `/${locale}/auth/login?redirect=/courses/${courseId}`;
    }, 1500);
    return;
  }

  // Redirect to enrollment page or show enrollment modal
  toast.loading('Processing enrollment...');
  
  // Simulate enrollment process
  setTimeout(() => {
    toast.success('Enrollment successful!\nYou can now access all course materials');
    setTimeout(() => {
      window.location.href = `/${locale}/courses/${courseId}/learn`;
    }, 1000);
  }, 1500);
}

// Add to cart
export function addToCart(courseId: string, courseTitle: string, price: number, locale: string = 'en'): void {
  try {
    // For now, redirect to subscribe page with course selected
    // In the future, implement a proper cart system
    toast.success(`"${courseTitle}" added to cart\nPrice: EGP ${price}`, {
      icon: '🛒',
      duration: 4000
    });
    
    // Redirect to subscribe page after a short delay
    setTimeout(() => {
      window.location.href = `/${locale}/subscribe?course=${courseId}`;
    }, 2000);
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error('Failed to add to cart');
  }
}

// Get wishlist count (useful for nav badges)
export function getWishlistCount(): number {
  return getWishlist().length;
}

// Get liked courses count
export function getLikedCoursesCount(): number {
  return getLikedCourses().length;
}

// Clear wishlist
export function clearWishlist(): void {
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    toast.success('Wishlist cleared');
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    toast.error('Failed to clear wishlist');
  }
}

// Export all course IDs for bulk operations
export function exportWishlist(): string[] {
  return getWishlist();
}
