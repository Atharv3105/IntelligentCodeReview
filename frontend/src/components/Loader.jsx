import { motion } from "framer-motion";

export default function Loader() {
  const spinnerVariants = {
    rotate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      },
    },
  };

  const dotVariants = {
    scale: {
      scale: [1, 1.3, 1],
      transition: {
        repeat: Infinity,
        duration: 1.5,
      },
    },
  };

  return (
    <motion.div 
      className="loader"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="loader-spinner"
        variants={spinnerVariants}
        animate="rotate"
        style={{
          width: "50px",
          height: "50px",
          border: "3px solid var(--border)",
          borderTop: "3px solid var(--primary)",
          borderRadius: "50%",
          margin: "0 auto var(--spacing-md)",
        }}
      />
      
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: "block",
          color: "var(--text-secondary)",
          fontSize: "0.95rem",
          fontWeight: 500,
        }}
      >
        <motion.span
          variants={dotVariants}
          animate="scale"
          style={{ display: "inline-block" }}
        >
          Processing
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ display: "inline-block" }}
        >
          ...
        </motion.span>
      </motion.span>
    </motion.div>
  );
}