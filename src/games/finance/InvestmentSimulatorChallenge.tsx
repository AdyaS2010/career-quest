import { useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, BarChart3, ArrowRight, Newspaper, PieChart } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion } from 'framer-motion';

interface AssetClass {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
}

const ASSET_CLASSES: AssetClass[] = [
    { name: 'Stocks', icon: '📈', color: 'text-blue-700', bgColor: 'bg-blue-50', description: 'High risk, high reward' },
    { name: 'Bonds', icon: '🏦', color: 'text-green-700', bgColor: 'bg-green-50', description: 'Low risk, steady income' },
    { name: 'Real Estate', icon: '🏠', color: 'text-amber-700', bgColor: 'bg-amber-50', description: 'Moderate risk, tangible' },
    { name: 'Crypto', icon: '₿', color: 'text-purple-700', bgColor: 'bg-purple-50', description: 'Very high risk, volatile' },
    { name: 'Savings', icon: '🏧', color: 'text-teal-700', bgColor: 'bg-teal-50', description: 'No risk, low return' },
];

interface MarketEvent {
    headline: string;
    source: string;
    impact: Record<string, number>; // multiplier for each asset class
    sentiment: 'positive' | 'negative' | 'mixed';
}

const MARKET_EVENTS_POOL: MarketEvent[][] = [
    // Round 1 events (pick 1)
    [
        {
            headline: 'Fed Announces Interest Rate Cut  -  Markets Rally',
            source: 'Financial Times',
            impact: { Stocks: 1.15, Bonds: 1.08, 'Real Estate': 1.10, Crypto: 1.20, Savings: 0.97 },
            sentiment: 'positive',
        },
        {
            headline: 'Unexpected Inflation Report Rattles Investors',
            source: 'Wall Street Journal',
            impact: { Stocks: 0.92, Bonds: 0.95, 'Real Estate': 1.05, Crypto: 0.88, Savings: 1.02 },
            sentiment: 'negative',
        },
    ],
    // Round 2 events
    [
        {
            headline: 'Tech Giant Reports Record Earnings  -  Stock Surge',
            source: 'Bloomberg',
            impact: { Stocks: 1.18, Bonds: 1.0, 'Real Estate': 1.02, Crypto: 1.12, Savings: 1.0 },
            sentiment: 'positive',
        },
        {
            headline: 'Global Supply Chain Crisis Deepens',
            source: 'Reuters',
            impact: { Stocks: 0.88, Bonds: 1.05, 'Real Estate': 0.95, Crypto: 0.90, Savings: 1.01 },
            sentiment: 'negative',
        },
    ],
    // Round 3 events
    [
        {
            headline: 'Cryptocurrency Regulation Bill Passes Senate',
            source: 'CNBC',
            impact: { Stocks: 1.02, Bonds: 1.01, 'Real Estate': 1.03, Crypto: 0.70, Savings: 1.0 },
            sentiment: 'mixed',
        },
        {
            headline: 'Housing Market Boom  -  Real Estate at All-Time High',
            source: 'MarketWatch',
            impact: { Stocks: 1.05, Bonds: 0.98, 'Real Estate': 1.25, Crypto: 1.05, Savings: 1.0 },
            sentiment: 'positive',
        },
    ],
];

interface InvestmentSimulatorChallengeProps {
    onComplete: (score: number) => void;
}

export function InvestmentSimulatorChallenge({ onComplete }: InvestmentSimulatorChallengeProps) {
    const STARTING_CAPITAL = 10000;
    const TOTAL_ROUNDS = 3;

    const [phase, setPhase] = useState<'scenario' | 'allocate' | 'event' | 'results'>('scenario');
    const [round, setRound] = useState(0);
    const [allocation, setAllocation] = useState<Record<string, number>>({
        Stocks: 0, Bonds: 0, 'Real Estate': 0, Crypto: 0, Savings: 0,
    });
    const [portfolioValue, setPortfolioValue] = useState(STARTING_CAPITAL);
    const [portfolioHistory, setPortfolioHistory] = useState<number[]>([STARTING_CAPITAL]);
    const [currentEvent, setCurrentEvent] = useState<MarketEvent | null>(null);
    const [eventHistory, setEventHistory] = useState<MarketEvent[]>([]);
    const [unallocated, setUnallocated] = useState(STARTING_CAPITAL);
    const { playSfx } = useAudio();

    const updateAllocation = useCallback((asset: string, value: number) => {
        const currentForThis = allocation[asset] || 0;
        const freeAmount = unallocated + currentForThis;
        const newValue = Math.min(Math.max(0, value), freeAmount);

        setAllocation(prev => ({ ...prev, [asset]: newValue }));
        setUnallocated(freeAmount - newValue);
    }, [allocation, unallocated]);

    const handleConfirmAllocation = useCallback(() => {
        if (unallocated > 0) return; // Must allocate everything
        playSfx('click');

        // Pick a random event for this round
        const roundEvents = MARKET_EVENTS_POOL[round];
        const event = roundEvents[Math.floor(Math.random() * roundEvents.length)];
        setCurrentEvent(event);
        setEventHistory(prev => [...prev, event]);

        // Calculate new portfolio value
        let newValue = 0;
        ASSET_CLASSES.forEach(asset => {
            const invested = allocation[asset.name] || 0;
            const multiplier = event.impact[asset.name] || 1;
            newValue += invested * multiplier;
        });
        newValue = Math.round(newValue);
        setPortfolioValue(newValue);
        setPortfolioHistory(prev => [...prev, newValue]);

        setPhase('event');
    }, [allocation, unallocated, round, playSfx]);

    const handleNextRound = useCallback(() => {
        if (round < TOTAL_ROUNDS - 1) {
            setRound(prev => prev + 1);
            // Reset allocation with current portfolio value
            setAllocation({ Stocks: 0, Bonds: 0, 'Real Estate': 0, Crypto: 0, Savings: 0 });
            setUnallocated(portfolioValue);
            setPhase('allocate');
        } else {
            setPhase('results');
        }
    }, [round, portfolioValue]);

    const calculateScore = useCallback(() => {
        const returnPercent = ((portfolioValue - STARTING_CAPITAL) / STARTING_CAPITAL) * 100;
        // Benchmark: 10% return over 3 rounds
        const benchmark = 10;
        // Score based on return vs benchmark
        let score: number;
        if (returnPercent >= benchmark * 2) score = 100;
        else if (returnPercent >= benchmark) score = 80 + ((returnPercent - benchmark) / benchmark) * 20;
        else if (returnPercent >= 0) score = 50 + (returnPercent / benchmark) * 30;
        else if (returnPercent >= -10) score = 30 + ((returnPercent + 10) / 10) * 20;
        else score = Math.max(10, 30 + returnPercent);

        // Diversification bonus: check how many different categories had allocation in the final round
        const allAllocated = Object.values(allocation).filter(v => v > 0).length;
        const diversificationBonus = allAllocated >= 4 ? 5 : allAllocated >= 3 ? 3 : 0;

        return Math.min(100, Math.max(0, Math.round(score + diversificationBonus)));
    }, [portfolioValue, allocation]);

    if (phase === 'scenario') {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-teal-700 to-cyan-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <BarChart3 className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Investment Simulator</h2>
                                <p className="text-teal-100">Financial Services • Intermediate</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-xl mb-6">
                            <h3 className="font-bold text-teal-900 text-lg mb-2">📋 Scenario Briefing</h3>
                            <p className="text-teal-800 leading-relaxed">
                                A new client, Ms. Rivera, walks into your office with <strong>$10,000</strong> she
                                wants to invest. Market conditions are uncertain  -  earnings reports are coming in,
                                interest rates are shifting, and global events are unfolding. Build her a diversified
                                portfolio and navigate <strong>3 rounds</strong> of market events to maximize returns.
                                Your reputation as a financial advisor depends on it!
                            </p>
                        </div>

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {ASSET_CLASSES.map(asset => (
                                <div key={asset.name} className={`${asset.bgColor} rounded-xl p-3 text-center`}>
                                    <div className="text-2xl mb-1">{asset.icon}</div>
                                    <div className="text-xs font-bold text-gray-700">{asset.name}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                            <span>💰 $10,000 starting capital</span>
                            <span>📊 3 market rounds</span>
                            <span>🏆 100 points max</span>
                        </div>

                        <button
                            onClick={() => {
                                playSfx('click');
                                setPhase('allocate');
                                setUnallocated(STARTING_CAPITAL);
                            }}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Start Investing! 📊
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === 'allocate') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-700 to-cyan-600 p-5 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <PieChart className="w-7 h-7" />
                            <div>
                                <h3 className="text-lg font-bold">Round {round + 1} of {TOTAL_ROUNDS}</h3>
                                <p className="text-teal-200 text-sm">Allocate your funds across asset classes</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-teal-200">Portfolio Value</div>
                            <div className="font-bold text-2xl font-mono">${portfolioValue.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Unallocated indicator */}
                        <div className={`text-center mb-6 p-3 rounded-xl ${unallocated > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                            <span className={`font-bold ${unallocated > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                                {unallocated > 0 ? `$${unallocated.toLocaleString()} remaining to allocate` : '✅ All funds allocated!'}
                            </span>
                        </div>

                        {/* Asset Allocation Sliders */}
                        <div className="space-y-5 mb-8">
                            {ASSET_CLASSES.map(asset => {
                                const value = allocation[asset.name] || 0;
                                const percent = portfolioValue > 0 ? Math.round((value / portfolioValue) * 100) : 0;

                                return (
                                    <div key={asset.name} className={`${asset.bgColor} rounded-xl p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{asset.icon}</span>
                                                <div>
                                                    <div className={`font-bold ${asset.color}`}>{asset.name}</div>
                                                    <div className="text-xs text-gray-500">{asset.description}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold text-lg font-mono ${asset.color}`}>
                                                    ${value.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">{percent}%</div>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={portfolioValue}
                                            step={100}
                                            value={value}
                                            onChange={(e) => updateAllocation(asset.name, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                                        />
                                        <div className="flex justify-between mt-1">
                                            {[0, 25, 50, 75, 100].map(pct => (
                                                <button
                                                    key={pct}
                                                    onClick={() => updateAllocation(asset.name, Math.round(portfolioValue * pct / 100))}
                                                    className="text-xs text-gray-400 hover:text-teal-600 transition-colors"
                                                >
                                                    {pct}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleConfirmAllocation}
                            disabled={unallocated > 0}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            Confirm Allocation & See Market Event 📰
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'event' && currentEvent) {
        const prevValue = portfolioHistory[portfolioHistory.length - 2];
        const change = portfolioValue - prevValue;
        const changePercent = ((change / prevValue) * 100).toFixed(1);
        const isGain = change >= 0;

        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Newspaper className="w-5 h-5 text-amber-400" />
                            <span className="text-amber-400 font-bold uppercase text-sm tracking-wider">Breaking News  -  Round {round + 1}</span>
                        </div>
                        <h2 className="text-2xl font-bold">{currentEvent.headline}</h2>
                        <p className="text-slate-400 text-sm mt-1">Source: {currentEvent.source}</p>
                    </div>

                    <div className="p-8">
                        {/* Portfolio Impact */}
                        <div className={`text-center p-6 rounded-2xl mb-6 ${isGain ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {isGain ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-600" />}
                                <span className={`text-4xl font-bold font-mono ${isGain ? 'text-green-700' : 'text-red-700'}`}>
                                    {isGain ? '+' : ''}{changePercent}%
                                </span>
                            </div>
                            <div className="text-gray-600">
                                Portfolio: <span className="font-bold font-mono">${portfolioValue.toLocaleString()}</span>
                                <span className={`ml-2 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                                    ({isGain ? '+' : ''}${change.toLocaleString()})
                                </span>
                            </div>
                        </div>

                        {/* Asset-by-asset breakdown */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {ASSET_CLASSES.map(asset => {
                                const multiplier = currentEvent.impact[asset.name] || 1;
                                const assetChange = ((multiplier - 1) * 100).toFixed(0);
                                const assetGain = multiplier >= 1;
                                return (
                                    <div key={asset.name} className="text-center p-2 rounded-lg bg-gray-50">
                                        <div className="text-xl">{asset.icon}</div>
                                        <div className="text-xs font-medium text-gray-600">{asset.name}</div>
                                        <div className={`text-sm font-bold ${assetGain ? 'text-green-600' : 'text-red-600'}`}>
                                            {assetGain ? '+' : ''}{assetChange}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Portfolio timeline */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="text-sm font-bold text-gray-600 mb-2">Portfolio Timeline</div>
                            <div className="flex items-end justify-around h-20">
                                {portfolioHistory.map((val, i) => {
                                    const maxVal = Math.max(...portfolioHistory);
                                    const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <div className="text-xs font-mono text-gray-500">${(val / 1000).toFixed(1)}k</div>
                                            <div
                                                className={`w-12 rounded-t ${val >= STARTING_CAPITAL ? 'bg-green-400' : 'bg-red-400'}`}
                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                            />
                                            <div className="text-xs text-gray-400">R{i}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleNextRound}
                            className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {round < TOTAL_ROUNDS - 1 ? (
                                <>Rebalance Portfolio for Round {round + 2} <ArrowRight className="w-5 h-5" /></>
                            ) : (
                                'See Final Results 🏆'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Results
    const finalScore = calculateScore();
    const totalReturn = portfolioValue - STARTING_CAPITAL;
    const totalReturnPercent = ((totalReturn / STARTING_CAPITAL) * 100).toFixed(1);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
                <div className="text-6xl mb-4">
                    {finalScore >= 80 ? '🏆' : finalScore >= 50 ? '📊' : '📉'}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Investment Report</h2>
                <p className="text-gray-600 mb-6">
                    {finalScore >= 80
                        ? "Exceptional returns! Ms. Rivera is thrilled and referring her friends to you."
                        : finalScore >= 50
                            ? "Decent performance. Ms. Rivera is satisfied but expects better next district."
                            : "Rough market conditions took their toll. Time to reassess your strategy."}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold font-mono text-gray-800">${portfolioValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Final Value</div>
                    </div>
                    <div className={`rounded-xl p-4 ${totalReturn >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-2xl font-bold font-mono ${totalReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {totalReturn >= 0 ? '+' : ''}{totalReturnPercent}%
                        </div>
                        <div className="text-sm text-gray-600">Total Return</div>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-teal-700">{finalScore}</div>
                        <div className="text-sm text-teal-600">Score</div>
                    </div>
                </div>

                {/* Event recap */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <div className="text-sm font-bold text-gray-600 mb-2">Market Events Recap</div>
                    {eventHistory.map((event, i) => (
                        <div key={i} className="flex items-start gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${event.sentiment === 'positive' ? 'bg-green-100 text-green-700'
                                : event.sentiment === 'negative' ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>R{i + 1}</span>
                            <span className="text-sm text-gray-700">{event.headline}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => onComplete(finalScore)}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl text-lg transition-all hover:from-teal-600 hover:to-cyan-600"
                >
                    Continue
                </button>
            </motion.div>
        </div>
    );
}
