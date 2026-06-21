import { useEffect, useRef, useState } from 'react';

interface CareerChatbotProps {
  open: boolean;
  onClose: () => void;
}

type Msg = { id: string; from: 'user' | 'astra'; text: string };

async function fetchLLMReply(input: string) {
  const key = import.meta.env.VITE_OPENAI_KEY;
  if (!key) throw new Error('No OpenAI key provided');

  const systemPrompt = `You are Astra, a helpful and friendly career mentor specialized for the Career World app. Answer concisely and give actionable tips for the five career tracks: Culinary Arts, Information Technology, Law & Government, Media & Communication, and Health Sciences. Provide game-specific advice when asked about mini-games (timing, debugging, evidence, interviewing, diagnosis).`;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ],
    max_tokens: 400,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return reply || "I'm sorry, I couldn't generate a response right now.";
}

export function CareerChatbot({ open, onClose }: CareerChatbotProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMessages([
        { id: 'm1', from: 'astra', text: "Hello! I'm Astra — your career mentor. Ask me about Culinary Arts, Information Technology, Law & Government, Media & Communication, or Health Sciences. I can also give tips for the mini-games." }
      ]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  const postUser = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: String(Date.now()), from: 'user', text } as any;
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // try LLM if key provided, otherwise fallback to a keyword responder
    try {
      setLoading(true);
      const reply = await fetchLLMReply(text).catch(() => undefined);
      if (reply) {
        const sageMsg: Msg = { id: String(Date.now() + 1), from: 'astra', text: reply };
        setMessages(prev => [...prev, sageMsg]);
      } else {
        // fallback simple responder
        const fallback = simpleResponder(text);
        const sageMsg: Msg = { id: String(Date.now() + 2), from: 'astra', text: fallback };
        setMessages(prev => [...prev, sageMsg]);
      }
    } catch (err: any) {
      const sageMsg: Msg = { id: String(Date.now() + 3), from: 'astra', text: `Error contacting LLM: ${err.message}. Try again or check your OpenAI key.` };
      setMessages(prev => [...prev, sageMsg]);
    } finally {
      setLoading(false);
    }
  };

  const simpleResponder = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('culinary') || t.includes('chef') || t.includes('cooking')) {
      return 'Culinary: focus on timing, mise en place, and plating. In-game tip: prioritize hot items and manage timers.';
    }
    if (t.includes('it') || t.includes('technology') || t.includes('bug') || t.includes('algorithm')) {
      return 'IT: break problems into steps, write tests, and read errors carefully. In-game tip: isolate the smallest failing case first.';
    }
    if (t.includes('law') || t.includes('court') || t.includes('evidence')) {
      return 'Law: collect reliable evidence and form logical arguments. In-game tip: look for contradictions in testimony.';
    }
    if (t.includes('media') || t.includes('journalism') || t.includes('interview')) {
      return 'Media: verify sources and structure stories around a clear lead. In-game tip: use keywords to fact-check quickly.';
    }
    if (t.includes('health') || t.includes('patient') || t.includes('diagnose')) {
      return 'Health: triage urgent problems first and gather a symptom timeline. In-game tip: look for red flags that change priority.';
    }
    return "I can help with career paths (Culinary, IT, Law, Media, Health) or give mini-game hints — ask me something specific!";
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center p-4 chat-overlay">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

  <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
              <span role="img" aria-label="Astra sparkle" className="text-2xl leading-none">✨</span>
            </div>
            <div>
              <div className="font-bold text-indigo-700">Astra</div>
              <div className="text-xs text-gray-500">Career mentor & game helper</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
          </div>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.from === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'} max-w-[80%] p-3 rounded-lg shadow`}>{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') postUser(input); }}
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none"
            placeholder="Ask Astra about careers or get mini-game tips..."
          />
          <button onClick={() => postUser(input)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{loading ? '...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
