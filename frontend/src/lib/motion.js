import { motion } from "framer-motion";

/**
 * Shared stagger animation variants for framer-motion.
 * Use `staggerContainer` on the parent wrapper and `fadeUpItem` on each child card.
 *
 * Usage:
 *   <motion.div variants={staggerContainer} initial="hidden" animate="visible">
 *     <motion.div variants={fadeUpItem} className="dash-card"> ... </motion.div>
 *     <motion.div variants={fadeUpItem} className="dash-card"> ... </motion.div>
 *   </motion.div>
 */

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.02
    }
  }
};

export const fadeUpItem = {
  hidden: {
    opacity: 0,
    y: 28
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 260
    }
  }
};

/**
 * Hover micro-interaction preset for cards.
 * Subtle scale + translateY on hover, eased on leave.
 */
export const cardHover = {
  scale: 1.015,
  y: -3,
  transition: { type: "spring", stiffness: 350, damping: 18 }
};

/**
 * Sidebar link hover preset — subtle slide-out effect.
 */
export const sidebarLinkHover = {
  x: 6,
  scale: 1.03,
  transition: { type: "spring", stiffness: 300, damping: 18 }
};

// Re-export motion for convenience
export { motion };
