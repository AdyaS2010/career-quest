import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface PageTransitionProps {
    children: React.ReactNode;
}

// A cinematic "step through the doorway" transition: the incoming scene eases
// in from slightly zoomed-in while fading and de-blurring, and the outgoing
// scene keeps pushing in as it fades  -  so moving between the map, the city and
// a career world feels like a deliberate camera move rather than an instant
// cut. Both keyframes stay at scale >= 1 so a full-bleed scene never reveals an
// edge. Honours the user's reduced-motion preference with a plain quick fade.
export function PageTransition({ children }: PageTransitionProps) {
    const { reducedMotion } = useTheme();

    if (reducedMotion) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'linear' }}
                className="w-full min-h-screen"
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.08, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(4px)' }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center center', willChange: 'transform, opacity, filter' }}
            className="w-full min-h-screen"
        >
            {children}
        </motion.div>
    );
}
