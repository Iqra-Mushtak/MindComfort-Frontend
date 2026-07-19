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
      className="podcast-item-row"
      onClick={onClick}
    >
      <div className="podcast-icon-circle">
        <i className="bi bi-mic-fill"></i>
      </div>

      <div className="flex-grow-1 overflow-hidden">
        <h6>{title}</h6>
        <small>{readableDate} at {readableTime}</small>
      </div>

      <div className={`status-dot ${status}`}></div>
    </div>
  );
};

export default MentorPodcastItem;