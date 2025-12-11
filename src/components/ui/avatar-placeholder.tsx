'use client';

import React from 'react';

interface AvatarPlaceholderProps {
  name?: string;
  size?: number;
  className?: string;
}

// Color palette for avatar backgrounds
const colors = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
];

// Get a consistent color based on name
function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get first letter of name
function getInitial(name: string): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// Simple letter avatar placeholder
export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({ 
  name = '', 
  size = 100, 
  className = '' 
}) => {
  const bgColor = getColorFromName(name);
  const initial = getInitial(name);
  const fontSize = size * 0.45;

  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: fontSize,
        fontWeight: 600,
        color: 'white',
      }}
    >
      {initial}
    </div>
  );
};

export default AvatarPlaceholder;
