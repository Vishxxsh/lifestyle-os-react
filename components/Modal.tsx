
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(isOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else setTimeout(() => setVisible(false), 300);
  }, [isOpen]);

  if (!mounted) return null;
  if (!visible) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Card */}
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 text-gray-900 dark:text-gray-100">
           {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
