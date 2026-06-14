import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onLoginOpen: () => void;
  onSignUpOpen: () => void;
}

export function Navbar({ isDark, onToggleTheme, onLoginOpen, onSignUpOpen }: NavbarProps) {
  const fg = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="flex items-end justify-between">
        {/* Left: Logo + Theme Toggle */}
        <div className="flex flex-col items-start gap-2">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {/* Simple geometric logo mark */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center liquid-glass-strong"
              style={{ borderRadius: "10px" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)"} strokeWidth="1.5" />
                <path d="M11 4 L11 18 M4 11 L18 11" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} strokeWidth="1" />
                <circle cx="11" cy="11" r="3" fill={isDark ? "white" : "#111"} />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontStyle: "italic",
                fontSize: "1.6rem",
                color: isDark ? "#fff" : "#0d0d0d",
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              Desyna
            </span>
          </button>

          {/* Dual Sun+Moon Theme Toggle Pill */}
          <button
            onClick={onToggleTheme}
            className="liquid-glass-strong cursor-pointer"
            style={{
              borderRadius: "9999px",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              border: "none",
            }}
            aria-label="Toggle theme"
          >
            {/* Sun (Light mode icon) */}
            <motion.span
              animate={{
                backgroundColor: !isDark
                  ? "rgba(255, 180, 0, 0.22)"
                  : "rgba(0, 0, 0, 0)",
                boxShadow: !isDark
                  ? "0 0 10px 2px rgba(255,180,0,0.25)"
                  : "none",
              }}
              transition={{ duration: 0.35 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "9999px",
              }}
            >
              <Sun
                size={14}
                strokeWidth={1.8}
                style={{
                  color: !isDark ? "rgba(255,160,0,0.95)" : fg,
                  opacity: !isDark ? 1 : 0.45,
                  transition: "opacity 0.3s, color 0.3s",
                }}
              />
            </motion.span>

            {/* Moon (Dark mode icon) */}
            <motion.span
              animate={{
                backgroundColor: isDark
                  ? "rgba(180, 160, 255, 0.20)"
                  : "rgba(0, 0, 0, 0)",
                boxShadow: isDark
                  ? "0 0 10px 2px rgba(160,140,255,0.22)"
                  : "none",
              }}
              transition={{ duration: 0.35 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "9999px",
              }}
            >
              <Moon
                size={14}
                strokeWidth={1.8}
                style={{
                  color: isDark ? "rgba(200,190,255,0.95)" : fg,
                  opacity: isDark ? 1 : 0.45,
                  transition: "opacity 0.3s, color 0.3s",
                }}
              />
            </motion.span>
          </button>
        </div>

        {/* Center: Nav Links */}
        <div
          className="liquid-glass hidden md:flex items-center gap-1 px-1.5 py-1"
          style={{ borderRadius: "9999px" }}
        >
          {[
            { label: "Features", id: "features-chess" },
            { label: "Services", id: "features-grid" },
            { label: "About", id: "about" },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-4 py-2 rounded-full cursor-pointer transition-all"
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: fg,
                background: "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: CTA Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onLoginOpen}
            whileTap={{ scale: 0.96 }}
            className="liquid-glass-strong cursor-pointer"
            style={{
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: fg,
              border: "none",
            }}
          >
            Login
          </motion.button>
          <motion.button
            onClick={onSignUpOpen}
            whileTap={{ scale: 0.96 }}
            className="cursor-pointer"
            style={{
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: isDark ? "#000" : "#fff",
              background: isDark ? "#fff" : "#0d0d0d",
              border: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            }}
          >
            Sign Up
          </motion.button>
        </div>
      </div>
    </nav>
  );
}