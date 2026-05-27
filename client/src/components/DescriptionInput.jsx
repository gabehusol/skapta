import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const EXAMPLES = [
  "I'm building a social media app with user auth and real-time notifications...",
  "I need a SaaS dashboard with payments, user roles, and analytics...",
  "I'm making an e-commerce store with inventory management...",
  "I want a real-time chat app with file sharing...",
];

// Typewriter state machine — all in one object so the effect has one dep
const INITIAL_TYPE_STATE = {
  exampleIndex: 0,
  charIndex: 0,
  isDeleting: false,
  isPaused: false,
};

export default function DescriptionInput({ onAnalyze, onReset, loading }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [ts, setTs] = useState(INITIAL_TYPE_STATE); // typewriter state

  // ── Typewriter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    // Freeze typewriter while user is typing
    if (description) return;

    const { exampleIndex, charIndex, isDeleting, isPaused } = ts;
    const current = EXAMPLES[exampleIndex];

    // Pause phase — wait before starting to delete
    if (isPaused) {
      const t = setTimeout(() => {
        setTs((s) => ({ ...s, isPaused: false, isDeleting: true }));
      }, 2200);
      return () => clearTimeout(t);
    }

    const delay = isDeleting ? 22 : 52;

    const t = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) {
          setPlaceholder(current.slice(0, charIndex + 1));
          setTs((s) => ({ ...s, charIndex: s.charIndex + 1 }));
        } else {
          // Done typing enter pause phase
          setTs((s) => ({ ...s, isPaused: true }));
        }
      } else {
        if (charIndex > 0) {
          setPlaceholder(current.slice(0, charIndex - 1));
          setTs((s) => ({ ...s, charIndex: s.charIndex - 1 }));
        } else {
          // Done deleting advance to next example
          setTs({
            exampleIndex: (exampleIndex + 1) % EXAMPLES.length,
            charIndex: 0,
            isDeleting: false,
            isPaused: false,
          });
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [ts, description]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const charCount = description.length;
  const charWarn = charCount > 1800;
  const descriptionReady = description.trim().length >= 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (!descriptionReady) {
      toast.error("Description must be at least 10 characters.");
      return;
    }
    onAnalyze({
      description: description.trim(),
      projectName: projectName.trim() || "my-app",
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Project name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold tracking-widest uppercase text-muted">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-app"
            maxLength={60}
            className="w-full px-4 py-3 bg-surface border border-hairline rounded-md text-ink text-sm
                       placeholder:text-faint
                       focus:outline-none focus:border-accent
                       transition-colors duration-200"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold tracking-widest uppercase text-muted">
            Project Description
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); onReset?.(); }}
              placeholder={placeholder}
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-3 bg-surface border border-hairline rounded-md text-ink text-sm
                         placeholder:text-faint
                         focus:outline-none focus:border-accent
                         transition-colors duration-200 resize-none leading-relaxed"
            />
            {/* Character counter */}
            <span
              className="absolute bottom-3 right-3 text-xs tabular-nums transition-colors duration-200"
              style={{ color: charWarn ? "#f97316" : "#444444" }}
            >
              {charCount}/2000
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.015 } : undefined}
            whileTap={!loading ? { scale: 0.975 } : undefined}
            className="px-7 py-3 rounded-md text-sm font-semibold transition-shadow duration-200"
            style={{
              background: "#f97316",
              color: "#080808",
              opacity: loading ? 0.4 : descriptionReady ? 1 : 0.55,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow:
                descriptionReady && !loading
                  ? "0 0 24px rgba(249, 115, 22, 0.35)"
                  : "none",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <Spinner />
                Analyzing...
              </span>
            ) : (
              "Analyze Stack →"
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

// Inline spinner — avoids an extra file
function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      className="inline-block w-4 h-4 border-2 rounded-full"
      style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#080808" }}
    />
  );
}
