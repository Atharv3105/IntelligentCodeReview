import { motion } from "framer-motion";

const buttonVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base"
  };

  return (
    <motion.button
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      whileHover="hover"
      whileTap="tap"
      variants={buttonVariants}
      {...props}
    >
      {children}
    </motion.button>
  );
}
