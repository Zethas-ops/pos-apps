import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AlertModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const handleShowAlert = (e) => {
      setMessage(e.detail.message || '');
      setIsOpen(true);
    };
    
    window.addEventListener('show-alert', handleShowAlert);
    
    // Override window.alert
    const originalAlert = window.alert;
    window.alert = (msg) => {
      window.dispatchEvent(new CustomEvent('show-alert', { detail: { message: msg } }));
    };
    
    return () => {
      window.removeEventListener('show-alert', handleShowAlert);
      window.alert = originalAlert; // Restore if unmounted
    };
  }, []);
  
  if (!isOpen) return null;
  
  const isError = message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('cannot');
  const isSuccess = message.toLowerCase().includes('success') || message.toLowerCase().includes('saved') || message.toLowerCase().includes('printed');
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 min-w-[320px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all border border-gray-100">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4">
            {isError ? (
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <AlertCircle size={32} />
              </div>
            ) : isSuccess ? (
              <div className="bg-green-100 text-green-600 p-4 rounded-full">
                <CheckCircle size={32} />
              </div>
            ) : (
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
                <Info size={32} />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isError ? "Oops!" : isSuccess ? "Success" : "Information"}
          </h3>
          <p className="text-sm text-gray-600 mb-6 font-medium">
            {message}
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
