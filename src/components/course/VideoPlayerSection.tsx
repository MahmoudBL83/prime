import React from 'react';

interface VideoPlayerSectionProps {
  videoUrl?: string;
  title?: string;
}

export default function VideoPlayerSection({ videoUrl, title }: VideoPlayerSectionProps) {
  return (
    <div className="video-player-section">
      <h3>{title || 'Video Player'}</h3>
      {videoUrl ? (
        <video controls className="w-full">
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="bg-gray-200 p-8 text-center">
          <p>Video player placeholder</p>
        </div>
      )}
    </div>
  );
}
