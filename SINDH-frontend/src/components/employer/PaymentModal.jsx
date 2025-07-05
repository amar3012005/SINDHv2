import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  X,
  AlertCircle 
} from 'lucide-react';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  application, 
  onPaymentComplete 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(application?.job?.salary || 0);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Pay using PhonePe, GPay, Paytm etc.',
      enabled: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay using your bank card',
      enabled: true
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      icon: DollarSign,
      description: 'Mark as paid in cash',
      enabled: true
    }
  ];

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Process payment based on method
      if (paymentMethod === 'cash') {
        // Mark as cash payment
        await processPayment('cash');
      } else if (paymentMethod === 'upi') {
        // Integrate with UPI gateway
        await processUPIPayment();
      } else if (paymentMethod === 'card') {
        // Integrate with card payment gateway
        await processCardPayment();
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (method) => {
    const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/${application._id}/process-payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentAmount: paymentAmount,
        paymentMethod: method
      })
    });

    if (response.ok) {
      onPaymentComplete();
      onClose();
    } else {
      throw new Error('Payment processing failed');
    }
  };

  const processUPIPayment = async () => {
    // Simulate UPI payment flow
    const upiUrl = `upi://pay?pa=worker@upi&pn=${application.worker?.name}&am=${paymentAmount}&cu=INR&tn=Payment for ${application.job?.title}`;
    
    // Open UPI app
    window.open(upiUrl, '_blank');
    
    // Mark payment as completed (in real app, you'd verify with payment gateway)
    setTimeout(() => {
      processPayment('upi');
    }, 3000);
  };

  const processCardPayment = async () => {
    // Integrate with payment gateway like Razorpay, Stripe etc.
    // For demo, we'll simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    await processPayment('card');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Pay Worker
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Worker:</span>
                <span className="font-medium">{application.worker?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Job:</span>
                <span className="font-medium">{application.job?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-green-600">₹{paymentAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                ₹
              </span>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                    {paymentMethod === method.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !paymentAmount}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <DollarSign className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Processing...' : `Pay ₹${paymentAmount}`}
            </button>
          </div>

          {/* Payment Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Payment Policy:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Payment will be credited to worker's account immediately</li>
                  <li>• UPI/Card payments are processed securely</li>
                  <li>• Cash payments should be marked only after actual payment</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
