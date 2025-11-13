import React from 'react';

interface CourseContentSectionProps {
  children?: React.ReactNode;
}

export default function CourseContentSection({ children }: CourseContentSectionProps) {
  return (
    <div className="course-content-section">
      {children || <p>Course content loading...</p>}
    </div>
  );
}
