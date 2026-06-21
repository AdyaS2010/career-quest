import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Trophy, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CareerSage } from '../components/CharacterGuide';
import { useChat } from '../contexts/ChatContext';
// tile assets
const castleUrl = new URL('../assets/map/castle.svg', import.meta.url).href;
const culinaryUrl = new URL('../assets/map/culinary.svg', import.meta.url).href;
const itUrl = new URL('../assets/map/it.svg', import.meta.url).href;
const lawUrl = new URL('../assets/map/law.svg', import.meta.url).href;
const mediaUrl = new URL('../assets/map/media.svg', import.meta.url).href;
const healthUrl = new URL('../assets/map/health.svg', import.meta.url).href;
import type { Career, Profile, UserCareerProgress } from '../lib/database.types';

// map layout moved to grid-based tiles (styles in index.css)

export function HomePage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerProgress, setCareerProgress] = useState<Record<string, UserCareerProgress>>({});
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  // use global chat context instead of local state
  const { openChat } = useChat();
  const [guideMessage, setGuideMessage] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const iconFor = (slug?: string) => {
    if (!slug) return culinaryUrl;
    const s = slug.toLowerCase();
    if (s.includes('culinary')) return culinaryUrl;
    if (s.includes('it') || s.includes('information')) return itUrl;
    if (s.includes('law')) return lawUrl;
    if (s.includes('media')) return mediaUrl;
    if (s.includes('health')) return healthUrl;
    return culinaryUrl;
  };

  // map / pan refs (needed for pointer interactions)
  const mapRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);

  // inertia / velocity refs
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // pinch refs for touch
  const pinchRef = useRef<{ initialDistance: number; initialScale: number; center: { x: number; y: number } } | null>(null);

  const mappedCareers = useMemo(() => {
      // random non-overlapping placements within container bounds
      const containerW = 520;
      const containerH = 360;
      const tileW = 160;
      const tileH = 160;

      const minDist = 120; // minimum center-to-center distance between islands
      const attemptsPerItem = 200;

      const positions: { x: number; y: number }[] = [];

      for (let i = 0; i < careers.length; i++) {
        let placed = false;
        for (let attempt = 0; attempt < attemptsPerItem; attempt++) {
          const x = Math.round(Math.random() * (containerW - tileW));
          const y = Math.round(Math.random() * (containerH - tileH));

          let ok = true;
          for (const p of positions) {
            const dx = p.x - x;
            const dy = p.y - y;
            if (Math.hypot(dx, dy) < minDist) {
              ok = false;
              break;
            }
          }

          if (ok) {
            positions.push({ x, y });
            placed = true;
            break;
          }
        }

        if (!placed) {
          // fallback: find first spot along grid that satisfies minDist
          const gridStep = Math.max(64, Math.floor(minDist / 2));
          let found = false;
          for (let gx = 0; gx <= containerW - tileW && !found; gx += gridStep) {
            for (let gy = 0; gy <= containerH - tileH && !found; gy += gridStep) {
              let ok = true;
              for (const p of positions) {
                if (Math.hypot(p.x - gx, p.y - gy) < minDist) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                positions.push({ x: gx, y: gy });
                found = true;
              }
            }
          }
          if (!found) {
            // last resort: place at a clamped position
            const fallbackX = Math.min(containerW - tileW, (i * 80) % (containerW - tileW));
            const fallbackY = Math.min(containerH - tileH, Math.floor(i / 6) * 80);
            positions.push({ x: fallbackX, y: fallbackY });
          }
        }
      }

      const base = careers.map((c, i) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        score: careerProgress[c.id]?.score,
        isCompleted: careerProgress[c.id]?.status === 'completed',
        isStarted: careerProgress[c.id]?.status === 'in_progress',
        icon: iconFor(c.slug),
        x: positions[i]?.x ?? (100 * i),
        y: positions[i]?.y ?? (100 * i),
      }));

      // stronger repel pass to spread islands a bit more
      const adjusted = base.map(p => ({ ...p }));
      // increase the effective minimum spacing and allow more iterations
      const repelMin = minDist * 1.5; // larger than minDist to encourage more separation
      for (let it = 0; it < 50; it++) {
        let moved = false;
        for (let a = 0; a < adjusted.length; a++) {
          for (let b = a + 1; b < adjusted.length; b++) {
            const A = adjusted[a];
            const B = adjusted[b];
            const dx = A.x - B.x;
            const dy = A.y - B.y;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < repelMin) {
              // push more strongly proportional to the overlap
              const push = (repelMin - d) * 1.15;
              const nx = (dx / d) * push;
              const ny = (dy / d) * push;
              A.x = Math.max(0, Math.min(containerW - tileW, A.x + nx));
              A.y = Math.max(0, Math.min(containerH - tileH, A.y + ny));
              B.x = Math.max(0, Math.min(containerW - tileW, B.x - nx));
              B.y = Math.max(0, Math.min(containerH - tileH, B.y - ny));
              moved = true;
            }
          }
        }
        if (!moved) break;
      }

      return adjusted;
    }, [careers, careerProgress]);

  // leftover orbit center (no longer used) removed

  function stopInertia() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function startInertia() {
    stopInertia();
    const decay = 0.95; // per frame
    const eps = 0.05;

    function step() {
      velocityRef.current.x *= decay;
      velocityRef.current.y *= decay;

      panRef.current.x += velocityRef.current.x;
      panRef.current.y += velocityRef.current.y;
      setPan({ x: panRef.current.x, y: panRef.current.y });

      if (Math.abs(velocityRef.current.x) > eps || Math.abs(velocityRef.current.y) > eps) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        stopInertia();
      }
    }

    rafRef.current = requestAnimationFrame(step);
  }

  function handlePointerDown(e: React.PointerEvent) {
    // unify pointer and mouse
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = { x: 0, y: 0 };
    stopInertia();
    mapRef.current?.classList.add('dragging');
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !lastPosRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    const dt = Math.max(16, now - (lastMoveTimeRef.current || now));

    // velocity px per frame approximation
    velocityRef.current = { x: dx / (dt / 16), y: dy / (dt / 16) };

    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastMoveTimeRef.current = now;
    panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
    setPan({ x: panRef.current.x, y: panRef.current.y });
  }

  function handlePointerUp(e: React.PointerEvent) {
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
    draggingRef.current = false;
    lastPosRef.current = null;
    mapRef.current?.classList.remove('dragging');
    // start inertia using last velocity
    startInertia();
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    // zoom to cursor
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursorX = e.clientX - rect.left - rect.width / 2 - panRef.current.x;
    const cursorY = e.clientY - rect.top - rect.height / 2 - panRef.current.y;

    const delta = -e.deltaY * 0.0015;
    const next = Math.min(2.5, Math.max(0.6, scale + delta));

    // adjust pan so the point under cursor stays fixed
    const scaleFactor = next / scale;
    panRef.current.x = panRef.current.x - cursorX * (scaleFactor - 1);
    panRef.current.y = panRef.current.y - cursorY * (scaleFactor - 1);
    setScale(next);
    setPan({ x: panRef.current.x, y: panRef.current.y });
  }

  // touch pinch handlers
  function distanceBetween(a: any, b: any) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  function centerBetween(a: any, b: any) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const d = distanceBetween(e.touches[0], e.touches[1]);
      const c = centerBetween(e.touches[0], e.touches[1]);
      pinchRef.current = { initialDistance: d, initialScale: scale, center: c };
      stopInertia();
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      draggingRef.current = true;
      lastPosRef.current = { x: t.clientX, y: t.clientY };
      lastMoveTimeRef.current = performance.now();
      velocityRef.current = { x: 0, y: 0 };
      stopInertia();
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const d = distanceBetween(e.touches[0], e.touches[1]);
      const c = centerBetween(e.touches[0], e.touches[1]);
      const scaleChange = d / pinchRef.current.initialDistance;
      const next = Math.min(2.5, Math.max(0.6, pinchRef.current.initialScale * scaleChange));

      // convert screen center to map-local coords and adjust pan to zoom around pinch center
      const rect = mapRef.current?.getBoundingClientRect();
      if (rect) {
        const screenCx = c.x - rect.left - rect.width / 2;
        const screenCy = c.y - rect.top - rect.height / 2;
        const scaleFactor = next / scale;
        panRef.current.x = panRef.current.x - screenCx * (scaleFactor - 1);
        panRef.current.y = panRef.current.y - screenCy * (scaleFactor - 1);
      }

      setScale(next);
      setPan({ x: panRef.current.x, y: panRef.current.y });
    } else if (e.touches.length === 1 && draggingRef.current && lastPosRef.current) {
      const t = e.touches[0];
      const now = performance.now();
      const dx = t.clientX - lastPosRef.current.x;
      const dy = t.clientY - lastPosRef.current.y;
      const dt = Math.max(16, now - (lastMoveTimeRef.current || now));
      velocityRef.current = { x: dx / (dt / 16), y: dy / (dt / 16) };
      lastPosRef.current = { x: t.clientX, y: t.clientY };
      lastMoveTimeRef.current = now;
      panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
      setPan({ x: panRef.current.x, y: panRef.current.y });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) {
      draggingRef.current = false;
      lastPosRef.current = null;
      startInertia();
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  // update the central container transform from pan/scale changes without inline JSX styles
  useEffect(() => {
    if (centerRef.current) {
      centerRef.current.style.transform = `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`;
    }
  }, [pan.x, pan.y, scale]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [careersRes, profileRes, progressRes] = await Promise.all([
        supabase.from('careers').select('*').eq('is_active', true).order('order_index'),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_career_progress').select('*').eq('user_id', user.id)
      ]);

      if (careersRes.data) setCareers(careersRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        updateGuideMessage(profileRes.data, progressRes.data || []);
      }

      const progressMap: Record<string, UserCareerProgress> = {};
      progressRes.data?.forEach((p: any) => {
        progressMap[p.career_id] = p;
      });
      setCareerProgress(progressMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGuideMessage = (_prof: Profile, progress: UserCareerProgress[]) => {
    const completedCount = progress.filter(p => p.status === 'completed').length;
    // More polished, wizard-sage themed messages tailored to progress
    if (completedCount === 0) {
      setGuideMessage("Welcome to the Career World! I'm Astra — explore any island to begin. Each island teaches a different real-world career skill.");
    } else if (completedCount === 1) {
      setGuideMessage("Nice start! You've explored your first career path. Ready to uncover another skill set?");
    } else if (completedCount === 2) {
      setGuideMessage("Great momentum — two paths explored. Keep going to broaden your career skills!");
    } else if (completedCount === 3) {
      setGuideMessage("Excellent progress! Three paths down — you're growing into a well-rounded explorer.");
    } else if (completedCount === 4) {
      setGuideMessage("Almost complete! One more path to go. Finish it to earn top recognition.");
    } else if (completedCount >= 5) {
      setGuideMessage("🎉 Legendary! You've explored all career islands. You're a true Career World Champion!");
    }
  };

  const handleCareerClick = (careerSlug: string) => {
    navigate(`/career/${careerSlug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-50">
        <div className="text-center">
          <div className="w-20 h-20 mb-4 animate-spin">🌐</div>
          <p className="text-xl font-bold text-indigo-800">Loading World Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-300 via-blue-200 to-cyan-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 pattern-bg" />
      </div>

      <nav className="relative z-50 backdrop-blur-xl bg-gradient-to-r from-amber-900/90 to-orange-900/90 border-b-4 border-amber-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-amber-200 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
                <Map className="w-8 h-8 text-indigo-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-wide title-shadow hover:scale-105 transition-transform duration-300">
                  🗺️ Career World
                </h1>
                <p className="text-sm text-amber-100 font-semibold">✨ Explore • Learn • Grow ✨</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl border-3 border-indigo-400 shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl button-interactive"
              >
                <Trophy className="w-6 h-6 text-yellow-300" />
                <div className="text-left">
                  <div className="text-xs text-amber-100 font-medium">Total Score</div>
                  <div className="text-xl font-black text-white">{profile?.total_score || 0}</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 rounded-xl border-3 border-sky-300 shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl button-interactive"
              >
                <User className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="text-xs text-sky-100 font-medium">Level</div>
                  <div className="text-xl font-black text-white">{(profile as any)?.level || 1}</div>
                </div>
              </button>

              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="p-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl border-3 border-red-400 shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl button-interactive"
              >
                <LogOut className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="relative bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 rounded-3xl shadow-2xl border-8 border-amber-900 p-8 map-panel-bg overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-amber-900 to-orange-800 rounded-full flex items-center justify-center border-4 border-amber-100 shadow-xl transform -rotate-12">
              <span className="text-4xl">🧭</span>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 opacity-30 transform rotate-12">
              <svg viewBox="0 0 100 100">
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="60" fill="#78350F">N</text>
                <text x="50" y="80" textAnchor="middle" fontSize="20" fill="#78350F">S</text>
                <text x="20" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#78350F">W</text>
                <text x="80" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#78350F">E</text>
              </svg>
            </div>

            <div className="relative h-[700px] mt-8 map-checker p-6 rounded-2xl bg-gradient-to-b from-sky-200/30 to-cyan-200/20 border-2 border-amber-300/50 shadow-inner">
              {/* large panning canvas */}
              <div
                className={`map-canvas relative w-full h-full overflow-hidden select-none rounded-xl`} 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                ref={mapRef}
              >
                <div className="absolute inset-0 pointer-events-none" />

                <div
                  ref={centerRef}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  {/* center castle */}
                  <div className="map-container">
                    <div className="castle-pos">
                      <button onClick={() => handleCareerClick('castle')} className="group">
                        <div className="island-tile relative w-64 h-40 flex items-center justify-center p-2 hover:shadow-2xl hover:scale-110 transition-all duration-300 transform button-interactive">
                          <img src={castleUrl} alt="Castle" className="w-48 h-32 object-contain drop-shadow-lg" />
                        </div>
                      </button>
                    </div>

                    {/* place islands around castle using fixed coords */}
                    {mappedCareers.map((mc) => (
                      <div
                        key={mc.id}
                        ref={(el) => {
                          if (!el) return;
                          // set absolute position for static placement around the castle
                          el.style.position = 'absolute';
                          el.style.left = `${mc.x}px`;
                          el.style.top = `${mc.y}px`;
                        }}
                        className="float-card"
                      >
                        <button onClick={() => handleCareerClick(mc.slug)} aria-label={`Open ${mc.name}`} title={mc.name}>
                          <div className="island-tile relative w-40 h-40 flex items-center justify-center p-3 hover:shadow-2xl hover:scale-120 transition-all duration-300 transform button-interactive">
                            <div className={`island-circle ${mc.isCompleted ? 'ring-4 ring-emerald-400 shadow-lg shadow-emerald-400' : mc.isStarted ? 'ring-4 ring-sky-300 shadow-lg shadow-sky-300' : 'ring-4 ring-amber-300 shadow-lg shadow-amber-300'}`}>
                              <img src={mc.icon} alt={mc.name} className="w-24 h-24 object-contain drop-shadow-md" />
                            </div>
                            <div className="absolute left-4 bottom-3 bg-gradient-to-br from-white to-amber-50 px-2 py-1 rounded-full text-xs font-bold shadow-md border border-amber-200">{mc.score ?? ''}</div>
                          </div>
                        </button>
                        <div className="mt-2 text-center text-sm font-semibold text-gray-800 drop-shadow-md">{mc.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 rounded-xl border-2 border-amber-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <span className="text-2xl">🏝️</span>
                <span className="text-white font-bold">Not Started</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl border-2 border-blue-400 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <span className="text-2xl">🚀</span>
                <span className="text-white font-bold">In Progress</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl border-2 border-green-400 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <span className="text-2xl">🏆</span>
                <span className="text-white font-bold">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showGuide && guideMessage && (
        <CareerSage
          message={guideMessage}
          onClose={() => setShowGuide(false)}
          onOpenChat={() => openChat()}
          position="bottom-right"
        />
      )}

    </div>
  );
}
