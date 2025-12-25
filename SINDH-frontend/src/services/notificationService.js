// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    APPLICATION: 'application',
    JOB_UPDATE: 'job_update',
    PAYMENT: 'payment',
    WELCOME: 'welcome'
};

// Create notification
export const createNotification = (notification) => {
    const newNotification = {
        id: Date.now() + Math.random(), // Ensure uniqueness
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
    };

    const notifications = getNotifications();
    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(0, 50);
    localStorage.setItem('notifications', JSON.stringify(trimmedNotifications));

    // Trigger custom event for real-time updates
    window.dispatchEvent(new CustomEvent('notificationAdded', {
        detail: newNotification
    }));

    return newNotification;
};

// Get all notifications
export const getNotifications = () => {
    try {
        return JSON.parse(localStorage.getItem('notifications') || '[]');
    } catch {
        return [];
    }
};

// Get unread count
export const getUnreadCount = () => {
    const notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
};

// Mark notification as read
export const markAsRead = (notificationId) => {
    const notifications = getNotifications();
    const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));

    window.dispatchEvent(new Event('notificationRead'));
};

// Mark all as read
export const markAllAsRead = () => {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updated));

    window.dispatchEvent(new Event('notificationRead'));
};

// Delete notification
export const deleteNotification = (notificationId) => {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(filtered));

    window.dispatchEvent(new Event('notificationDeleted'));
};

// Clear all notifications
export const clearAllNotifications = () => {
    localStorage.setItem('notifications', '[]');
    window.dispatchEvent(new Event('notificationsCleared'));
};

// Check for pending notifications (for current user)
export const checkPendingNotifications = (userId) => {
    if (!userId) return;

    const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '{}');
    const userNotifications = pendingNotifications[userId] || [];

    if (userNotifications.length > 0) {
        // Add to current notifications
        const currentNotifications = getNotifications();
        const merged = [...userNotifications, ...currentNotifications];
        localStorage.setItem('notifications', JSON.stringify(merged.slice(0, 50)));

        // Clear pending for this user
        delete pendingNotifications[userId];
        localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));

        // Trigger event
        window.dispatchEvent(new CustomEvent('pendingNotificationsReceived', {
            detail: { count: userNotifications.length }
        }));
    }
};

// Create pending notification for another user (e.g., worker when employer accepts application)
export const createPendingNotification = (userId, notification) => {
    if (!userId) return;

    const pendingNotifications = JSON.parse(localStorage.getItem('pendingNotifications') || '{}');

    if (!pendingNotifications[userId]) {
        pendingNotifications[userId] = [];
    }

    const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
    };

    pendingNotifications[userId].unshift(newNotification);
    localStorage.setItem('pendingNotifications', JSON.stringify(pendingNotifications));

    return newNotification;
};
