import { Link, useNavigate, useLocation } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';

export function Navbar() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navBg = isDark ? 'rgba(12, 12, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#ffffff' : '#1a1a2e';
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(26,26,46,0.6)';

  const navLinks = [
    { label: 'Whiteboard', path: '/dashboard/whiteboard' },
    { label: 'Editor', path: '/dashboard/design-editor' },
    { label: 'Brand kit', path: '/dashboard/brand-kit' },
    { label: 'Portfolio Generator', path: '/dashboard/portfolio' },
    { label: 'Palettes', path: '/dashboard/palette' },
  ];

  const isPortfolio = location.pathname === '/dashboard/portfolio';

  const handleExportPortfolio = () => {
    document.dispatchEvent(new CustomEvent('portfolio-export'));
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: navBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        // Use box-shadow instead of borderBottom so the computed border-color
        // stays a single uniform value — prevents html2canvas multi-value parse error.
        border: 'none',
        boxShadow: `0 1px 0 0 ${borderColor}`,
        transition: 'background 0.5s ease, box-shadow 0.5s ease',
      }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 select-none group">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500"
          style={{ 
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: "10px" 
          }}
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke={isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)"} strokeWidth="1.5" />
            <path d="M11 4 L11 18 M4 11 L18 11" stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} strokeWidth="1" />
            <circle cx="11" cy="11" r="3" fill={isDark ? "white" : "#111"} />
          </svg>
        </div>
        <span style={{ 
          color: textColor, 
          fontWeight: 600, 
          fontSize: '1.2rem', 
          fontStyle: 'italic',
          fontFamily: "'Instrument Serif', serif",
          transition: 'color 0.5s ease' 
        }}>
          Desyna
        </span>
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-8">
        {navLinks.map(({ label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                color: isActive ? (isDark ? '#4ade80' : '#16a34a') : mutedText,
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.92rem',
                transition: 'color 0.3s ease',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right Action Group */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle — always visible in top-right */}
        <ThemeToggle />

        {/* Username */}
        <span style={{ color: textColor, fontWeight: 600, fontSize: '0.92rem', transition: 'color 0.5s ease' }}>
          {user?.displayName ? user.displayName.split(' ')[0] : 'User'}
        </span>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-1 focus:outline-none"
            aria-label="User menu"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                color: textColor,
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                transition: 'all 0.5s ease',
              }}
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown
              size={13}
              style={{
                color: mutedText,
                transition: 'transform 0.2s ease',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
              style={{
                background: isDark ? 'rgba(18, 18, 30, 0.95)' : 'rgba(255,255,255,0.97)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                <p style={{ color: textColor, fontSize: '0.82rem', fontWeight: 600 }}>{user?.displayName || 'User'}</p>
                <p style={{ color: mutedText, fontSize: '0.75rem' }}>{user?.email || 'user@example.com'}</p>
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                style={{ color: textColor }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings size={14} style={{ color: mutedText }} />
                <span style={{ fontSize: '0.85rem' }}>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                style={{ color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(248,113,113,0.08)' : 'rgba(239,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} style={{ color: '#f87171' }} />
                <span style={{ fontSize: '0.85rem' }}>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}