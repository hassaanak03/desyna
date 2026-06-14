import { motion } from "motion/react";
import { Zap, Palette, BarChart3, Shield } from "lucide-react";

interface FeaturesGridProps {
  isDark: boolean;
}

const features = [
  {
    icon: Zap,
    title: "Infinite Canvas",
    body: "Workspace without boundaries.",
  },
  {
    icon: Palette,
    title: "Color Psychology",
    body: "AI driven mood palettes.",
  },
  {
    icon: BarChart3,
    title: "Type Scale Generator",
    body: "Perfect visual hierarchy.",
  },
  {
    icon: Shield,
    title: "Portfolio Optimizer",
    body: "Auto masonry grid layouts.",
  },
];

export function FeaturesGrid({ isDark }: FeaturesGridProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.52)";
  const labelColor = isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.3)";

  return (
    <section id="features-grid" className="w-full px-6 lg:px-20 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <div
            className="liquid-glass inline-flex items-center mb-6"
            style={{ borderRadius: "9999px", padding: "7px 18px" }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: fg,
              }}
            >
              Why Us
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: fg,
            }}
          >
            The difference is everything.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="liquid-glass rounded-2xl p-6 flex flex-col gap-4"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.6}
                    className="glow-icon"
                    style={{ color: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,40,120,0.85)" }}
                  />
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: fg,
                      marginBottom: "6px",
                    }}
                  >
                    {feat.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 300,
                      fontSize: "0.85rem",
                      lineHeight: 1.55,
                      color: fgMuted,
                    }}
                  >
                    {feat.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
