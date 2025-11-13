'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Application {
  id: string;
  userId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED';
  expertise: string;
  experienceYears?: number;
  sampleContentUrl?: string;
  portfolioUrl?: string;
  socialProof?: string;
  motivation: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    bio?: string;
  };
}

export default function AdminApplicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    status: 'PENDING',
    search: '',
  });

  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadApplications();
  }, [session]);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const loadApplications = async () => {
    try {
      const res = await fetch('/api/admin/applications?status=ALL');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        
        // Calculate stats
        const pending = data.applications.filter((a: Application) => a.status === 'PENDING').length;
        const underReview = data.applications.filter((a: Application) => a.status === 'UNDER_REVIEW').length;
        const approved = data.applications.filter((a: Application) => a.status === 'APPROVED').length;
        const rejected = data.applications.filter((a: Application) => a.status === 'REJECTED').length;
        
        setStats({ pending, underReview, approved, rejected });
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.user.name.toLowerCase().includes(search) ||
        app.user.email.toLowerCase().includes(search) ||
        app.expertise.toLowerCase().includes(search)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const handleStartReview = (application: Application, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes('');
    setRejectionReason('');
    setShowDetailModal(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;

    if (reviewAction === 'REJECT' && !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: reviewAction,
          reviewNotes,
          rejectionReason: reviewAction === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowReviewModal(false);
        loadApplications();
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      UNDER_REVIEW: { color: 'bg-blue-100 text-blue-800', icon: <Eye className="w-3 h-3" /> },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
      RESUBMIT_REQUIRED: { color: 'bg-orange-100 text-orange-800', icon: <FileText className="w-3 h-3" /> },
    };

    const variant = variants[status] || variants.PENDING;

    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        {variant.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Creator Applications</h1>
        <p className="text-muted-foreground">Review and manage creator applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or expertise..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RESUBMIT_REQUIRED">Resubmit Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p>No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {application.user.profileImage ? (
                            <img
                              src={application.user.profileImage}
                              alt={application.user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-muted-foreground">
                              {application.user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{application.user.name}</h3>
                          <p className="text-sm text-muted-foreground">{application.user.email}</p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-sm text-foreground mb-1">
                          <span className="font-medium">Expertise:</span> {application.expertise}
                        </p>
                        {application.experienceYears && (
                          <p className="text-sm text-foreground mb-1">
                            <span className="font-medium">Experience:</span> {application.experienceYears} years
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(application.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(application)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the applicant's information and credentials
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div>
                <h3 className="font-semibold mb-2">Applicant Information</h3>
                <div className="bg-background rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedApplication.user.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedApplication.user.email}</p>
                  <p><span className="font-medium">Status:</span> {getStatusBadge(selectedApplication.status)}</p>
                </div>
              </div>

              {/* Bio */}
              {selectedApplication.user.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Professional Bio</h3>
                  <p className="text-sm text-foreground bg-background rounded-lg p-4">
                    {selectedApplication.user.bio}
                  </p>
                </div>
              )}

              {/* Expertise */}
              <div>
                <h3 className="font-semibold mb-2">Expertise & Experience</h3>
                <div className="bg-background rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Area:</span> {selectedApplication.expertise}</p>
                  {selectedApplication.experienceYears && (
                    <p><span className="font-medium">Years:</span> {selectedApplication.experienceYears} years</p>
                  )}
                </div>
              </div>

              {/* Links */}
              {(selectedApplication.sampleContentUrl || selectedApplication.portfolioUrl) && (
                <div>
                  <h3 className="font-semibold mb-2">Portfolio & Samples</h3>
                  <div className="space-y-2">
                    {selectedApplication.sampleContentUrl && (
                      <a
                        href={selectedApplication.sampleContentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Sample Content
                      </a>
                    )}
                    {selectedApplication.portfolioUrl && (
                      <a
                        href={selectedApplication.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Social Proof */}
              {selectedApplication.socialProof && (
                <div>
                  <h3 className="font-semibold mb-2">Social Proof</h3>
                  <p className="text-sm text-foreground bg-background rounded-lg p-4 whitespace-pre-wrap">
                    {selectedApplication.socialProof}
                  </p>
                </div>
              )}

              {/* Motivation */}
              <div>
                <h3 className="font-semibold mb-2">Motivation</h3>
                <p className="text-sm text-foreground bg-background rounded-lg p-4 whitespace-pre-wrap">
                  {selectedApplication.motivation}
                </p>
              </div>

              {/* Previous Review Notes */}
              {selectedApplication.reviewNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Previous Review Notes</h3>
                  <p className="text-sm text-foreground bg-yellow-50 rounded-lg p-4">
                    {selectedApplication.reviewNotes}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedApplication.rejectionReason && (
                <div>
                  <h3 className="font-semibold mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700 bg-red-50 rounded-lg p-4">
                    {selectedApplication.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedApplication?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleStartReview(selectedApplication, 'REJECT')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  onClick={() => handleStartReview(selectedApplication, 'REQUEST_CHANGES')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleStartReview(selectedApplication, 'APPROVE')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVE' && 'Approve Application'}
              {reviewAction === 'REJECT' && 'Reject Application'}
              {reviewAction === 'REQUEST_CHANGES' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVE' && 'This will create a creator account for the applicant.'}
              {reviewAction === 'REJECT' && 'Please provide a reason for rejection.'}
              {reviewAction === 'REQUEST_CHANGES' && 'Specify what needs to be improved.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === 'REJECT' && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why the application is being rejected..."
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                placeholder="Add any internal notes about this review..."
              />
            </div>
          </div>

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
              disabled={submitting || (reviewAction === 'REJECT' && !rejectionReason)}
              className={
                reviewAction === 'APPROVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction === 'REJECT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === 'APPROVE' && 'Approve'}
                  {reviewAction === 'REJECT' && 'Reject'}
                  {reviewAction === 'REQUEST_CHANGES' && 'Request Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
