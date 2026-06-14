import { useRef } from "react";
import { motion } from "motion/react";

interface StartSectionProps {
  isDark: boolean;
}

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_125119_8e5ae31c-0021-4396-bc08-f7aebeb877a2.mp4";

export function StartSection({ isDark }: StartSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  // Use the gradient start colors so the fades blend seamlessly
  const gradFrom = isDark ? "#000000" : "#ffffff";

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "600px" }}
    >


      {/* Top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "280px",
          background: `linear-gradient(to bottom, ${gradFrom}, transparent)`,
          zIndex: 2,
        }}
      />
      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "280px",
          background: `linear-gradient(to top, ${gradFrom}, transparent)`,
          zIndex: 2,
        }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark ? "rgba(0,0,0,0.45)" : "rgba(240,240,245,0.50)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-6 py-32"
        style={{ zIndex: 10, minHeight: "500px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <div
            className="liquid-glass inline-flex items-center mb-8"
            style={{ borderRadius: "9999px", padding: "7px 18px" }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: fg,
              }}
            >
              Workflow
            </span>
          </div>

          {/* Heading */}
          <h2
            className="max-w-2xl mx-auto mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: 1,
              letterSpacing: "-2px",
              color: fg,
            }}
          >
            Turn ideas into visuals.
          </h2>

          {/* Subtext */}
          <p
            className="max-w-md mx-auto mb-10"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "1rem",
              lineHeight: 1.7,
              color: fgMuted,
            }}
          >
            Jump onto an infinite canvas. Generate brand kits. Build portfolios.
            All in one unified space.
          </p>

          {/* CTA */}
          <button
            className="liquid-glass-strong cursor-pointer"
            style={{
              borderRadius: "9999px",
              padding: "13px 32px",
              color: fg,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: "0.9rem",
              border: "none",
            }}
          >
            Explore Features
          </button>
        </motion.div>
      </div>
    </section>
  );
}