import React, { useState, useEffect } from 'react';
import { Menu, X, DollarSign, Wallet, MessageCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LogoutButton from './LogoutButton';
import LanguageSwitcher from './LanguageSwitcher';
import { getApiUrl } from '../utils/apiUtils';

// Import the logo SVG
import LogoSVG from '../assets/logo.svg';

// Animated Pattern Components for Navbar
const NavFloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 8 + 4; // Smaller for navbar
  const duration = Math.random() * 8 + 12;
  
  const initialX = Math.random() * 100;
  const initialY = Math.random() * 20;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-5"
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}px`,
      }}
      animate={{
        x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
        y: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.2, 0.8, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    >
      {shape === 'square' && <div className="w-full h-full bg-black" />}
      {shape === 'circle' && <div className="w-full h-full bg-black rounded-full" />}
      {shape === 'triangle' && (
        <div 
          className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-black"
        />
      )}
    </motion.div>
  );
};

const NavAnimatedGrid = ({ opacity = 0.03 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, black 0.5px, transparent 0.5px),
            linear-gradient(black 0.5px, transparent 0.5px)
          `,
          backgroundSize: '25px 25px'
        }}
        animate={{
          x: [0, 25, 0],
          y: [0, 25, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const NavParticleField = ({ count = 8 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-0.5 h-0.5 bg-black rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -8, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.3, 1]
      }}
      transition={{
        duration: Math.random() * 2 + 3,
        repeat: Infinity,
        delay: Math.random() * 2,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const NavGeometricOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated mini triangles */}
      <motion.div
        className="absolute top-2 right-20 w-3 h-3 opacity-10"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,80 10,80" fill="black" />
        </svg>
      </motion.div>

      {/* Animated mini squares */}
      <motion.div
        className="absolute top-2 left-32 w-2 h-2 opacity-10"
        animate={{
          rotate: [0, 45, 0],
          x: [0, 8, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-black transform rotate-45" />
      </motion.div>

      {/* Animated mini circles */}
      <motion.div
        className="absolute top-1 right-40 opacity-10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-2 h-2 border border-black rounded-full" />
      </motion.div>
    </div>
  );
};

const Navbar = () => {
  // Simply return null to remove navbar from all pages
  return null;
};

export default Navbar;