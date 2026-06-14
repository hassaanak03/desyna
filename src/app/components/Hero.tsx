import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { BlurText } from "./BlurText";

interface HeroProps {
  isDark: boolean;
  onSignUpOpen: () => void;
}

export function Hero({ isDark, onSignUpOpen }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";

  // Explicitly trigger play to bypass autoPlay restrictions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  const bgEnd = isDark ? "#000000" : "#ffffff";

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        height: "100vh",
        minHeight: "700px",
        background: isDark
          ? "linear-gradient(to bottom, #000000, #0a0a0a)"
          : "linear-gradient(to bottom, #ffffff, #faf5ee)",
      }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        muted={true}
        autoPlay={true}
        playsInline={true}
        loop={true}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          zIndex: 0,
          opacity: 0,
          transition: "opacity 1.4s ease",
        }}
        onCanPlayThrough={(e) => {
          (e.currentTarget as HTMLVideoElement).style.opacity = "1";
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4"
      />

      {/* Aurora Glow Layer — sits above video, below content */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {/* Neon Green blob — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "-5%",
            width: "520px",
            height: "380px",
            borderRadius: "50%",
            background: isDark ? "rgba(0,255,120,0.38)" : "rgba(0,200,100,0.18)",
            filter: "blur(110px)",
            opacity: isDark ? 0.42 : 0.28,
          }}
        />
        {/* Electric Purple blob — top right */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-8%",
            width: "480px",
            height: "420px",
            borderRadius: "50%",
            background: isDark ? "rgba(120,60,255,0.45)" : "rgba(100,60,220,0.18)",
            filter: "blur(120px)",
            opacity: isDark ? 0.4 : 0.22,
          }}
        />
        {/* Electric Blue blob — center */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "30%",
            width: "400px",
            height: "300px",
            borderRadius: "50%",
            background: isDark ? "rgba(30,120,255,0.35)" : "rgba(30,100,220,0.14)",
            filter: "blur(100px)",
            opacity: isDark ? 0.36 : 0.18,
          }}
        />
      </div>

      {/* Dark/Light overlay blending video with gradient + aurora */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: isDark
            ? "rgba(0,0,0,0.38)"
            : "rgba(255,255,255,0.45)",
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
        }}
      />

      {/* Bottom gradient fade into page background */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          zIndex: 4,
          height: "420px",
          background: `linear-gradient(to bottom, transparent, ${bgEnd})`,
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col items-center text-center px-6"
        style={{ zIndex: 10, paddingTop: "160px" }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass flex items-center gap-2 mb-8"
          style={{ borderRadius: "9999px", padding: "5px" }}
        >
          <span
            className="rounded-full px-3 py-1"
            style={{
              background: isDark ? "#fff" : "#0d0d0d",
              color: isDark ? "#000" : "#fff",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Welcome
          </span>
          <span
            style={{
              fontSize: "0.78rem",
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              paddingRight: "10px",
              fontFamily: "var(--font-body)",
              fontWeight: 400,
            }}
          >
            The future of design is here
          </span>
        </motion.div>

        {/* Heading */}
        <h1
          className="max-w-3xl mx-auto mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            lineHeight: 0.92,
            letterSpacing: "-4px",
            color: fg,
          }}
        >
          <BlurText
            text="What's cooking in your brain today?"
            delayPerWord={0.1}
          />
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="max-w-lg mx-auto mb-10"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            fontSize: "1.05rem",
            lineHeight: 1.65,
            color: fgMuted,
          }}
        >
          Stunning designs. Infinite canvas. Built with AI tools.
          This is creativity wildly reimagined.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={onSignUpOpen}
            className="liquid-glass-strong cursor-pointer"
            style={{
              borderRadius: "9999px",
              padding: "13px 32px",
              color: fg,
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: "0.92rem",
              border: "none",
            }}
          >
            Start Designing
          </button>
          <button
            className="cursor-pointer"
            style={{
              background: "transparent",
              border: "none",
              color: fgMuted,
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: "0.92rem",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            Watch Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}