import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Trash2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const collectionName = user.type === 'worker' ? 'workers' : 'employers';
    const notifRef = collection(db, collectionName, user.id, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setNotifications(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, isOpen]);

  const markAsRead = async (notifId) => {
    const collectionName = user.type === 'worker' ? 'workers' : 'employers';
    const notifRef = doc(db, collectionName, user.id, 'notifications', notifId);
    await updateDoc(notifRef, { read: true });
  };

  const markAllAsRead = async () => {
    const collectionName = user.type === 'worker' ? 'workers' : 'employers';
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      const ref = doc(db, collectionName, user.id, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (e, notifId) => {
    e.stopPropagation();
    const collectionName = user.type === 'worker' ? 'workers' : 'employers';
    const notifRef = doc(db, collectionName, user.id, 'notifications', notifId);
    await deleteDoc(notifRef);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    
    // Navigate based on type
    if (notif.data?.type === 'new_application' && user.type === 'employer') {
      navigate(`/employer/job/${notif.data.jobId}`);
    } else if (notif.data?.type === 'payment_received' && user.type === 'worker') {
      navigate('/worker/wallet');
    }
    
    onClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_application': return <Briefcase className="w-4 h-4 text-[#FF7124]" />;
      case 'payment_received': return <DollarSign className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-[#3B4883]" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3B4883]/20 backdrop-blur-sm z-[1000]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[1001] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b-2 border-[#3B4883]/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#3B4883] uppercase tracking-tight">Notifications</h2>
                <p className="text-[10px] font-bold text-[#3B4883]/40 uppercase tracking-widest mt-1">
                  {notifications.filter(n => !n.read).length} Unread Messages
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-[#3B4883]/5 flex items-center justify-center text-[#3B4883]/40 hover:text-[#FF7124] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 bg-[#F8F5F2] flex items-center justify-between">
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-black text-[#FF7124] uppercase tracking-widest hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#FF7124] animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-20 h-20 bg-[#3B4883]/5 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-[#3B4883]/10" />
                  </div>
                  <h3 className="text-sm font-black text-[#3B4883] uppercase tracking-widest">No Notifications</h3>
                  <p className="text-xs font-bold text-[#3B4883]/40 mt-2 uppercase">We'll let you know when something happens</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-[#3B4883]/5">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-6 cursor-pointer transition-all hover:bg-[#F8F5F2] relative group ${!notif.read ? 'bg-[#FF7124]/5' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.read ? 'bg-white shadow-md' : 'bg-[#3B4883]/5'}`}>
                          {getIcon(notif.data?.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-black uppercase truncate ${!notif.read ? 'text-[#3B4883]' : 'text-[#3B4883]/60'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[8px] font-bold text-[#3B4883]/30 uppercase shrink-0">
                              {new Date(notif.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.read ? 'font-bold text-[#272D4E]' : 'text-[#272D4E]/60'}`}>
                            {notif.body}
                          </p>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(e, notif.id)}
                        className="absolute right-2 bottom-2 p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;

