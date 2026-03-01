import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion'

export function ScrollProgress() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  if (reduced) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 origin-left bg-primary"
      style={{ scaleX }}
    />
  )
}
