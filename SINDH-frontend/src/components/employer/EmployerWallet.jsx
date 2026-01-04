import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  DollarSign,
  History,
  Building
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { db } from '../../config/firebase';
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const EmployerWallet = () => {
  const { user } = useUser();
  const [walletData, setWalletData] = useState({
    balance: 0,
    spentAmount: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    // 1. Listen to employer document for balance changes
    const employerDocRef = doc(db, 'employers', user.id);
    const unsubscribeEmployer = onSnapshot(employerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const employerData = docSnap.data();
        setWalletData(prev => ({
          ...prev,
          balance: employerData.wallet?.totalBalance || 0,
          spentAmount: employerData.wallet?.spentAmount || 0,
        }));
      }
    }, (err) => {
      console.error("Error listening to employer doc:", err);
    });

    // 2. Listen to transactions sub-collection
    const txQuery = query(
      collection(db, 'employers', user.id, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
      const transactions = snapshot.docs.map(docSnap => {
        const t = docSnap.data();
        return {
          id: docSnap.id,
          ...t,
          date: t.createdAt?.toDate ? t.createdAt.toDate() : (t.createdAt || new Date())
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
      unsubscribeEmployer();
      unsubscribeTx();
    };
  }, [user?.id]);

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
          |HIRING_WALLET
        </h1>

        {/* Main Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#3B4883] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden mb-8"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          
          <div className="relative z-10">
            <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-2">Available Funds</p>
            <h2 className="text-5xl font-black mb-8">₹{walletData.balance.toLocaleString()}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black text-white/50 uppercase mb-1">Total Spent</p>
                <p className="text-xl font-black">₹{walletData.spentAmount.toLocaleString()}</p>
              </div>
              <button className="bg-[#FF7124] text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-black uppercase text-sm shadow-lg shadow-[#FF7124]/20 active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
                Add Cash
              </button>
            </div>
          </div>
        </motion.div>

        {/* Transaction History Section */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-black text-[#3B4883]/40 uppercase tracking-widest">Recent Transactions</p>
          <History className="w-4 h-4 text-[#3B4883]/20" />
        </div>

        <div className="space-y-4">
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-[#3B4883]/10">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-[#3B4883]/10" />
              <p className="text-xs font-bold text-[#3B4883]/40 uppercase">No transactions yet</p>
            </div>
          ) : (
            walletData.transactions.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border-2 border-[#3B4883]/5 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#FF7124]/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'debit' ? 'bg-orange-50 text-[#FF7124]' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {tx.type === 'debit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#3B4883] uppercase group-hover:text-[#FF7124] transition-colors line-clamp-1">
                      {tx.description}
                    </h4>
                    <p className="text-[10px] font-bold text-[#3B4883]/40 uppercase">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'debit' ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {tx.type === 'debit' ? '-' : '+'}₹{tx.amount}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerWallet;



