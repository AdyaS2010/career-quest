import { useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Career, ColorScheme } from '../lib/database.types';

interface FloatingIslandProps {
  career: Career;
  index: number;
  onClick: () => void;
}

export function FloatingIsland({ career, index, onClick }: FloatingIslandProps) {
  const islandRef = useRef<HTMLDivElement>(null);
  const colorScheme = career.color_scheme as unknown as ColorScheme;

  const IconComponent = (Icons[career.icon as keyof typeof Icons] as LucideIcon) || Icons.Star;

  useEffect(() => {
    const island = islandRef.current;
    if (!island) return;
    // apply CSS custom properties so we keep JSX free of inline style objects
    const animationDuration = 3000 + (index * 500);
    const animationDelay = index * 200;

    island.style.setProperty('--float-duration', `${animationDuration}ms`);
    island.style.setProperty('--float-delay', `${animationDelay}ms`);
    island.style.setProperty('--enter-delay', `${animationDelay}ms`);
    island.style.setProperty('--enter-duration', `600ms`);

    // color variables for the island card (keeps gradients in CSS)
    island.style.setProperty('--island-color', colorScheme.primary);
    island.style.setProperty('--island-secondary', colorScheme.secondary);
    island.style.setProperty('--island-glow', colorScheme.accent);
  }, [index]);

  return (
    <div
      ref={islandRef}
      onClick={onClick}
      className="floating-island group cursor-pointer"
    >
      <div className="relative w-64 h-80 transform-gpu transition-all duration-500 group-hover:scale-110">
        <div
          className="absolute inset-0 rounded-3xl shadow-2xl transition-all duration-500 group-hover:shadow-[0_20px_80px_rgba(0,0,0,0.3)] island-card"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-transparent" />

          <div className="relative h-full p-6 flex flex-col items-center justify-between">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <IconComponent className="w-12 h-12 text-white drop-shadow-lg" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                {career.name}
              </h3>
              <p className="text-white/90 text-sm font-medium">
                {career.title}
              </p>
              <p className="text-white/80 text-xs line-clamp-3 px-2">
                {career.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Icons.Clock className="w-4 h-4" />
              <span>{career.estimated_time} min</span>
            </div>
          </div>

          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-black/20 rounded-full blur-xl" />
        </div>
      </div>
    </div>
  );
}
