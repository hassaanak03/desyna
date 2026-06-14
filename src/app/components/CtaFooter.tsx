import { useRef } from "react";
import { motion } from "motion/react";
import { HLSVideo } from "./HLSVideo";

interface CtaFooterProps {
  isDark: boolean;
  onSignUpOpen: () => void;
}

const HLS_URL = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";
const MISSION_MP4 =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_132944_a0d124bb-eaa1-4082-aa30-2310efb42b4b.mp4";

export function CtaFooter({ isDark, onSignUpOpen }: CtaFooterProps) {
  const mp4Ref = useRef<HTMLVideoElement>(null);
  const gradFrom = isDark ? "#000" : "#f2f2f5";

  return (
    <footer className="relative w-full overflow-hidden">
      {/* MP4 fallback / ambient layer (mission video) — loads immediately */}
      <video
        ref={mp4Ref}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          zIndex: 0,
          opacity: 0,
          transition: "opacity 1.8s ease",
        }}
        onCanPlayThrough={(e) => {
          (e.currentTarget as HTMLVideoElement).style.opacity = "1";
        }}
        src={MISSION_MP4}
      />

      {/* HLS Video Background — fades in on top once buffered */}
      <HLSVideo
        src={HLS_URL}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark ? "rgba(0,0,0,0.60)" : "rgba(240,240,245,0.65)",
          zIndex: 2,
        }}
      />

      {/* Top gradient fade — deeper so it blends seamlessly with the section above */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "260px",
          background: `linear-gradient(to bottom, ${gradFrom}, transparent)`,
          zIndex: 3,
        }}
      />

      {/* CTA Content */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-6 pt-40 pb-24"
        style={{ zIndex: 10, minHeight: "480px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="mb-5 max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: isDark ? "#fff" : "#0d0d0d",
            }}
          >
            Your next masterpiece starts here.
          </h2>
          <p
            className="mb-10 max-w-md mx-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontSize: "1rem",
              lineHeight: 1.65,
              color: isDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.55)",
            }}
          >
            Join the premium design suite today. No commitment, just pure creativity.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onSignUpOpen}
              className="liquid-glass-strong cursor-pointer"
              style={{
                borderRadius: "9999px",
                padding: "13px 32px",
                color: isDark ? "#fff" : "#0d0d0d",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "0.92rem",
                border: "none",
              }}
            >
              Sign Up Free
            </button>
            <button
              className="cursor-pointer"
              style={{
                borderRadius: "9999px",
                padding: "13px 32px",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "0.92rem",
                color: isDark ? "#000" : "#fff",
                background: isDark ? "#fff" : "#0d0d0d",
                border: "none",
                boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              }}
            >
              View Plans
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Bar */}
      <div
        className="relative flex flex-col md:flex-row items-center justify-between gap-4 px-8 lg:px-20 py-6"
        style={{
          zIndex: 10,
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: "0.8rem",
            color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)",
          }}
        >
          © 2026 Desyna. All rights reserved.
        </span>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
            <button
              key={link}
              className="cursor-pointer"
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "0.78rem",
                color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)",
                textDecoration: "none",
              }}
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}