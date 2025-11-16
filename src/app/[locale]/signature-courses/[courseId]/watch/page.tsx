'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Icon Components with lazy loading
const IconComponents = {
  ArrowLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft }))),
  Volume2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Volume2 }))),
  VolumeX: lazy(() => import('lucide-react').then(mod => ({ default: mod.VolumeX }))),
  Play: lazy(() => import('lucide-react').then(mod => ({ default: mod.Play }))),
  Pause: lazy(() => import('lucide-react').then(mod => ({ default: mod.Pause }))),
  Maximize: lazy(() => import('lucide-react').then(mod => ({ default: mod.Maximize }))),
  Minimize: lazy(() => import('lucide-react').then(mod => ({ default: mod.Minimize }))),
  Settings: lazy(() => import('lucide-react').then(mod => ({ default: mod.Settings }))),
  SkipForward: lazy(() => import('lucide-react').then(mod => ({ default: mod.SkipForward }))),
  SkipBack: lazy(() => import('lucide-react').then(mod => ({ default: mod.SkipBack }))),
  ChevronDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown }))),
  MessageSquare: lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare }))),
  ThumbsUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsUp }))),
  ThumbsDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsDown }))),
  Share2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Share2 }))),
  Download: lazy(() => import('lucide-react').then(mod => ({ default: mod.Download })))
}

// Dynamic Icon Component
const DynamicIcon = ({ name, className, ...props }: { name: keyof typeof IconComponents; className?: string; [key: string]: any }) => {
  const IconComponent = IconComponents[name]
  
  return (
    <Suspense fallback={<div className={className} />}>
      <IconComponent className={className} {...props} />
    </Suspense>
  )
}

interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  episodeNumber: number;
  seasonNumber: number;
  watched: boolean;
  progress: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    profileImage?: string;
  };
  episodes: Episode[];
}

export default function WatchCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const locale = params?.locale as string || 'en';
  const courseId = params?.courseId as string;
  const isRTL = locale === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [showAudio, setShowAudio] = useState(false);
  const [audioTrack, setAudioTrack] = useState('English');
  const [subtitle, setSubtitle] = useState('Off');
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => playNextEpisode();

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentEpisode]);

  const loadCourse = async () => {
    try {
      console.log('Loading course with ID:', courseId);
      let url = `/api/signature-courses/${courseId}/watch`;
      // In local/demo environments allow fetching with demo bypass
      if (typeof window !== 'undefined') {
        const host = window.location.hostname || '';
        if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') ) {
          url += '?demo=true';
        }
        // Also respect explicit query param in the browser URL
        const qs = new URLSearchParams(window.location.search);
        if (qs.get('demo') === 'true') {
          url = url.includes('?') ? url + '&demo=true' : url + '?demo=true';
        }
      }
      console.log('Fetching from URL:', url);

      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        setCourse(data.course);
        setCurrentEpisode(data.course.episodes[0]);
      } else {
        toast.error(data.error || 'Failed to load course');
        console.error('Error response:', data);
        router.push(`/${locale}/signature-courses`);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const playNextEpisode = () => {
    if (!course || !currentEpisode) return;
    const currentIndex = course.episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex < course.episodes.length - 1) {
      setCurrentEpisode(course.episodes[currentIndex + 1]);
      setPlaying(true);
      setAutoPlayCountdown(null); // Reset countdown
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  const playPreviousEpisode = () => {
    if (!course || !currentEpisode) return;
    const currentIndex = course.episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex > 0) {
      setCurrentEpisode(course.episodes[currentIndex - 1]);
      setPlaying(true);
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  const selectEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setShowEpisodes(false);
    setPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Show toast notification when audio or subtitle changes
  useEffect(() => {
    if (audioTrack) {
      toast.success(`Audio: ${audioTrack}`, {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #333',
        },
      });
    }
  }, [audioTrack]);

  useEffect(() => {
    if (subtitle) {
      toast.success(subtitle === 'Off' ? 'Subtitles: Off' : `Subtitles: ${subtitle}`, {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#000',
          color: '#fff',
          border: '1px solid #333',
        },
      });
    }
  }, [subtitle]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const saveProgress = async () => {
    if (!currentEpisode || !videoRef.current) return;
    try {
      await fetch(`/api/signature-courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: currentEpisode.id,
          progress: videoRef.current.currentTime,
          completed: videoRef.current.currentTime / videoRef.current.duration > 0.9,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(saveProgress, 10000); // Save every 10 seconds
    return () => clearInterval(interval);
  }, [currentEpisode]);

  // Auto-play countdown for next episode
  useEffect(() => {
    if (!duration || !currentTime || !course || !currentEpisode) return;
    
    const timeLeft = duration - currentTime;
    
    // Start countdown 15 seconds before end
    if (timeLeft <= 15 && timeLeft > 0 && playing) {
      setAutoPlayCountdown(Math.ceil(timeLeft));
    } else {
      setAutoPlayCountdown(null);
    }
  }, [currentTime, duration, playing, course, currentEpisode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!course || !currentEpisode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="text-white text-2xl mb-4">Course Not Found</div>
        <div className="text-gray-400 text-sm mb-2">Course ID: {courseId}</div>
        <div className="text-gray-400 text-sm mb-4">Check the browser console for more details</div>
        <button
          onClick={() => router.push(`/${locale}/signature-courses`)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Video Player Container */}
      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={currentEpisode.videoUrl}
          poster={currentEpisode.thumbnail}
          onClick={togglePlay}
        />

        {/* Subtitle Display (Demo) */}
        {subtitle !== 'Off' && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40 text-center px-4">
            <div className="bg-black/80 px-6 py-3 rounded-lg inline-block">
              <p className="text-white text-lg font-semibold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                [{subtitle}] Demo subtitles - This is sample subtitle text
              </p>
            </div>
          </div>
        )}

        {/* Audio/Subtitle Status Indicator */}
        {(audioTrack !== 'English' || subtitle !== 'Off') && showControls && (
          <div className="absolute top-24 right-8 z-40 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            {audioTrack !== 'English' && (
              <div className="flex items-center gap-2">
                <DynamicIcon name="Volume2" className="w-4 h-4" />
                <span>Audio: {audioTrack}</span>
              </div>
            )}
            {subtitle !== 'Off' && (
              <div className="flex items-center gap-2 mt-1">
                <DynamicIcon name="MessageSquare" className="w-4 h-4" />
                <span>Subtitles: {subtitle}</span>
              </div>
            )}
          </div>
        )}

        {/* Back Button - Top Left */}
        <button
          onClick={() => router.push(`/${locale}/signature-courses/${courseId}`)}
          className={`absolute top-8 ${isRTL ? 'right-8' : 'left-8'} z-50 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-3 transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <DynamicIcon name="ArrowLeft" className="w-6 h-6 text-white" />
        </button>

        {/* Course Info - Top Right */}
        <div
          className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} z-50 transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-6 py-3">
            <h1 className="text-white font-bold text-lg">{course.title}</h1>
            <p className="text-gray-300 text-sm">
              Episode {currentEpisode.episodeNumber}: {currentEpisode.title}
            </p>
          </div>
        </div>

        {/* Center Play/Pause Button */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-20 h-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
          >
            <DynamicIcon name="Play" className="w-10 h-10 text-white ml-2" fill="white" />
          </button>
        )}

        {/* Bottom Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pb-8 px-8 transition-all ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-6 relative">
            {/* Time tooltip on hover */}
            {hoverTime !== null && (
              <div
                className="absolute bottom-full mb-2 bg-white text-black text-xs font-semibold px-2 py-1 rounded"
                style={{ left: `${hoverPosition}px`, transform: 'translateX(-50%)' }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
            
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, #E50914 0%, #E50914 ${(currentTime / duration) * 100}%, #4a4a4a ${(currentTime / duration) * 100}%, #4a4a4a 100%)`,
              }}
            />
            <div className="flex justify-between text-white text-sm mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {playing ? (
                  <DynamicIcon name="Pause" className="w-8 h-8" fill="white" />
                ) : (
                  <DynamicIcon name="Play" className="w-8 h-8" fill="white" />
                )}
              </button>

              {/* Previous Episode */}
              <button
                onClick={playPreviousEpisode}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <DynamicIcon name="SkipBack" className="w-6 h-6" />
              </button>

              {/* Next Episode */}
              <button
                onClick={playNextEpisode}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <DynamicIcon name="SkipForward" className="w-6 h-6" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {muted || volume === 0 ? (
                    <DynamicIcon name="VolumeX" className="w-6 h-6" />
                  ) : (
                    <DynamicIcon name="Volume2" className="w-6 h-6" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover:w-24 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Episode Title */}
              <div className="text-white ml-4">
                <span className="font-semibold">{currentEpisode.title}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {/* Audio & Subtitles */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAudio(!showAudio);
                    setShowSettings(false);
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  title="Audio & Subtitles"
                >
                  <DynamicIcon name="MessageSquare" className="w-6 h-6" />
                </button>

                {/* Audio/Subtitle Menu */}
                {showAudio && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-4 min-w-[250px]">
                    <div className="text-white">
                      <p className="text-sm font-semibold mb-2">Audio</p>
                      <div className="space-y-2 mb-4">
                        {['English', 'Spanish', 'French', 'German', 'Arabic'].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setAudioTrack(lang);
                              setShowAudio(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm flex items-center justify-between ${
                              audioTrack === lang ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            <span>{lang}</span>
                            {audioTrack === lang && <span>✓</span>}
                          </button>
                        ))}
                      </div>

                      <p className="text-sm font-semibold mb-2 mt-4">Subtitles</p>
                      <div className="space-y-2">
                        {['Off', 'English', 'Spanish', 'French', 'German', 'Arabic'].map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setSubtitle(sub);
                              setShowAudio(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm flex items-center justify-between ${
                              subtitle === sub ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            <span>{sub}</span>
                            {subtitle === sub && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Episodes List */}
              <button
                onClick={() => setShowEpisodes(!showEpisodes)}
                className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 bg-black/60 hover:bg-black/80 px-4 py-2 rounded"
              >
                <DynamicIcon name="MessageSquare" className="w-5 h-5" />
                <span className="text-sm">Episodes</span>
              </button>

              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setShowAudio(false);
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <DynamicIcon name="Settings" className="w-6 h-6" />
                </button>

                {/* Settings Menu */}
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
                    <div className="text-white">
                      <p className="text-sm font-semibold mb-2">Playback Speed</p>
                      <div className="space-y-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`w-full text-left px-3 py-1 rounded hover:bg-white/10 text-sm ${
                              playbackRate === rate ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            {rate === 1 ? 'Normal' : `${rate}x`}
                          </button>
                        ))}
                      </div>

                      <p className="text-sm font-semibold mt-4 mb-2">Quality</p>
                      <div className="space-y-2">
                        {['Auto', '1080p', '720p', '480p', '360p'].map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`w-full text-left px-3 py-1 rounded hover:bg-white/10 text-sm ${
                              quality === q ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {fullscreen ? (
                  <DynamicIcon name="Minimize" className="w-6 h-6" />
                ) : (
                  <DynamicIcon name="Maximize" className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Episodes Sidebar */}
        {showEpisodes && (
          <div className="absolute top-0 right-0 bottom-0 w-96 bg-black/95 backdrop-blur-sm overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">{course.title}</h2>
                <button
                  onClick={() => setShowEpisodes(false)}
                  className="text-white hover:text-gray-300"
                >
                  <DynamicIcon name="ChevronDown" className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {course.episodes.map((episode, index) => (
                  <div
                    key={episode.id}
                    onClick={() => selectEpisode(episode)}
                    className={`cursor-pointer rounded-lg overflow-hidden transition-all hover:bg-white/10 ${
                      currentEpisode.id === episode.id ? 'ring-2 ring-red-600' : ''
                    }`}
                  >
                    <div className="flex gap-4 p-3">
                      <div className="relative w-32 h-20 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                        />
                        {episode.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                            <div
                              className="h-full bg-red-600"
                              style={{ width: `${episode.progress}%` }}
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                            <DynamicIcon name="Play" className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <span className="text-gray-400 text-sm">{index + 1}</span>
                          <span className="text-gray-400 text-sm">{episode.duration}</span>
                        </div>
                        <h3 className="text-white font-semibold text-sm mt-1 truncate">
                          {episode.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {episode.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skip Intro/Credits Button */}
        {currentTime > 5 && currentTime < 30 && (
          <button
            onClick={() => skip(25)}
            className="absolute bottom-32 right-8 bg-white/90 hover:bg-white text-black font-semibold px-6 py-3 rounded transition-all"
          >
            Skip Intro
          </button>
        )}

        {/* Next Episode Auto-Play Countdown */}
        {autoPlayCountdown !== null && autoPlayCountdown > 0 && (
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-black/90 backdrop-blur-sm rounded-lg p-6 w-96">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-32 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                <img
                  src={course.episodes[course.episodes.findIndex(ep => ep.id === currentEpisode.id) + 1]?.thumbnail}
                  alt="Next Episode"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs mb-1">Next Episode</p>
                <h4 className="text-white font-semibold text-sm line-clamp-2">
                  {course.episodes[course.episodes.findIndex(ep => ep.id === currentEpisode.id) + 1]?.title}
                </h4>
              </div>
            </div>
            
            <div className="relative mb-3">
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${((15 - autoPlayCountdown) / 15) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setAutoPlayCountdown(null);
                  if (videoRef.current) {
                    videoRef.current.pause();
                    setPlaying(false);
                  }
                }}
                className="text-white text-sm hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={playNextEpisode}
                className="bg-white hover:bg-gray-200 text-black font-semibold px-6 py-2 rounded transition-colors text-sm"
              >
                Play Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E50914;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }

        input[type='range']:hover::-webkit-slider-thumb {
          opacity: 1;
          transform: scale(1.3);
        }

        input[type='range'] {
          transition: height 0.2s;
        }

        input[type='range']:hover {
          height: 6px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
