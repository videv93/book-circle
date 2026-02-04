import type { Variants, Transition } from 'framer-motion';

/**
 * Check if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Page transition variants
 * Duration: 200ms, Easing: ease-out
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/**
 * Standard page transition timing
 */
export const pageTransition: Transition = {
  duration: 0.2,
  ease: [0.0, 0.0, 0.2, 1], // ease-out
};

/**
 * Get motion props with reduced motion support
 * Returns empty object if user prefers reduced motion
 */
export function getMotionProps(variants: Variants = pageVariants) {
  if (shouldReduceMotion()) {
    return {};
  }

  return {
    variants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    transition: pageTransition,
  };
}

/**
 * Fade in animation variants
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Scale animation variants (for buttons, icons)
 */
export const scaleVariants: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

/**
 * Slide up animation variants (for modals, toasts)
 */
export const slideUpVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};
