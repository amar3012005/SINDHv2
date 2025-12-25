import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

const SuccessAnimation = ({
    title = "Success!",
    message = "Your action was completed successfully.",
    redirectMessage = "Redirecting in 5 seconds...",
    onComplete
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2
                    }}
                    className="mx-auto mb-6"
                >
                    <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-16 h-16 text-success" strokeWidth={2} />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-neutral-900 mb-3"
                >
                    {title}
                </motion.h2>

                {/* Message */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-neutral-600 text-lg mb-6"
                >
                    {message}
                </motion.p>

                {/* Redirect Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center text-primary-600 font-medium"
                >
                    <ArrowRight className="w-5 h-5 mr-2 animate-pulse" />
                    {redirectMessage}
                </motion.div>

                {/* Loading Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="mt-6 h-1 bg-primary-500 rounded-full"
                />
            </motion.div>
        </motion.div>
    );
};

export default SuccessAnimation;
