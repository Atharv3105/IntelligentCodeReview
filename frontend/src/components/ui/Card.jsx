import { motion } from "framer-motion";

export function Card({ children, variant = "glass", hover = false, className = "", ...props }) {
  const variants = {
    glass: "card",
    bordered: "card border-2",
    flat: "rounded-2xl border border-gray-700/40 bg-gray-900/30"
  };

  const selectedVariant = variants[variant] || variants.glass;

  return (
    <motion.div
      className={`${selectedVariant} p-6 ${hover ? "transition-transform duration-200" : ""} ${className}`}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
