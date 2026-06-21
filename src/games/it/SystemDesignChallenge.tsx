import { useState, useEffect } from 'react';
import { Server, Database, Cloud, Zap, Activity, DollarSign, Shield, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Component {
  id: string;
  name: string;
  icon: JSX.Element;
  type: 'frontend' | 'backend' | 'database' | 'cache' | 'loadbalancer' | 'api';
  cost: number;
  capacity: number;
}

interface PlacedComponent {
  component: Component;
  position: { x: number; y: number };
  connections: string[];
  load: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
}

const COMPONENTS: Component[] = [
  { id: 'frontend', name: 'Frontend UI', icon: <Server className="w-6 h-6" />, type: 'frontend', cost: 10, capacity: 50 },
  { id: 'api', name: 'API Gateway', icon: <Zap className="w-6 h-6" />, type: 'api', cost: 15, capacity: 80 },
  { id: 'backend', name: 'Backend Server', icon: <Cloud className="w-6 h-6" />, type: 'backend', cost: 20, capacity: 60 },
  { id: 'database', name: 'Database', icon: <Database className="w-6 h-6" />, type: 'database', cost: 25, capacity: 70 },
  { id: 'cache', name: 'Cache Layer', icon: <Activity className="w-6 h-6" />, type: 'cache', cost: 15, capacity: 90 },
  { id: 'loadbalancer', name: 'Load Balancer', icon: <Server className="w-6 h-6" />, type: 'loadbalancer', cost: 20, capacity: 100 },
];

interface SystemDesignChallengeProps {
  onComplete: (score: number) => void;
}

export function SystemDesignChallenge({ onComplete }: SystemDesignChallengeProps) {
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isStressTest, setIsStressTest] = useState(false);
  const [traffic, setTraffic] = useState(0);
  const [metrics, setMetrics] = useState({ speed: 0, cost: 0, reliability: 0 });
  const [showMissionBrief, setShowMissionBrief] = useState(true);
  const { playSfx } = useAudio();

  useEffect(() => {
    if (isRunning) {
      const targetTraffic = isStressTest ? 150 : 100;
      if (traffic < targetTraffic) {
        const timer = setInterval(() => {
          setTraffic(prev => Math.min(targetTraffic, prev + 5));
        }, 200);
        return () => clearInterval(timer);
      }
    } else {
      setTraffic(0);
    }
  }, [isRunning, isStressTest, traffic]);

  useEffect(() => {
    calculateMetrics();
    updateComponentStatus();
  }, [placedComponents, traffic]);

  const updateComponentStatus = () => {
    if (!isRunning) {
      setPlacedComponents(prev => prev.map(pc => ({ ...pc, load: 0, status: 'healthy' })));
      return;
    }

    setPlacedComponents(prev => prev.map(pc => {
      // Calculate load based on traffic and component capacity
      // Load balancers reduce load on connected backends
      let currentLoad = traffic;

      // Actual meaningful simulation logic:
      const incomingConnections = prev.filter(p => p.connections.includes(pc.component.id));
      const connectedFromLoadBalancer = incomingConnections.some(p => p.component.type === 'loadbalancer');
      const connectedFromCache = incomingConnections.some(p => p.component.type === 'cache');

      // Load Balancers split traffic across connected backends
      if (pc.component.type === 'backend' && connectedFromLoadBalancer) {
        currentLoad = currentLoad / 2;
      }

      // Cache layers significantly shield databases from traffic
      if (pc.component.type === 'database' && connectedFromCache) {
        currentLoad = currentLoad / 3;
      }

      const effectiveLoad = Math.min(100, (currentLoad / pc.component.capacity) * 50);

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (effectiveLoad > 90) status = 'critical';
      else if (effectiveLoad > 70) status = 'warning';

      return { ...pc, load: effectiveLoad, status };
    }));
  };

  const removeComponent = (indexToRemove: number) => {
    playSfx('click');
    setPlacedComponents(prev => prev.filter((_, idx) => idx !== indexToRemove).map(pc => {
      // Also remove any connections to this deleted component
      const deletedId = prev[indexToRemove].component.id;
      return {
        ...pc,
        connections: pc.connections.filter(conn => conn !== deletedId)
      };
    }));
  };

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
    if (traffic > 100) speedScore -= 20;

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
    playSfx('click');
    setSelectedComponent(component.id);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedComponent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const component = COMPONENTS.find(c => c.id === selectedComponent);
    if (!component) return;

    playSfx('click');
    setPlacedComponents([
      ...placedComponents,
      {
        component,
        position: { x, y },
        connections: [],
        load: 0,
        status: 'healthy',
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
    playSfx('click');
    if (!connectingFrom) {
      setConnectingFrom(componentId); // This sets the source component
    } else {
      if (connectingFrom !== componentId) {
        // Add connection from source component TO this target component
        const newPlaced = placedComponents.map(pc => {
          if (pc.component.id === connectingFrom) {
            // Prevent duplicate connections
            if (!pc.connections.includes(componentId)) {
              return {
                ...pc,
                connections: [...pc.connections, componentId],
              };
            }
          }
          return pc;
        });
        setPlacedComponents(newPlaced);
      }
      setConnectingFrom(null); // Reset after connection
    }
  };

  const handleRunSystem = (stress: boolean) => {
    playSfx('click');
    setIsStressTest(stress);
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

      // Bonus for surviving stress test
      if (stress && placedComponents.every(pc => pc.status !== 'critical')) {
        finalScore += 20;
      }

      onComplete(Math.round(Math.min(100, finalScore)));
    }, 8000);
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

        <AnimatePresence>
          {showMissionBrief && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              className="bg-blue-100/50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900 relative"
            >
              <button
                onClick={() => { playSfx('click'); setShowMissionBrief(false); }}
                className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors p-1"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <strong>Mission: Flash Sale Survival</strong><br />
              Design a highly available web architecture that can survive a sudden massive spike in user traffic.
              <ul>
                <li>• Ensure you have at least a <strong>Frontend</strong>, <strong>Backend</strong>, and <strong>Database</strong>.</li>
                <li>• Use <strong>Load Balancers</strong> to split traffic going into your backends.</li>
                <li>• Use <strong>Caches</strong> to protect your databases from heavy read traffic.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-4 gap-6 mb-6">
          {/* Component Palette */}
          <div className="col-span-1 bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-4">Components</h4>
            <div className="space-y-2">
              {COMPONENTS.map(component => (
                <button
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedComponent === component.id
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
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold animate-pulse">
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
                      <g key={`${idx}-${targetId}`}>
                        <line
                          x1={pc.position.x}
                          y1={pc.position.y}
                          x2={target.position.x}
                          y2={target.position.y}
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray={isRunning ? "5,5" : "0"}
                          opacity={0.5}
                        />
                        {isRunning && (
                          <circle r="4" fill="#34d399">
                            <animateMotion
                              dur={`${Math.max(0.5, 2 - (traffic / 100))}s`}
                              repeatCount="indefinite"
                              path={`M${pc.position.x},${pc.position.y} L${target.position.x},${target.position.y}`}
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })
                )}
              </svg>

              {/* Placed components */}
              {placedComponents.map((pc, idx) => (
                <motion.div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleComponentDrag(idx, e as any)}
                  onClick={() => handleConnect(pc.component.id)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${connectingFrom === pc.component.id ? 'ring-4 ring-green-400 rounded-lg' : ''
                    }`}
                  style={{ left: pc.position.x, top: pc.position.y }}
                  animate={{
                    scale: pc.status === 'critical' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <div className={`group relative bg-white rounded-lg p-3 shadow-lg hover:shadow-xl transition-all ${pc.status === 'critical' ? 'bg-red-100 border-2 border-red-500' :
                    pc.status === 'warning' ? 'bg-yellow-100 border-2 border-yellow-500' : ''
                    }`}>
                    {pc.status === 'critical' && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-20">
                        <AlertTriangle size={12} />
                      </div>
                    )}
                    {!isRunning && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeComponent(idx); }}
                        className="absolute -top-2 -left-2 bg-gray-400 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        title="Remove Component"
                      >
                        <X size={12} />
                      </button>
                    )}
                    <div className={`${pc.status === 'critical' ? 'text-red-600' :
                      pc.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      } mb-1`}>{pc.component.icon}</div>
                    <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {pc.component.name}
                    </div>
                    {isRunning && (
                      <div className="w-full bg-gray-200 h-1 mt-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pc.status === 'critical' ? 'bg-red-500' :
                            pc.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${pc.load}%` }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Traffic visualization */}
              {isRunning && traffic > 0 && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className={`w-4 h-4 ${isStressTest ? 'text-red-600' : 'text-green-600'}`} />
                    <span className="text-sm font-semibold text-gray-900">
                      {isStressTest ? 'STRESS TEST LOAD' : 'Traffic Load'}: {traffic}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${isStressTest ? 'bg-red-600' : 'bg-green-600'} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, (traffic / 150) * 100)}%` }}
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
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Reliability</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{metrics.reliability}%</div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => handleRunSystem(false)}
                disabled={placedComponents.length < 3 || isRunning}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning && !isStressTest ? 'System Running...' : 'Run Normal Test'}
              </button>
              <button
                onClick={() => handleRunSystem(true)}
                disabled={placedComponents.length < 3 || isRunning}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                {isRunning && isStressTest ? 'STRESS TESTING...' : 'Run Stress Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
