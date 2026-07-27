import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Every animated element in the app uses `m` rather than `motion`.
 *
 * `motion.div` statically pulls in the entire feature set — drag, layout
 * projection and all — even on a page that only fades things in. `m` ships the
 * bare renderer, and `MotionProvider` below loads exactly the features we use
 * (animations, exit, hover/tap/focus and whileInView). `strict` makes a stray
 * `motion.*` throw during development instead of silently undoing the saving.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/** The one brand ease. Exported so route/hero transitions reuse it instead of
 *  re-typing the cubic-bezier literal. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Scroll-reveal: fades + rises into view once. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'figure';
}) {
  const reduce = useReducedMotion();
  const MotionTag = m[as];
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Container that staggers its <StaggerItem> children as they enter view. */
export function Stagger({ children, className, gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  const reduce = useReducedMotion();
  // Under reduced motion, don't orchestrate at all — render a plain wrapper so
  // the no-motion guarantee doesn't rely on each StaggerItem dropping variants.
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </m.div>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className} variants={reduce ? undefined : staggerItem}>
      {children}
    </m.div>
  );
}

/** Simple mount fade — used for route content. */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

export { AnimatePresence, useReducedMotion };
export { m as motion };
