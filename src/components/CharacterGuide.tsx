import { useEffect, useRef, useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { useGuide } from '../context/GuideContext';

export function CharacterGuide() {
  const { state, toggleChat, sendMessage, hideGuide } = useGuide();
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (state.isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatHistory, state.isOpen]);

  if (!state.isVisible) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-24 right-8',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  }[state.position];

  return (
    <div className={`fixed ${positionClasses} z-50 flex items-end gap-4 print:hidden`}>

      {/* Chat Window */}
      {state.isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 w-80 sm:w-96 flex flex-col overflow-hidden animate-slide-up origin-bottom-right mb-4 mr-2"
          style={{ height: '500px', maxHeight: '80vh' }}>

          {/* Header - Knight Theme */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 p-4 flex justify-between items-center text-white border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <div>
                <h3 className="font-bold text-sm">Sir Questopher</h3>
                <p className="text-xs text-purple-200">Your Career Knight</p>
              </div>
            </div>
            <button onClick={toggleChat} className="p-1 hover:bg-purple-600 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {state.chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                  ${msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for advice..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Speech Bubble (Only if chat is closed and there is a message) */}
      {!state.isOpen && state.message && (
        <div className={`
          absolute bottom-28 right-0 bg-white rounded-2xl p-4 shadow-xl border border-indigo-100 max-w-xs w-64
          transform transition-all duration-300 origin-bottom-right
          ${state.message ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
        `}>
          <button
            onClick={hideGuide}
            className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 shadow-md hover:bg-gray-200"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
          <div className="flex gap-3">
            <div className="mt-1"><Sparkles className="w-4 h-4 text-yellow-500" /></div>
            <p className="text-sm text-gray-700">{state.message}</p>
          </div>
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b border-r border-indigo-100 transform rotate-45" />
        </div>
      )}

      {/* Character Avatar - ALWAYS VISIBLE */}
      {/* Avatar Button - Knight Theme */}
      <button
        onClick={toggleChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-20 h-20 rounded-full 
          bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700
          shadow-2xl border-4 border-amber-300
          hover:scale-110 active:scale-95 transition-all duration-300
        `}
        style={{
          boxShadow: '0 10px 40px rgba(217, 119, 6, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Robot Knight SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="armorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" /> {/* slate-300 */}
              <stop offset="100%" stopColor="#64748b" /> {/* slate-500 */}
            </linearGradient>
            <linearGradient id="visrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* Helmet Plume */}
          <path d="M 50 15 Q 65 5 70 20" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" className="animate-wave" />

          {/* Helmet/Head */}
          <circle cx="50" cy="40" r="18" fill="url(#armorGradient)" stroke="#475569" strokeWidth="2" />

          {/* Visor/Eye Area */}
          <path d="M 38 38 Q 50 38 62 38 L 62 44 Q 50 48 38 44 Z" fill="#1e293b" />

          {/* Glowing Eyes */}
          <g className={state.emotion === 'thinking' ? 'animate-pulse' : ''}>
            <circle cx="44" cy="41" r="2" fill="#60a5fa" />
            <circle cx="56" cy="41" r="2" fill="#60a5fa" />
          </g>

          {/* Body/Armor */}
          <rect x="35" y="60" width="30" height="35" rx="5" fill="url(#armorGradient)" stroke="#475569" strokeWidth="2" />

          {/* Shield Emblem */}
          <circle cx="50" cy="75" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />

          {/* Arms */}
          <path d="M 35 65 Q 20 70 25 80" stroke="#64748b" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M 65 65 Q 80 70 75 80" stroke="#64748b" strokeWidth="5" fill="none" strokeLinecap="round" />

          {/* Neck */}
          <rect x="45" y="55" width="10" height="8" fill="#475569" />
        </svg>

        {/* Glow Effect on Hover */}
        {isHovered && (
          <div className="absolute inset-0 rounded-full bg-yellow-300/30 animate-ping" />
        )}
      </button>
    </div>
  );
}
