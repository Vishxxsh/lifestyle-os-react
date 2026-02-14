
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, onBack, children }) => {
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
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Card */}
      <div 
        className={`relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl transform transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle for mobile drag visual */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden"></div>

        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-1">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-1 -ml-3 mr-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 text-gray-900 dark:text-gray-100 no-scrollbar pb-6">
           {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
