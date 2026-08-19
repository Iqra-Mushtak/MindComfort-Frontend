import React from 'react';

const MentorPodcastItem = ({ title, date, time, status, onClick }) => {
  const parsedDate = date ? new Date(date) : null;
  const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());

  const readableDate = isValidDate
    ? parsedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : (date || 'Date not set');

  const readableTime = time || (isValidDate
    ? parsedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Time not set');

  return (
    <div 
      className="podcast-item-row d-flex align-items-center justify-content-between"
      onClick={onClick}
    >
      <div className="podcast-icon-circle flex-shrink-0">
        <i className="bi bi-mic-fill"></i>
      </div>

      <div className="flex-grow-1 overflow-hidden me-2">
        <h6 className="text-truncate mb-0">{title}</h6>
        <small className="text-muted text-truncate d-block">
          {readableDate} at {readableTime}
        </small>
      </div>

      <div className={`status-dot ${status} flex-shrink-0`}></div>
    </div>
  );
};

export default MentorPodcastItem;