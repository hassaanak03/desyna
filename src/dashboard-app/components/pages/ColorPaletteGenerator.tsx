/// <reference types="vite/client" />
import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Copy, Check, Plus, Trash2, Save, Wand2, BookMarked, Pencil, X, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router';
import { useProjects } from '../../context/ProjectContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Palette {
  id: string;
  name: string;
  colors: string[];
  tags: string[];
  isBest?: boolean;
}

// ─── Fallback Data Library ────────────────────────────────────────────────────
const defaultPalettes: Palette[] = [
  { id: 'd1', name: 'Desyna Aurora', colors: ['#080812', '#1a1a3e', '#4ade80', '#22d3ee', '#a78bfa'], tags: ['brand', 'atmospheric'], isBest: true },
  { id: 'd2', name: 'Midnight Bloom', colors: ['#0a0118', '#2d1b69', '#7c3aed', '#f472b6', '#fda4af'], tags: ['elegant', 'luxe'] },
  { id: 'd3', name: 'Arctic Pulse', colors: ['#f0f4ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'], tags: ['cool', 'crisp'] },
  { id: 'd4', name: 'Ember Forge', colors: ['#1c0500', '#7c1d00', '#dc2626', '#f97316', '#fbbf24'], tags: ['fiery', 'bold'] },
  { id: 'd5', name: 'Sage Garden', colors: ['#f1f8f1', '#d1e8d1', '#6dbf6d', '#2d7a2d', '#0f3d0f'], tags: ['natural', 'growth'] },
  { id: 'd6', name: 'Neon Alchemy', colors: ['#000510', '#0a0a2e', '#ff006e', '#8338ec', '#3a86ff'], tags: ['vibrant', 'modern'] },
];

const quickTags = ['Ocean', 'Sunset', 'Forest', 'Cyberpunk', 'Neon', 'Minimal', 'Space'];

// ─── Component ────────────────────────────────────────────────────────────────
export function ColorPaletteGenerator() {
  const { isDark } = useTheme();
  const location = useLocation();
  const { handleSaveProject: contextSaveProject } = useProjects();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [palettes, setPalettes] = useState<Palette[]>(defaultPalettes);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom builder
  const [customColors, setCustomColors] = useState<string[]>(['#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24']);
  const [customName, setCustomName] = useState('My Palette');

  // Saved palettes
  const [saved, setSaved] = useState<Palette[]>(() => {
    try { return JSON.parse(localStorage.getItem('desyna-palettes') || '[]'); } catch { return []; }
  });

  // ── Project Loading ──
  useEffect(() => {
    const state = location.state as { projectId?: string } | null;
    if (!state?.projectId) return;

    const loadProject = async () => {
      try {
        const docRef = doc(db, 'projects', state.projectId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const projectData = data.projectData || data;
          if (projectData.customColors) setCustomColors(projectData.customColors);
          if (projectData.customName) setCustomName(projectData.customName);
          if (projectData.saved) setSaved(projectData.saved);
          setCurrentProjectId(state.projectId!);
        }
      } catch (err) {
        console.error("Error loading palette project:", err);
        toast.error("Failed to load project.");
      }
    };
    loadProject();
  }, [location.state]);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // ── Styling tokens ─────────────────────────────────────────────────────────
  const glassBg = isDark ? 'rgba(14,14,26,0.88)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const textPrimary = isDark ? '#fff' : '#1a1a2e';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const cardBg = isDark ? 'rgba(12,12,24,0.85)' : 'rgba(255,255,255,0.9)';

  // ── AI Generation (Groq Llama-3.3-70b) ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setPalettes([]);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('Groq API Key not found in .env');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'system',
              content: 'You are a professional color palette generator. Based on the user prompt, generate 6 unique and aesthetically pleasing color palettes. Each palette must have exactly 5 hex color codes. Return ONLY a JSON object with a key "palettes" which is an array of objects. Each object should have "name" (string), "colors" (array of 5 strings), and "tags" (array of 2 strings). Do not include any other text.'
            },
            { role: 'user', content: `Generate palettes for: ${prompt}` }
          ],
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stop: null,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);

      if (aiResponse.palettes && Array.isArray(aiResponse.palettes)) {
        const formatted = aiResponse.palettes.map((p: any, i: number) => ({
          ...p,
          id: `ai-${Date.now()}-${i}`,
          isBest: i === 0 // Make the first one "Best Pick"
        }));
        setPalettes(formatted);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      setError('AI service unavailable. Showing defaults.');
      setPalettes(defaultPalettes);
    } finally {
      setGenerating(false);
    }
  };

  // ── Copy hex to clipboard ──────────────────────────────────────────────────
  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => { });
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  }, []);

  // ── Save palette to library ────────────────────────────────────────────────
  const savePalette = (palette: Palette) => {
    const entry = { ...palette, id: `sv-${Date.now()}`, isBest: false };
    setSaved(prev => {
      const next = [entry, ...prev];
      localStorage.setItem('desyna-palettes', JSON.stringify(next));
      return next;
    });
    setSavedMsg(palette.name);
    setTimeout(() => setSavedMsg(null), 2000);
  };

  const saveCustom = async () => {
    const palette = { id: `sv-${Date.now()}`, name: customName, colors: customColors, tags: ['custom'] };
    savePalette(palette);

    // Also save the entire state to Firestore
    handleSaveProjectToCloud();
  };

  const handleSaveProjectToCloud = async () => {
    try {
      const state = { customColors, customName, saved };
      const id = await contextSaveProject(
        currentProjectId,
        customName || 'Color Palette',
        state,
        '', // No preview image for now
        'Color Palette'
      );
      if (id) {
        setCurrentProjectId(id);
        toast.success('Palette project saved to cloud!');
      }
    } catch (err) {
      console.error('Error saving palette to cloud:', err);
      toast.error('Failed to save to cloud.');
    }
  };

  const deleteSaved = (id: string) => {
    setSaved(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem('desyna-palettes', JSON.stringify(next));
      return next;
    });
  };

  const startEdit = (p: Palette) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const applyEdit = () => {
    setSaved(prev => {
      const next = prev.map(p => p.id === editingId ? { ...p, name: editName } : p);
      localStorage.setItem('desyna-palettes', JSON.stringify(next));
      return next;
    });
    setEditingId(null);
  };

  // ── Custom builder helpers ─────────────────────────────────────────────────
  const updateCustomColor = (idx: number, hex: string) => {
    setCustomColors(prev => prev.map((c, i) => i === idx ? hex : c));
  };
  const addCustomColor = () => {
    if (customColors.length < 8) setCustomColors(prev => [...prev, '#ffffff']);
  };
  const removeCustomColor = (idx: number) => {
    if (customColors.length > 2) setCustomColors(prev => prev.filter((_, i) => i !== idx));
  };

  // ── 3D tilt handlers ───────────────────────────────────────────────────────
  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -6;
    const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 6;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025) translateZ(0)`;
    el.style.transition = 'transform 0.05s ease';
  };
  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0)';
    el.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes best-glow {
          0%,100% { box-shadow: 0 0 0 2px rgba(74,222,128,0.5), 0 8px 40px rgba(74,222,128,0.2), 0 24px 60px rgba(0,0,0,0.4); }
          50%      { box-shadow: 0 0 0 2px rgba(34,211,238,0.7), 0 8px 40px rgba(34,211,238,0.3), 0 24px 60px rgba(0,0,0,0.4); }
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Hero / Prompt Section ─────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center text-center px-6 pt-14 pb-12 overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0" style={{ overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '20%', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(74,222,128,0.12) 0%, transparent 70%)', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '10%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.1) 0%, transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-4">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs"
            style={{ background: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)', border: '1px solid rgba(74,222,128,0.3)', color: isDark ? '#4ade80' : '#16a34a' }}
          >
            <Sparkles size={12} /> Powered by Llama 3.3 · Groq AI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: textPrimary, lineHeight: 1.12, marginBottom: '1rem' }}
        >
          Colors that tell{' '}
          <span style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your story
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ color: textMuted, fontSize: '0.95rem', maxWidth: 480, lineHeight: 1.65, marginBottom: '2rem' }}
        >
          Our Llama-powered AI creates unique, professionally balanced color palettes based on any concept you can imagine.
        </motion.p>

        {/* Prompt Input */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <div
            className="flex items-center gap-3 p-2 pl-5 rounded-2xl"
            style={{ background: glassBg, border: `1px solid ${glassBorder}`, backdropFilter: 'blur(20px)', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)' }}
          >
            <Sparkles size={17} style={{ color: isDark ? '#a78bfa' : '#7c3aed', flexShrink: 0 }} />
            <input
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. 'cyberpunk nights', 'vintage polaroid', 'minimal arctic'..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: textPrimary }}
            />
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              style={{
                background: generating ? 'rgba(74,222,128,0.3)' : 'linear-gradient(135deg, #4ade80, #22d3ee)',
                color: '#080812',
                border: 'none',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              {generating ? (
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin-slow 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                </svg>
              ) : <Wand2 size={14} />}
              {generating ? 'Dreaming…' : 'Generate'}
            </motion.button>
          </div>

          {/* Quick tag pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setPrompt(tag.toLowerCase()); }}
                className="px-3 py-1 rounded-full text-xs cursor-pointer"
                style={{
                  background: inputBg,
                  border: `1px solid ${glassBorder}`,
                  color: textMuted,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = textPrimary; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.borderColor = glassBorder; }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-red-400"
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── Generated Palettes ────────────────────────────────────────── */}
      <section className="px-6 pb-14 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ color: textPrimary, fontSize: '1.1rem', fontWeight: 700 }}>
              {prompt ? `Results for "${prompt}"` : 'Suggested Palettes'}
            </h2>
            <p style={{ color: textMuted, fontSize: '0.8rem', marginTop: 3 }}>
              Click any color swatch to copy its hex code
            </p>
          </div>
          {savedMsg && (
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(22,163,74,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: isDark ? '#4ade80' : '#16a34a' }}
            >
              <Check size={14} /> "{savedMsg}" saved!
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    height: 200,
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${glassBorder}`,
                    animation: `fade-up 0.5s ease ${i * 0.08}s both`,
                  }}
                >
                  <div className="h-24 w-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-2/3 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                    <div className="h-2.5 w-1/3 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {palettes.map((palette, idx) => (
                <motion.div
                  key={palette.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: cardBg,
                    border: `1px solid ${glassBorder}`,
                    backdropFilter: 'blur(20px)',
                    willChange: 'transform',
                    transformStyle: 'preserve-3d',
                    cursor: 'default',
                    ...(palette.isBest
                      ? { animation: 'best-glow 3s ease-in-out infinite' }
                      : { boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(0,0,0,0.1)' }
                    ),
                  }}
                >
                  {/* Best badge */}
                  {palette.isBest && (
                    <div
                      className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)', color: '#080812' }}
                    >
                      <Sparkles size={10} /> Best Pick
                    </div>
                  )}

                  {/* Color strip — 5 equal columns */}
                  <div className="flex relative" style={{ height: 110 }}>
                    {palette.colors.map((hex, ci) => (
                      <button
                        key={ci}
                        onClick={() => copyHex(hex)}
                        className="flex-1 relative group/swatch flex items-end justify-center pb-2"
                        style={{
                          background: hex,
                          cursor: 'pointer',
                          transition: 'flex 0.2s ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.flex = '1.5'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.flex = '1'; }}
                        title={hex}
                      >
                        <span
                          className="opacity-0 group-hover/swatch:opacity-100 transition-opacity duration-150 font-mono rounded-md px-1.5 py-0.5 text-xs"
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: '0.6rem',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          {copiedHex === hex ? <Check size={10} /> : hex}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Info row */}
                  <div className="px-4 pt-3 pb-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div style={{ color: textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>{palette.name}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {palette.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textMuted }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Hex codes row */}
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {palette.colors.map((hex, ci) => (
                        <button
                          key={ci}
                          onClick={() => copyHex(hex)}
                          className="font-mono text-xs px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150"
                          style={{
                            background: copiedHex === hex ? `${hex}22` : inputBg,
                            border: `1px solid ${copiedHex === hex ? hex + '55' : glassBorder}`,
                            color: copiedHex === hex ? hex : textMuted,
                          }}
                          title="Copy hex"
                        >
                          {hex}
                        </button>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${glassBorder}` }}>
                      <button
                        onClick={() => copyHex(palette.colors.join(', '))}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs cursor-pointer"
                        style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textMuted, transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.color = textPrimary; }}
                        onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
                      >
                        <Copy size={11} /> Copy All
                      </button>
                      <button
                        onClick={() => savePalette(palette)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs cursor-pointer font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,211,238,0.15))',
                          border: '1px solid rgba(74,222,128,0.3)',
                          color: isDark ? '#4ade80' : '#16a34a',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Save size={11} /> Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Custom Palette Builder ────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-8"
          style={{
            background: glassBg,
            border: `1px solid ${glassBorder}`,
            backdropFilter: 'blur(24px)',
            boxShadow: isDark ? '0 16px 60px rgba(0,0,0,0.4)' : '0 16px 60px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))', border: '1px solid rgba(167,139,250,0.3)' }}
            >
              <Pencil size={16} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h2 style={{ color: textPrimary, fontWeight: 700, fontSize: '1.05rem' }}>Build Your Own</h2>
              <p style={{ color: textMuted, fontSize: '0.78rem' }}>Click a swatch to pick a color · Drag to reorder</p>
            </div>
          </div>

          <div style={{ height: 1, background: glassBorder, margin: '20px 0' }} />

          {/* Palette name */}
          <div className="mb-6">
            <label style={{ color: textMuted, fontSize: '0.75rem', display: 'block', marginBottom: 6 }}>Palette Name</label>
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none w-full max-w-xs"
              style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textPrimary, transition: 'all 0.3s ease' }}
            />
          </div>

          {/* Color swatches */}
          <div className="mb-8">
            <label style={{ color: textMuted, fontSize: '0.75rem', display: 'block', marginBottom: 12 }}>Colors</label>
            <div className="flex flex-wrap gap-4 items-end">
              {customColors.map((color, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-2 group/sw"
                >
                  <div
                    className="relative rounded-2xl"
                    style={{
                      width: 76, height: 76,
                      background: `radial-gradient(circle at 30% 30%, ${color}ff, ${color}bb)`,
                      boxShadow: `0 6px 20px ${color}55, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; }}
                  >
                    {customColors.length > 2 && (
                      <button
                        onClick={() => removeCustomColor(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/sw:opacity-100 transition-opacity z-10 cursor-pointer"
                        style={{ background: '#ef4444', color: '#fff', fontSize: '0.6rem' }}
                      >
                        <X size={9} />
                      </button>
                    )}
                    <input
                      type="color"
                      value={color}
                      onChange={e => updateCustomColor(idx, e.target.value)}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', borderRadius: 16 }}
                      title="Click to change color"
                    />
                  </div>
                  <span style={{ color: textMuted, fontSize: '0.65rem', fontFamily: 'monospace' }}>{color}</span>
                </motion.div>
              ))}

              {customColors.length < 8 && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={addCustomColor}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  style={{ width: 76 }}
                >
                  <div
                    className="w-full rounded-2xl flex items-center justify-center"
                    style={{
                      height: 76,
                      background: inputBg,
                      border: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                      color: textMuted,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Plus size={22} />
                  </div>
                  <span style={{ color: textMuted, fontSize: '0.65rem' }}>Add</span>
                </motion.button>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={saveCustom}
            className="flex items-center gap-2.5 px-7 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #4ade80)',
              color: '#080812',
              border: 'none',
              boxShadow: '0 0 30px rgba(167,139,250,0.35)',
            }}
          >
            <BookMarked size={16} /> Save to Library
          </motion.button>
        </div>
      </section>

      {/* ── Saved Palettes ────────────────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h2 style={{ color: textPrimary, fontWeight: 700, fontSize: '1.1rem' }}>
            Your Library
          </h2>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textMuted }}
          >
            {saved.length}
          </span>
        </div>

        {saved.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
            style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `2px dashed ${glassBorder}` }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
            >
              <BookMarked size={28} style={{ color: textMuted }} />
            </div>
            <p style={{ color: textPrimary, fontWeight: 600, marginBottom: 4 }}>No saved palettes yet</p>
            <p style={{ color: textMuted, fontSize: '0.85rem' }}>Save palettes from the suggestions above or build your own.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {saved.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.25 }}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: cardBg,
                    border: `1px solid ${glassBorder}`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.3)' : '0 6px 24px rgba(0,0,0,0.08)',
                    willChange: 'transform',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="flex" style={{ height: 72 }}>
                    {p.colors.map((hex, i) => (
                      <button
                        key={i}
                        onClick={() => copyHex(hex)}
                        className="flex-1 cursor-pointer transition-all duration-150 group/sv"
                        style={{ background: hex, position: 'relative' }}
                        title={hex}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.flex = '1.4'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.flex = '1'; }}
                      >
                        <span
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/sv:opacity-100 transition-opacity font-mono text-white"
                          style={{ fontSize: '0.55rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
                        >
                          {copiedHex === hex ? '✓' : hex}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="px-3 py-3">
                    {editingId === p.id ? (
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && applyEdit()}
                          autoFocus
                          className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
                          style={{ background: inputBg, border: `1px solid rgba(74,222,128,0.4)`, color: textPrimary }}
                        />
                        <button onClick={applyEdit} className="cursor-pointer" style={{ color: '#4ade80' }}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: textPrimary, fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>{p.name}</div>
                    )}

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => copyHex(p.colors.join(', '))}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs cursor-pointer"
                        style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textMuted, transition: 'all 0.2s ease' }}
                      >
                        <Copy size={10} /> Copy
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="flex items-center justify-center w-8 py-1.5 rounded-lg text-xs cursor-pointer"
                        style={{ background: inputBg, border: `1px solid ${glassBorder}`, color: textMuted, transition: 'all 0.2s ease' }}
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => deleteSaved(p.id)}
                        className="flex items-center justify-center w-8 py-1.5 rounded-lg text-xs cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', transition: 'all 0.2s ease' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
