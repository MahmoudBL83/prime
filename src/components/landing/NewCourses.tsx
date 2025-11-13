import React from 'react';

interface NewCoursesProps {
  courses?: Array<{ id: string; title: string; description: string }>;
}

export default function NewCourses({ courses = [] }: NewCoursesProps) {
  return (
    <section className="new-courses">
      <h2>New Courses</h2>
      {courses.length > 0 ? (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>New courses coming soon...</p>
      )}
    </section>
  );
}
