import { Outlet } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { Navbar } from './Navbar';
import { Toaster } from 'sonner';

export function RootLayout() {
  const { isDark } = useTheme();

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: isDark ? '#08080f' : '#f0f0fa',
        transition: 'background-color 0.6s ease',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar />
      <main className="pt-14">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" theme={isDark ? 'dark' : 'light'} />
    </div>
  );
}