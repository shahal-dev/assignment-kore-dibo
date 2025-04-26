import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import { X } from 'lucide-react';

export default function NotificationCenter({ open, onClose }: { open: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const { notifications, markReadMutation } = useNotifications(user?.id);

  return (
    <div className={`fixed top-16 right-4 w-80 max-w-full bg-white shadow-lg rounded-lg border z-50 transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <span className="font-semibold text-lg">Notifications</span>
        <button onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y">
        {notifications.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">No notifications</div>
        ) : notifications.map(n => (
          <div key={n.id} className={`p-4 ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
            <div className="font-medium">{n.message}</div>
            {n.link && <a href={n.link} className="text-blue-500 underline text-sm">View</a>}
            {!n.read && (
              <button className="ml-2 text-xs text-blue-600 underline" onClick={() => markReadMutation.mutate(n.id)}>Mark as read</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
