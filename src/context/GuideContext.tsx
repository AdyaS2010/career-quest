import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateResponse, getContextAwareTip } from '../lib/GuideKnowledge';

type GuideEmotion = 'happy' | 'thinking' | 'excited' | 'waving';
type GuidePosition = 'bottom-right' | 'center' | 'bottom-left' | 'top-right';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    emotion?: GuideEmotion;
}

interface GuideState {
    isVisible: boolean; // Is the character visible at all (the floating icon)
    isOpen: boolean;    // Is the chat window/dialog open
    message: string;    // Current bubbling message (for speech bubble when chat is closed)
    emotion: GuideEmotion;
    position: GuidePosition;
    chatHistory: ChatMessage[];
}

interface GuideContextType {
    state: GuideState;
    showGuide: (message: string, emotion?: GuideEmotion) => void;
    hideGuide: () => void;
    toggleChat: () => void;
    sendMessage: (text: string) => void;
    setEmotion: (emotion: GuideEmotion) => void;
}

const GuideContext = createContext<GuideContextType | undefined>(undefined);

export function GuideProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GuideState>({
        isVisible: true, // Always visible now as per user request
        isOpen: false,
        message: "Hi! I'm Questopher!",
        emotion: 'happy',
        position: 'bottom-right',
        chatHistory: [{
            id: 'init',
            sender: 'bot',
            text: "Greetings, traveler! I am Questopher the Career Squire. How can I help you navigate the kingdom today?",
            emotion: 'waving'
        }]
    });

    const location = useLocation();

    // Route change handler - context aware tips
    useEffect(() => {
        // When route changes, maybe give a subtle hint if chat is closed, or add to history if open
        const tip = getContextAwareTip(location.pathname);

        // Update the 'bubble' message
        setState(prev => ({
            ...prev,
            message: tip.text,
            emotion: tip.emotion
        }));

        // Optionally add a "system" message to chat if it's new context?
        // Let's keep chat clean for now unless user asks.
    }, [location.pathname]);

    const showGuide = (message: string, emotion: GuideEmotion = 'happy') => {
        setState(prev => ({
            ...prev,
            isVisible: true,
            message,
            emotion,
            // If we are showing a specific forced message, maybe we open the chat?
            // Or just the bubble. Let's do bubble for now.
        }));
    };

    const hideGuide = () => {
        // Hides the bubble by clearing the message, and closes chat
        setState(prev => ({ ...prev, isOpen: false, message: '' }));
    };

    const toggleChat = () => {
        setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
    };

    const sendMessage = (text: string) => {
        // Add user message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text
        };

        setState(prev => ({
            ...prev,
            chatHistory: [...prev.chatHistory, userMsg],
            emotion: 'thinking' // Thinking while processing
        }));

        // Simulate delay for "thinking"
        setTimeout(() => {
            const response = generateResponse(text, location.pathname);

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: response.text,
                emotion: response.emotion
            };

            setState(prev => ({
                ...prev,
                chatHistory: [...prev.chatHistory, botMsg],
                emotion: response.emotion,
                message: response.text // Also update the bubble text
            }));
        }, 800);
    };

    const setEmotion = (emotion: GuideEmotion) => {
        setState(prev => ({ ...prev, emotion }));
    };

    return (
        <GuideContext.Provider value={{ state, showGuide, hideGuide, toggleChat, sendMessage, setEmotion }}>
            {children}
        </GuideContext.Provider>
    );
}

export function useGuide() {
    const context = useContext(GuideContext);
    if (context === undefined) {
        throw new Error('useGuide must be used within a GuideProvider');
    }
    return context;
}
