import { useChat } from '../contexts/ChatContext';

export function GlobalChatButton() {
  const { openChat } = useChat();

  return (
    <button
      onClick={openChat}
      aria-label="Open career chat"
      title="Ask Astra"
      className="fixed z-60 bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
    >
      {/* wizard emoji to match Astra */}
      <span role="img" aria-label="Ask Astra" className="text-3xl leading-none">🧙‍♂️</span>
    </button>
  );
}
