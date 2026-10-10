'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Users,
  MessageCircle,
  Calendar,
  FileText,
  CheckSquare,
  Play,
  Search,
  Loader2,
  Heart,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudyBuddyMatch {
  id: string;
  status: string;
  createdAt: string;
  buddy: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  sharedSubjects: string[];
  sharedGoals: string[];
}

export default function StudyBuddyMatchesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<StudyBuddyMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (session?.user) {
      loadMatches();
    }
  }, [session]);

  const loadMatches = async () => {
    try {
      const res = await fetch('/api/study-buddy/matches');
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      } else {
        toast.error('Failed to load matches');
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.buddy.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && match.status === 'accepted';
    if (activeTab === 'pending') return matchesSearch && match.status === 'pending';
    
    return matchesSearch;
  });

  const startChat = (matchId: string, buddyName: string) => {
    // Redirect to messaging with this buddy
    router.push(`/messages?buddy=${matchId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                My Study Buddies
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect and collaborate with your matched study partners
              </p>
            </div>
            <Button onClick={() => router.push('/study-buddy/discover')}>
              <Heart className="w-4 h-4 mr-2" />
              Find More Buddies
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="text-3xl font-bold text-foreground">{matches.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Buddies</p>
                  <p className="text-3xl font-bold text-green-600">
                    {matches.filter(m => m.status === 'accepted').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {matches.filter(m => m.status === 'pending').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Matches</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Matches Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start swiping to find your perfect study buddy!
                  </p>
                  <Button onClick={() => router.push('/study-buddy/discover')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Find Study Buddies
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <div className="relative">
                          {match.buddy.profileImage ? (
                            <img
                              src={match.buddy.profileImage}
                              alt={match.buddy.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                              <span className="text-2xl font-bold text-foreground">
                                {match.buddy.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {match.status === 'accepted' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {match.buddy.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {match.buddy.email}
                          </p>
                          <Badge
                            variant={match.status === 'accepted' ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {match.status === 'accepted' ? 'Active' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Shared Interests */}
                      {match.sharedSubjects && match.sharedSubjects.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">
                            Shared Subjects:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {match.sharedSubjects.map((subject, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {match.status === 'accepted' && (
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startChat(match.id, match.buddy.name)}
                            className="w-full"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/study-buddy/workspace/${match.id}`)}
                            className="w-full"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Workspace
                          </Button>
                        </div>
                      )}

                      {match.status === 'pending' && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground text-center">
                            Waiting for {match.buddy.name} to accept...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'

export const runtime = 'edge'
