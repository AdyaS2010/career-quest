import { useState } from 'react';
import { FileText, Star as StarIcon } from 'lucide-react';

interface Fact {
  id: string;
  text: string;
  category: 'lede' | 'body' | 'conclusion';
}

interface Quote {
  id: string;
  text: string;
  speaker: string;
}

interface HeadlineOption {
  id: string;
  text: string;
  effectiveness: number;
}

const FACTS: Fact[] = [
  { id: 'f1', text: 'Arctic ice melt rate accelerated 40% faster than previous decade', category: 'lede' },
  { id: 'f2', text: 'Study focused on Arctic ice melt rates over 20 years', category: 'body' },
  { id: 'f3', text: 'Used satellite data and ground measurements from 15 research stations', category: 'body' },
  { id: 'f4', text: 'Predicts 2-foot sea level rise by 2050 affecting 100M people', category: 'body' },
  { id: 'f5', text: 'Immediate 50% carbon emission reduction needed to slow progression', category: 'conclusion' },
  { id: 'f6', text: 'Dr. Sarah Chen led the groundbreaking climate research', category: 'body' },
];

const QUOTES: Quote[] = [
  { id: 'qu1', text: 'The acceleration we\'re seeing is unprecedented and alarming.', speaker: 'Dr. Sarah Chen' },
  { id: 'qu2', text: 'This isn\'t just about polar bears anymore, it\'s about human survival.', speaker: 'Dr. Sarah Chen' },
  { id: 'qu3', text: 'We have a narrow window to act before the damage becomes irreversible.', speaker: 'Dr. Sarah Chen' },
];

const HEADLINES: HeadlineOption[] = [
  { id: 'h1', text: 'Arctic Ice Melting Faster Than Ever, New Study Reveals', effectiveness: 85 },
  { id: 'h2', text: 'Scientists Say Something About Ice', effectiveness: 30 },
  { id: 'h3', text: 'Climate Crisis: Arctic Melt Accelerates 40%, Threatening 100M People', effectiveness: 95 },
  { id: 'h4', text: 'Ice Study Results Published', effectiveness: 25 },
];

interface ArticleSection {
  type: 'lede' | 'body' | 'conclusion';
  facts: Fact[];
  quotes: Quote[];
}

interface StoryCrafterChallengeProps {
  onComplete: (score: number) => void;
}

export function StoryCrafterChallenge({ onComplete }: StoryCrafterChallengeProps) {
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleSection[]>([
    { type: 'lede', facts: [], quotes: [] },
    { type: 'body', facts: [], quotes: [] },
    { type: 'conclusion', facts: [], quotes: [] },
  ]);
  const [availableFacts, setAvailableFacts] = useState<Fact[]>(FACTS);
  const [availableQuotes, setAvailableQuotes] = useState<Quote[]>(QUOTES);
  const [showPreview, setShowPreview] = useState(false);
  const [editorFeedback, setEditorFeedback] = useState<{ engagement: number; clarity: number; accuracy: number } | null>(null);

  const handleFactDrop = (fact: Fact, sectionIndex: number) => {
    const newArticle = [...article];
    newArticle[sectionIndex].facts.push(fact);
    setArticle(newArticle);
    setAvailableFacts(availableFacts.filter(f => f.id !== fact.id));
  };

  const handleQuoteDrop = (quote: Quote, sectionIndex: number) => {
    const newArticle = [...article];
    newArticle[sectionIndex].quotes.push(quote);
    setArticle(newArticle);
    setAvailableQuotes(availableQuotes.filter(q => q.id !== quote.id));
  };

  const handleRemoveFact = (factId: string, sectionIndex: number) => {
    const fact = article[sectionIndex].facts.find(f => f.id === factId);
    if (fact) {
      const newArticle = [...article];
      newArticle[sectionIndex].facts = newArticle[sectionIndex].facts.filter(f => f.id !== factId);
      setArticle(newArticle);
      setAvailableFacts([...availableFacts, fact]);
    }
  };

  const handleRemoveQuote = (quoteId: string, sectionIndex: number) => {
    const quote = article[sectionIndex].quotes.find(q => q.id === quoteId);
    if (quote) {
      const newArticle = [...article];
      newArticle[sectionIndex].quotes = newArticle[sectionIndex].quotes.filter(q => q.id !== quoteId);
      setArticle(newArticle);
      setAvailableQuotes([...availableQuotes, quote]);
    }
  };

  const handlePublish = () => {
    setShowPreview(true);

    // Calculate scores
    const headlineScore = HEADLINES.find(h => h.id === selectedHeadline)?.effectiveness || 0;
    
    // Structure score based on correct placement
    const ledeHasMainFact = article[0].facts.some(f => f.category === 'lede');
    const bodyHasSupportingFacts = article[1].facts.length >= 2;
    const conclusionHasAction = article[2].facts.some(f => f.category === 'conclusion');
    
    let structureScore = 0;
    if (ledeHasMainFact) structureScore += 15;
    if (bodyHasSupportingFacts) structureScore += 15;
    if (conclusionHasAction) structureScore += 10;
    
    // Quote score
    const quoteScore = Math.min(30, article.reduce((sum, section) => sum + section.quotes.length, 0) * 10);

    const engagement = Math.round((headlineScore * 0.3) + structureScore + (quoteScore * 0.3));
    const clarity = Math.round(structureScore * 1.2);
    const accuracy = article.reduce((sum, section) => sum + section.facts.length, 0) >= 4 ? 90 : 70;

    setEditorFeedback({ engagement, clarity, accuracy });

    setTimeout(() => {
      const finalScore = Math.round((engagement + clarity + accuracy) / 3);
      onComplete(finalScore);
    }, 4000);
  };

  const canPublish = selectedHeadline && 
    article.some(s => s.facts.length > 0 || s.quotes.length > 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-purple-600" />
          <h3 className="text-2xl font-bold text-gray-900">
            Story Crafter
          </h3>
        </div>

        {!showPreview ? (
          <>
            {/* Headline Selection */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">1. Choose Your Headline:</h4>
              <div className="grid grid-cols-2 gap-3">
                {HEADLINES.map(headline => (
                  <button
                    key={headline.id}
                    onClick={() => setSelectedHeadline(headline.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedHeadline === headline.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{headline.text}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-6">
              {/* Available Content */}
              <div className="col-span-1">
                <h4 className="font-bold text-gray-900 mb-3">2. Available Content:</h4>
                
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Facts:</div>
                  <div className="space-y-2">
                    {availableFacts.map(fact => (
                      <div
                        key={fact.id}
                        className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs"
                      >
                        {fact.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Quotes:</div>
                  <div className="space-y-2">
                    {availableQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="bg-purple-50 p-2 rounded-lg border border-purple-200 text-xs"
                      >
                        <div className="font-semibold text-purple-900">{quote.speaker}:</div>
                        <div className="italic">"{quote.text}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Article Builder */}
              <div className="col-span-3">
                <h4 className="font-bold text-gray-900 mb-3">3. Build Your Article:</h4>
                
                <div className="space-y-4">
                  {/* Lede */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📌</span>
                      <div>
                        <div className="font-bold text-gray-900">Lede (Opening)</div>
                        <div className="text-xs text-gray-600">Hook readers with the main news</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Add Facts:</div>
                      <div className="flex flex-wrap gap-2">
                        {availableFacts.map(fact => (
                          <button
                            key={fact.id}
                            onClick={() => handleFactDrop(fact, 0)}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            + Add
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {article[0].facts.map(fact => (
                        <div key={fact.id} className="bg-white p-2 rounded border border-gray-200 text-sm flex items-start justify-between">
                          <span>{fact.text}</span>
                          <button onClick={() => handleRemoveFact(fact.id, 0)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                      {article[0].quotes.map(quote => (
                        <div key={quote.id} className="bg-purple-100 p-2 rounded border border-purple-200 text-sm flex items-start justify-between">
                          <span className="italic">"{quote.text}" - {quote.speaker}</span>
                          <button onClick={() => handleRemoveQuote(quote.id, 0)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Add Quotes:</div>
                      <div className="flex flex-wrap gap-2">
                        {availableQuotes.map(quote => (
                          <button
                            key={quote.id}
                            onClick={() => handleQuoteDrop(quote, 0)}
                            className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                          >
                            + Add Quote
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <div className="font-bold text-gray-900">Body (Details)</div>
                        <div className="text-xs text-gray-600">Provide context and supporting information</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                        {availableFacts.map(fact => (
                          <button
                            key={fact.id}
                            onClick={() => handleFactDrop(fact, 1)}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            + Add
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {article[1].facts.map(fact => (
                        <div key={fact.id} className="bg-white p-2 rounded border border-gray-200 text-sm flex items-start justify-between">
                          <span>{fact.text}</span>
                          <button onClick={() => handleRemoveFact(fact.id, 1)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                      {article[1].quotes.map(quote => (
                        <div key={quote.id} className="bg-purple-100 p-2 rounded border border-purple-200 text-sm flex items-start justify-between">
                          <span className="italic">"{quote.text}" - {quote.speaker}</span>
                          <button onClick={() => handleRemoveQuote(quote.id, 1)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {availableQuotes.map(quote => (
                          <button
                            key={quote.id}
                            onClick={() => handleQuoteDrop(quote, 1)}
                            className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                          >
                            + Add Quote
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <div className="font-bold text-gray-900">Conclusion (Call to Action)</div>
                        <div className="text-xs text-gray-600">End with impact and next steps</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                        {availableFacts.map(fact => (
                          <button
                            key={fact.id}
                            onClick={() => handleFactDrop(fact, 2)}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            + Add
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {article[2].facts.map(fact => (
                        <div key={fact.id} className="bg-white p-2 rounded border border-gray-200 text-sm flex items-start justify-between">
                          <span>{fact.text}</span>
                          <button onClick={() => handleRemoveFact(fact.id, 2)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                      {article[2].quotes.map(quote => (
                        <div key={quote.id} className="bg-purple-100 p-2 rounded border border-purple-200 text-sm flex items-start justify-between">
                          <span className="italic">"{quote.text}" - {quote.speaker}</span>
                          <button onClick={() => handleRemoveQuote(quote.id, 2)} className="text-red-600 ml-2">✕</button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {availableQuotes.map(quote => (
                          <button
                            key={quote.id}
                            onClick={() => handleQuoteDrop(quote, 2)}
                            className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                          >
                            + Add Quote
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={!canPublish}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publish Article
            </button>
          </>
        ) : (
          <div>
            {/* Article Preview */}
            <div className="bg-gray-50 rounded-xl p-8 mb-6 border-2 border-gray-200">
              <div className="max-w-3xl mx-auto">
                <div className="text-sm text-gray-600 mb-2">THE DAILY NEWS</div>
                <h1 className="text-4xl font-bold text-gray-900 mb-6">
                  {HEADLINES.find(h => h.id === selectedHeadline)?.text}
                </h1>
                
                {article.map((section, idx) => (
                  <div key={idx} className="mb-4">
                    {section.facts.map((fact, fIdx) => (
                      <p key={fIdx} className="text-gray-800 mb-2 leading-relaxed">{fact.text}</p>
                    ))}
                    {section.quotes.map((quote, qIdx) => (
                      <blockquote key={qIdx} className="border-l-4 border-purple-500 pl-4 my-3 italic text-gray-700">
                        "{quote.text}" - {quote.speaker}
                      </blockquote>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Feedback */}
            {editorFeedback && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-6xl">👨‍💼</span>
                  <div>
                    <div className="text-xl font-bold text-gray-900 mb-2">Editor's Feedback</div>
                    <div className="text-gray-700 mb-4">Great work! Here's how your article performed:</div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i <= Math.round(editorFeedback.engagement / 20)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{editorFeedback.engagement}%</div>
                        <div className="text-sm text-gray-600">Engagement</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i <= Math.round(editorFeedback.clarity / 20)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{editorFeedback.clarity}%</div>
                        <div className="text-sm text-gray-600">Clarity</div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i <= Math.round(editorFeedback.accuracy / 20)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-green-600">{editorFeedback.accuracy}%</div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
