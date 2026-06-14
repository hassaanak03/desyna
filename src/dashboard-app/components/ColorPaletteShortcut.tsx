import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export function ColorPaletteShortcut({ className = '', style = {} }: { className?: string, style?: React.CSSProperties }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/palette')}
      className={`fixed bottom-7 right-7 z-50 flex items-center gap-2.5 pl-2.5 pr-4 py-2.5 rounded-2xl cursor-pointer select-none ${className}`}
      style={{
        background: isDark ? 'rgba(10,10,22,0.94)' : 'rgba(255,255,255,0.94)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,222,128,0.08), 0 0 24px rgba(74,222,128,0.06)'
          : '0 8px 32px rgba(0,0,0,0.14)',
        color: isDark ? '#fff' : '#1a1a2e',
        ...style
      }}
    >
      {/* Mini palette strip */}
      <div className="flex rounded-lg overflow-hidden" style={{ width: 36, height: 28 }}>
        {['#4ade80', '#22d3ee', '#a78bfa', '#f472b6'].map((c) => (
          <div key={c} style={{ flex: 1, background: c }} />
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.01em' }}>Palette</span>
    </motion.button>
  );
}
