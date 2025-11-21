'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Heart,
  X,
  Star,
  Loader2,
  Users,
  Calendar,
  Target,
  BookOpen,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyBuddy {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  interests?: string;
  goals?: string;
  skillLevel?: string;
  compatibilityScore: number;
  matchReasons: string[];
}

export default function StudyBuddyDiscoverPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadBuddies();
    }
  }, [session]);

  const loadBuddies = async () => {
    try {
      const res = await fetch('/api/study-buddy/discover?limit=20');
      if (res.ok) {
        const data = await res.json();
        setBuddies(data.buddies || []);
      } else {
        toast.error('Failed to load study buddies');
      }
    } catch (error) {
      console.error('Error loading buddies:', error);
      toast.error('Failed to load study buddies');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (swiping || currentIndex >= buddies.length) return;

    const currentBuddy = buddies[currentIndex];
    setSwiping(true);

    try {
      // Map superlike to like for now (API doesn't differentiate)
      const apiAction = action === 'superlike' ? 'like' : action;

      const res = await fetch('/api/study-buddy/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentBuddy.id,
          action: apiAction,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.isMutual) {
          toast.success("It's a match! 🎉", {
            duration: 3000,
            icon: '🎉',
          });
          // Redirect to match page after a delay
          setTimeout(() => {
            router.push(`/study-buddy/matches`);
          }, 2000);
        }

        // Move to next buddy
        setCurrentIndex(prev => prev + 1);

        // Load more if running low
        if (currentIndex >= buddies.length - 3) {
          loadBuddies();
        }
      } else {
        toast.error(data.error || 'Failed to record swipe');
      }
    } catch (error) {
      console.error('Error swiping:', error);
      toast.error('Failed to record swipe');
    } finally {
      setSwiping(false);
      setDragDirection(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-muted-foreground bg-muted';
  };

  const currentBuddy = buddies[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentBuddy) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No More Study Buddies
            </h2>
            <p className="text-muted-foreground mb-6">
              You've seen all available study buddies. Check back later for new matches!
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/study-buddy/matches')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                View My Matches
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12">
      <div className="container max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Find Your Study Buddy
          </h1>
          <p className="text-muted-foreground">
            {buddies.length - currentIndex} potential matches
          </p>
        </div>

        {/* Card Stack */}
        <div className="relative h-[600px] mb-6">
          <AnimatePresence>
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: dragDirection === 'left' ? -500 : dragDirection === 'right' ? 500 : 0,
                opacity: 0,
                transition: { duration: 0.3 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100) {
                  setDragDirection('right');
                  handleSwipe('like');
                } else if (info.offset.x < -100) {
                  setDragDirection('left');
                  handleSwipe('pass');
                }
              }}
              className="absolute inset-0"
            >
              <Card className="h-full shadow-2xl overflow-hidden">
                {/* Profile Image */}
                <div className="h-72 bg-gradient-to-br from-purple-400 to-pink-400 relative">
                  {currentBuddy.profileImage ? (
                    <img
                      src={currentBuddy.profileImage}
                      alt={currentBuddy.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-6xl font-bold text-foreground">
                          {currentBuddy.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Compatibility Score */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-4 py-2 rounded-full ${getScoreColor(currentBuddy.compatibilityScore)} font-bold flex items-center gap-2`}>
                      <Sparkles className="w-4 h-4" />
                      {currentBuddy.compatibilityScore}% Match
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <CardContent className="pt-6 space-y-4 overflow-y-auto" style={{ maxHeight: '328px' }}>
                  {/* Name & Bio */}
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {currentBuddy.name}
                    </h2>
                    {currentBuddy.bio && (
                      <p className="text-foreground">{currentBuddy.bio}</p>
                    )}
                  </div>

                  {/* Match Reasons */}
                  {currentBuddy.matchReasons.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Why you'll match
                      </h3>
                      <div className="space-y-2">
                        {currentBuddy.matchReasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {currentBuddy.interests && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {currentBuddy.interests.split(',').map((interest, idx) => (
                          <Badge key={idx} variant="secondary">
                            {interest.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {currentBuddy.goals && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Goals
                      </h3>
                      <p className="text-sm text-foreground">{currentBuddy.goals}</p>
                    </div>
                  )}

                  {/* Skill Level */}
                  {currentBuddy.skillLevel && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Skill Level</h3>
                      <Badge className="capitalize">{currentBuddy.skillLevel}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleSwipe('pass')}
            disabled={swiping}
            className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50"
          >
            <X className="w-8 h-8" />
          </Button>

          <Button
            size="lg"
            onClick={() => handleSwipe('superlike')}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Star className="w-8 h-8" />
          </Button>

          <Button
            size="lg"
            onClick={() => handleSwipe('like')}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
          >
            <Heart className="w-8 h-8" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Swipe right or tap <Heart className="w-4 h-4 inline text-green-500" /> to connect</p>
          <p>Swipe left or tap <X className="w-4 h-4 inline text-red-500" /> to pass</p>
          <p>Tap <Star className="w-4 h-4 inline text-blue-500" /> for a super like!</p>
        </div>
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
