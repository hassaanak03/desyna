import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useNavigate } from "react-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase";

interface AuthModalsProps {
  isDark: boolean;
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
  onCloseLogin: () => void;
  onCloseSignUp: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToLogin: () => void;
}

const inputStyle = (isDark: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "11px 16px",
  borderRadius: "10px",
  border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.14)",
  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
  color: isDark ? "#fff" : "#0d0d0d",
  fontFamily: "var(--font-body)",
  fontWeight: 400,
  fontSize: "0.9rem",
  outline: "none",
  marginBottom: "12px",
  boxSizing: "border-box",
});

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: "var(--ds-overlay)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

interface LoginProps {
  isDark: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

function LoginModal({ isDark, onClose, onSwitchToSignUp }: LoginProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.52)";
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="liquid-glass-strong rounded-2xl p-8 w-full relative"
      style={{ maxWidth: "420px", backdropFilter: "blur(60px)", WebkitBackdropFilter: "blur(60px)" }}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 cursor-pointer"
        style={{ background: "none", border: "none", color: fgMuted }}
      >
        <X size={18} />
      </button>

      <h2
        className="text-center mb-6"
        style={{
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontSize: "2.2rem",
          color: fg,
          lineHeight: 1,
        }}
      >
        Welcome Back
      </h2>

      <input
        type="email"
        placeholder="Email"
        style={inputStyle(isDark)}
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        style={inputStyle(isDark)}
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p style={{ color: "rgb(239,68,68)", fontSize: "0.8rem", marginTop: "-6px", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSignIn}
        className="liquid-glass-strong w-full cursor-pointer"
        style={{
          borderRadius: "9999px",
          padding: "13px",
          color: fg,
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: "0.9rem",
          border: "none",
          width: "100%",
          marginTop: "8px",
        }}
      >
        Sign In
      </button>

      <div className="text-center mt-5">
        <button
          onClick={onSwitchToSignUp}
          className="cursor-pointer"
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            fontSize: "0.82rem",
            color: fgMuted,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            cursor: "pointer",
          }}
        >
          Don't have an account? Create account
        </button>
      </div>
    </motion.div>
  );
}

interface SignUpProps {
  isDark: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function SignUpModal({ isDark, onClose, onSwitchToLogin }: SignUpProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.52)";
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const mismatch = touched && confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (password !== confirm) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      navigate("/dashboard");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="liquid-glass-strong rounded-2xl p-8 w-full relative"
      style={{ maxWidth: "420px", backdropFilter: "blur(60px)", WebkitBackdropFilter: "blur(60px)" }}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 cursor-pointer"
        style={{ background: "none", border: "none", color: fgMuted }}
      >
        <X size={18} />
      </button>

      <h2
        className="text-center mb-6"
        style={{
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontSize: "2.2rem",
          color: fg,
          lineHeight: 1,
        }}
      >
        Join the Desyna
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          style={inputStyle(isDark)}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          style={inputStyle(isDark)}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          style={inputStyle(isDark)}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          style={{
            ...inputStyle(isDark),
            borderColor: mismatch
              ? "rgba(239,68,68,0.6)"
              : isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
          }}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setTouched(true); }}
        />

        {mismatch && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "rgb(239,68,68)",
              marginTop: "-6px",
              marginBottom: "10px",
            }}
          >
            Passwords must match to create account
          </p>
        )}

        {error && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "rgb(239,68,68)",
              marginTop: "-6px",
              marginBottom: "10px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="liquid-glass-strong w-full cursor-pointer"
          style={{
            borderRadius: "9999px",
            padding: "13px",
            color: fg,
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: "0.9rem",
            border: "none",
            width: "100%",
            marginTop: "8px",
          }}
        >
          Create Account
        </button>
      </form>

      <div className="text-center mt-5">
        <button
          onClick={onSwitchToLogin}
          className="cursor-pointer"
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            fontSize: "0.82rem",
            color: fgMuted,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Already have an account? Login
        </button>
      </div>
    </motion.div>
  );
}

export function AuthModals({
  isDark,
  isLoginOpen,
  isSignUpOpen,
  onCloseLogin,
  onCloseSignUp,
  onSwitchToSignUp,
  onSwitchToLogin,
}: AuthModalsProps) {
  return (
    <AnimatePresence>
      {isLoginOpen && (
        <ModalOverlay key="login" onClose={onCloseLogin}>
          <LoginModal
            isDark={isDark}
            onClose={onCloseLogin}
            onSwitchToSignUp={onSwitchToSignUp}
          />
        </ModalOverlay>
      )}
      {isSignUpOpen && (
        <ModalOverlay key="signup" onClose={onCloseSignUp}>
          <SignUpModal
            isDark={isDark}
            onClose={onCloseSignUp}
            onSwitchToLogin={onSwitchToLogin}
          />
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}
