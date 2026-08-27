import React from 'react';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-slate';

  switch (status) {
    case 'Draft':
      badgeClass = 'badge-slate';
      break;
    case 'Submitted':
      badgeClass = 'badge-blue';
      break;
    case 'Under Review':
      badgeClass = 'badge-amber';
      break;
    case 'Confirmed':
      badgeClass = 'badge-purple';
      break;
    case 'In Production':
      badgeClass = 'badge-amber';
      break;
    case 'Dispatched':
      badgeClass = 'badge-blue';
      break;
    case 'Completed':
      badgeClass = 'badge-emerald';
      break;
    case 'Cancelled':
      badgeClass = 'badge-rose';
      break;
    default:
      badgeClass = 'badge-slate';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
