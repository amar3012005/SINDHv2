import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  Clock,
  History
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { db } from '../../config/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const WorkerWallet = () => {
  const { user } = useUser();
  const [walletData, setWalletData] = useState({
    balance: 0,
    withdrawableBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    // 1. Listen to worker document for balance changes
    const workerDocRef = doc(db, 'workers', user.id);
    const unsubscribeWorker = onSnapshot(workerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const workerData = docSnap.data();
        setWalletData(prev => ({
          ...prev,
          balance: workerData.wallet?.totalBalance || workerData.balance || 0,
          withdrawableBalance: workerData.wallet?.withdrawableBalance || 0,
          heldBalance: (workerData.wallet?.totalBalance || workerData.balance || 0) - (workerData.wallet?.withdrawableBalance || 0),
          totalEarned: workerData.wallet?.totalEarnings || 0,
          totalSpent: workerData.wallet?.withdrawnAmount || 0,
        }));
      }
    }, (err) => {
      console.error("Error listening to worker doc:", err);
    });

    // 2. Listen to transactions sub-collection
    const txQuery = query(
      collection(db, 'workers', user.id, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
      const transactions = snapshot.docs.map(docSnap => {
        const t = docSnap.data();
        return {
          id: docSnap.id,
          ...t,
          date: t.createdAt?.toDate ? t.createdAt.toDate() : (t.createdAt || new Date()),
        };
      });

      setWalletData(prev => ({
        ...prev,
        transactions
      }));
      setLoading(false);
    }, (error) => {
      console.error('Error listening to transactions:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeWorker();
      unsubscribeTx();
    };
  }, [user?.id]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > walletData.withdrawableBalance) {
      toast.error(`Insufficient withdrawable balance. Available: ₹${walletData.withdrawableBalance}`);
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/workers/${user.id}/withdraw`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: 'bank_transfer'
        })
      });

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#3B4883]/10 border-t-[#FF7124] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#202124] relative overflow-hidden pb-24">
      {/* Background matching design system */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }} />
        <div className="absolute inset-0 opacity-100" style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-8">
        <h1 className="text-3xl font-black text-[#3B4883] uppercase tracking-tight mb-8">
          |MY_EARNINGS
        </h1>

        {/* Worker Balance Card - Two Parts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#3B4883] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-1">Total Net Worth</p>
                <h2 className="text-5xl font-black">₹{walletData.balance.toLocaleString()}</h2>
              </div>
              <WalletIcon className="w-10 h-10 text-[#FF7124]" />
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase mb-1">Available Cash</p>
                    <p className="text-2xl font-black">₹{walletData.withdrawableBalance.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="mt-4 bg-[#FF7124] text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-[#FF7124]/20 active:scale-95 transition-all w-full"
                  >
                    Withdraw
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <p className="text-[10px] font-black text-white/50 uppercase mb-1">Frozen / Pending</p>
                  <p className="text-2xl font-black text-blue-300">₹{walletData.heldBalance?.toLocaleString() || 0}</p>
                  <p className="text-[8px] text-white/30 uppercase mt-2">Released on Job Completion</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">Lifetime Earned</p>
                  <p className="text-lg font-black text-emerald-400">₹{walletData.totalEarned.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase mb-1">Total Withdrawn</p>
                  <p className="text-lg font-black text-orange-300">₹{walletData.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction History Section */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-black text-[#3B4883]/40 uppercase tracking-widest">Transaction Records</p>
          <History className="w-4 h-4 text-[#3B4883]/20" />
        </div>

        <div className="space-y-4">
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-[#3B4883]/10">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 text-[#3B4883]/10" />
              <p className="text-xs font-bold text-[#3B4883]/40 uppercase">No history yet</p>
            </div>
          ) : (
            walletData.transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border-2 border-[#3B4883]/5 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#FF7124]/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'withdrawal' ? 'bg-orange-50 text-[#FF7124]' : 
                    tx.type === 'credit_pending' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {tx.type === 'withdrawal' ? <ArrowDownLeft className="w-6 h-6" /> : 
                     tx.type === 'credit_pending' ? <Clock className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#3B4883] uppercase group-hover:text-[#FF7124] transition-colors line-clamp-1">
                      {tx.description}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-[#3B4883]/40 uppercase">{formatDate(tx.date)}</p>
                      {tx.type === 'credit_pending' && (
                        <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Committed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'withdrawal' ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-[#FF7124]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-10 h-10 text-[#FF7124]" />
                </div>
                <h3 className="text-2xl font-black text-[#3B4883] uppercase tracking-tight mb-2">Withdraw Cash</h3>
                <p className="text-sm font-bold text-[#3B4883]/40">Available: <span className="text-[#3B4883]">₹{walletData.withdrawableBalance}</span></p>
              </div>

              <div className="mb-8">
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#3B4883]/20 transition-colors group-focus-within:text-[#FF7124]">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#F8F5F2] border-2 border-transparent focus:border-[#FF7124] focus:bg-white rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-[#3B4883] outline-none transition-all text-center"
                    placeholder="0"
                    max={walletData.withdrawableBalance}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleWithdraw}
                  className="w-full py-5 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e66420] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-[#FF7124]/20"
                >
                  Confirm Withdrawal
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full py-3 text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest hover:text-[#FF7124] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkerWallet;
