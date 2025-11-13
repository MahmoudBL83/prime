import React from 'react';

interface SubscriptionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="subscription-modal">
      <div className="modal-content">
        <h2>Subscription</h2>
        <p>Subscription functionality coming soon...</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
