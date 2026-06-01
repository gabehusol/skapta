import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DescriptionInput from "../components/DescriptionInput";
import StackGrid from "../components/StackGrid";
import HeroBackground from "../components/HeroBackground";
import { useRecommend } from "../hooks/useRecommend";

export default function Home() {
  const { loading, recommendations, analyze } = useRecommend();
  const [lastInput, setLastInput] = useState({ projectName: "my-app", description: "" });

  const handleAnalyze = ({ description, projectName }) => {
    setLastInput({ description, projectName });
    analyze(description);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080808" }}>

      {/* ── Nav — fixed, frosted glass ────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          background: "rgba(8,8,8,0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(249,115,22,0.15)",
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ textShadow: "0 0 22px rgba(249,115,22,0.75)" }}
          className="text-sm font-bold tracking-widest uppercase cursor-default select-none"
          style={{ color: "#f97316", letterSpacing: "0.18em" }}
        >
          Skapta
        </motion.span>

        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          href="https://github.com/gabehusol/skapta"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium"
          style={{ color: "#666666" }}
          whileHover={{ color: "#f5f5f5" }}
        >
          GitHub ↗
        </motion.a>
      </nav>

      {/* Spacer that matches fixed nav height (py-5 × 2 + ~24px content ≈ 64px) */}
      <div className="h-16 shrink-0" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-14 pb-10 text-center">
        <HeroBackground />

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative max-w-3xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ color: "#f97316" }}
          >
            AI Stack Architect
          </motion.p>

          <h1
            className="text-5xl md:text-6xl font-normal mb-5 leading-tight"
            style={{
              color: "#f5f5f5",
              letterSpacing: "-0.65px",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            }}
          >
            Describe your project.
            <br />
            <span style={{ color: "#f97316" }}>Get your stack.</span>
          </h1>

          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "#666666", lineHeight: "1.7" }}
          >
            Tell us what you're building. Skapta recommends the right stack
            with reasoning grounded in real documentation, then generates a
            ready-to-run project ZIP.
          </p>
        </motion.div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-10 pb-8 flex flex-col gap-10">

        <DescriptionInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Loading pulse */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{ width: 7, height: 7, background: "#f97316" }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted">Analyzing your project...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendations */}
        <AnimatePresence>
          {!loading && recommendations && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <StackGrid
                recommendations={recommendations}
                projectName={lastInput.projectName}
                description={lastInput.description}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="px-8 py-9 mt-auto"
        style={{ borderTop: "1px solid rgba(249,115,22,0.10)" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Left — logo + tagline */}
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#f97316", letterSpacing: "0.18em" }}
            >
              Skapta
            </span>
            <span className="text-xs" style={{ color: "#444444" }}>
              Describe your project. Get your stack.
            </span>
          </div>

          {/* Centre — links */}
          <div className="flex items-center gap-6">
            <motion.a
              href="https://github.com/gabehusol/skapta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ color: "#555555" }}
              whileHover={{ color: "#f5f5f5" }}
            >
              GitHub ↗
            </motion.a>
            <span className="text-xs" style={{ color: "#333333" }}>
              Docs{" "}
              <span style={{ color: "#2a2a2a" }}>(coming soon)</span>
            </span>
            <span className="text-xs" style={{ color: "#333333" }}>
              Changelog{" "}
              <span style={{ color: "#2a2a2a" }}>(coming soon)</span>
            </span>
          </div>

          {/* Right — brag line */}
          <span
            className="text-xs font-medium"
            style={{ color: "#2d2d2d" }}
          >
            Built with Skapta
          </span>

        </div>
      </footer>

    </div>
  );
}
