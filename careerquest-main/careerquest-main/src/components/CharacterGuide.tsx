import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CharacterGuideProps {
  message: string;
  onClose?: () => void;
  onOpenChat?: () => void;
  autoClose?: boolean;
  position?: 'bottom-right' | 'center';
}

// Renamed visually to CareerSage (wizard-themed). File kept as CharacterGuide.tsx
export function CareerSage({
  message,
  onClose,
  onOpenChat,
  autoClose = false,
  position = 'bottom-right'
}: CharacterGuideProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  const positionClasses = position === 'center'
    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    : 'bottom-8 right-8';

  return (
    <div className={`fixed ${positionClasses} z-50 max-w-md`}>
      <div className="relative">
        <div className="absolute -top-14 -left-14 w-36 h-36 animate-float">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full blur-2xl opacity-60" />
            {/* Use a real wizard emoji for Astra (keeps the floating animation) */}
            <div className="relative w-full h-full flex items-center justify-center drop-shadow-2xl">
              <span role="img" aria-label="Astra the wizard" className="text-8xl leading-none">🧙‍♂️</span>
            </div>
          </div>
        </div>

        <div className={`ml-28 bg-white rounded-3xl shadow-2xl p-6 border-2 border-indigo-200 relative ${isAnimating ? 'animate-wiggle' : ''}`}>
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="absolute -top-3 -right-3 p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors shadow-lg text-white"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                {/* replace small hat SVG with wizard emoji */}
                <span role="img" aria-label="Astra avatar" className="text-2xl leading-none">🧙‍♂️</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="font-extrabold text-indigo-700 mb-1">Astra</div>
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onOpenChat?.()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-semibold"
            >
              Chat with Astra
            </button>

            <button
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm font-medium"
            >
              Dismiss
            </button>
          </div>

          <div className="absolute -bottom-3 left-12 w-6 h-6 bg-white border-b-4 border-r-4 border-indigo-200 transform rotate-45" />
        </div>
      </div>
    </div>
  );
}
