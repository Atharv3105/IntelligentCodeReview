import React, { useRef } from "react";
import { motion } from "framer-motion";

export function Card({ children, className = "", onClick, elevated = false, animate = true, ...props }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty("--mx", `${x}%`);
    ref.current.style.setProperty("--my", `${y}%`);
  };

  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        ...(onClick
          ? {
              whileHover: { y: -3, boxShadow: "var(--shadow-lg)" },
              whileTap: { scale: 0.99 },
            }
          : {}),
      }
    : {};

  return (
    <Comp
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`ambient-card rounded-2xl ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: elevated ? "var(--shadow-md)" : "var(--shadow-sm)",
        cursor: onClick ? "pointer" : undefined,
      }}
      {...(animate ? motionProps : {})}
      {...props}
    >
      {children}
    </Comp>
  );
}
