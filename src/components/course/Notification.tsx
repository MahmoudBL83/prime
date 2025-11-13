import React from 'react';

interface NotificationProps {
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export default function Notification({ message, type = 'info' }: NotificationProps) {
  return (
    <div className={`notification notification-${type}`}>
      {message || 'Notification placeholder'}
    </div>
  );
}
