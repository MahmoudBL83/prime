'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Award,
  Star,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  Loader2,
  Filter,
  Search,
  TrendingUp,
  Sparkles,
  Crown,
  Award as CertificateIcon,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SignatureCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: {
    name: string;
    profileImage?: string;
  };
  duration: string;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  price: number;
  level: string;
  category: string;
  hasWorkbook: boolean;
  hasCohort: boolean;
  hasExpertQA: boolean;
  hasCapstone: boolean;
}

export default function SignatureCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<SignatureCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/signature-courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      } else {
        toast.error('Failed to load signature courses');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = ['all', 'Technology', 'Business', 'Design', 'Marketing', 'Data Science'];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-foreground">
        <div className="absolute inset-0 bg-background/10"></div>
        <div className="relative container max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8" />
              <Badge className="bg-white/20 text-foreground border-white/30 text-lg px-4 py-1">
                Premium
              </Badge>
            </div>
            <h1 className="text-5xl font-bold mb-4">Signature Courses</h1>
            <p className="text-xl text-amber-50 mb-8">
              Curated, expert-led programs designed for deep learning and career transformation.
              Learn from industry leaders with comprehensive workbooks, cohort support, and capstone projects.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <CertificateIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Verified Certificates</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Cohort Learning</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Workbooks Included</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Expert Q&A</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="container max-w-7xl mx-auto px-4 -mt-8">
        <Card className="shadow-xl border-amber-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search signature courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredCourses.length} signature courses available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Courses Found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-amber-200 overflow-hidden"
                onClick={() => router.push(`/signature-courses/${course.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Premium Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-amber-600 text-foreground border-0 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Signature
                    </Badge>
                  </div>

                  {/* Level Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/90">
                      {course.level}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Category */}
                  <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2">
                    {course.category}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 mb-4">
                    {course.instructor.profileImage ? (
                      <img
                        src={course.instructor.profileImage}
                        alt={course.instructor.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-amber-600">
                          {course.instructor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-foreground">{course.instructor.name}</span>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {course.hasWorkbook && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Workbook
                      </div>
                    )}
                    {course.hasCohort && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Cohort
                      </div>
                    )}
                    {course.hasExpertQA && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Expert Q&A
                      </div>
                    )}
                    {course.hasCapstone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Capstone
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{course.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({course.ratingCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollmentCount.toLocaleString()} enrolled</span>
                    </div>
                  </div>

                  {/* Price & Duration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-amber-600">
                        {course.price} EGP
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </div>
                    </div>
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
