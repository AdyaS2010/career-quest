import React, { createContext, useContext, useState } from 'react';

interface ChatContextValue {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openChat = () => setOpen(true);
  const closeChat = () => setOpen(false);

  return (
    <ChatContext.Provider value={{ open, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

export default ChatContext;
