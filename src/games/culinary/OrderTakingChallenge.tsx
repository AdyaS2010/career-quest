import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ChefHat, Receipt, XCircle } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: number;
  customer: string;
  avatar: string;
  mood: 'happy' | 'neutral' | 'impatient';
  items: string[];
  specialRequests: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Define items and their logical possible requests
const MENU_DATABASE = {
  entrees: [
    { name: 'Grilled Salmon', possibleRequests: ['Salmon well-done', 'Extra lemon', 'No sauce'] },
    { name: 'Ribeye Steak', possibleRequests: ['Steak medium-rare', 'Steak well-done', 'Extra gravy'] },
    { name: 'Vegetarian Pasta', possibleRequests: ['Gluten-free pasta', 'Extra parmesan', 'No garlic'] },
    { name: 'Chicken Parmesan', possibleRequests: ['Sauce on the side', 'Extra cheese'] },
    { name: 'Mushroom Risotto', possibleRequests: ['Dairy-free', 'Extra mushrooms'] },
  ],
  sides: [
    { name: 'Caesar Salad', possibleRequests: ['No croutons on salad', 'Dressing on the side'] },
    { name: 'Mashed Potatoes', possibleRequests: ['Extra butter', 'No gravy'] },
    { name: 'Garden Salad', possibleRequests: ['No onions', 'Dressing on the side'] },
    { name: 'Roasted Vegetables', possibleRequests: ['No salt', 'Well-roasted'] },
  ],
  desserts: [
    { name: 'Lemon Tart', possibleRequests: ['No powdered sugar'] },
    { name: 'Chocolate Cake', possibleRequests: ['Add vanilla ice cream'] },
    { name: 'Tiramisu', possibleRequests: ['Extra cocoa powder'] },
    { name: 'Cheesecake', possibleRequests: ['Strawberry glaze on the side'] },
  ]
};

const CUSTOMERS = [
  { name: 'Sarah (Regular)', avatar: '👩‍💼', mood: 'happy' as const },
  { name: 'Mr. Thompson', avatar: '👨‍🦳', mood: 'neutral' as const },
  { name: 'The Critics', avatar: '🕵️‍♂️', mood: 'impatient' as const },
  { name: 'The Mayor', avatar: '👔', mood: 'happy' as const },
  { name: 'Tired Student', avatar: '🎒', mood: 'impatient' as const },
];

function generateRandomOrders(count: number): Order[] {
  const orders: Order[] = [];

  for (let i = 0; i < count; i++) {
    // Randomize difficulty based on order index
    const difficulty = i === 0 ? 'easy' : (i === count - 1 ? 'hard' : 'medium');

    // Pick a random customer
    const randomCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];

    // Randomly select 1 entree, 1 side, 1 dessert 
    // (easy: 2 items, medium/hard: 3 items)
    const categories = ['entrees', 'sides', 'desserts'];

    // Shuffle categories to pick which ones to include if easy
    const selectedCategories = difficulty === 'easy'
      ? categories.sort(() => 0.5 - Math.random()).slice(0, 2)
      : categories;

    const items: string[] = [];
    const specialRequests: string[] = [];

    selectedCategories.forEach(cat => {
      const dbCategory = MENU_DATABASE[cat as keyof typeof MENU_DATABASE];
      const randomItem = dbCategory[Math.floor(Math.random() * dbCategory.length)];
      items.push(randomItem.name);

      // Random chance to add a special request based on difficulty
      const requestChance = difficulty === 'easy' ? 0.3 : (difficulty === 'medium' ? 0.6 : 0.9);
      if (randomItem.possibleRequests.length > 0 && Math.random() < requestChance) {
        const randomReq = randomItem.possibleRequests[Math.floor(Math.random() * randomItem.possibleRequests.length)];
        // Don't add duplicate requests (though unlikely with this structure)
        if (!specialRequests.includes(randomReq)) {
          specialRequests.push(randomReq);
        }
      }
    });

    // If hard mode, force at least 2 special requests if possible
    if (difficulty === 'hard' && specialRequests.length < 2) {
      selectedCategories.forEach(cat => {
        const dbCategory = MENU_DATABASE[cat as keyof typeof MENU_DATABASE];
        const itemMatch = items.find(iName => dbCategory.some(dbItem => dbItem.name === iName));
        if (itemMatch) {
          const dbItemInfo = dbCategory.find(dbItem => dbItem.name === itemMatch);
          if (dbItemInfo && dbItemInfo.possibleRequests.length > 0) {
            const randomReq = dbItemInfo.possibleRequests[Math.floor(Math.random() * dbItemInfo.possibleRequests.length)];
            if (!specialRequests.includes(randomReq)) specialRequests.push(randomReq);
          }
        }
      });
    }

    orders.push({
      id: i + 1,
      customer: randomCustomer.name,
      avatar: randomCustomer.avatar,
      mood: randomCustomer.mood,
      items,
      specialRequests,
      difficulty
    });
  }

  return orders;
}

interface OrderTakingChallengeProps {
  onComplete: (score: number) => void;
}

export function OrderTakingChallenge({ onComplete }: OrderTakingChallengeProps) {
  const [orders] = useState<Order[]>(() => generateRandomOrders(5));
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [timeToMemorize, setTimeToMemorize] = useState(10);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'feedback'>('memorize');
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const { playSfx } = useAudio();

  // If there are no orders generated (safety check)
  if (!orders || orders.length === 0) return null;

  const currentOrder = orders[currentOrderIndex];

  // Extract and shuffle unique items/requests so they don't appear in predictable sequential order
  const [allItems] = useState<string[]>(() => {
    const items = Array.from(new Set(orders.flatMap(o => o.items)));
    return items.sort(() => 0.5 - Math.random());
  });
  const [allRequests] = useState<string[]>(() => {
    const requests = Array.from(new Set(orders.flatMap(o => o.specialRequests)));
    return requests.sort(() => 0.5 - Math.random());
  });

  useEffect(() => {
    if (phase === 'memorize' && timeToMemorize > 0) {
      const timer = setTimeout(() => setTimeToMemorize(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeToMemorize === 0 && phase === 'memorize') {
      setPhase('recall');
    }
  }, [phase, timeToMemorize]);

  const handleSubmit = () => {
    const itemsCorrect = selectedItems.sort().join(',') === currentOrder.items.sort().join(',');
    const requestsCorrect = selectedRequests.sort().join(',') === currentOrder.specialRequests.sort().join(',');
    const isCorrect = itemsCorrect && requestsCorrect;

    setResults([...results, isCorrect]);
    if (isCorrect) {
      playSfx('success');
      setScore(prev => prev + (currentOrder.difficulty === 'hard' ? 40 : currentOrder.difficulty === 'medium' ? 30 : 20));
    } else {
      playSfx('error');
    }

    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentOrderIndex < orders.length - 1) {
      setCurrentOrderIndex(prev => prev + 1);
      setPhase('memorize');
      setTimeToMemorize(10);
      setSelectedItems([]);
      setSelectedRequests([]);
    } else {
      // Calculate max possible score dynamically
      const maxScore = orders.reduce((acc, order) => {
        return acc + (order.difficulty === 'hard' ? 40 : order.difficulty === 'medium' ? 30 : 20);
      }, 0);
      const finalScore = Math.round((score / maxScore) * 100);
      onComplete(Math.min(100, finalScore));
    }
  };

  const toggleItem = (item: string) => {
    playSfx('click');
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleRequest = (request: string) => {
    playSfx('click');
    setSelectedRequests(prev =>
      prev.includes(request) ? prev.filter(r => r !== request) : [...prev, request]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative min-h-[600px]">
        {/* Header */}
        <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Order Up!</h3>
              <p className="text-orange-100 text-sm">Table {currentOrder.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {orders.map((_, idx: number) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-colors ${idx < currentOrderIndex
                  ? results[idx] ? 'bg-green-400' : 'bg-red-400'
                  : idx === currentOrderIndex ? 'bg-white' : 'bg-orange-800'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Customer Avatar Area */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={currentOrder.id}
              className="text-center"
            >
              <div className="text-8xl mb-2 filter drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
                {phase === 'feedback'
                  ? (results[results.length - 1] ? '🥰' : '😠')
                  : currentOrder.avatar}
              </div>
              <h4 className="font-bold text-xl text-gray-800">{currentOrder.customer}</h4>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mt-2 ${currentOrder.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentOrder.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {currentOrder.difficulty} Mode
              </div>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'memorize' && (
              <motion.div
                key="memorize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto"
              >
                {/* Timer Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
                    <span>Memorize the Order</span>
                    <span className="text-orange-600">{timeToMemorize}s</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-orange-500"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: timeToMemorize, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* The Ticket */}
                <div className="bg-yellow-50 p-6 rounded-sm shadow-md border-t-8 border-orange-200 relative transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full" />
                  <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4 text-center">
                    <Receipt className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <h2 className="font-mono text-2xl font-bold text-gray-800">ORDER #{currentOrder.id}04</h2>
                    <p className="font-mono text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                  </div>

                  <div className="space-y-4 font-mono">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Items</p>
                      <ul className="space-y-2">
                        {currentOrder.items.map((item: string, i: number) => (
                          <li key={i} className="text-lg font-bold text-gray-800 flex justify-between">
                            <span>{item}</span>
                            <span>1</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {currentOrder.specialRequests.length > 0 && (
                      <div className="bg-white p-3 rounded border border-red-100">
                        <p className="text-xs text-red-500 uppercase mb-1 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> Special Requests
                        </p>
                        <ul className="space-y-1">
                          {currentOrder.specialRequests.map((req: string, i: number) => (
                            <li key={i} className="text-sm text-red-600 italic">- {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center font-mono text-xs text-gray-400">
                    THANK YOU FOR DINING WITH US
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'recall' && (
              <motion.div
                key="recall"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">What did they order?</h3>
                  <p className="text-gray-500">Select the items and any special requests.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Receipt size={18} /> Menu Items
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {allItems.map(item => (
                        <button
                          key={item}
                          onClick={() => toggleItem(item)}
                          className={`p-3 rounded-xl text-left transition-all flex items-center justify-between ${selectedItems.includes(item)
                            ? 'bg-white border-2 border-orange-500 shadow-md text-orange-900'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                          <span>{item}</span>
                          {selectedItems.includes(item) && <CheckCircle2 size={18} className="text-orange-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-2xl">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                      <AlertCircle size={18} /> Special Requests
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {allRequests.map(req => (
                        <button
                          key={req}
                          onClick={() => toggleRequest(req)}
                          className={`p-3 rounded-xl text-left transition-all flex items-center justify-between ${selectedRequests.includes(req)
                            ? 'bg-white border-2 border-red-500 shadow-md text-red-900'
                            : 'bg-white border border-red-100 hover:bg-red-100 text-gray-600'
                            }`}
                        >
                          <span>{req}</span>
                          {selectedRequests.includes(req) && <CheckCircle2 size={18} className="text-red-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Submit Order 🛎️
                </button>
              </motion.div>
            )}

            {phase === 'feedback' && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="mb-6">
                  {results[results.length - 1] ? (
                    <div className="inline-block p-6 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-16 h-16 text-green-600" />
                    </div>
                  ) : (
                    <div className="inline-block p-6 bg-red-100 rounded-full mb-4">
                      <XCircle className="w-16 h-16 text-red-600" />
                    </div>
                  )}
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {results[results.length - 1] ? 'Perfect Order!' : 'Order Mix-up!'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {results[results.length - 1]
                      ? "The customer is delighted with your service. Keep up the great work!"
                      : "The customer received the wrong items. Pay closer attention to the details!"}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                  >
                    {currentOrderIndex < orders.length - 1 ? 'Next Customer' : 'Finish Shift'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
