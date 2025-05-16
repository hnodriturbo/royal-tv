// components/ui/StatusBadge.js
const statusMap = {
  sent: { emoji: '📨', label: 'Sent' },
  delivered: { emoji: '📬', label: 'Delivered' },
  read: { emoji: '✅', label: 'Read' },
  deleted: { emoji: '🗑️', label: 'Deleted' },
};

const StatusBadge = ({ status }) => {
  const info = statusMap[status] || { emoji: '❓', label: 'Unknown' };
  return (
    <span className="inline-flex items-center font-bold">
      {info.emoji} {info.label}
    </span>
  );
};

export default StatusBadge;
