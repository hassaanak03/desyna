import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.93 }}
      className="flex items-center gap-0.5 cursor-pointer select-none relative"
      style={{
        width: 72,
        height: 34,
        borderRadius: 999,
        padding: '3px',
        /* Glass base */
        background: isDark
          ? 'linear-gradient(145deg, rgba(30,28,60,0.82), rgba(14,13,36,0.92))'
          : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(230,232,255,0.78))',
        border: isDark
          ? '1px solid rgba(255,255,255,0.13)'
          : '1px solid rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        /* 3-D depth shadows */
        boxShadow: isDark
          ? `0 2px 0 rgba(255,255,255,0.06) inset,
             0 -1px 0 rgba(0,0,0,0.5) inset,
             0 4px 16px rgba(0,0,0,0.55),
             0 1px 3px rgba(0,0,0,0.4)`
          : `0 2px 0 rgba(255,255,255,0.95) inset,
             0 -1px 0 rgba(0,0,0,0.08) inset,
             0 4px 16px rgba(0,0,0,0.12),
             0 1px 3px rgba(0,0,0,0.08)`,
        transition: 'background 0.45s ease, box-shadow 0.45s ease',
      }}
    >
      {/* Gloss sheen overlay */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 60%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      {/* Sun pill */}
      <motion.div
        animate={{ scale: !isDark ? 1 : 0.78, opacity: !isDark ? 1 : 0.45 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 27,
          height: 27,
          flexShrink: 0,
          background: !isDark
            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
            : 'transparent',
          boxShadow: !isDark
            ? '0 2px 8px rgba(245,158,11,0.55), 0 1px 0 rgba(255,255,255,0.4) inset'
            : 'none',
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <Sun size={13} style={{ color: !isDark ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'color 0.35s ease' }} />
      </motion.div>

      {/* Moon pill */}
      <motion.div
        animate={{ scale: isDark ? 1 : 0.78, opacity: isDark ? 1 : 0.45 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 27,
          height: 27,
          flexShrink: 0,
          background: isDark
            ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
            : 'transparent',
          boxShadow: isDark
            ? '0 2px 8px rgba(124,58,237,0.6), 0 1px 0 rgba(255,255,255,0.15) inset'
            : 'none',
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <Moon size={13} style={{ color: isDark ? '#fff' : 'rgba(26,26,46,0.3)', transition: 'color 0.35s ease' }} />
      </motion.div>
    </motion.button>
  );
}