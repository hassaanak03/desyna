import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Zap, Palette, BarChart3, Shield } from 'lucide-react';

const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap');

.desyna-wrapper {
  --background-hsl: 220, 20%, 8%;
  --foreground-hsl: 0, 0%, 100%;
  --background: hsl(var(--background-hsl));
  --foreground: hsl(var(--foreground-hsl));
  
  font-family: 'Barlow', sans-serif;
  background-color: var(--background);
  color: var(--foreground);
  transition: background-color 0.5s ease, color 0.5s ease;
}

.desyna-wrapper.light {
  --background-hsl: 40, 30%, 96%;
  --foreground-hsl: 220, 20%, 10%;
  --background: linear-gradient(to bottom, #ffffff, #fdfbf7);
}

.font-heading { font-family: 'Instrument Serif', serif; }
.font-body { font-family: 'Barlow', sans-serif; }

.liquid-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.desyna-wrapper.light .liquid-glass {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5);
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}
.desyna-wrapper.light .liquid-glass-strong {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8);
}
`;

export default function DesynaLandingPage() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');

  const handleSignUp = () => {
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords must match to create account');
      return;
    }
    setSignUpError('');
    // Proceed with signup...
  };

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const startVideoRef = useRef<HTMLVideoElement>(null);
  const ctaVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.play().catch(() => { });
    if (startVideoRef.current) startVideoRef.current.play().catch(() => { });
    if (ctaVideoRef.current) ctaVideoRef.current.play().catch(() => { });
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className={`desyna-wrapper min-h-screen ${isLightMode ? 'light' : ''}`}>
      <style>{cssStyles}</style>

      {/* NAVBAR */}
      <nav className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div onClick={scrollToTop} className="cursor-pointer flex items-center gap-2">
            <img src="/src/assets/logo-icon.png" alt="Desyna Logo" className="h-12 w-12" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="font-heading italic text-3xl font-bold">Desyna</span>
          </div>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="liquid-glass-strong rounded-full p-1 flex items-center gap-2 relative w-16 h-8"
          >
            <div className={`absolute top-1 bottom-1 w-6 bg-white/20 rounded-full transition-transform duration-300 ${isLightMode ? 'translate-x-8' : 'translate-x-0'}`} />
            <Sun className="w-4 h-4 z-10 ml-1" />
            <Moon className="w-4 h-4 z-10 ml-2" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6 liquid-glass rounded-full px-4 py-2">
          <a href="#features-chess" className="text-sm font-medium font-body opacity-90 hover:opacity-100">Features</a>
          <a href="#features-grid" className="text-sm font-medium font-body opacity-90 hover:opacity-100">Services</a>
          <a href="#about" className="text-sm font-medium font-body opacity-90 hover:opacity-100">About</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsLoginOpen(true)} className="liquid-glass-strong rounded-full px-6 py-2 text-sm font-medium">
            Login
          </button>
          <button onClick={() => setIsSignUpOpen(true)} className="bg-white text-black rounded-full px-6 py-2 text-sm font-medium hover:bg-white/90">
            Sign Up
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[1000px] overflow-hidden flex items-center justify-center pt-24">
        <video
          ref={heroVideoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28_fed7_44c8_b9a9_bd9acdd5ec31.mp4"
          muted autoPlay playsInline loop
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Vibrant Aurora Glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-purple-600/40 blur-3xl rounded-full mix-blend-screen absolute -ml-48"></div>
          <div className="w-96 h-96 bg-blue-500/40 blur-3xl rounded-full mix-blend-screen absolute ml-48 mt-32"></div>
        </div>
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-0"></div>
        <div className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-[var(--background)] to-transparent z-0"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
          <div className="liquid-glass rounded-full px-2 py-1 mb-6 flex items-center gap-2">
            <span className="bg-white text-black rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">Welcome</span>
            <span className="pr-3 text-sm font-medium">To the future of design</span>
          </div>

          <motion.h1
            initial={{ filter: 'blur(20px)', opacity: 0, y: 50 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic leading-[0.9] tracking-[4px] mb-8"
          >
            What's cooking in your brain today?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl font-body opacity-80 max-w-2xl mb-10"
          >
            Stunning designs. Infinite canvas. Built with AI tools. This is creativity wildly reimagined.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex items-center gap-6"
          >
            <button className="liquid-glass-strong rounded-full px-8 py-4 text-lg font-medium hover:scale-105 transition-transform">
              Start Designing
            </button>
            <button className="hover:opacity-80 transition-opacity text-lg font-medium flex items-center gap-2">
              Watch Demo <Zap className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* START SECTION */}
      <section className="relative min-h-[500px] flex flex-col items-center justify-center py-24 text-center px-4">

        <div className="absolute top-0 w-full h-[200px] bg-gradient-to-b from-[var(--background)] to-transparent z-0"></div>
        <div className="absolute bottom-0 w-full h-[200px] bg-gradient-to-t from-[var(--background)] to-transparent z-0"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="liquid-glass rounded-full px-4 py-1.5 mb-6 text-sm font-medium tracking-wide">
            Workflow
          </div>
          <h2 className="text-4xl md:text-6xl font-heading italic mb-6">Turn ideas into visuals.</h2>
          <p className="text-lg opacity-80 max-w-2xl mb-10 font-body">
            Jump onto an infinite canvas. Generate brand kits. Build portfolios. All in one unified space.
          </p>
          <button className="liquid-glass-strong rounded-full px-8 py-3 text-lg font-medium hover:scale-105 transition-transform">
            Explore Features
          </button>
        </div>
      </section>

      {/* FEATURES CHESS */}
      <section id="features-chess" className="py-24 px-8 lg:px-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
          <div className="flex-1">
            <h3 className="text-4xl font-heading italic mb-4">The Ultimate Whiteboard</h3>
            <p className="text-lg opacity-80 font-body leading-relaxed">
              Experience an immersive canvas with highly vibrant creative tools, sticky notes, and dynamic layouts.
            </p>
          </div>
          <div className="flex-1 w-full h-[400px] liquid-glass rounded-2xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 mix-blend-screen"></div>
            <span className="opacity-50 text-xl font-heading italic">Interface Preview</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1 text-right">
            <h3 className="text-4xl font-heading italic mb-4">Brandkit and Typography</h3>
            <p className="text-lg opacity-80 font-body leading-relaxed">
              Generate color palettes based on psychology and test fonts with intelligent pairing suggestions.
            </p>
          </div>
          <div className="flex-1 w-full h-[400px] liquid-glass rounded-2xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 mix-blend-screen"></div>
            <span className="opacity-50 text-xl font-heading italic">Typography Preview</span>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features-grid" className="py-24 px-8 lg:px-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="liquid-glass rounded-full px-4 py-1.5 text-sm mb-6 inline-block">Why Us</span>
          <h2 className="text-5xl font-heading italic">The difference is everything.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: "Infinite Canvas", desc: "Workspace without boundaries." },
            { icon: Palette, title: "Color Psychology", desc: "AI driven mood palettes." },
            { icon: BarChart3, title: "Type Scale Generator", desc: "Perfect visual hierarchy." },
            { icon: Shield, title: "Portfolio Optimizer", desc: "Auto masonry grid layouts." }
          ].map((feat, i) => (
            <div key={i} className="liquid-glass rounded-2xl p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
              <feat.icon className="w-10 h-10 mb-6 opacity-80" />
              <h4 className="text-xl font-heading italic mb-3">{feat.title}</h4>
              <p className="text-sm opacity-70 font-body">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-8 lg:px-24 max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-heading italic mb-16">Built for designers.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="liquid-glass rounded-2xl p-8 text-left">
              <div className="flex gap-1 mb-4 text-yellow-500">★★★★★</div>
              <p className="opacity-90 font-body italic mb-6">"The typographic pairing tools alone saved me hours. The infinite canvas feels completely unrestrictive."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full" />
                <div>
                  <div className="font-medium text-sm">Visual Specialist</div>
                  <div className="opacity-50 text-xs">Creative Agency</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 px-8 lg:px-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="liquid-glass rounded-full px-4 py-1.5 text-sm mb-6 inline-block">About</span>
          <h2 className="text-5xl font-heading italic">The Visionary Behind the Canvas.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass rounded-2xl p-10 flex items-center justify-center text-center backdrop-blur-3xl bg-white/5">
            <h4 className="font-body font-medium text-lg">Created by GFX Designer for GFX Designers</h4>
          </div>
          <div className="liquid-glass rounded-2xl p-10 flex items-center justify-center text-center backdrop-blur-3xl bg-white/5">
            <h4 className="font-body font-medium text-lg">Husnain Mahmood aka HASH</h4>
          </div>
          <div className="liquid-glass rounded-2xl p-10 flex items-center justify-center text-center backdrop-blur-3xl bg-white/5">
            <h4 className="font-body font-medium text-lg">husnaindznfx@gmail.com</h4>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="relative py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden mt-24">
        <video
          ref={ctaVideoRef}
          src="https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8"
          muted autoPlay playsInline loop
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
        />
        <div className="absolute top-0 w-full h-[200px] bg-gradient-to-b from-[var(--background)] to-transparent z-0"></div>

        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-heading italic mb-6">Your next masterpiece starts here.</h2>
          <p className="text-xl opacity-80 font-body mb-10 max-w-2xl mx-auto">Join the premium design suite today. No commitment, just pure creativity.</p>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setIsSignUpOpen(true)} className="liquid-glass-strong rounded-full px-8 py-4 text-lg font-medium hover:scale-105 transition-transform">
              Sign Up Free
            </button>
            <button className="bg-white text-black rounded-full px-8 py-4 text-lg font-medium hover:bg-white/90 transition-colors">
              View Plans
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER BAR */}
      <footer className="border-t border-white/10 py-8 px-8 lg:px-24 flex flex-col md:flex-row justify-between items-center opacity-70 text-sm font-body">
        <p>© 2026 Desyna. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Contact</a>
        </div>
      </footer>

      {/* AUTHENTICATION MODALS */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="liquid-glass rounded-2xl p-10 w-full max-w-md relative">
            <button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100">✕</button>
            <h3 className="font-heading italic text-4xl text-center mb-8 text-white">Welcome Back</h3>
            <input type="email" placeholder="Email" className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 w-full outline-none focus:border-white/50 transition-colors" />
            <input type="password" placeholder="Password" className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-6 w-full outline-none focus:border-white/50 transition-colors" />
            <button className="liquid-glass-strong rounded-full w-full py-4 text-white font-medium hover:bg-white/10 transition-colors">Sign In</button>
            <button onClick={() => { setIsLoginOpen(false); setIsSignUpOpen(true); }} className="w-full text-center mt-6 text-white/70 hover:text-white text-sm">
              Don't have an account? Create account
            </button>
          </div>
        </div>
      )}

      {isSignUpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="liquid-glass rounded-2xl p-10 w-full max-w-md relative">
            <button onClick={() => setIsSignUpOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100">✕</button>
            <h3 className="font-heading italic text-4xl text-center mb-8 text-white">Join the Canvas</h3>
            <input type="text" placeholder="Full Name" className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 w-full outline-none focus:border-white/50 transition-colors" />
            <input type="email" placeholder="Email" className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 w-full outline-none focus:border-white/50 transition-colors" />
            <input type="password" placeholder="Password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 w-full outline-none focus:border-white/50 transition-colors" />
            <input type="password" placeholder="Confirm Password" value={signUpConfirmPassword} onChange={(e) => setSignUpConfirmPassword(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-2 w-full outline-none focus:border-white/50 transition-colors" />
            {signUpError && <p className="text-red-500 text-sm mb-4">{signUpError}</p>}
            <button onClick={handleSignUp} className="liquid-glass-strong rounded-full w-full py-4 text-white font-medium hover:bg-white/10 transition-colors mt-2">Create Account</button>
            <button onClick={() => { setIsSignUpOpen(false); setIsLoginOpen(true); }} className="w-full text-center mt-6 text-white/70 hover:text-white text-sm">
              Already have an account? Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
