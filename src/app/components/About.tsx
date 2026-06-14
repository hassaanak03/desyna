import { motion } from "motion/react";
import { User, Briefcase, Mail } from "lucide-react";

interface AboutProps {
  isDark: boolean;
}

const cards = [
  {
    icon: Briefcase,
    title: "Origin",
    text: "Created by GFX Designer for GFX Designers",
  },
  {
    icon: User,
    title: "The Creator",
    text: "Husnain Mahmood",
  },
  {
    icon: Mail,
    title: "Reach Out",
    text: "husnaindznfx@gmail.com",
  },
];

export function About({ isDark }: AboutProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.52)";
  const labelColor = isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.3)";

  return (
    <section id="about" className="w-full px-6 lg:px-20 py-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
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
              About
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(2rem, 4vw, 3.4rem)",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: fg,
            }}
          >
            The Visionary Behind the Canvas.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, delay: idx * 0.12 }}
                className="liquid-glass-strong rounded-2xl p-9 flex flex-col items-center text-center gap-5"
                style={{ backdropFilter: "blur(60px)", WebkitBackdropFilter: "blur(60px)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.4}
                    style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,40,120,0.8)" }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 300,
                      fontSize: "0.72rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: labelColor,
                      marginBottom: "8px",
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: "1rem",
                      lineHeight: 1.5,
                      color: fg,
                    }}
                  >
                    {card.text}
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
