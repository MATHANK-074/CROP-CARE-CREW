/**
 * FloatingChatButton Component
 * 
 * A floating action button that opens the farming assistant chatbot.
 * Positioned in the bottom-right corner of the screen.
 */

import React, { useState } from 'react';
import { FaComments, FaSeedling } from 'react-icons/fa';
import ChatBot from './ChatBot';

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
        <button
          onClick={toggleChat}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
          aria-label="Open farming assistant chat"
        >
          <div className="relative">
            {isChatOpen ? (
              <FaSeedling className="text-xl" />
            ) : (
              <>
                <FaComments className="text-xl" />
                {/* Notification dot - could be used for new features */}
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Chat Bot Modal */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default FloatingChatButton;