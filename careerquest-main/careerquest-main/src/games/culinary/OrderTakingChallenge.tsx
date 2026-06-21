import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Order {
  id: number;
  customer: string;
  items: string[];
  specialRequests: string[];
}

const SAMPLE_ORDERS: Order[] = [
  {
    id: 1,
    customer: 'Table 3',
    items: ['Grilled Salmon', 'Caesar Salad', 'Lemon Tart'],
    specialRequests: ['No croutons on salad', 'Salmon well-done'],
  },
  {
    id: 2,
    customer: 'Table 7',
    items: ['Ribeye Steak', 'Mashed Potatoes', 'Chocolate Cake'],
    specialRequests: ['Steak medium-rare', 'Extra gravy'],
  },
  {
    id: 3,
    customer: 'Table 5',
    items: ['Vegetarian Pasta', 'Garden Salad', 'Tiramisu'],
    specialRequests: ['Gluten-free pasta', 'Dressing on the side'],
  },
];

interface OrderTakingChallengeProps {
  onComplete: (score: number) => void;
}

export function OrderTakingChallenge({ onComplete }: OrderTakingChallengeProps) {
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [showOrder, setShowOrder] = useState(true);
  const [timeToMemorize, setTimeToMemorize] = useState(10);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [results, setResults] = useState<boolean[]>([]);

  const currentOrder = SAMPLE_ORDERS[currentOrderIndex];
  const allItems = ['Grilled Salmon', 'Caesar Salad', 'Lemon Tart', 'Ribeye Steak', 'Mashed Potatoes', 'Chocolate Cake', 'Vegetarian Pasta', 'Garden Salad', 'Tiramisu'];
  const allRequests = ['No croutons on salad', 'Salmon well-done', 'Steak medium-rare', 'Extra gravy', 'Gluten-free pasta', 'Dressing on the side'];

  useEffect(() => {
    if (phase === 'memorize' && timeToMemorize > 0) {
      const timer = setTimeout(() => setTimeToMemorize(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeToMemorize === 0) {
      setPhase('recall');
      setShowOrder(false);
    }
  }, [phase, timeToMemorize]);

  const handleSubmit = () => {
    const itemsCorrect = selectedItems.sort().join(',') === currentOrder.items.sort().join(',');
    const requestsCorrect = selectedRequests.sort().join(',') === currentOrder.specialRequests.sort().join(',');
    const isCorrect = itemsCorrect && requestsCorrect;

    setResults([...results, isCorrect]);

    if (currentOrderIndex < SAMPLE_ORDERS.length - 1) {
      setCurrentOrderIndex(prev => prev + 1);
      setPhase('memorize');
      setTimeToMemorize(10);
      setShowOrder(true);
      setSelectedItems([]);
      setSelectedRequests([]);
    } else {
      const correctCount = [...results, isCorrect].filter(Boolean).length;
      const score = Math.round((correctCount / SAMPLE_ORDERS.length) * 100);
      onComplete(score);
    }
  };

  const toggleItem = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleRequest = (request: string) => {
    setSelectedRequests(prev =>
      prev.includes(request) ? prev.filter(r => r !== request) : [...prev, request]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Order {currentOrderIndex + 1} of {SAMPLE_ORDERS.length}
          </h3>
          <div className="flex gap-2">
            {SAMPLE_ORDERS.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentOrderIndex
                    ? results[idx]
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : idx === currentOrderIndex
                    ? 'bg-orange-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {phase === 'memorize' && (
          <div className="space-y-6">
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {timeToMemorize}s
              </div>
              <p className="text-gray-700">Memorize this order!</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                {currentOrder.customer}
              </h4>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Items:</p>
                <ul className="space-y-2">
                  {currentOrder.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-gray-900">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Special Requests:</p>
                <ul className="space-y-2">
                  {currentOrder.specialRequests.map((request, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-orange-600">⚠</span>
                      <span className="text-gray-900">{request}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {phase === 'recall' && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="font-semibold text-gray-900">
                What did {currentOrder.customer} order?
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Select the items:</h4>
              <div className="grid grid-cols-2 gap-3">
                {allItems.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedItems.includes(item)
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Select special requests:</h4>
              <div className="grid grid-cols-1 gap-3">
                {allRequests.map(request => (
                  <button
                    key={request}
                    onClick={() => toggleRequest(request)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedRequests.includes(request)
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {request}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
