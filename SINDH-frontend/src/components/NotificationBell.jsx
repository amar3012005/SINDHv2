import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useUser();

    useEffect(() => {
        if (!user?.id) return;

        const collectionName = user.type === 'worker' ? 'workers' : 'employers';
        const notifRef = collection(db, collectionName, user.id, 'notifications');
        const q = query(notifRef, where('read', '==', false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.docs.length);
        });

        return () => unsubscribe();
    }, [user?.id]);

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2.5 rounded-2xl bg-white border-2 border-[#3B4883]/5 hover:border-[#FF7124] hover:bg-[#FF7124]/5 transition-all group shadow-sm active:scale-95"
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-[#FF7124] fill-[#FF7124]/10' : 'text-[#3B4883] group-hover:text-[#FF7124]'}`} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-1 -right-1 bg-[#FF7124] text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-lg shadow-[#FF7124]/20 border-2 border-white"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Notification Center Modal */}
            <NotificationCenter 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
            />
        </div>
    );
};

export default NotificationBell;
