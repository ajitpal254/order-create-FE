import React from 'react';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-slate';

  switch (status) {
    case 'draft':
    case 'Draft':
      badgeClass = 'badge-slate';
      break;
    case 'submitted':
    case 'Submitted':
      badgeClass = 'badge-blue';
      break;
    case 'sent':
    case 'Sent':
      badgeClass = 'badge-blue';
      break;
    case 'confirmed':
    case 'Confirmed':
      badgeClass = 'badge-purple';
      break;
    case 'in production':
    case 'In Production':
    case 'Quality Check':
      badgeClass = 'badge-amber';
      break;
    case 'partial':
    case 'Partial':
      badgeClass = 'badge-amber';
      break;
    case 'shipped':
    case 'Shipped':
      badgeClass = 'badge-blue';
      break;
    case 'delivered':
    case 'Delivered':
    case 'closed':
    case 'Closed':
    case 'paid':
    case 'Paid':
      badgeClass = 'badge-emerald';
      break;
    case 'cancelled':
    case 'Cancelled':
    case 'void':
    case 'Void':
    case 'overdue':
    case 'Overdue':
      badgeClass = 'badge-rose';
      break;
    default:
      badgeClass = 'badge-slate';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
