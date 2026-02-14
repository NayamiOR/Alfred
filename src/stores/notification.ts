import {reactive} from 'vue';

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    duration?: number;
}

interface NotificationState {
    notifications: Notification[];
}

export const notificationStore = reactive<NotificationState>({
    notifications: []
});

export const notify = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const notification: Notification = {id, message, type, duration};

    notificationStore.notifications.push(notification);

    if (duration > 0) {
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }
};

export const removeNotification = (id: string) => {
    const index = notificationStore.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notificationStore.notifications.splice(index, 1);
    }
};
