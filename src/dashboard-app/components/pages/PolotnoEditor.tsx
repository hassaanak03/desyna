import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { createStore } from 'polotno/model/store';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import '@blueprintjs/core/lib/css/blueprint.css';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function PolotnoEditor() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { label?: string, ratio?: '16:9' | '1:1' | 'custom', width?: number, height?: number } | null;
  const ratio = state?.ratio || '16:9';

  const storeRef = useRef<any>(null);
  const [storeLoaded, setStoreLoaded] = useState(false);

  useEffect(() => {
    const store = createStore({
      key: '', // Insert Polotno API key here if required for premium features
      showCredit: false,
    });
    
    let w = 1920;
    let h = 1080;
    
    if (ratio === 'custom' && state?.width && state?.height) {
      w = state.width;
      h = state.height;
    } else if (ratio === '1:1') {
      w = 1080;
      h = 1080;
    }
    
    store.addPage({ width: w, height: h });
    storeRef.current = store;
    setStoreLoaded(true);
  }, [ratio, state]);

  const glassBg = isDark ? 'rgba(14,14,26,0.88)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? '#fff' : '#1a1a2e';

  if (!storeLoaded) {
    return <div className="flex h-[calc(100vh-56px)] w-full items-center justify-center font-semibold text-gray-500">Loading Editor...</div>;
  }

  return (
    <div className="relative w-full overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Top Navbar for Editor */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: glassBg, borderColor: glassBorder }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm hover:opacity-80 transition-opacity"
          style={{ color: textPrimary, cursor: 'pointer' }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1 flex justify-center">
           <Toolbar store={storeRef.current} downloadButtonEnabled />
        </div>
        <div>
           <ZoomButtons store={storeRef.current} />
        </div>
      </div>
      
      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden" style={{ background: isDark ? '#080812' : '#f8fafc' }}>
        <div className="w-80 border-r flex flex-col" style={{ borderColor: glassBorder, background: isDark ? '#1a1a2e' : '#fff' }}>
          <SidePanel store={storeRef.current} />
        </div>
        <div className="flex-1 relative">
          <Workspace store={storeRef.current} />
        </div>
      </div>
    </div>
  );
}
