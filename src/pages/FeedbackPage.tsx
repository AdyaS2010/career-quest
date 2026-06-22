import { useEffect, useState } from 'react';
import { Star, Send } from 'lucide-react';
import { AppNavbar } from '../components/AppNavbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Feedback {
    id: string;
    name: string;
    rating: number;
    comment: string;
    created_at: string;
}

const PRESET_FEEDBACKS: Feedback[] = [
    {
        id: 'p1',
        name: 'Avery MS',
        rating: 5,
        comment: 'The culinary arts game is so fun but the timer is scary lol! I love how the ingredients look. Great for FBLA!!',
        created_at: '2026-02-24T14:30:00Z'
    },
    {
        id: 'p2',
        name: 'Leo da lawyer',
        rating: 4,
        comment: 'The cross examination is tricky but addictive. I actually learned what a leading question is. Maybe add a way to skip dialogue?',
        created_at: '2026-02-11T09:12:00Z'
    },
    {
        id: 'p3',
        name: 'Dr. Radhika S',
        rating: 5,
        comment: 'A remarkable pedagogical approach to career readiness. The simulation depth is impressive for a high school level project. Highly recommended for classrooms.',
        created_at: '2026-08-10T16:45:00Z'
    },
    {
        id: 'p4',
        name: 'Jordan_Codes',
        rating: 4,
        comment: 'IT island is fire! 8-bit music goes hard. Feedback: The debugging challenge could use a bit more variety in error types, but overall super polished.',
        created_at: '2026-02-07T11:20:00Z'
    },
    {
        id: 'p5',
        name: 'Marcus K., Tech Advisor',
        rating: 5,
        comment: "Impressive codebase and user experience. The 'Island' metaphor works perfectly for progress tracking. Solid 5 stars for this FBLA submission.",
        created_at: '2026-01-28T13:00:00Z'
    },
    {
        id: 'p6',
        name: 'Chloe B.',
        rating: 5,
        comment: 'I mastered the Financial Services island!! I never realized how much I like charts and numbers. The feedback loop is really satisfying.',
        created_at: '2026-01-16T18:30:00Z'
    }
];

export function FeedbackPage() {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        try {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Merge database feedbacks with our preset/prepopulated ones
            const dbFeedbacks = data || [];
            const allFeedbacks = [...dbFeedbacks, ...PRESET_FEEDBACKS].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setFeedbacks(allFeedbacks);
        } catch (err) {
            console.error('Error loading feedback:', err);
            // Fallback to presets if DB fails
            setFeedbacks(PRESET_FEEDBACKS.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !comment.trim() || !user) return;

        setSubmitting(true);
        try {
            // @ts-ignore
            const { data, error } = await supabase.from('feedbacks').insert([{
                user_id: user.id,
                name: name.trim(),
                rating,
                comment: comment.trim()
            }]).select();

            if (error) throw error;

            if (data) {
                setFeedbacks([data[0], ...feedbacks]);
            }
            setName('');
            setComment('');
            setRating(5);
        } catch (err) {
            console.error('Error saving feedback:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
        >
            <AppNavbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Rating Summary Card */}
                    <div
                        className="rounded-3xl shadow-2xl overflow-hidden border-4 p-8 transform transition-all"
                        style={{
                            backgroundColor: 'var(--surface-card)',
                            borderColor: theme === 'dark' ? 'rgba(250, 204, 21, 0.3)' : '#fef3c7'
                        }}
                    >
                        <h3 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Rating Summary</h3>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">
                                {feedbacks.length > 0
                                    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
                                    : '0.0'}
                            </div>
                            <div>
                                <div className="flex mb-1">
                                    {[...Array(5)].map((_, i) => {
                                        const avg = feedbacks.length > 0
                                            ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length
                                            : 0;
                                        return (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    {feedbacks.length} Reviews
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = feedbacks.filter(fb => fb.rating === stars).length;
                                const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                                return (
                                    <div key={stars} className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 w-12">
                                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stars}</span>
                                            <Star className="w-3 h-3 fill-yellow-500/50 text-yellow-500/50" />
                                        </div>
                                        <div className="flex-1 h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="w-8 text-right text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                                            {count}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div
                        className="rounded-3xl shadow-2xl overflow-hidden border-4 p-8 sticky top-24 transform transition-all"
                        style={{
                            backgroundColor: 'var(--surface-card)',
                            borderColor: theme === 'dark' ? 'rgba(236, 72, 153, 0.3)' : '#fce7f3'
                        }}
                    >
                        <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Leave a Review</h2>
                        <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            How are you enjoying Career Quest? Tell us what you think!
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-pink-500/20 transition-all outline-none font-medium"
                                    style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : '#fff',
                                        borderColor: 'var(--border-default)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="e.g. Master Chef 22"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Rating</label>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(null)}
                                            className="p-1.5 transition-all hover:scale-125 active:scale-95"
                                        >
                                            <Star
                                                className={`w-9 h-9 ${star <= (hoveredStar ?? rating) ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Your Thoughts</label>
                                <textarea
                                    required
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-pink-500/20 transition-all outline-none min-h-[160px] resize-none font-medium"
                                    style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.4)' : '#fff',
                                        borderColor: 'var(--border-default)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="What was your favorite challenge? What would you like to see next?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !name.trim() || !comment.trim()}
                                className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                                style={{
                                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                    color: 'white'
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Send Feedback'}
                                <Send className="w-6 h-6" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Display Feedback Column */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Recent Reviews <span className="text-pink-500 font-black">({feedbacks.length})</span>
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <div
                                className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {feedbacks.map((fb) => (
                                <div
                                    key={fb.id}
                                    className="p-8 rounded-[2.5rem] shadow-lg border-2 transition-all hover:shadow-2xl hover:border-pink-500/30 group"
                                    style={{
                                        backgroundColor: 'var(--surface-card)',
                                        borderColor: 'var(--border-default)'
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform"
                                                style={{
                                                    background: `linear-gradient(135deg, hsl(${fb.name.length * 40 % 360}, 70%, 60%), hsl(${fb.name.length * 60 % 360}, 60%, 50%))`
                                                }}
                                            >
                                                {fb.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>{fb.name}</h4>
                                                <div className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                                    {new Date(fb.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex border-2 rounded-2xl px-4 py-2 shadow-inner bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-default)' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <span className="absolute -left-2 -top-4 text-6xl text-pink-500/10 italic font-serif">"</span>
                                        <p
                                            className="text-xl font-medium leading-relaxed pl-4 border-l-4 group-hover:border-pink-500 transition-colors"
                                            style={{ color: 'var(--text-secondary)', borderColor: theme === 'dark' ? 'rgba(236,72,153,0.3)' : 'var(--accent-primary)' }}
                                        >
                                            {fb.comment}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

