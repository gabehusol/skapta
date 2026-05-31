import { useState } from "react";
import { motion } from "framer-motion";
import { cardVariants } from "../lib/variants";

export default function RecommendationCard({ category, data, onOverride }) {
  const [selected, setSelected] = useState(data.choice);
  const [isHovered, setIsHovered] = useState(false);

  const isOverridden = selected !== data.choice;

  const handleChange = (e) => {
    setSelected(e.target.value);
    onOverride?.(category, e.target.value);
  };

  return (
    <motion.div
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative flex flex-col gap-4 p-6 rounded-lg overflow-hidden"
      style={{
        background: "#111111",
        border: `1px solid ${isHovered ? "rgba(249,115,22,0.35)" : "#222222"}`,
        boxShadow: isHovered ? "0 0 28px rgba(249,115,22,0.07)" : "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Orange left-edge accent bar shown when overridden */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
        animate={{ opacity: isOverridden ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: "#f97316" }}
      />

      {/* Category eyebrow */}
      <span className="text-xs font-semibold tracking-widest uppercase text-muted">
        {category}
      </span>

      {/* Choice headline */}
      <div className="flex items-baseline gap-2">
        <h3
          className="text-lg font-semibold leading-snug"
          style={{ color: "#f5f5f5", letterSpacing: "-0.3px" }}
        >
          {selected}
        </h3>
        {isOverridden && (
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: "#f97316",
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
            }}
          >
            overridden
          </motion.span>
        )}
      </div>

      {/* Reason */}
      <p className="text-sm leading-relaxed flex-1 text-muted">{data.reason}</p>

      {/* Override dropdown */}
      {data.alternatives?.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          <label
            className="text-xs font-medium tracking-wider uppercase"
            style={{ color: "#444444" }}
          >
            Override
          </label>
          <div className="relative">
            <select
              value={selected}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-md appearance-none cursor-pointer
                         focus:outline-none focus:border-accent transition-colors duration-150"
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#f5f5f5",
              }}
            >
              <option value={data.choice}>{data.choice} (recommended)</option>
              {data.alternatives.map((alt) => (
                <option key={alt} value={alt}>
                  {alt}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
              style={{ color: "#666666" }}
            >
              ▾
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
