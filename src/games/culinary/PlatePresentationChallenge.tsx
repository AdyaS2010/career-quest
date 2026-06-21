import { useState } from 'react';
import { Sparkles, Camera, ChefHat, Star, Share2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface PlateItem {
  id: string;
  name: string;
  emoji: string;
  category: 'protein' | 'vegetable' | 'starch' | 'garnish';
  count: number;
}

const PLATE_ITEMS: PlateItem[] = [
  { id: 'steak', name: 'Steak', emoji: '🥩', category: 'protein', count: 1 },
  { id: 'chicken', name: 'Chicken', emoji: '🍗', category: 'protein', count: 1 },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', category: 'protein', count: 1 },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'vegetable', count: 5 },
  { id: 'carrots', name: 'Carrots', emoji: '🥕', category: 'vegetable', count: 4 },
  { id: 'asparagus', name: 'Asparagus', emoji: '🌿', category: 'vegetable', count: 4 },
  { id: 'potato', name: 'Potato', emoji: '🥔', category: 'starch', count: 1 },
  { id: 'rice', name: 'Rice', emoji: '🍚', category: 'starch', count: 1 },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', category: 'starch', count: 1 },
  { id: 'herb', name: 'Herbs', emoji: '🌿', category: 'garnish', count: 3 },
  { id: 'lemon', name: 'Lemon', emoji: '🍋', category: 'garnish', count: 2 },
  { id: 'sauce', name: 'Sauce', emoji: '🫙', category: 'garnish', count: 1 },
];

interface PlatePresentationChallengeProps {
  onComplete: (score: number) => void;
}

export function PlatePresentationChallenge({ onComplete }: PlatePresentationChallengeProps) {
  const [selectedItems, setSelectedItems] = useState<PlateItem[]>([]);
  const [arrangement, setArrangement] = useState<{ item: PlateItem; position: { x: number; y: number }; scale: number; rotation: number }[]>([]);
  const [phase, setPhase] = useState<'select' | 'arrange' | 'judging' | 'complete'>('select');
  const [flash, setFlash] = useState(false);
  const [judgeComment, setJudgeComment] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const { playSfx } = useAudio();

  const handleItemSelect = (item: PlateItem) => {
    playSfx('click');
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 6) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleArrangePhase = () => {
    playSfx('click');
    const newArrangement: { item: PlateItem; position: { x: number; y: number }; scale: number; rotation: number }[] = [];

    selectedItems.forEach((item, idx) => {
      // Base position for this group
      const baseX = 180 + (idx % 3) * 60;
      const baseY = 180 + Math.floor(idx / 3) * 60;

      for (let c = 0; c < item.count; c++) {
        // Scatter secondary items slightly around the base coordinate
        const offsetX = c === 0 ? 0 : (Math.random() * 40 - 20);
        const offsetY = c === 0 ? 0 : (Math.random() * 40 - 20);

        newArrangement.push({
          item,
          position: {
            x: baseX + offsetX,
            y: baseY + offsetY,
          },
          scale: 1,
          rotation: Math.random() * 60 - 30, // Random starting rotation for organic feel
        });
      }
    });

    setArrangement(newArrangement);
    setPhase('arrange');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('itemIndex', index.toString());
    playSfx('click');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemIndex = parseInt(e.dataTransfer.getData('itemIndex'));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setArrangement(prev => {
      const newArrangement = [...prev];
      newArrangement[itemIndex] = {
        ...newArrangement[itemIndex],
        position: { x, y },
        rotation: Math.random() * 30 - 15, // Slight random rotation for realism
      };
      return newArrangement;
    });

    // Play sound based on item type
    const item = arrangement[itemIndex].item;
    if (item.category === 'garnish') playSfx('click'); // Should be a lighter sound ideally
    else playSfx('click');
  };

  const handleComplete = () => {
    setPhase('judging');

    // Calculate Score
    const hasProtein = selectedItems.some(i => i.category === 'protein');
    const hasVegetable = selectedItems.some(i => i.category === 'vegetable');
    const hasStarch = selectedItems.some(i => i.category === 'starch');
    const hasGarnish = selectedItems.some(i => i.category === 'garnish');

    const balanceScore = [hasProtein, hasVegetable, hasStarch, hasGarnish].filter(Boolean).length * 20;
    const varietyScore = Math.min(selectedItems.length * 5, 20);
    const score = balanceScore + varietyScore;
    setFinalScore(score);

    // Generate Judge Comment
    if (score >= 90) setJudgeComment("Absolutely stunning! A masterpiece of culinary art.");
    else if (score >= 70) setJudgeComment("A very appetizing plate. Good balance of colors and textures.");
    else if (score >= 50) setJudgeComment("Not bad, but it feels like something is missing. Maybe more color?");
    else setJudgeComment("It looks a bit... sparse. Remember to include all food groups!");

    // Camera Flash Effect
    setTimeout(() => {
      playSfx('success');
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setPhase('complete');
      }, 200);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden min-h-[600px]">

        {/* Flash Overlay */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {phase === 'select' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Plate Presentation
              </h3>
              <p className="text-gray-600">
                Select up to 6 items to create a balanced, beautiful dish
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
              <p className="text-center text-gray-700 flex items-center justify-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-600" />
                <strong>Chef's Tip:</strong> A well-balanced plate includes protein, vegetables, starch, and garnish!
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {PLATE_ITEMS.map(item => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  disabled={selectedItems.length >= 6 && !selectedItems.find(i => i.id === item.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedItems.find(i => i.id === item.id)
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{item.category}</div>
                </motion.button>
              ))}
            </div>

            <div className="text-center mb-4">
              <span className="text-lg font-semibold text-gray-700">
                Selected: {selectedItems.length}/6
              </span>
            </div>

            <button
              onClick={handleArrangePhase}
              disabled={selectedItems.length === 0}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Go to Plating
            </button>
          </motion.div>
        )}

        {(phase === 'arrange' || phase === 'judging') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Arrange Your Dish
              </h3>
              <p className="text-gray-600">
                Drag items to create an attractive presentation
              </p>
            </div>

            <div
              className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-full aspect-square max-w-lg mx-auto border-8 border-white shadow-2xl overflow-hidden"
              onDrop={phase === 'arrange' ? handleDrop : undefined}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="absolute inset-0 bg-white opacity-90 rounded-full" />

              {/* Decorative Plate Rim */}
              <div className="absolute inset-4 border border-gray-200 rounded-full opacity-50 pointer-events-none" />

              {arrangement.map((item, index) => {
                let sizeClass = 'text-6xl';
                if (item.item.category === 'protein') sizeClass = 'text-8xl';
                else if (item.item.category === 'starch') {
                  if (item.item.id === 'potato') sizeClass = 'text-6xl';
                  else if (item.item.id === 'pasta') sizeClass = 'text-[12rem] leading-none'; // Make pasta even bigger
                  else sizeClass = 'text-[9rem] leading-none'; // Rice
                }
                else if (item.item.category === 'vegetable') sizeClass = 'text-6xl';
                else if (item.item.category === 'garnish') sizeClass = 'text-4xl';

                return (
                  <motion.div
                    key={item.item.id}
                    draggable={phase === 'arrange'}
                    onDragStart={(e) => handleDragStart(e as any, index)}
                    className={`absolute ${phase === 'arrange' ? 'cursor-move' : ''}`}
                    style={{
                      left: `${item.position.x}px`,
                      top: `${item.position.y}px`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{
                      scale: 1,
                      rotate: item.rotation,
                      x: "-50%",
                      y: "-50%"
                    }}
                    whileHover={phase === 'arrange' ? { scale: 1.1, zIndex: 10 } : {}}
                  >
                    <div className={`filter drop-shadow-lg ${sizeClass} select-none`}>
                      {item.item.emoji}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {phase === 'arrange' && (
              <div className="flex gap-4">
                <button
                  onClick={() => setPhase('select')}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Present Dish
                </button>
              </div>
            )}

            {phase === 'judging' && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <ChefHat className="w-12 h-12 text-orange-500 mx-auto" />
                </motion.div>
                <p className="mt-4 text-lg font-semibold text-gray-700">The Judge is tasting your dish...</p>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 max-w-md mx-auto transform rotate-1">
              <div className="bg-gray-900 p-4 rounded-lg mb-4 relative overflow-hidden aspect-square">
                {/* Snapshot of the plate (simulated by re-rendering it smaller) */}
                <div className="absolute inset-0 bg-white rounded-full m-4 opacity-90" />
                {arrangement.map((item, index) => {
                  let sizeClass = 'text-3xl';
                  if (item.item.category === 'protein') sizeClass = 'text-5xl';
                  else if (item.item.category === 'starch') {
                    if (item.item.id === 'potato') sizeClass = 'text-4xl';
                    else if (item.item.id === 'pasta') sizeClass = 'text-[8rem] leading-none';
                    else sizeClass = 'text-[6rem] leading-none'; // Rice
                  }
                  else if (item.item.category === 'vegetable') sizeClass = 'text-3xl';
                  else if (item.item.category === 'garnish') sizeClass = 'text-xl';

                  return (
                    <div
                      key={index}
                      className={`absolute flex items-center justify-center ${sizeClass}`}
                      style={{
                        left: `${item.position.x / 500 * 100}%`,
                        top: `${item.position.y / 500 * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                      }}
                    >
                      {item.item.emoji}
                    </div>
                  );
                })}
              </div>

              <h3 className="font-handwriting text-3xl font-bold text-gray-800 mb-2">Chef's Special</h3>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= Math.round(finalScore / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-gray-600 italic font-serif">"{judgeComment}"</p>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setSelectedItems([]);
                  setArrangement([]);
                  setPhase('select');
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Create New Dish
              </button>
              <button
                onClick={() => onComplete(finalScore)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Submit Score
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
