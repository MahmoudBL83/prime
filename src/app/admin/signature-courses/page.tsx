'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  Crown,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Video,
  Award,
  Loader2,
  Search,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Creator {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  stats: {
    courses: number;
    students: number;
    avgRating: number;
  };
  isInvited: boolean;
}

interface SignatureCourseProposal {
  id: string;
  creatorId: string;
  creatorName: string;
  courseTitle: string;
  description: string;
  stage: 'PROPOSAL' | 'SCRIPT_REVIEW' | 'PRODUCTION_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewNotes?: string;
}

export default function SignatureCoursesAdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [proposals, setProposals] = useState<SignatureCourseProposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('invitations');
  const [inviting, setInviting] = useState<string | null>(null);

  // Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<SignatureCourseProposal | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const [creatorsRes, proposalsRes] = await Promise.all([
        fetch('/api/admin/signature-courses/eligible-creators'),
        fetch('/api/admin/signature-courses/proposals'),
      ]);

      if (creatorsRes.ok) {
        const creatorsData = await creatorsRes.json();
        setCreators(creatorsData.creators || []);
      }

      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedCreator || !inviteMessage.trim()) {
      toast.error('Please provide an invitation message');
      return;
    }

    setInviting(selectedCreator.id);

    try {
      const res = await fetch('/api/admin/signature-courses/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreator.id,
          message: inviteMessage,
        }),
      });

      if (res.ok) {
        toast.success('Invitation sent successfully!');
        setShowInviteModal(false);
        setSelectedCreator(null);
        setInviteMessage('');
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(null);
    }
  };

  const handleReviewProposal = async () => {
    if (!selectedProposal || !reviewAction) {
      toast.error('Please select an action');
      return;
    }

    try {
      const res = await fetch('/api/admin/signature-courses/review-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (res.ok) {
        toast.success('Proposal reviewed successfully!');
        setShowReviewModal(false);
        setSelectedProposal(null);
        setReviewAction(null);
        setReviewNotes('');
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to review proposal');
      }
    } catch (error) {
      console.error('Error reviewing proposal:', error);
      toast.error('Failed to review proposal');
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROPOSAL': return 'bg-blue-100 text-blue-700';
      case 'SCRIPT_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'PRODUCTION_REVIEW': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-muted text-foreground';
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProposals = proposals.filter(proposal =>
    proposal.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Signature Courses Management</h1>
              <p className="text-muted-foreground">Invite elite creators and manage editorial pipeline</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="invitations">Creator Invitations</TabsTrigger>
            <TabsTrigger value="proposals">Editorial Pipeline</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* Creator Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Eligible Creators</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search creators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {creator.profileImage ? (
                          <img
                            src={creator.profileImage}
                            alt={creator.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-amber-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{creator.name}</h3>
                          <p className="text-sm text-muted-foreground">{creator.email}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{creator.stats.courses} courses</span>
                            <span>{creator.stats.students} students</span>
                            <span>⭐ {creator.stats.avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {creator.isInvited ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Invited
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedCreator(creator);
                            setShowInviteModal(true);
                          }}
                          disabled={inviting === creator.id}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {inviting === creator.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Invitation
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editorial Pipeline Tab */}
          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Proposals</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search proposals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-4 bg-background rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{proposal.courseTitle}</h3>
                            <Badge className={getStageColor(proposal.stage)}>
                              {proposal.stage.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{proposal.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {proposal.creatorName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(proposal.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>

                      {proposal.reviewNotes && (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                          <strong>Review Notes:</strong> {proposal.reviewNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-2">
                      {creators.filter(c => c.isInvited).length}
                    </div>
                    <p className="text-muted-foreground">Invited Creators</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {proposals.filter(p => p.stage === 'PROPOSAL').length}
                    </div>
                    <p className="text-muted-foreground">Pending Proposals</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {proposals.filter(p => p.stage === 'APPROVED').length}
                    </div>
                    <p className="text-muted-foreground">Approved Courses</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedCreator && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Send Signature Course Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Inviting: {selectedCreator.name}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Personal Message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Write a personalized invitation message..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={6}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedCreator(null);
                    setInviteMessage('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={!inviteMessage.trim() || inviting !== null}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProposal && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardHeader>
              <CardTitle>Review Course Proposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{selectedProposal.courseTitle}</h3>
                <p className="text-sm text-muted-foreground">{selectedProposal.description}</p>
                <div className="mt-2">
                  <Badge className={getStageColor(selectedProposal.stage)}>
                    Current Stage: {selectedProposal.stage.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Review Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={reviewAction === 'APPROVE' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('APPROVE')}
                    className={reviewAction === 'APPROVE' ? 'bg-green-600' : ''}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={reviewAction === 'REQUEST_CHANGES' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('REQUEST_CHANGES')}
                    className={reviewAction === 'REQUEST_CHANGES' ? 'bg-yellow-600' : ''}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant={reviewAction === 'REJECT' ? 'default' : 'outline'}
                    onClick={() => setReviewAction('REJECT')}
                    className={reviewAction === 'REJECT' ? 'bg-red-600' : ''}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Review Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide detailed feedback..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedProposal(null);
                    setReviewAction(null);
                    setReviewNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewProposal}
                  disabled={!reviewAction}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
