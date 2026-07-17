import { motion } from "framer-motion";

const MotionCard = ({ children, className = "", delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay,
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default MotionCard;
