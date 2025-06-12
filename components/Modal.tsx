
import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timerId = setTimeout(() => {
        setShowContent(true);
      }, 10); 
      return () => clearTimeout(timerId);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className={`bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-[#F29C2A]">{title}</h3> {/* Updated title color */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#F29C2A] transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F29C2A] focus:ring-opacity-50" // Updated hover and ring color
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};