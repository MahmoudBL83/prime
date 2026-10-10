'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  Radio,
  Clock,
  Eye,
  Users,
  Calendar,
  Filter,
  Search,
  Loader2,
  Play,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic'

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  viewCount: number;
  channel: {
    id: string;
    name: string;
    profileImage?: string;
  };
  attendeeCount?: number;
}

export default function LiveStreamsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveSession[]>([]);
  const [upcomingStreams, setUpcomingStreams] = useState<LiveSession[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    loadStreams();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    try {
      const res = await fetch('/api/live-streams');
      if (res.ok) {
        const data = await res.json();
        setLiveStreams(data.liveStreams || []);
        setUpcomingStreams(data.upcomingStreams || []);
      }
    } catch (error) {
      console.error('Error loading streams:', error);
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = (activeTab === 'live' ? liveStreams : upcomingStreams).filter((stream) => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Radio className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Streams</h1>
              <p className="text-muted-foreground">Watch live classes and events</p>
            </div>
          </div>
          
          {session?.user?.role === 'CREATOR' && (
            <Link href="/creator/live-studio">
              <Button className="bg-red-500 hover:bg-red-600 text-foreground">
                <Radio className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {liveStreams.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Live Now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {upcomingStreams.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {liveStreams.reduce((sum, s) => sum + (s.attendeeCount || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Viewers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search streams..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'live' ? 'default' : 'outline'}
            onClick={() => setActiveTab('live')}
            className={activeTab === 'live' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            <Radio className="w-4 h-4 mr-2" />
            Live Now ({liveStreams.length})
          </Button>
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upcoming')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Upcoming ({upcomingStreams.length})
          </Button>
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStreams.map((stream) => (
            <Link key={stream.id} href={`/live/${stream.id}`}>
              <Card className="group hover:shadow-lg transition-all cursor-pointer">
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-16 h-16 text-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {stream.status === 'LIVE' && (
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-red-500 text-foreground animate-pulse">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                      {stream.attendeeCount !== undefined && (
                        <Badge className="bg-background/70 text-foreground">
                          <Eye className="w-3 h-3 mr-1" />
                          {stream.attendeeCount}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {stream.status === 'SCHEDULED' && (
                    <Badge className="absolute top-4 left-4 bg-blue-500 text-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      Scheduled
                    </Badge>
                  )}
                </div>
                
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-foreground font-bold flex-shrink-0">
                      {stream.channel.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-purple-600 transition-colors mb-1 truncate">
                        {stream.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{stream.channel.name}</p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {stream.status === 'LIVE' ? (
                          <>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {stream.viewCount} views
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(stream.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(stream.scheduledAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredStreams.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Radio className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold mb-2">
                  No {activeTab === 'live' ? 'live' : 'upcoming'} streams
                </p>
                <p className="text-sm">
                  {activeTab === 'live' 
                    ? 'Check back later for live streams' 
                    : 'No scheduled streams at the moment'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
