import { useState, useEffect } from 'react';
import { Flame, Timer, ThermometerSun } from 'lucide-react';

interface Dish {
  name: string;
  cookTime: number;
  idealTemp: number;
  emoji: string;
}

const DISHES: Dish[] = [
  { name: 'Grilled Steak', cookTime: 12, idealTemp: 63, emoji: '🥩' },
  { name: 'Pan-Seared Salmon', cookTime: 8, idealTemp: 58, emoji: '🐟' },
  { name: 'Pasta Carbonara', cookTime: 10, idealTemp: 75, emoji: '🍝' },
];

interface CookingChallengeProps {
  onComplete: (score: number) => void;
}

export function CookingChallenge({ onComplete }: CookingChallengeProps) {
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [temperature, setTemperature] = useState(20);
  const [cookingTime, setCookingTime] = useState(0);
  const [isCooking, setIsCooking] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [phase, setPhase] = useState<'setup' | 'cooking' | 'result'>('setup');

  const currentDish = DISHES[currentDishIndex];

  useEffect(() => {
    if (isCooking && cookingTime < 20) {
      const timer = setInterval(() => {
        setCookingTime(prev => prev + 1);
        setTemperature(prev => Math.min(100, prev + Math.random() * 8));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isCooking, cookingTime]);

  const startCooking = () => {
    setIsCooking(true);
    setPhase('cooking');
  };

  const stopCooking = () => {
    setIsCooking(false);
    setPhase('result');

    const timeDiff = Math.abs(cookingTime - currentDish.cookTime);
    const tempDiff = Math.abs(temperature - currentDish.idealTemp);

    const timeScore = Math.max(0, 50 - (timeDiff * 5));
    const tempScore = Math.max(0, 50 - (tempDiff * 2));
    const dishScore = Math.round(timeScore + tempScore);

    setResults([...results, dishScore]);
  };

  const nextDish = () => {
    if (currentDishIndex < DISHES.length - 1) {
      setCurrentDishIndex(prev => prev + 1);
      setCookingTime(0);
      setTemperature(20);
      setIsCooking(false);
      setPhase('setup');
    } else {
      const avgScore = Math.round(
        [...results, results[results.length]].reduce((a, b) => a + b, 0) / DISHES.length
      );
      onComplete(avgScore);
    }
  };

  const getQualityRating = (score: number) => {
    if (score >= 90) return { text: 'Perfect!', color: 'text-green-600', emoji: '⭐' };
    if (score >= 70) return { text: 'Great!', color: 'text-blue-600', emoji: '👍' };
    if (score >= 50) return { text: 'Good', color: 'text-yellow-600', emoji: '👌' };
    return { text: 'Needs Work', color: 'text-red-600', emoji: '😅' };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Dish {currentDishIndex + 1} of {DISHES.length}
          </h3>
          <div className="flex gap-2">
            {DISHES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentDishIndex
                    ? 'bg-green-500'
                    : idx === currentDishIndex
                    ? 'bg-orange-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {phase === 'setup' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">{currentDish.emoji}</div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">
                {currentDish.name}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-orange-50 rounded-xl p-6 text-center">
                <Timer className="w-10 h-10 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{currentDish.cookTime}s</div>
                <div className="text-sm text-gray-600">Target Time</div>
              </div>
              <div className="bg-red-50 rounded-xl p-6 text-center">
                <ThermometerSun className="w-10 h-10 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{currentDish.idealTemp}°C</div>
                <div className="text-sm text-gray-600">Target Temp</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-center text-gray-700">
                <strong>Goal:</strong> Cook the dish to the right temperature and stop at the perfect time!
              </p>
            </div>

            <button
              onClick={startCooking}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Flame className="w-6 h-6" />
              Start Cooking
            </button>
          </div>
        )}

        {phase === 'cooking' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">{currentDish.emoji}</div>
              <h4 className="text-2xl font-bold text-gray-900">{currentDish.name}</h4>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Timer className="w-8 h-8" />
                  <div>
                    <div className="text-3xl font-bold">{cookingTime}s</div>
                    <div className="text-sm opacity-90">Cooking Time</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ThermometerSun className="w-8 h-8" />
                  <div>
                    <div className="text-3xl font-bold">{temperature.toFixed(0)}°C</div>
                    <div className="text-sm opacity-90">Temperature</div>
                  </div>
                </div>
              </div>

              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${(cookingTime / 20) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={stopCooking}
              className="w-full py-4 bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-bold rounded-xl transition-colors"
            >
              Stop Cooking!
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-8xl mb-4">{currentDish.emoji}</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6">{currentDish.name}</h4>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Your Time</div>
                  <div className="text-2xl font-bold text-gray-900">{cookingTime}s</div>
                  <div className="text-sm text-gray-500">Target: {currentDish.cookTime}s</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Your Temp</div>
                  <div className="text-2xl font-bold text-gray-900">{temperature.toFixed(0)}°C</div>
                  <div className="text-sm text-gray-500">Target: {currentDish.idealTemp}°C</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white mb-6">
                <div className="text-5xl font-bold mb-2">{results[results.length - 1]}/100</div>
                <div className="text-xl">
                  {getQualityRating(results[results.length - 1]).emoji}{' '}
                  {getQualityRating(results[results.length - 1]).text}
                </div>
              </div>
            </div>

            <button
              onClick={nextDish}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
            >
              {currentDishIndex < DISHES.length - 1 ? 'Next Dish' : 'Finish Challenge'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
