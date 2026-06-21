import { useState, useEffect, useRef } from 'react';
import { Flame, Timer, ThermometerSun, Utensils, AlertTriangle } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Dish {
  name: string;
  cookTime: number;
  idealTempMin: number;
  idealTempMax: number;
  emoji: string;
  description: string;
}

const DISHES: Dish[] = [
  {
    name: 'Grilled Steak',
    cookTime: 15,
    idealTempMin: 60,
    idealTempMax: 70,
    emoji: '🥩',
    description: 'Sear it to perfection! Keep the heat high but don\'t burn it.'
  },
  {
    name: 'Pan-Seared Salmon',
    cookTime: 12,
    idealTempMin: 55,
    idealTempMax: 65,
    emoji: '🐟',
    description: 'Gentle heat is key for flaky salmon.'
  },
  {
    name: 'Pasta Carbonara',
    cookTime: 10,
    idealTempMin: 70,
    idealTempMax: 80,
    emoji: '🍝',
    description: 'Maintain a steady simmer for the sauce.'
  },
];

interface CookingChallengeProps {
  onComplete: (score: number) => void;
}

function DraggableIngredient({ dish, isCooking }: { dish: Dish; isCooking: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'ingredient',
    disabled: isCooking,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isCooking) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing touch-none z-10"
    >
      <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center text-6xl border-4 border-orange-100 hover:border-orange-300 transition-colors relative overflow-hidden group">
        <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10">{dish.emoji}</span>
      </div>
      <p className="text-center mt-2 font-bold text-gray-700 bg-white/80 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
        Drag to Pan
      </p>
    </div>
  );
}

function CookingPan({ isCooking, dish, temperature, heatLevel }: { isCooking: boolean; dish: Dish; temperature: number; heatLevel: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'pan',
  });

  // Visual feedback based on temperature
  const getPanColor = () => {
    if (!isCooking) return isOver ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-100';
    if (temperature > dish.idealTempMax + 10) return 'border-red-600 bg-red-100'; // Burning
    if (temperature >= dish.idealTempMin && temperature <= dish.idealTempMax) return 'border-green-500 bg-green-50'; // Perfect
    return 'border-orange-400 bg-orange-50'; // Cooking
  };

  return (
    <div className="relative">
      {/* Stove Grate */}
      <div className="absolute -inset-4 bg-gray-800 rounded-full opacity-20 blur-sm transform scale-110" />

      <div
        ref={setNodeRef}
        className={`relative w-72 h-72 rounded-full border-8 transition-all duration-300 flex items-center justify-center shadow-xl ${getPanColor()}`}
      >
        {/* Pan Handle */}
        <div className="absolute -right-32 w-32 h-8 bg-gray-700 rounded-r-full shadow-md origin-left transform -rotate-12 z-0" />

        {isCooking ? (
          <div className="text-center relative z-10">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0],
                y: [0, -2, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 / (heatLevel || 1) }} // Faster animation with higher heat
              className="text-9xl mb-2 drop-shadow-md"
            >
              {dish.emoji}
            </motion.div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <Utensils className="w-20 h-20 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Drop Ingredients Here</p>
          </div>
        )}

        {/* Smoke/Steam Effects */}
        {isCooking && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(3 + Math.floor(heatLevel))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: -150 - (heatLevel * 20),
                  x: (Math.random() - 0.5) * 60,
                  scale: [0.5, 1.5, 2]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2 - (heatLevel * 0.2),
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
                className={`absolute bottom-1/2 left-1/2 w-8 h-8 rounded-full blur-xl ${temperature > dish.idealTempMax ? 'bg-gray-800' : 'bg-white'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Fire under the pan */}
        {isCooking && heatLevel > 0 && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-1">
            {[...Array(Math.min(5, Math.ceil(heatLevel)))].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                animate={{
                  scaleY: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.2 + Math.random() * 0.2,
                  delay: i * 0.1
                }}
              >
                <Flame className={`text-orange-500 ${heatLevel > 3 ? 'text-blue-500' : ''}`} size={24 + (heatLevel * 2)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CookingChallenge({ onComplete }: CookingChallengeProps) {
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [temperature, setTemperature] = useState(20);
  const [cookingTime, setCookingTime] = useState(0);
  const [heatLevel, setHeatLevel] = useState(0); // 0 to 5
  const [isCooking, setIsCooking] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [phase, setPhase] = useState<'setup' | 'cooking' | 'result'>('setup');
  const [perfectTime, setPerfectTime] = useState(0); // Time spent in perfect temp zone
  const { playSfx } = useAudio();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentDish = DISHES[currentDishIndex];

  useEffect(() => {
    if (isCooking) {
      timerRef.current = setInterval(() => {
        setCookingTime(prev => prev + 0.1); // Update every 100ms

        // Temperature physics using functional state to avoid stale closures
        setTemperature(prevTemp => {
          const coolingRate = 0.15;
          const heatingRate = heatLevel * 0.35; // Gentle realistic heating
          const newTemp = Math.max(20, Math.min(150, prevTemp + heatingRate - coolingRate));

          // Track perfect time linearly inside the same state update
          if (newTemp >= currentDish.idealTempMin && newTemp <= currentDish.idealTempMax) {
            setPerfectTime(pt => pt + 0.1);
          }

          return newTemp;
        });

      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isCooking, heatLevel, currentDish]); // Removed `temperature` from dependencies!

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over && event.over.id === 'pan') {
      playSfx('click');
      startCooking();
    }
  };

  const startCooking = () => {
    setIsCooking(true);
    setHeatLevel(1); // Start with low heat
    setPhase('cooking');
  };

  const stopCooking = () => {
    setIsCooking(false);
    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);
    playSfx('success');

    // Score Calculation
    // 1. Time Score: How close to target cook time?
    const timeDiff = Math.abs(cookingTime - currentDish.cookTime);
    // Be forgiving: Within 2 seconds is still a perfect time score
    const timeScore = timeDiff <= 2 ? 40 : Math.max(0, 40 - ((timeDiff - 2) * 5)); // Max 40 points

    // 2. Temperature Mastery: 
    // They only need to hold it at perfect temp for 20% of the target cook time to get max points.
    const targetPerfectTimeDuration = currentDish.cookTime * 0.2;
    const perfectRatio = Math.min(1, perfectTime / Math.max(1, targetPerfectTimeDuration));
    let tempScore = perfectRatio * 40; // Max 40 points

    // 3. Doneness Penalty: Scale penalty based on how far off the temperature is
    let tempPenalty = 0;

    // Give a 3 degree buffer window where there is NO penalty
    if (temperature < currentDish.idealTempMin - 3) {
      // Undercooked
      const degreesOff = (currentDish.idealTempMin - 3) - temperature;
      tempPenalty = Math.min(30, degreesOff * 1.5);
    } else if (temperature > currentDish.idealTempMax + 3) {
      // Overcooked/Burnt
      const degreesOff = temperature - (currentDish.idealTempMax + 3);
      tempPenalty = Math.min(40, degreesOff * 2);
    }

    // 4. Near-Miss Boost: If they missed the perfect time zone but ended on a great temperature, 
    // boost the temp score since the final product is what matters most.
    if (tempPenalty === 0 && tempScore < 30) {
      tempScore = 35; // Guarantee 35/40 for temperature if the final temp is in the pocket
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(timeScore + tempScore - tempPenalty + 30))); // Base 30 points, cap at 100

    setResults([...results, finalScore]);
  };

  const nextDish = () => {
    playSfx('click');
    if (currentDishIndex < DISHES.length - 1) {
      setCurrentDishIndex(prev => prev + 1);
      setCookingTime(0);
      setTemperature(20);
      setHeatLevel(0);
      setPerfectTime(0);
      setIsCooking(false);
      setPhase('setup');
    } else {
      // The `results` array already contains the final score for the last dish because `stopCooking` pushed it.
      // Therefore we can simply reduce the `results` array directly.
      const totalScore = results.reduce((acc, curr) => acc + curr, 0);
      const avgScore = Math.round(totalScore / DISHES.length);
      onComplete(avgScore);
    }
  };

  const getQualityRating = (score: number) => {
    if (score >= 90) return { text: 'Chef\'s Kiss! 👨‍🍳', color: 'text-green-600', emoji: '⭐' };
    if (score >= 70) return { text: 'Delicious!', color: 'text-blue-600', emoji: '👍' };
    if (score >= 50) return { text: 'Edible', color: 'text-yellow-600', emoji: '👌' };
    return { text: 'Burnt/Raw...', color: 'text-red-600', emoji: '🤢' };
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-orange-100 p-2 rounded-lg text-orange-600">👨‍🍳</span>
                Dish {currentDishIndex + 1}: {currentDish.name}
              </h3>
              <p className="text-gray-500 mt-1">{currentDish.description}</p>
            </div>

            <div className="flex gap-2">
              {DISHES.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-colors ${idx < currentDishIndex
                    ? 'bg-green-500'
                    : idx === currentDishIndex
                      ? 'bg-orange-500'
                      : 'bg-gray-200'
                    }`}
                />
              ))}
            </div>
          </div>

          <DndContext onDragEnd={handleDragEnd}>
            {phase === 'setup' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-orange-50 rounded-2xl p-6 text-center border border-orange-100">
                    <Timer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{currentDish.cookTime}s</div>
                    <div className="text-sm text-gray-600 font-medium">Target Time</div>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
                    <ThermometerSun className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">
                      {currentDish.idealTempMin}-{currentDish.idealTempMax}°C
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Ideal Temp Range</div>
                  </div>
                </div>

                <div className="flex justify-around items-center py-12 bg-gray-50 rounded-3xl border border-gray-100">
                  <DraggableIngredient dish={currentDish} isCooking={false} />
                  <CookingPan isCooking={false} dish={currentDish} temperature={20} heatLevel={0} />
                </div>
              </motion.div>
            )}

            {phase === 'cooking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Panel: Stats */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 font-medium">Time</span>
                      <Timer className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                      {cookingTime.toFixed(1)}s
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-orange-500"
                        style={{ width: `${Math.min(100, (cookingTime / currentDish.cookTime) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 font-medium">Temperature</span>
                      <ThermometerSun className={`w-5 h-5 ${temperature > currentDish.idealTempMax ? 'text-red-500' :
                        temperature >= currentDish.idealTempMin ? 'text-green-500' : 'text-blue-500'
                        }`} />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 font-mono">
                      {temperature.toFixed(0)}°C
                    </div>

                    {/* Temperature Bar */}
                    <div className="relative h-6 bg-gray-200 rounded-full mt-4 overflow-hidden">
                      {/* Zones */}
                      <div
                        className="absolute top-0 bottom-0 bg-green-200 opacity-50"
                        style={{
                          left: `${(currentDish.idealTempMin / 150) * 100}%`,
                          width: `${((currentDish.idealTempMax - currentDish.idealTempMin) / 150) * 100}%`
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 bg-red-200 opacity-50"
                        style={{
                          left: `${(currentDish.idealTempMax + 10) / 150 * 100}%`,
                          right: 0
                        }}
                      />

                      {/* Indicator */}
                      <motion.div
                        className="absolute top-0 bottom-0 w-1 bg-black shadow-lg"
                        style={{ left: `${Math.min(100, (temperature / 150) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0°C</span>
                      <span>150°C</span>
                    </div>

                    {temperature > currentDish.idealTempMax && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm font-bold mt-2 bg-red-50 p-2 rounded-lg"
                      >
                        <AlertTriangle size={16} />
                        BURNING! LOWER HEAT!
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Center Panel: Cooking Area */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center bg-gray-50 rounded-3xl p-8 border border-gray-100 relative">
                  <CookingPan isCooking={true} dish={currentDish} temperature={temperature} heatLevel={heatLevel} />

                  {/* Heat Control */}
                  <div className="w-full max-w-md mt-12 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-700">Stove Heat</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">Level {heatLevel}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={heatLevel}
                      onChange={(e) => setHeatLevel(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                      <span>OFF</span>
                      <span>LOW</span>
                      <span>MED</span>
                      <span>HIGH</span>
                      <span className="text-red-500">MAX</span>
                    </div>
                  </div>

                  <button
                    onClick={stopCooking}
                    className="mt-8 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    Serve Dish! 🍽️
                  </button>
                </div>
              </motion.div>
            )}
          </DndContext>

          {phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="text-8xl mb-6 animate-bounce">{currentDish.emoji}</div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">{currentDish.name}</h4>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8 mb-8 shadow-xl">
                <div className="text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                  {results[results.length - 1]}
                  <span className="text-2xl text-gray-400 ml-2">/ 100</span>
                </div>
                <div className="text-2xl font-medium flex items-center justify-center gap-2">
                  {getQualityRating(results[results.length - 1]).emoji}
                  <span className={getQualityRating(results[results.length - 1]).color}>
                    {getQualityRating(results[results.length - 1]).text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Cooking Time</div>
                  <div className="text-2xl font-bold text-gray-900">{cookingTime.toFixed(1)}s</div>
                  <div className="text-xs text-gray-400 mt-1">Target: {currentDish.cookTime}s</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Final Temp</div>
                  <div className={`text-2xl font-bold ${temperature > currentDish.idealTempMax ? 'text-red-600' :
                    temperature < currentDish.idealTempMin ? 'text-blue-600' : 'text-green-600'
                    }`}>
                    {temperature.toFixed(0)}°C
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {currentDish.idealTempMin}-{currentDish.idealTempMax}°C
                  </div>
                </div>
              </div>

              <button
                onClick={nextDish}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
              >
                {currentDishIndex < DISHES.length - 1 ? 'Next Dish →' : 'Complete Challenge 🎉'}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

