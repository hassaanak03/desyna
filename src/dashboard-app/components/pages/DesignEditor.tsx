import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { observer } from 'mobx-react-lite';
import { createStore } from 'polotno/model/store';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { SidePanel } from 'polotno/side-panel/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { useTheme } from '../../context/ThemeContext';
import { useProjects } from '../../context/ProjectContext';
import { db, auth } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Save, Download, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

// Polotno depends on blueprint CSS
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

// Store Initialization
const store = createStore({
  key: 'FREE_KEY',
  showCredit: false
});

export const DesignEditor = observer(() => {
  const { isDark } = useTheme();
  const { handleSaveProject } = useProjects();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    const loadData = async () => {
      if (state.projectId) {
        setCurrentProjectId(state.projectId);
        try {
          const docRef = doc(db, 'projects', state.projectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.projectData) store.loadJSON(data.projectData);
          }
        } catch (err) {
          console.error("Error loading polotno project:", err);
        }
      } else if (state.projectData) {
        store.loadJSON(state.projectData);
      } else if (state.ratio) {
        let width = 1920;
        let height = 1080;
        if (state.ratio === '1:1') { width = 1080; height = 1080; }
        else if (state.ratio === 'custom' && state.width && state.height) { width = state.width; height = state.height; }

        if (store.pages.length > 0) {
          store.pages[0].set({ width, height });
        } else {
          store.addPage({ width, height });
        }
      }
    };
    loadData();
  }, [location.state]);

  // Debounced Auto-Save
  useEffect(() => {
    const unsubscribe = store.on('change', () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        const data = store.toJSON();
        await handleSaveProject(currentProjectId, 'Design Project', data);
      }, 5000); // Auto-save every 5 seconds of inactivity
    });
    return () => {
      if (unsubscribe) unsubscribe();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [currentProjectId, handleSaveProject]);

  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? 'white' : 'black';
  const borderColor = isDark ? '#333' : '#ddd';

  const handleBrandKitExport = async () => {
    try {
      await store.waitLoading();
      store.saveAsImage({ pixelRatio: 2 });
      toast.success('Design exported successfully!');
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please ensure all images are fully loaded and try again.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = store.toJSON();
      const id = await handleSaveProject(currentProjectId, 'Design Project', data);
      if (id) setCurrentProjectId(id);
      toast.success('Project saved!');
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally { setIsSaving(false); }
  };

  const handleBackNavigation = async () => {
    setIsSaving(true);
    try {
      await store.waitLoading();
      const data = store.toJSON();
      const preview = await store.toDataURL();
      await handleSaveProject(currentProjectId, 'Design Project', data, preview);
    } catch (err) {
      console.error("Auto-save on back failed:", err);
    }
    navigate('/dashboard');
  };

  return (
    <div className={`w-full relative overflow-hidden ${isDark ? 'bp5-dark' : ''}`} style={{ height: 'calc(100vh - 64px)', backgroundColor: bgColor }}>
      <style>{`
        /* Root Polotno Overrides */
        .polotno-side-panel, .polotno-toolbar, .polotno-main-container {
          background-color: ${bgColor} !important;
          color: ${textColor} !important;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .polotno-side-panel { 
          border-right: 1px solid ${borderColor} !important;
          box-shadow: 4px 0 10px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .polotno-toolbar { 
          border-bottom: 1px solid ${borderColor} !important;
          height: 52px !important;
          padding: 0 24px !important;
          display: flex !important;
          align-items: center !important;
          background: ${isDark ? '#09090b' : '#ffffff'} !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          gap: 20px !important;
        }

        /* Group spacing within the toolbar */
        .polotno-toolbar-content {
          gap: 24px !important;
          display: flex !important;
          align-items: center !important;
        }

        .polotno-toolbar-content > div {
          gap: 16px !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Blueprint Button Overrides to match Screenshot */
        .bp5-button {
          background: transparent !important;
          box-shadow: none !important;
          color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)'} !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          padding: 6px 14px !important;
          min-height: 34px !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          white-space: nowrap !important;
        }

        .bp5-button:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} !important;
          color: ${isDark ? '#fff' : '#000'} !important;
        }

        .bp5-icon {
          color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'} !important;
          transition: color 0.2s ease !important;
        }

        .bp5-button:hover .bp5-icon {
          color: ${isDark ? '#fff' : '#000'} !important;
        }

        /* Root Polotno Side Panel Styling */
        .polotno-side-panel {
           background-color: ${isDark ? '#0f0f1a' : '#ffffff'} !important;
        }

        /* Remove Polotno Credit */
        .polotno-license-status { display: none !important; }
        
        /* Spacing for toolbar elements */
        .polotno-toolbar-left, .polotno-toolbar-right {
          display: flex !important;
          gap: 16px !important;
          align-items: center !important;
        }

        /* Specifically target feature buttons in the middle */
        .polotno-toolbar-content > div {
          display: flex !important;
          gap: 12px !important;
          align-items: center !important;
        }

        /* Workspace Scrollbar */
        .polotno-workspace-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .polotno-workspace-container::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
      `}</style>

      <PolotnoContainer>
        <SidePanelWrap>
          <SidePanel store={store} />
        </SidePanelWrap>
        <WorkspaceWrap>
          <div className="relative flex flex-col w-full h-full">
            <div className="flex items-center justify-between" style={{
              background: isDark ? '#0a0a0c' : '#ffffff',
              borderBottom: `1px solid ${borderColor}`,
              zIndex: 10
            }}>
              <Toolbar store={store} />
              <div style={{ display: 'flex', gap: '8px', paddingRight: '12px' }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="liquid-glass"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    color: textColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: `1px solid ${borderColor}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  }}
                >
                  <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleBrandKitExport}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                    color: '#000',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(34, 211, 238, 0.2)'
                  }}
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
            <Workspace store={store} />
          </div>
        </WorkspaceWrap>
      </PolotnoContainer>
    </div>
  );
});

export default DesignEditor;