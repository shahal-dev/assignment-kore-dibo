import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function useNotifications(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { data: notifications = [], refetch, isFetching } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = await fetch(`/api/notifications`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await fetch(`/api/notifications/mark-read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['notifications', userId]),
  });

  return { notifications, refetch, isFetching, markReadMutation };
}
