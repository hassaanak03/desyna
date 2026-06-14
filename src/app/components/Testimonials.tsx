import { motion } from "motion/react";
import { Star } from "lucide-react";

interface TestimonialsProps {
  isDark: boolean;
}

const testimonials = [
  {
    name: "Aria Solano",
    role: "Visual Identity Specialist",
    initials: "AS",
    text: "Desyna's typography tester is unmatched. I can pair fonts with intelligent suggestions and preview them in real context — something no other tool offers at this level.",
  },
  {
    name: "Marcus Elrond",
    role: "Brand Strategy Director",
    initials: "ME",
    text: "The portfolio optimizer changed the game for me. Auto masonry layouts that actually understand visual weight? My client presentations have never looked sharper.",
  },
  {
    name: "Selin Kaya",
    role: "Senior Art Director",
    initials: "SK",
    text: "I've been using Desyna for three months and the color psychology tools are genuinely incredible. The AI-driven mood palettes feel human — warm, considered, and always on-brand.",
  },
];

export function Testimonials({ isDark }: TestimonialsProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.52)";
  const starColor = isDark ? "rgba(255,215,100,0.9)" : "rgba(200,150,0,0.9)";
  const avatarBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  return (
    <section className="w-full px-6 lg:px-20 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
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
            Built for designers.
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: idx * 0.1 }}
              className="liquid-glass rounded-2xl p-7 flex flex-col gap-5"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill={starColor}
                    stroke="none"
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  color: fgMuted,
                  flex: 1,
                }}
              >
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: avatarBg,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: fg,
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                      color: fg,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 300,
                      fontSize: "0.75rem",
                      color: fgMuted,
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
