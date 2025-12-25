import React, { useState, useEffect, useRef } from 'react';
import { Bell, Trash2, Clock, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../services/notificationService';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Load notifications
    const loadNotifications = () => {
        setNotifications(getNotifications());
        setUnreadCount(getUnreadCount());
    };

    useEffect(() => {
        loadNotifications();

        // Listen for notification events
        const handleNotificationAdded = () => loadNotifications();
        const handleNotificationRead = () => loadNotifications();
        const handleNotificationDeleted = () => loadNotifications();

        window.addEventListener('notificationAdded', handleNotificationAdded);
        window.addEventListener('notificationRead', handleNotificationRead);
        window.addEventListener('notificationDeleted', handleNotificationDeleted);
        window.addEventListener('notificationsCleared', handleNotificationAdded);
        window.addEventListener('pendingNotificationsReceived', handleNotificationAdded);

        return () => {
            window.removeEventListener('notificationAdded', handleNotificationAdded);
            window.removeEventListener('notificationRead', handleNotificationRead);
            window.removeEventListener('notificationDeleted', handleNotificationDeleted);
            window.removeEventListener('notificationsCleared', handleNotificationAdded);
            window.removeEventListener('pendingNotificationsReceived', handleNotificationAdded);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.actionLink) {
            navigate(notification.actionLink);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    const handleDelete = (e, notificationId) => {
        e.stopPropagation();
        deleteNotification(notificationId);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'application': return '📝';
            case 'job_update': return '💼';
            case 'payment': return '💰';
            case 'welcome': return '👋';
            default: return '🔔';
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-[#3B4883]/5 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6 text-[#3B4883]" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 max-h-[500px] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                            <h3 className="font-semibold text-neutral-900 flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-primary-500" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4 mr-1" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                                    <p className="text-sm font-medium">No notifications yet</p>
                                    <p className="text-xs mt-1">We'll notify you when something new happens</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary-50/30' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start">
                                                <span className="text-2xl mr-3 flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <p className={`text-sm font-medium ${!notification.read ? 'text-neutral-900' : 'text-neutral-700'
                                                            }`}>
                                                            {notification.title}
                                                        </p>
                                                        <button
                                                            onClick={(e) => handleDelete(e, notification.id)}
                                                            className="ml-2 p-1 hover:bg-neutral-200 rounded transition-colors"
                                                            aria-label="Delete notification"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-neutral-400" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-neutral-400 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {getTimeAgo(notification.timestamp)}
                                                        </span>
                                                        {notification.actionText && (
                                                            <span className="text-xs text-primary-600 font-medium">
                                                                {notification.actionText} →
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full ml-2 flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
