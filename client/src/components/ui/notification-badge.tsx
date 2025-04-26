import { Bell } from 'lucide-react';

export default function NotificationBadge({ count, onClick }: { count: number, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="relative p-2 rounded-full hover:bg-gray-100">
      <Bell className="h-6 w-6 text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {count}
        </span>
      )}
    </button>
  );
}
