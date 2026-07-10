import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import {
  ScaleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { jwtDecode } from "jwt-decode";
import customerAuthService from "@/service/customer-auth.service";

const NewRequestModal = ({ isOpen, onClose, buttonRef }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const customerAccountToken = localStorage.getItem("customerAccountToken");
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef(null);

  const handleDisciplineRequest = () => {
    navigate("/home/new-disciplinary-request");
    onClose(); // Close modal after navigation
  };

  const handleComplaintRequest = () => {
    navigate("/home/new-complaint-request");
    onClose(); // Close modal after navigation
  };

  useEffect(() => {
    if (customerAccountToken) {
      const decodedToken = jwtDecode(customerAccountToken);
      const userId = decodedToken.id;

      const fetchUserProfile = async () => {
        try {
          const response = await customerAuthService.getCustomerById(userId);
          setUserProfile(response.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };

      fetchUserProfile();
    }
  }, [customerAccountToken]);

  // Calculate modal position based on button position
  useEffect(() => {
    if (isOpen) {
      const updatePosition = () => {
        if (buttonRef) {
          const rect = buttonRef.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;

          setModalPosition({
            top: rect.bottom + scrollY + 8,
            left: rect.left + scrollX + (rect.width / 2),
          });
        } else {
          // Fallback: center the modal if button ref is not available
          setModalPosition({
            top: window.innerHeight / 2 + window.scrollY,
            left: window.innerWidth / 2 + window.scrollX,
          });
        }
      };

      // Small delay to ensure button is rendered
      const timeoutId = setTimeout(updatePosition, 10);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, buttonRef]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && buttonRef && !buttonRef.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  console.log("Modal is rendering, isOpen:", isOpen, "buttonRef:", buttonRef, "position:", modalPosition);

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .modal-enter {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 modal-enter"
        style={{
          top: modalPosition.top > 0 ? `${modalPosition.top}px` : '50%',
          left: modalPosition.left > 0 ? `${modalPosition.left}px` : '50%',
          transform: modalPosition.top > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[clamp(280px,16.67vw,320px)] overflow-hidden">
          {/* Modal Header */}
          {/* <div className="bg-gradient-to-r from-primary to-primary-dark px-[clamp(16px,0.83vw,16px)] py-[clamp(12px,0.69vh,12px)] flex items-center justify-between">
            <h3 className="text-white font-semibold text-[clamp(12px,0.73vw,14px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>Choose Report Type</h3>
            <button
              onClick={onClose}
              className="p-[clamp(4px,0.21vw,4px)] hover:bg-white/20 rounded-full transition-colors"
            >
              <XMarkIcon className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-white" />
            </button>
          </div> */}

          {/* Modal Content */}
          <div className="p-[clamp(16px,0.83vw,16px)] space-y-[clamp(10px,0.52vw,12px)]">
            {/* Disciplinary Case */}
            <button
              onClick={handleDisciplineRequest}
              className="w-full p-[clamp(10px,0.52vw,12px)] bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-[clamp(10px,0.52vw,12px)]">
                <div className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ScaleIcon className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[clamp(12px,0.73vw,14px)] font-semibold text-gray-800 group-hover:text-primary transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Disciplinary Report
                  </p>
                  <p className="text-[clamp(10px,0.63vw,12px)] text-gray-500 mt-[clamp(2px,0.14vh,2px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Report disciplinary issues
                  </p>
                </div>
              </div>
            </button>

            {/* Complaint Case */}
            <button
              onClick={handleComplaintRequest}
              className="w-full p-[clamp(10px,0.52vw,12px)] bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-[clamp(10px,0.52vw,12px)]">
                <div className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ExclamationTriangleIcon className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[clamp(12px,0.73vw,14px)] font-semibold text-gray-800 group-hover:text-primary transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Complaint Report
                  </p>
                  <p className="text-[clamp(10px,0.63vw,12px)] text-gray-500 mt-[clamp(2px,0.14vh,2px)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Report complaint issues
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewRequestModal;