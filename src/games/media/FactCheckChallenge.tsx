import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Share2, MessageCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Post {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  isFake: boolean;
  source: string; // The "real" source found when verifying
}

const POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Daily News',
    handle: '@dailynews',
    avatar: '📰',
    content: "Scientists discover new species of flying penguin in Antarctica! 🐧✈️ #Science #Nature",
    image: '🐧',
    timestamp: '2h ago',
    isFake: true,
    source: 'SatireWeb.com'
  },
  {
    id: 'p2',
    author: 'Tech Insider',
    handle: '@techinsider',
    avatar: '💻',
    content: "New solar panel technology increases efficiency by 40%. A major breakthrough for renewable energy.",
    timestamp: '4h ago',
    isFake: false,
    source: 'ScienceJournal.org'
  },
  {
    id: 'p3',
    author: 'Viral Trends',
    handle: '@viral',
    avatar: '🔥',
    content: "Drinking 5 liters of coffee a day increases life expectancy by 20 years! ☕😲",
    timestamp: '5h ago',
    isFake: true,
    source: 'RandomBlog.net'
  }
];

interface FactCheckChallengeProps {
  onComplete: (score: number) => void;
}

export function FactCheckChallenge({ onComplete }: FactCheckChallengeProps) {
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [stamp, setStamp] = useState<'verified' | 'fake' | null>(null);
  const { playSfx } = useAudio();

  const currentPost = POSTS[currentPostIndex];

  const handleVerify = () => {
    setIsVerifying(true);
    playSfx('click');
    setTimeout(() => {
      setVerificationResult(currentPost.source);
      setIsVerifying(false);
    }, 1500);
  };

  const handleDecision = (decision: 'verified' | 'fake') => {
    const isCorrect = (decision === 'fake' && currentPost.isFake) || (decision === 'verified' && !currentPost.isFake);

    setStamp(decision);
    if (isCorrect) {
      playSfx('success');
      setScore(prev => prev + 100);
    } else {
      playSfx('error');
    }

    setTimeout(() => {
      setStamp(null);
      setVerificationResult(null);

      if (currentPostIndex < POSTS.length - 1) {
        setCurrentPostIndex(prev => prev + 1);
      } else {
        onComplete(Math.round(((score + (isCorrect ? 100 : 0)) / (POSTS.length * 100)) * 100));
      }
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-12 gap-8">

        {/* Phone / Feed View */}
        <div className="col-span-5 flex justify-center">
          <div className="w-[380px] h-[700px] bg-black rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden relative">
            {/* Status Bar */}
            <div className="h-8 bg-black text-white text-xs flex justify-between items-center px-6 pt-2">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-white rounded-full opacity-20"></div>
                <div className="w-4 h-4 bg-white rounded-full opacity-20"></div>
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>

            {/* App Header */}
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-black text-xl tracking-tighter text-blue-500">SocialFeed</h3>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>

            {/* Feed Content */}
            <div className="bg-gray-50 h-full p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPost.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="bg-white rounded-xl shadow-sm p-4 mb-4 relative overflow-hidden"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {currentPost.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{currentPost.author}</div>
                      <div className="text-gray-500 text-xs">{currentPost.handle} • {currentPost.timestamp}</div>
                    </div>
                  </div>

                  <p className="text-gray-800 mb-3 leading-relaxed">{currentPost.content}</p>

                  {currentPost.image && (
                    <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center text-6xl mb-3">
                      {currentPost.image}
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400 text-sm border-t pt-3">
                    <button className="flex items-center gap-1 hover:text-blue-500"><MessageCircle className="w-4 h-4" /> 24</button>
                    <button className="flex items-center gap-1 hover:text-green-500"><Share2 className="w-4 h-4" /> 12</button>
                    <button className="flex items-center gap-1 hover:text-red-500"><Heart className="w-4 h-4" /> 156</button>
                  </div>

                  {/* Stamp Overlay */}
                  {stamp && (
                    <motion.div
                      initial={{ scale: 2, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: -15 }}
                      className={`absolute inset-0 flex items-center justify-center bg-white/80 z-20`}
                    >
                      <div className={`border-8 rounded-xl p-4 font-black text-4xl uppercase tracking-widest ${stamp === 'verified' ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                        }`}>
                        {stamp === 'verified' ? 'VERIFIED' : 'FAKE NEWS'}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tools Panel */}
        <div className="col-span-7 space-y-6 pt-10">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-blue-600" /> Fact Check Tools
            </h3>

            <div className="space-y-4">
              <button
                onClick={handleVerify}
                disabled={isVerifying || !!verificationResult}
                className="w-full p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 transition-all flex items-center gap-4 group"
              >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Globe className={`w-8 h-8 text-blue-600 ${isVerifying ? 'animate-spin' : ''}`} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-blue-900 text-lg">Check Source</div>
                  <div className="text-blue-700">Scan database for source credibility</div>
                </div>
              </button>

              <AnimatePresence>
                {verificationResult && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm"
                  >
                    &gt; SCANNING SOURCE...<br />
                    &gt; SOURCE IDENTIFIED: {verificationResult}<br />
                    &gt; CREDIBILITY RATING: {currentPost.isFake ? 'LOW (SATIRE/BLOG)' : 'HIGH (ACADEMIC/NEWS)'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => handleDecision('verified')}
                disabled={!!stamp}
                className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" /> Mark Verified
              </button>
              <button
                onClick={() => handleDecision('fake')}
                disabled={!!stamp}
                className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ShieldAlert className="w-6 h-6" /> Mark Fake
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper component for icon
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
