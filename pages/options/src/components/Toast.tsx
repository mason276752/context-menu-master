import { useEffect } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
  isLight?: boolean;
}

export const Toast = ({ message, duration = 2000, onClose, isLight = true }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg ${
          isLight ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } transition-all duration-200 transform translate-y-0`}>
        {message}
      </div>
    </div>
  );
};
