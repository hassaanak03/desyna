import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Search, Plus, ChevronRight } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
  ratio: string;
  accent: string;
  bg: string;
  icon: 'play' | 'ig' | 'plus';
  dotted?: boolean;
}

interface RecentDesign {
  id: number;
  title: string;
  author: string;
  img: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const recentDesigns: RecentDesign[] = [
  {
    id: 1, title: 'Recent Design', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 2, title: 'Presentation', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1771814591138-6aaab1bce775?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 3, title: 'Design Design', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1764268602042-88b05a211378?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 4, title: 'Design Design', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1769984867572-10dea95bd4f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 5, title: 'Brand Design', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1765758014805-a7a6cc272982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 6, title: 'Sound Whiteboard', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1767449280971-46e438b1ce4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
  {
    id: 7, title: 'Design Grid', author: 'Husnain',
    img: 'https://images.unsplash.com/photo-1689852501130-e89d9e54aa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
  },
];

const quickActions: QuickAction[] = [
  {
    id: 'video',
    label: 'Video',
    ratio: '16:9',
    accent: '#ef4444',
    bg: 'linear-gradient(145deg, #200505 0%, #3d0000 50%, #1a0000 100%)',
    icon: 'play',
  },
  {
    id: 'presentation',
    label: 'Presentation',
    ratio: '16:9',
    accent: '#f97316',
    bg: 'linear-gradient(145deg, #1e0d00 0%, #3d2000 50%, #1a0c00 100%)',
    icon: 'play',
  },
  {
    id: 'instagram',
    label: 'Instagram Post',
    ratio: '1:1',
    accent: '#e1306c',
    bg: 'linear-gradient(145deg, #1a0025 0%, #300040 50%, #180020 100%)',
    icon: 'ig',
  },
  {
    id: 'custom',
    label: 'Custom Size',
    ratio: 'custom',
    accent: '#6b7280',
    bg: 'transparent',
    icon: 'plus',
    dotted: true,
  },
];

// ─── Instagram Icon ───────────────────────────────────────────────────────────

function InstagramIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f09433" />
          <stop offset="25%"  stopColor="#e6683c" />
          <stop offset="50%"  stopColor="#dc2743" />
          <stop offset="75%"  stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-g)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="17.5" cy="6.5" r="1" fill="white" />
    </svg>
  );
}

// ─── Geometric Wireframe Decoration ─────────────────────────────────────────

function Wireframes() {
  return (
    <div style={{ position: 'absolute', right: '3%', bottom: '2%', pointerEvents: 'none', zIndex: 1, opacity: 0.22 }}>
      <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
        <polygon points="130,8  252,130 130,252  8,130"   stroke="rgba(160,200,255,0.9)" strokeWidth="0.7" />
        <polygon points="130,34 226,130 130,226 34,130"   stroke="rgba(160,200,255,0.75)" strokeWidth="0.6" />
        <polygon points="130,60 200,130 130,200 60,130"   stroke="rgba(160,200,255,0.6)" strokeWidth="0.5" />
        <polygon points="130,86 174,130 130,174 86,130"   stroke="rgba(160,200,255,0.45)" strokeWidth="0.5" />
        <polygon points="130,110 150,130 130,150 110,130" stroke="rgba(160,200,255,0.3)" strokeWidth="0.4" />
        <line x1="130" y1="8"  x2="130" y2="252" stroke="rgba(160,200,255,0.25)" strokeWidth="0.4" />
        <line x1="8"   y1="130" x2="252" y2="130" stroke="rgba(160,200,255,0.25)" strokeWidth="0.4" />
        <line x1="8"   y1="130" x2="130" y2="8"   stroke="rgba(160,200,255,0.12)" strokeWidth="0.3" strokeDasharray="4 4" />
        <line x1="130" y1="8"   x2="252" y2="130" stroke="rgba(160,200,255,0.12)" strokeWidth="0.3" strokeDasharray="4 4" />
        <line x1="252" y1="130" x2="130" y2="252" stroke="rgba(160,200,255,0.12)" strokeWidth="0.3" strokeDasharray="4 4" />
        <line x1="130" y1="252" x2="8"   y2="130" stroke="rgba(160,200,255,0.12)" strokeWidth="0.3" strokeDasharray="4 4" />
        {/* Small offset diamond */}
        <polygon points="210,180 236,206 210,232 184,206" stroke="rgba(160,200,255,0.5)" strokeWidth="0.6" />
        <polygon points="210,192 224,206 210,220 196,206" stroke="rgba(160,200,255,0.35)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

// ─── Aurora + Grid Background ─────────────────────────────────────────────────

function AuroraBackground({ isDark }: { isDark: boolean }) {
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <style>{`
        @keyframes orb1 {
          0%,100% { transform:translate(0,0) scale(1);    opacity:.80; }
          33%      { transform:translate(7%,-11%) scale(1.2); opacity:1; }
          66%      { transform:translate(-5%,7%) scale(.88); opacity:.65; }
        }
        @keyframes orb2 {
          0%,100% { transform:translate(0,0) scale(1);    opacity:.70; }
          40%      { transform:translate(-10%,9%) scale(1.15); opacity:.95; }
          75%      { transform:translate(6%,-5%) scale(.9);  opacity:.58; }
        }
        @keyframes orb3 {
          0%,100% { transform:translate(0,0) scale(1);    opacity:.60; }
          50%      { transform:translate(5%,11%) scale(1.25); opacity:.82; }
        }
      `}</style>

      {/* Base dark/light */}
      <div style={{ position:'absolute', inset:0, background: isDark ? '#08080f' : '#f0f0fa', transition:'background .6s' }} />

      {/* Dot grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: isDark
          ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
          : 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: isDark ? 0.45 : 0.35,
      }} />

      {/* Green orb — top-left */}
      <div style={{
        position:'absolute', width:'75%', height:'75%', top:'-18%', left:'-14%',
        borderRadius:'50%',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(74,222,128,0.35) 0%, rgba(34,197,94,0.15) 38%, transparent 68%)'
          : 'radial-gradient(ellipse, rgba(74,222,128,0.14) 0%, transparent 68%)',
        animation:'orb1 14s ease-in-out infinite',
        transition:'background .6s',
      }} />

      {/* Purple orb — top-right */}
      <div style={{
        position:'absolute', width:'70%', height:'70%', top:'-8%', right:'-18%',
        borderRadius:'50%',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(139,92,246,0.34) 0%, rgba(167,139,250,0.12) 38%, transparent 68%)'
          : 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 68%)',
        animation:'orb2 18s ease-in-out infinite',
        transition:'background .6s',
      }} />

      {/* Blue orb — bottom-center */}
      <div style={{
        position:'absolute', width:'60%', height:'60%', bottom:'-8%', left:'22%',
        borderRadius:'50%',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(59,130,246,0.28) 0%, rgba(34,211,238,0.10) 38%, transparent 68%)'
          : 'radial-gradient(ellipse, rgba(59,130,246,0.10) 0%, transparent 68%)',
        animation:'orb3 22s ease-in-out infinite',
        transition:'background .6s',
      }} />

      {/* Vignette */}
      <div style={{
        position:'absolute', inset:0,
        background: isDark
          ? 'radial-gradient(ellipse at 50% 38%, transparent 28%, rgba(0,0,0,0.68) 100%)'
          : 'radial-gradient(ellipse at 50% 38%, transparent 28%, rgba(190,190,220,0.5) 100%)',
        transition:'background .6s',
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────��───────────────────────────────────────

export function HomePage() {
  const { isDark } = useTheme();
  const navigate   = useNavigate();

  // ── Custom size modal state ──
  const [customModal, setCustomModal]   = useState(false);
  const [customWidth, setCustomWidth]   = useState('1920');
  const [customHeight, setCustomHeight] = useState('1080');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const uid = auth.currentUser?.uid || 'guest';
        const q = query(
          collection(db, 'projects'),
          where('uid', '==', uid),
          orderBy('timestamp', 'desc'),
          limit(7)
        );
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedProjects(projects);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    fetchProjects();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchProjects();
    });
    return () => unsubscribe();
  }, []);

  const tp  = isDark ? '#ffffff'                     : '#1a1a2e';
  const ts  = isDark ? 'rgba(255,255,255,0.55)'      : 'rgba(26,26,46,0.55)';
  const gBg = isDark ? 'rgba(16,16,30,0.68)'         : 'rgba(255,255,255,0.75)';
  const gBr = isDark ? 'rgba(255,255,255,0.10)'      : 'rgba(0,0,0,0.09)';
  const cBr = isDark ? 'rgba(255,255,255,0.07)'      : 'rgba(0,0,0,0.07)';
  const iBg = isDark ? 'rgba(16,16,34,0.80)'         : 'rgba(255,255,255,0.88)';

  return (
    <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', position: 'relative' }}>

      {/* Background */}
      <AuroraBackground isDark={isDark} />

      {/* All page content sits above background at z-10 */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ── HERO SECTION ── */}
        <section style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'72px 24px 56px', position:'relative', overflow:'hidden' }}>

          {isDark && <Wireframes />}

          {/* Welcome badge */}
          <motion.div
            initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.5 }}
            style={{ marginBottom: 24 }}
          >
            <span style={{
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'8px 22px', borderRadius:999,
              background: gBg,
              border: `1px solid ${gBr}`,
              color: tp,
              backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
              fontSize:'0.88rem', fontWeight:500,
              boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(74,222,128,0.08)' : '0 2px 12px rgba(0,0,0,0.08)',
              transition:'all .5s',
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'linear-gradient(135deg,#4ade80,#22d3ee)', flexShrink:0 }} />
              Welcome
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.65, delay:.1 }}
            style={{
              fontFamily:"'Instrument Serif', serif",
              fontStyle:'italic',
              fontSize:'clamp(2.6rem, 6.8vw, 4.6rem)',
              color: tp,
              lineHeight:1.08,
              letterSpacing:'-0.01em',
              maxWidth:660,
              marginBottom:20,
              transition:'color .5s',
            }}
          >
            What's cooking in<br />your brain today?
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.6, delay:.2 }}
            style={{ color:ts, fontSize:'0.92rem', lineHeight:1.72, maxWidth:360, marginBottom:32, transition:'color .5s' }}
          >
            Stunning design. Blazing performance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.55, delay:.3 }}
            style={{ display:'flex', gap:14, marginBottom:28, flexWrap:'wrap', justifyContent:'center' }}
          >
            <motion.button
              onClick={() => navigate('/dashboard/design-editor')}
              whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
              style={{
                padding:'10px 30px', borderRadius:999, border:'none', cursor:'pointer',
                background: isDark ? '#ffffff' : '#1a1a2e',
                color: isDark ? '#08080f' : '#ffffff',
                fontWeight:600, fontSize:'0.9rem',
                boxShadow: isDark
                  ? '0 0 28px rgba(255,255,255,0.18), 0 4px 16px rgba(0,0,0,0.3)'
                  : '0 4px 24px rgba(26,26,46,0.3)',
                transition:'all .4s',
              }}
            >
              Start Designing
            </motion.button>

            <motion.button
              whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
              style={{
                padding:'10px 26px', borderRadius:999, cursor:'pointer',
                background:'transparent',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.24)' : 'rgba(26,26,46,0.24)'}`,
                color: tp, fontWeight:500, fontSize:'0.9rem',
                display:'flex', alignItems:'center', gap:8,
                backdropFilter:'blur(8px)', transition:'all .4s',
              }}
            >
              <Play size={13} fill="currentColor" />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.5, delay:.42 }}
            style={{ position:'relative', width:'100%', maxWidth:460 }}
          >
            <Search size={15} style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:ts, pointerEvents:'none' }} />
            <input
              type="text"
              placeholder="Search bar + placeholder text..."
              style={{
                width:'100%', padding:'12px 20px 12px 46px',
                borderRadius:999, outline:'none',
                background: iBg,
                border: `1px solid ${gBr}`,
                color: tp, fontSize:'0.88rem',
                backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                transition:'all .5s', boxSizing:'border-box',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)',
              }}
            />
          </motion.div>
        </section>

        {/* ── QUICK ACTIONS ── */}
        <section style={{ padding:'0 24px 40px', maxWidth:780, margin:'0 auto' }}>
          <motion.h2
            initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:.45, delay:.5 }}
            style={{ color:tp, fontSize:'1rem', fontWeight:600, marginBottom:18, transition:'color .5s' }}
          >
            You might want to try...
          </motion.h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
            {quickActions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:.4, delay:.54 + i * .08 }}
                whileHover={{ scale:1.05, y:-5 }} whileTap={{ scale:.96 }}
                onClick={() => {
                  if (action.id === 'custom') { setCustomModal(true); return; }
                  navigate('/dashboard/design-editor', { state:{ ratio:action.ratio, label:action.label } });
                }}
                style={{
                  aspectRatio:'1',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12,
                  borderRadius:20, cursor:'pointer', position:'relative', overflow:'hidden',
                  background: action.dotted
                    ? (isDark ? 'rgba(12,12,24,0.5)' : 'rgba(240,240,252,0.7)')
                    : action.bg,
                  border: action.dotted
                    ? `1.5px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.2)'}`
                    : `1px solid ${cBr}`,
                  backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
                  boxShadow: action.dotted ? 'none' : (isDark ? '0 6px 28px rgba(0,0,0,0.55)' : '0 4px 16px rgba(0,0,0,0.1)'),
                  transition:'all .35s',
                }}
              >
                {/* Subtle top sheen for non-dotted cards */}
                {!action.dotted && (
                  <div style={{
                    position:'absolute', inset:0, borderRadius:20,
                    background:'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
                    pointerEvents:'none',
                  }} />
                )}

                {/* Icon */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {action.icon === 'ig' && <InstagramIcon size={40} />}

                  {action.icon === 'play' && (
                    <div style={{
                      width:46, height:46, borderRadius:'50%',
                      background: action.accent,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 24px ${action.accent}99, 0 0 48px ${action.accent}44`,
                    }}>
                      <Play size={17} fill="white" style={{ color:'white', marginLeft:2 }} />
                    </div>
                  )}

                  {action.icon === 'plus' && (
                    <div style={{
                      width:46, height:34,
                      border:`1.5px dashed ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,46,0.3)'}`,
                      borderRadius:6,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Plus size={18} style={{ color:ts }} />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div style={{ textAlign:'center', padding:'0 8px' }}>
                  <div style={{
                    color: action.dotted ? ts : '#ffffff',
                    fontSize:'0.82rem', fontWeight:500,
                  }}>
                    {action.label}
                  </div>
                  {action.id !== 'custom' && (
                    <div style={{ color:'rgba(255,255,255,0.38)', fontSize:'0.72rem', marginTop:3 }}>
                      {action.ratio}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── RECENT DESIGNS ── */}
        <section style={{ padding:'0 24px 80px', maxWidth:780, margin:'0 auto' }}>
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:.4, delay:.68 }}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}
          >
            <h2 style={{ color:tp, fontSize:'1rem', fontWeight:600, transition:'color .5s' }}>
              Recent Designs
            </h2>
            <button style={{
              display:'flex', alignItems:'center', gap:4,
              color: isDark ? '#4ade80' : '#16a34a',
              fontSize:'0.85rem', fontWeight:500,
              background:'none', border:'none', cursor:'pointer', transition:'color .5s',
            }}>
              See all <ChevronRight size={14} />
            </button>
          </motion.div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
            {(savedProjects.length > 0 ? savedProjects : recentDesigns).map((design, i) => (
              <motion.div
                key={design.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:.38, delay:.7 + i * .06 }}
                whileHover={{ scale:1.03, y:-3 }}
                onClick={() => {
                  const type = (design.type || '').toLowerCase();
                  if (type.includes('brand')) {
                    navigate('/dashboard/brand-kit', { state: { projectId: design.id } });
                  } else if (type.includes('whiteboard')) {
                    navigate('/dashboard/whiteboard', { state: { projectId: design.id } });
                  } else if (type.includes('portfolio')) {
                    navigate('/dashboard/portfolio', { state: { projectId: design.id } });
                  } else if (type.includes('palette')) {
                    navigate('/dashboard/palette', { state: { projectId: design.id } });
                  } else {
                    // Default to structured editor or design editor
                    navigate('/dashboard/design-editor', { state: { projectId: design.id } });
                  }
                }}
                style={{ cursor:'pointer' }}
                className="group"
              >
                <div style={{
                  borderRadius:12, overflow:'hidden',
                  aspectRatio:'16/9', marginBottom:8, position:'relative',
                  border:`1px solid ${cBr}`,
                  boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.45)' : '0 2px 10px rgba(0,0,0,0.08)',
                  transition:'border-color .5s',
                }}>
                  <img
                    src={design.img || `https://picsum.photos/seed/${design.id}/400/225`}
                    alt={design.title}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .4s' }}
                  />
                  {/* Hover overlay */}
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(0,0,0,0.38)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    opacity:0, transition:'opacity .25s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
                  >
                    <span style={{
                      color:'#fff', fontSize:'0.78rem', fontWeight:500,
                      padding:'5px 14px', borderRadius:999,
                      background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)',
                    }}>Open</span>
                  </div>
                </div>
                <div style={{ color:tp, fontSize:'0.82rem', fontWeight:500, transition:'color .5s' }}>{design.title || 'Untitled Design'}</div>
                <div style={{ color:ts, fontSize:'0.73rem', marginTop:2, transition:'color .5s' }}>{design.type || design.author} {design.timestamp ? `· ${new Date(design.timestamp).toLocaleDateString()}` : ''}</div>
              </motion.div>
            ))}

            {/* Add new */}
            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:.38, delay:.7 + recentDesigns.length * .06 }}
              whileHover={{ scale:1.03, y:-3 }}
              onClick={() => navigate('/dashboard/design-editor')}
              style={{ cursor:'pointer' }}
            >
              <div style={{
                borderRadius:12, aspectRatio:'16/9', marginBottom:8,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8,
                border:`1.5px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(26,26,46,0.15)'}`,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                transition:'all .4s',
              }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Plus size={18} style={{ color:ts }} />
                </div>
              </div>
              <div style={{ color:ts, fontSize:'0.82rem', fontWeight:500 }}>Add new one</div>
            </motion.div>
          </div>
        </section>
      </div>{/* /relative z-10 */}

      {/* ── CUSTOM SIZE MODAL ── */}
      <AnimatePresence>
        {customModal && (
          <motion.div
            key="custom-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setCustomModal(false)}
          >
            <motion.div
              key="custom-modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.92, y: 20  }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400,
                borderRadius: 24,
                background: isDark ? 'rgba(14,14,28,0.96)' : 'rgba(255,255,255,0.97)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                boxShadow: isDark
                  ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(74,222,128,0.08)'
                  : '0 32px 80px rgba(0,0,0,0.15)',
                padding: '32px 32px 28px',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
                  <h2 style={{ color: tp, fontWeight: 700, fontSize: '1.15rem' }}>Custom Canvas Size</h2>
                  <button
                    onClick={() => setCustomModal(false)}
                    style={{ width:28, height:28, borderRadius:'50%', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: isDark?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)', fontSize:16 }}
                  >×</button>
                </div>
                <p style={{ color: isDark?'rgba(255,255,255,0.45)':'rgba(26,26,46,0.5)', fontSize:'0.85rem' }}>
                  Set the dimensions for your new canvas
                </p>
              </div>

              {/* Dimension inputs */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom: 24 }}>
                {[
                  { label:'Width',  value: customWidth,  setter: setCustomWidth,  unit:'px' },
                  { label:'Height', value: customHeight, setter: setCustomHeight, unit:'px' },
                ].map(({ label, value, setter, unit }) => (
                  <div key={label}>
                    <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color: isDark?'rgba(255,255,255,0.45)':'rgba(26,26,46,0.45)', marginBottom:8 }}>
                      {label}
                    </label>
                    <div style={{ display:'flex', alignItems:'center', gap:0, borderRadius:12, overflow:'hidden', border:`1px solid ${isDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`, background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)' }}>
                      <input
                        type="number"
                        min="1"
                        max="8000"
                        value={value}
                        onChange={e => setter(e.target.value)}
                        style={{
                          flex:1, padding:'10px 12px', background:'transparent', border:'none', outline:'none',
                          color: tp, fontSize:'0.9rem', fontWeight:600, fontFamily:'monospace',
                          width: 0,
                        }}
                      />
                      <span style={{ paddingRight:12, color: isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)', fontSize:'0.8rem' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common presets */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
                {[
                  { label:'HD',   w:1920, h:1080 },
                  { label:'4K',   w:3840, h:2160 },
                  { label:'Square', w:1080, h:1080 },
                  { label:'A4',   w:2480, h:3508 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setCustomWidth(String(p.w)); setCustomHeight(String(p.h)); }}
                    style={{
                      padding:'4px 12px', borderRadius:999, fontSize:'0.75rem', cursor:'pointer',
                      background: isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)',
                      border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}`,
                      color: isDark?'rgba(255,255,255,0.6)':'rgba(26,26,46,0.6)',
                    }}
                  >
                    {p.label} <span style={{ opacity:.5 }}>{p.w}×{p.h}</span>
                  </button>
                ))}
              </div>

              {/* Create Canvas button */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const w = Math.max(1, parseInt(customWidth)  || 1920);
                  const h = Math.max(1, parseInt(customHeight) || 1080);
                  setCustomModal(false);
                  navigate('/dashboard/design-editor', { state:{ ratio:'custom', label:'Custom Canvas', width: w, height: h } });
                }}
                style={{
                  width:'100%', padding:'13px 24px', borderRadius:14, border:'none', cursor:'pointer',
                  background: 'linear-gradient(135deg,#4ade80 0%,#22d3ee 50%,#a78bfa 100%)',
                  color: '#08080f', fontWeight:700, fontSize:'0.95rem',
                  boxShadow: '0 0 32px rgba(74,222,128,0.45), 0 4px 16px rgba(0,0,0,0.2)',
                  letterSpacing: '0.02em',
                }}
              >
                Create Canvas
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}