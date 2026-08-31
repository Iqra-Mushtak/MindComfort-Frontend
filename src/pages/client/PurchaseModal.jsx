import React from 'react';
import './PurchaseModal.css';

import React, { useEffect } from 'react';

const PurchaseModal = ({ 
  isOpen, 
  item, 
  itemType, 
  onConfirm, 
  onCancel, 
  isLoading, 
  error,
  onClearError
}) => {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (onClearError) onClearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  if (!isOpen || !item) return null;

  const isPlan = itemType === 'plan';
  const isPodcast = itemType === 'podcast';

  const getFeatures = () => {
    if (isPlan) {
      if (item.type === 'both') {
        return [
          'Community chatroom access',
          'All podcast access',
          `${item.durationMonths} month${item.durationMonths > 1 ? 's' : ''} access`
        ];
      } else if (item.type === 'chat') {
        return [
          'Community chatroom access',
          `${item.durationMonths} month${item.durationMonths > 1 ? 's' : ''} access`
        ];
      } else if (item.type === 'podcast') {
        return [
          'All podcast access',
          `${item.durationMonths} month${item.durationMonths > 1 ? 's' : ''} access`
        ];
      }
    } else if (isPodcast) {
      return [
        'Access to live session',
        'Recording access for 7 days'
      ];
    }
    return [];
  };

  const getTitle = () => {
    return isPlan ? `Subscribe to ${item.name}` : 'Confirm Purchase';
  };

  const getSubtitle = () => {
    if (isPlan) {
      return item.description || '';
    } else if (isPodcast) {
      return `by ${item.mentorName || 'Mentor'}`;
    }
    return '';
  };

  const getDate = () => {
    if (isPlan) return null;
    if (isPodcast) {
      const dateStr = item.startTime || item.scheduledDate;
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return null;
  };

  return (
    <div className="purchase-modal-overlay">
      <div className="purchase-modal">
        <button className="purchase-modal-close" onClick={onCancel}>
          <i className="bi bi-x-lg"></i>
        </button>

        <div className="purchase-modal-content">
          <h3>{getTitle()}</h3>
          
          {item && (
            <>
              <div className="purchase-details">
                {isPlan && (
                  <>
                    <p className="item-name">{item.name}</p>
                    {item.description && (
                      <p className="item-description">{item.description}</p>
                    )}
                  </>
                )}
                
                {isPodcast && (
                  <>
                    <p className="item-name">{item.title}</p>
                    <p className="item-mentor">{getSubtitle()}</p>
                    {getDate() && (
                      <p className="item-date">
                        <i className="bi bi-calendar3"></i>
                        {getDate()}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="purchase-price-section">
                <p className="price-label">Price</p>
                <p className="price-amount">
                  {item.currency || 'PKR'} {item.price?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="purchase-features">
                <p className="features-label">You will get:</p>
                <ul>
                  {getFeatures().map((feature, idx) => (
                    <li key={idx}>
                      <i className="bi bi-check-circle-fill"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="purchase-error">
                  <i className="bi bi-exclamation-circle"></i>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="purchase-modal-actions">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn-confirm" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
