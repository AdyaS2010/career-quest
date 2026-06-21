import { useState, useEffect } from 'react';
import { Server, Database, Cloud, Zap, Activity, DollarSign } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  icon: JSX.Element;
  type: 'frontend' | 'backend' | 'database' | 'cache' | 'loadbalancer' | 'api';
  cost: number;
}

interface PlacedComponent {
  component: Component;
  position: { x: number; y: number };
  connections: string[];
}

const COMPONENTS: Component[] = [
  { id: 'frontend', name: 'Frontend UI', icon: <Server className="w-6 h-6" />, type: 'frontend', cost: 10 },
  { id: 'api', name: 'API Gateway', icon: <Zap className="w-6 h-6" />, type: 'api', cost: 15 },
  { id: 'backend', name: 'Backend Server', icon: <Cloud className="w-6 h-6" />, type: 'backend', cost: 20 },
  { id: 'database', name: 'Database', icon: <Database className="w-6 h-6" />, type: 'database', cost: 25 },
  { id: 'cache', name: 'Cache Layer', icon: <Activity className="w-6 h-6" />, type: 'cache', cost: 15 },
  { id: 'loadbalancer', name: 'Load Balancer', icon: <Server className="w-6 h-6" />, type: 'loadbalancer', cost: 20 },
];

interface SystemDesignChallengeProps {
  onComplete: (score: number) => void;
}

export function SystemDesignChallenge({ onComplete }: SystemDesignChallengeProps) {
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [traffic, setTraffic] = useState(0);
  const [metrics, setMetrics] = useState({ speed: 0, cost: 0, reliability: 0 });

  useEffect(() => {
    if (isRunning && traffic < 100) {
      const timer = setInterval(() => {
        setTraffic(prev => Math.min(100, prev + 5));
      }, 500);
      return () => clearInterval(timer);
    }
  }, [isRunning, traffic]);

  useEffect(() => {
    calculateMetrics();
  }, [placedComponents, traffic]);

  const calculateMetrics = () => {
    if (placedComponents.length === 0) {
      setMetrics({ speed: 0, cost: 0, reliability: 0 });
      return;
    }

    // Calculate cost
    const totalCost = placedComponents.reduce((sum, pc) => sum + pc.component.cost, 0);
    const costScore = Math.max(0, 100 - totalCost);

    // Calculate speed based on architecture
    const hasLoadBalancer = placedComponents.some(pc => pc.component.type === 'loadbalancer');
    const hasCache = placedComponents.some(pc => pc.component.type === 'cache');
    const hasApi = placedComponents.some(pc => pc.component.type === 'api');
    
    let speedScore = 50;
    if (hasLoadBalancer) speedScore += 20;
    if (hasCache) speedScore += 20;
    if (hasApi) speedScore += 10;
    
    // Traffic penalty
    speedScore = Math.max(0, speedScore - (traffic / 5));

    // Calculate reliability based on connections
    const avgConnections = placedComponents.reduce((sum, pc) => sum + pc.connections.length, 0) / placedComponents.length;
    const hasRedundancy = placedComponents.length >= 5;
    let reliabilityScore = avgConnections * 20;
    if (hasRedundancy) reliabilityScore += 20;
    reliabilityScore = Math.min(100, reliabilityScore);

    setMetrics({
      speed: Math.round(speedScore),
      cost: Math.round(costScore),
      reliability: Math.round(reliabilityScore),
    });
  };

  const handleComponentClick = (component: Component) => {
    setSelectedComponent(component.id);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedComponent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const component = COMPONENTS.find(c => c.id === selectedComponent);
    if (!component) return;

    setPlacedComponents([
      ...placedComponents,
      {
        component,
        position: { x, y },
        connections: [],
      },
    ]);
    setSelectedComponent(null);
  };

  const handleComponentDrag = (index: number, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('componentIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentIndex = parseInt(e.dataTransfer.getData('componentIndex'));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPlaced = [...placedComponents];
    newPlaced[componentIndex] = {
      ...newPlaced[componentIndex],
      position: { x, y },
    };
    setPlacedComponents(newPlaced);
  };

  const handleConnect = (componentId: string) => {
    if (!connectingFrom) {
      setConnectingFrom(componentId);
    } else {
      if (connectingFrom !== componentId) {
        // Add connection
        const newPlaced = placedComponents.map(pc => {
          if (pc.component.id === connectingFrom) {
            return {
              ...pc,
              connections: [...pc.connections, componentId],
            };
          }
          return pc;
        });
        setPlacedComponents(newPlaced);
      }
      setConnectingFrom(null);
    }
  };

  const handleRunSystem = () => {
    setIsRunning(true);
    setTraffic(0);

    setTimeout(() => {
      setIsRunning(false);
      
      // Calculate final score
      const avgMetric = (metrics.speed + metrics.cost + metrics.reliability) / 3;
      const hasAllRequired = placedComponents.some(pc => pc.component.type === 'frontend') &&
                             placedComponents.some(pc => pc.component.type === 'backend') &&
                             placedComponents.some(pc => pc.component.type === 'database');
      
      const connectionScore = placedComponents.reduce((sum, pc) => sum + pc.connections.length * 10, 0);
      
      let finalScore = hasAllRequired ? 30 : 0;
      finalScore += Math.min(40, connectionScore);
      finalScore += avgMetric * 0.3;
      
      onComplete(Math.round(Math.min(100, finalScore)));
    }, 10000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              System Design Architect
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          {/* Component Palette */}
          <div className="col-span-1 bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-4">Components</h4>
            <div className="space-y-2">
              {COMPONENTS.map(component => (
                <button
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedComponent === component.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-green-600">{component.icon}</div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium text-gray-900">{component.name}</div>
                    <div className="text-xs text-gray-500">${component.cost}/mo</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">
                <strong>Instructions:</strong>
              </div>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click component, then click canvas to place</li>
                <li>Click placed components to connect them</li>
                <li>Run system to test performance</li>
              </ol>
            </div>
          </div>

          {/* Design Canvas */}
          <div className="col-span-3">
            <div
              onClick={handleCanvasClick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl h-[500px] mb-4 overflow-hidden"
            >
              {selectedComponent && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Click anywhere to place component
                </div>
              )}

              {/* Draw connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {placedComponents.map((pc, idx) =>
                  pc.connections.map(targetId => {
                    const target = placedComponents.find(p => p.component.id === targetId);
                    if (!target) return null;
                    
                    return (
                      <line
                        key={`${idx}-${targetId}`}
                        x1={pc.position.x}
                        y1={pc.position.y}
                        x2={target.position.x}
                        y2={target.position.y}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray={isRunning ? "5,5" : "0"}
                      >
                        {isRunning && (
                          <animate
                            attributeName="stroke-dashoffset"
                            from="0"
                            to="10"
                            dur="0.5s"
                            repeatCount="indefinite"
                          />
                        )}
                      </line>
                    );
                  })
                )}
              </svg>

              {/* Placed components */}
              {placedComponents.map((pc, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleComponentDrag(idx, e)}
                  onClick={() => handleConnect(pc.component.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                    connectingFrom === pc.component.id ? 'ring-4 ring-green-400' : ''
                  }`}
                  style={{ left: pc.position.x, top: pc.position.y }}
                >
                  <div className="bg-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all">
                    <div className="text-green-600 mb-1">{pc.component.icon}</div>
                    <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {pc.component.name}
                    </div>
                  </div>
                </div>
              ))}

              {/* Traffic visualization */}
              {isRunning && traffic > 0 && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      Traffic Load: {traffic}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${traffic}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Speed</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{metrics.speed}%</div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Cost Efficiency</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{metrics.cost}%</div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Reliability</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{metrics.reliability}%</div>
              </div>
            </div>

            <button
              onClick={handleRunSystem}
              disabled={placedComponents.length < 3 || isRunning}
              className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'System Running...' : 'Run System Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
