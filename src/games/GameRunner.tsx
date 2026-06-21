import type { Challenge } from '../lib/database.types';
import { CulinaryArtsGame } from './CulinaryArts';
import { InformationTechnologyGame } from './InformationTechnology';
import { LawGovernmentGame } from './LawGovernment';
import { MediaCommunicationGame } from './MediaCommunication';
import { HealthSciencesGame } from './HealthSciences';
import { FinanceGame } from './Finance';
import { EducationGame } from './Education';
import { ArtsGame } from './Arts';

interface Props {
  slug: string;
  challenge: Challenge;
  onComplete: (score: number) => void;
  onExit: () => void;
}

// Renders the correct career mini-game for a given slug. Mirrors the dispatch
// in CareerWorld so building interiors can launch the same real games.
export function GameRunner({ slug, challenge, onComplete, onExit }: Props) {
  const common = { challenge, onComplete, onExit };
  switch (slug) {
    case 'culinary-arts': return <CulinaryArtsGame {...common} />;
    case 'information-technology': return <InformationTechnologyGame {...common} />;
    case 'law-government': return <LawGovernmentGame {...common} />;
    case 'media-communication': return <MediaCommunicationGame {...common} />;
    case 'health-sciences': return <HealthSciencesGame {...common} />;
    case 'financial-services': return <FinanceGame {...common} />;
    case 'education': return <EducationGame {...common} />;
    case 'arts-entertainment': return <ArtsGame {...common} />;
    default: return null;
  }
}
