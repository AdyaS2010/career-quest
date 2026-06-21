import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface PlateItem {
  id: string;
  name: string;
  emoji: string;
  category: 'protein' | 'vegetable' | 'starch' | 'garnish';
}

const PLATE_ITEMS: PlateItem[] = [
  { id: 'steak', name: 'Steak', emoji: '🥩', category: 'protein' },
  { id: 'chicken', name: 'Chicken', emoji: '🍗', category: 'protein' },
  { id: 'salmon', name: 'Salmon', emoji: '🐟', category: 'protein' },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'vegetable' },
  { id: 'carrots', name: 'Carrots', emoji: '🥕', category: 'vegetable' },
  { id: 'asparagus', name: 'Asparagus', emoji: '🌿', category: 'vegetable' },
  { id: 'potato', name: 'Potato', emoji: '🥔', category: 'starch' },
  { id: 'rice', name: 'Rice', emoji: '🍚', category: 'starch' },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', category: 'starch' },
  { id: 'herb', name: 'Herbs', emoji: '🌿', category: 'garnish' },
  { id: 'lemon', name: 'Lemon', emoji: '🍋', category: 'garnish' },
  { id: 'sauce', name: 'Sauce', emoji: '🫙', category: 'garnish' },
];

interface PlatePresentationChallengeProps {
  onComplete: (score: number) => void;
}

export function PlatePresentationChallenge({ onComplete }: PlatePresentationChallengeProps) {
  const [selectedItems, setSelectedItems] = useState<PlateItem[]>([]);
  const [arrangement, setArrangement] = useState<{ item: PlateItem; position: { x: number; y: number } }[]>([]);
  const [phase, setPhase] = useState<'select' | 'arrange' | 'complete'>('select');

  const handleItemSelect = (item: PlateItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 6) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleArrangePhase = () => {
    const initialArrangement = selectedItems.map((item, idx) => ({
      item,
      position: {
        x: 50 + (idx % 3) * 100,
        y: 50 + Math.floor(idx / 3) * 100,
      },
    }));
    setArrangement(initialArrangement);
    setPhase('arrange');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('itemIndex', index.toString());
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
      };
      return newArrangement;
    });
  };

  const handleComplete = () => {
    const hasProtein = selectedItems.some(i => i.category === 'protein');
    const hasVegetable = selectedItems.some(i => i.category === 'vegetable');
    const hasStarch = selectedItems.some(i => i.category === 'starch');
    const hasGarnish = selectedItems.some(i => i.category === 'garnish');

    const balanceScore = [hasProtein, hasVegetable, hasStarch, hasGarnish].filter(Boolean).length * 20;
    const varietyScore = Math.min(selectedItems.length * 5, 20);

    const score = balanceScore + varietyScore;
    onComplete(score);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {phase === 'select' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Plate Presentation
              </h3>
              <p className="text-gray-600">
                Select up to 6 items to create a balanced, beautiful dish
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-center text-gray-700">
                <strong>Tip:</strong> A well-balanced plate includes protein, vegetables, starch, and garnish
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {PLATE_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  disabled={selectedItems.length >= 6 && !selectedItems.find(i => i.id === item.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedItems.find(i => i.id === item.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                </button>
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
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Arrange on Plate
            </button>
          </div>
        )}

        {phase === 'arrange' && (
          <div className="space-y-6">
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
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="absolute inset-0 bg-white opacity-90 rounded-full" />

              {arrangement.map((item, index) => (
                <div
                  key={item.item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  className="absolute cursor-move transition-transform hover:scale-110"
                  style={{
                    left: `${item.position.x}px`,
                    top: `${item.position.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="bg-white rounded-full p-3 shadow-lg">
                    <div className="text-5xl">{item.item.emoji}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
            >
              Serve Dish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
