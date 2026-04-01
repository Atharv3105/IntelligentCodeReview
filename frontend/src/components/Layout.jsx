import { motion } from "framer-motion";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar />
      <motion.main
        className="container-custom min-h-[calc(100vh-76px)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        {children}
      </motion.main>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
          animate={{ x: [0, -36, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
