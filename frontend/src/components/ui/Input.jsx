import { motion } from "framer-motion";
import { useState } from "react";

export function Input({ label, error, size = "md", icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);

  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-11 px-3.5 text-sm",
    lg: "h-12 px-4 text-base"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {label && <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>}

      <div className="relative">
        {Icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon /></div>}
        <motion.input
          className={`w-full rounded-lg border bg-gray-800/50 text-gray-100 placeholder:text-gray-500 ${sizes[size]} ${Icon ? "pl-10" : ""} ${error ? "border-red-500" : "border-gray-700"}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          animate={{ boxShadow: focused ? "0 0 0 3px var(--primary-glow)" : "0 0 0 0 transparent" }}
          transition={{ duration: 0.15 }}
          {...props}
        />
      </div>

      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </motion.div>
  );
}
