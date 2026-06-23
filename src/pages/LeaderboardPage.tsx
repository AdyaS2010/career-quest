import { useEffect, useState } from 'react';
import { Crown, Share2 } from 'lucide-react';
import { AppNavbar } from '../components/AppNavbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { loadPrefs } from '../lib/prefs';
import type { Profile } from '../lib/database.types';

export function LeaderboardPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [leaders, setLeaders] = useState<Profile[]>([]);
    const [userRank, setUserRank] = useState<{ rank: number, score: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('total_score', { ascending: false })
                .limit(50);

            if (error) throw error;
            // Respect each player's "show on leaderboard" choice. Other players are
            // hidden via the optional show_on_leaderboard column (if present); the
            // current player is hidden according to their local preference.
            const hideSelf = user ? !loadPrefs(user.id).showOnLeaderboard : false;
            const visible = ((data || []) as Profile[]).filter(p => {
                if ((p as any).show_on_leaderboard === false) return false;
                if (user && p.id === user.id && hideSelf) return false;
                return true;
            }).slice(0, 10);
            setLeaders(visible);

            if (user) {
                const { data: userData, error: userError } = await supabase
                    .from('profiles')
                    .select('total_score')
                    .eq('id', user.id)
                    .single();

                if (!userError && userData) {
                    const score = (userData as any).total_score as number;

                    const { count, error: countError } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .gt('total_score', score);

                    if (!countError && count !== null) {
                        setUserRank({ rank: count + 1, score: score });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />;
            case 1:
                // Gold medal for 2nd place
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="gold" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="goldenrod" strokeWidth="2" />
                        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="black" fontWeight="bold">2</text>
                    </svg>
                );
            case 2:
                // Bronze medal for 3rd place
                return (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#cd7f32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="#b87333" strokeWidth="2" />
                        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="black" fontWeight="bold">3</text>
                    </svg>
                );
            default:
                return <span className="w-8 h-8 flex items-center justify-center font-bold text-xl" style={{ color: 'var(--text-muted)' }}>{index + 1}</span>;
        }
    };

    const handleShare = async () => {
        if (!userRank) return;
        const level = Math.floor(userRank.score / 100) + 1;
        const shareText = `I just reached Level ${level} and am ranked #${userRank.rank} globally with ${userRank.score.toLocaleString()} points on Career Quest! Can you beat my score? 🏆`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Career Quest Rank',
                    text: shareText,
                    url: window.location.origin,
                });
            } catch (err) {
                console.log('User cancelled share or it failed:', err);
            }
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`, '_blank');
        }
    };

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))' }}
        >
            <AppNavbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div
                    className="rounded-3xl shadow-xl overflow-hidden border"
                    style={{
                        backgroundColor: 'var(--surface-card)',
                        borderColor: 'var(--border-default)'
                    }}
                >
                    <div className="p-8 bg-indigo-600 text-white text-center rounded-t-3xl">
                        <h2 className="text-3xl font-bold mb-2">Ranking Top 10</h2>
                        <p className="text-indigo-100">See how you compare with other players globally!</p>

                        {userRank && (
                            <div className="mt-6 bg-white/20 backdrop-blur-md rounded-xl p-4 inline-block border border-white/30 shadow-lg transform transition hover:scale-105">
                                <p className="font-semibold text-white mb-2 uppercase tracking-wide text-xs">Your Global Ranking</p>
                                <div className="flex items-center gap-6 px-4">
                                    <div className="text-left">
                                        <div className="text-sm text-indigo-200 uppercase font-bold tracking-wider">Rank</div>
                                        <div className="text-3xl font-bold">#{userRank.rank}</div>
                                    </div>
                                    <div className="w-px h-10 bg-white/30"></div>
                                    <div className="text-right">
                                        <div className="text-sm text-indigo-200 uppercase font-bold tracking-wider">Score</div>
                                        <div className="text-3xl font-bold">{userRank.score.toLocaleString()}</div>
                                    </div>

                                    <button
                                        onClick={handleShare}
                                        className="ml-4 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-all shadow-md font-semibold text-sm h-full"
                                        title="Share Rank"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div
                                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaders.map((leader, index) => (
                                    <div
                                        key={leader.id}
                                        className="flex items-center p-4 rounded-2xl transition-all"
                                        style={{
                                            backgroundColor: user?.id === leader.id
                                                ? (theme === 'dark' ? 'rgba(251, 191, 36, 0.12)' : '#fffbeb')
                                                : (theme === 'dark' ? 'var(--surface-elevated)' : '#ffffff'),
                                            border: user?.id === leader.id
                                                ? `2px solid var(--accent-primary)`
                                                : `1px solid var(--border-default)`,
                                            transform: user?.id === leader.id ? 'scale(1.015)' : 'scale(1)',
                                            boxShadow: user?.id === leader.id ? '0 4px 12px var(--shadow-color)' : 'none'
                                        }}
                                    >
                                        <div className="flex-shrink-0 w-16 flex justify-center">
                                            {getRankIcon(index)}
                                        </div>
 
                                        <div className="flex-shrink-0 mr-4">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border"
                                                style={{
                                                    backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7',
                                                    borderColor: 'var(--border-default)',
                                                    color: 'var(--accent-primary)'
                                                }}
                                            >
                                                {leader.username.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
 
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                {leader.username}
                                                {user?.id === leader.id && (
                                                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>
                                                )}
                                            </h3>
                                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                Joined {new Date(leader.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="text-right px-4">
                                            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                                {leader.total_score.toLocaleString()}
                                            </div>
                                            <div className="text-xs uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                Points
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {leaders.length === 0 && (
                                    <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                        No players found yet. Be the first to join the leaderboard!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
