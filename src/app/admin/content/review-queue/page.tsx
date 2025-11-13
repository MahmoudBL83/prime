'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Video,
  FileText,
  Loader2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Course {
  id: string;
  title: string;
  thumbnail?: string;
  contentCategory: string;
  lessonCount: number;
  totalDuration: number;
  isFirstReview: boolean;
  creator: {
    user: {
      name: string;
      email: string;
    };
  };
  createdAt: string;
}

export default function AdminContentReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    action: 'APPROVE' as 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    qualityScore: 7,
    checklist: {
      productionQuality: false,
      learningOutcomes: false,
      contentAccuracy: false,
      policyCompliance: false,
      appropriateForCategory: false,
    },
    notes: '',
    rejectionReasons: '',
  });

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadCourses();
  }, [session]);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/admin/content/reviews');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = (course: Course) => {
    setSelectedCourse(course);
    setReviewForm({
      action: 'APPROVE',
      qualityScore: 7,
      checklist: {
        productionQuality: false,
        learningOutcomes: false,
        contentAccuracy: false,
        policyCompliance: false,
        appropriateForCategory: false,
      },
      notes: '',
      rejectionReasons: '',
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse) return;

    // Validate checklist if approving
    if (reviewForm.action === 'APPROVE') {
      const allChecked = Object.values(reviewForm.checklist).every(v => v === true);
      if (!allChecked) {
        toast.error('Please complete all checklist items before approving');
        return;
      }
    }

    // Validate rejection reason
    if (reviewForm.action === 'REJECT' && !reviewForm.rejectionReasons) {
      toast.error('Please provide rejection reasons');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/content/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          ...reviewForm,
          contentChecklist: reviewForm.checklist,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        if (data.strikeIssued) {
          toast('⚠️ Warning strike issued to creator', { icon: '⚠️' });
        }
        setShowReviewModal(false);
        loadCourses();
      } else {
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Content Review Queue</h1>
        <p className="text-muted-foreground">
          Review and approve courses before they go live
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">First Reviews</p>
                <p className="text-2xl font-bold text-red-600">
                  {courses.filter(c => c.isFirstReview).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Review Time</p>
                <p className="text-2xl font-bold text-blue-600">2.5h</p>
              </div>
              <Video className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>Courses Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p>No courses pending review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-40 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {course.creator.user.name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {course.isFirstReview && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              First Review
                            </Badge>
                          )}
                          <Badge className="bg-blue-100 text-blue-800">
                            {course.contentCategory.replace('CATEGORY_', 'Cat ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{course.lessonCount} lessons</span>
                        <span>•</span>
                        <span>{formatDuration(course.totalDuration)}</span>
                        <span>•</span>
                        <span>Submitted {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/courses/${course.id}/preview`)}
                          variant="outline"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartReview(course)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Start Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Course</DialogTitle>
          </DialogHeader>

          {selectedCourse && (
            <div className="space-y-6">
              {/* Course Info */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="font-semibold mb-1">{selectedCourse.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {selectedCourse.creator.user.name}
                </p>
                {selectedCourse.isFirstReview && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    First course review - Warning strike will be issued if rejected
                  </p>
                )}
              </div>

              {/* Action Selection */}
              <div>
                <Label>Review Decision</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={reviewForm.action === 'APPROVE' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, action: 'APPROVE' })}
                    className={reviewForm.action === 'APPROVE' ? 'bg-green-600' : ''}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewForm.action === 'REQUEST_CHANGES' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, action: 'REQUEST_CHANGES' })}
                    className={reviewForm.action === 'REQUEST_CHANGES' ? 'bg-orange-600' : ''}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant={reviewForm.action === 'REJECT' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, action: 'REJECT' })}
                    className={reviewForm.action === 'REJECT' ? 'bg-red-600' : ''}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Quality Score */}
              <div>
                <Label htmlFor="qualityScore">Quality Score (1-10)</Label>
                <Input
                  id="qualityScore"
                  type="number"
                  min="1"
                  max="10"
                  value={reviewForm.qualityScore}
                  onChange={(e) => setReviewForm({ 
                    ...reviewForm, 
                    qualityScore: parseInt(e.target.value) 
                  })}
                />
              </div>

              {/* Checklist */}
              <div>
                <Label className="mb-3 block">Quality Checklist</Label>
                <div className="space-y-3">
                  {Object.entries({
                    productionQuality: 'Production quality (audio/video clear)',
                    learningOutcomes: 'Learning outcomes clearly defined',
                    contentAccuracy: 'Content is accurate and up-to-date',
                    policyCompliance: 'Complies with platform policies',
                    appropriateForCategory: 'Appropriate for assigned category',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={key}
                        checked={reviewForm.checklist[key as keyof typeof reviewForm.checklist]}
                        onCheckedChange={(checked: boolean) =>
                          setReviewForm({
                            ...reviewForm,
                            checklist: {
                              ...reviewForm.checklist,
                              [key]: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor={key} className="cursor-pointer font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Review Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={reviewForm.notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Internal notes about this review..."
                />
              </div>

              {/* Rejection Reasons */}
              {reviewForm.action === 'REJECT' && (
                <div>
                  <Label htmlFor="rejectionReasons">Rejection Reasons *</Label>
                  <Textarea
                    id="rejectionReasons"
                    value={reviewForm.rejectionReasons}
                    onChange={(e) => setReviewForm({ ...reviewForm, rejectionReasons: e.target.value })}
                    rows={4}
                    placeholder="Explain why this course is being rejected..."
                    className="border-red-300"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={
                reviewForm.action === 'APPROVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewForm.action === 'REJECT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
