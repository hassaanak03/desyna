import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { StartSection } from "./components/StartSection";
import { FeaturesChess } from "./components/FeaturesChess";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { Testimonials } from "./components/Testimonials";
import { About } from "./components/About";
import { CtaFooter } from "./components/CtaFooter";
import { AuthModals } from "./components/AuthModals";
import { useTheme } from "../dashboard-app/context/ThemeContext";

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  // Keep body background in sync
  useEffect(() => {
    document.body.style.background = isDark
      ? "linear-gradient(to bottom, #000000, #111111)"
      : "linear-gradient(to bottom, #ffffff, #f5ede0)";
    document.body.style.transition = "background 0.6s ease";
  }, [isDark]);

  return (
    <div
      className={isDark ? "desyna-dark" : "desyna-light"}
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(to bottom, #000000, #111111)"
          : "linear-gradient(to bottom, #ffffff, #f5ede0)",
        color: isDark ? "#ffffff" : "#0d0d0d",
        transition: "background 0.6s ease, color 0.5s ease",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Fixed Navbar */}
      <Navbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLoginOpen={() => setIsLoginOpen(true)}
        onSignUpOpen={() => setIsSignUpOpen(true)}
      />

      {/* Auth Modals */}
      <AuthModals
        isDark={isDark}
        isLoginOpen={isLoginOpen}
        isSignUpOpen={isSignUpOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseSignUp={() => setIsSignUpOpen(false)}
        onSwitchToSignUp={() => { setIsLoginOpen(false); setIsSignUpOpen(true); }}
        onSwitchToLogin={() => { setIsSignUpOpen(false); setIsLoginOpen(true); }}
      />

      {/* Hero */}
      <Hero isDark={isDark} onSignUpOpen={() => setIsSignUpOpen(true)} />

      {/* Content Sections */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(to bottom, #000000, #111111)"
            : "linear-gradient(to bottom, #ffffff, #f5ede0)",
          transition: "background 0.6s ease",
        }}
      >
        <StartSection isDark={isDark} />
        <FeaturesChess isDark={isDark} />
        <FeaturesGrid isDark={isDark} />
        <Testimonials isDark={isDark} />
        <About isDark={isDark} />
        <CtaFooter isDark={isDark} onSignUpOpen={() => setIsSignUpOpen(true)} />
      </div>
    </div>
  );
}