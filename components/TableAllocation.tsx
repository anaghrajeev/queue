import { useEffect, useState } from "react";

interface TableAllocationProps {
  assignedTableId: string;
  userName: string;
  checkInId: number | string;
  currentIndex: number;
  totalSeated: number;
  onClose: () => void;
}

const TableAllocation = ({ 
  assignedTableId, 
  userName, 
  checkInId, 
  currentIndex, 
  totalSeated, 
  onClose 
}: TableAllocationProps) => {
  const [timeLeft, setTimeLeft] = useState(20);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Reset timer when a new check-in is displayed
    setTimeLeft(20);
    setIsVisible(true);
  }, [checkInId]);

  useEffect(() => {
    // Set up countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(countdownInterval);
          setIsVisible(false);
          onClose();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Cleanup timers on component unmount
    return () => {
      clearInterval(countdownInterval);
    };
  }, [checkInId, onClose]);

  // Handle manual close when needed
  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  // Don't render if no table ID or not visible
  if (!assignedTableId || assignedTableId === "" || !isVisible) return null;

  return (
    <div className="w-full flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4">
      <div className="bg-white w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header - Ticket-like tear edge */}
        <div className="bg-black h-8 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0">
            <svg viewBox="0 0 100 10" className="w-full">
              <path 
                d="M0,0 L5,5 L10,0 L15,5 L20,0 L25,5 L30,0 L35,5 L40,0 L45,5 L50,0 L55,5 L60,0 L65,5 L70,0 L75,5 L80,0 L85,5 L90,0 L95,5 L100,0 L100,10 L0,10 Z" 
                fill="white"
              />
            </svg>
          </div>
        </div>
        
        {/* Ticket Header */}
        <div className="text-center py-6 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reserved Seating</div>
          <div className="text-2xl font-bold text-black mt-1">CONFIRMATION</div>
          {totalSeated > 1 && (
            <div className="text-sm text-gray-500 mt-1">
              {currentIndex + 1} of {totalSeated}
            </div>
          )}
        </div>
        
        {/* Guest Information */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">GUEST</div>
          <div className="text-2xl font-semibold text-black">{userName}</div>
        </div>
        
        {/* Table Information */}
        <div className="px-8 py-6 bg-gray-50 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">TABLE</div>
            <div className="text-4xl font-bold text-black">{assignedTableId}</div>
          </div>
          <div className="border-2 border-black h-20 w-20 flex items-center justify-center">
            <div className="text-4xl font-bold">{assignedTableId}</div>
          </div>
        </div>
        
        {/* Countdown Timer */}
        <div className="px-8 py-4 text-center">
          <div className="text-sm font-medium text-gray-500 mb-1">THIS TICKET WILL CLOSE IN</div>
          <div className="text-xl font-bold text-red-600">{timeLeft} seconds</div>
        </div>
        
        {/* Footer with buttons */}
        <div className="flex border-t border-gray-200">
          <button 
            onClick={handleClose}
            className="flex-1 py-3 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {currentIndex < totalSeated - 1 && (
            <button 
              onClick={handleClose}
              className="flex-1 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Next Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableAllocation;