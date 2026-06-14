import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTheme } from '../../context/ThemeContext';
import { Save, Download, Image as ImageIcon, Layers, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';
import { Tldraw, Editor, getSnapshot, createShapeId, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { db, auth } from '../../../firebase';
import { useProjects } from '../../context/ProjectContext';
import { toast } from 'sonner';

// Liveblocks
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useRoom } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

// Inner component where useRoom is valid
function WhiteboardCanvas({ setEditor }: { setEditor: (ed: Editor) => void }) {
  const room = useRoom();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    // 1. Initialize Yjs document and Liveblocks provider
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    const yMap = yDoc.getMap<any>('tldraw_store');
    
    // 2. Create the Tldraw store
    const newStore = createTLStore({ shapeUtils: defaultShapeUtils });

    // 3. Sync Yjs changes to Tldraw
    const handleYjsChange = (event: Y.YMapEvent<any>) => {
      newStore.mergeRemoteChanges(() => {
         event.changes.keys.forEach((change, key) => {
            if (change.action === 'add' || change.action === 'update') {
               const record = yMap.get(key);
               if (record) newStore.put([record]);
            } else if (change.action === 'delete') {
               newStore.remove([key as any]);
            }
         });
      });
    };
    yMap.observe(handleYjsChange);

    // 4. Sync Tldraw changes to Yjs
    const unlisten = newStore.listen((update) => {
      if (update.source === 'user') {
         yDoc.transact(() => {
            for (const [id, record] of Object.entries(update.changes.added)) {
               yMap.set(id, record);
            }
            for (const [id, record] of Object.entries(update.changes.updated)) {
               yMap.set(id, record[1]); // new state
            }
            for (const id of Object.keys(update.changes.removed)) {
               yMap.delete(id);
            }
         });
      }
    }, { scope: 'document' });

    setStore(newStore);

    return () => {
      unlisten();
      yMap.unobserve(handleYjsChange);
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [room]);

  if (!store) return <div className="absolute inset-0 flex items-center justify-center text-gray-500">Initializing Store...</div>;

  return <Tldraw store={store} onMount={setEditor} autoFocus />;
}

export function WhiteboardEditor() {
  const { isDark } = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();
  const state     = location.state as { label?: string } | null;
  const label     = state?.label || 'Untitled';

  const [canvasName, setCanvasName] = useState(label !== 'Untitled' ? label : 'My Canvas');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [selectedTextShapes, setSelectedTextShapes] = useState<any[]>([]);
  const [customHex, setCustomHex] = useState('#000000');
  const { handleSaveProject } = useProjects();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { projectId?: string } | null;
    if (!state?.projectId || !editor) return;

    const loadProject = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'projects', state.projectId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentProjectId(state.projectId!);
          if (data.title) setCanvasName(data.title);
          
          // ProjectContext saves to 'projectData', legacy code used 'state'
          const projectState = data.projectData || data.state;
          if (projectState) {
            editor.loadSnapshot(projectState);
          }
        }
      } catch (err) {
        console.error("Error loading whiteboard project:", err);
        toast.error("Failed to load project.");
      }
    };
    loadProject();
  }, [location.state, editor]);

  useEffect(() => {
    if (!editor) return;
    const updateSelection = () => {
      const shapes = editor.getSelectedShapes();
      const textShapes = shapes.filter(s => s.type === 'text');
      if (shapes.length > 0 && shapes.length === textShapes.length) {
        setSelectedTextShapes(textShapes);
        // Sync customHex if they all have same color
        if (textShapes.length > 0 && textShapes[0].props.color) {
          setCustomHex(textShapes[0].props.color);
        }
      } else {
        setSelectedTextShapes([]);
      }
    };
    const unlisten = editor.store.listen(updateSelection, { scope: 'all' });
    return () => unlisten();
  }, [editor]);

  const updateTextProps = (props: any) => {
    if (!editor || selectedTextShapes.length === 0) return;
    editor.updateShapes(selectedTextShapes.map(s => ({
      id: s.id,
      type: 'text',
      props: { ...s.props, ...props }
    })));
  };

  // Handle Delete and Backspace keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || editor.getEditingShapeId() !== null) {
          return;
        }
        const selectedIds = editor.getSelectedShapeIds();
        if (selectedIds.length > 0) {
          editor.deleteShapes(Array.from(selectedIds));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleSaveProjectInternal = async () => {
    if (!editor) return;
    try {
      const snapshot = getSnapshot(editor.store);
      const id = await handleSaveProject(currentProjectId, canvasName, snapshot, '', 'Whiteboard');
      if (id) setCurrentProjectId(id);
      toast.success('Whiteboard saved successfully!');
    } catch (err) {
      console.error('Error saving project:', err);
      toast.error('Failed to save project.');
    }
  };

  const getTargetFrameId = () => {
    if (!editor) return null;
    const selectedIds = editor.getSelectedShapeIds();
    const selectedFrames = selectedIds.filter(id => editor.getShape(id)?.type === 'frame');
    if (selectedFrames.length > 0) return selectedFrames[0];
    
    const frames = editor.getCurrentPageShapes().filter(s => s.type === 'frame');
    if (frames.length > 0) return frames[0].id;
    return null;
  };

  const handleExportPNG = async () => {
    if (!editor) return;
    const frameId = getTargetFrameId();
    const ids = frameId ? [frameId] : Array.from(editor.getCurrentPageShapeIds());
    if (ids.length === 0) return alert('No shapes to export.');
    
    try {
      const { blob } = await editor.toImage(ids, { format: 'png', scale: 2 });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${canvasName.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export PNG');
    }
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    const frameId = getTargetFrameId();
    const ids = frameId ? [frameId] : Array.from(editor.getCurrentPageShapeIds());
    if (ids.length === 0) return alert('No shapes to export.');
    
    try {
      const { blob } = await editor.toImage(ids, { format: 'png', scale: 2 });
      
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${canvasName.replace(/\s+/g, '-').toLowerCase()}-export.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF');
    }
  };

  const handleLayerAction = (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    if (!editor) return;
    const selectedIds = Array.from(editor.getSelectedShapeIds());
    if (selectedIds.length === 0) return alert('Select shapes first to arrange.');
    
    if (action === 'bringToFront') editor.bringToFront(selectedIds);
    if (action === 'sendToBack') editor.sendToBack(selectedIds);
    if (action === 'bringForward') editor.bringForward(selectedIds);
    if (action === 'sendBackward') editor.sendBackward(selectedIds);
  };

  const addFrame = (ratio: '16:9' | '1:1') => {
    if (!editor) return;
    const frameId = createShapeId(`ratio-frame-${Date.now()}`);
    editor.createShape({
      id: frameId,
      type: 'frame',
      x: 100,
      y: 100,
      props: {
        w: ratio === '16:9' ? 1280 : 800,
        h: ratio === '16:9' ? 720 : 800,
        name: `${ratio} Frame`
      }
    });
    // Ensure Frame is sent to back
    editor.sendToBack([frameId]);
  };

  const glassBg    = isDark ? 'rgba(14,14,26,0.88)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDark ? '#fff' : '#1a1a2e';

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      <div className="absolute inset-0 z-0">
        <LiveblocksProvider publicApiKey="pk_dev_L2S8c-zOTlkw2jUzdFb9Zn5CKzo4VKPbXTvI-cZVgm6HMUnD4OmZaRCmd_yKT6p6">
          <RoomProvider id="desyna_global_room">
            <ClientSideSuspense fallback={<div className="flex w-full h-full items-center justify-center font-semibold text-gray-500">Loading Whiteboard...</div>}>
              <WhiteboardCanvas setEditor={setEditor} />
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </div>

          {/* Top Center: Title Input */}
          <div
            className="absolute top-4 left-1/2 flex items-center gap-3 px-4 py-2.5 rounded-2xl pointer-events-auto"
            style={{
              zIndex: 9999,
              transform: 'translateX(-50%)',
              background: glassBg,
              border: `1px solid ${glassBorder}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <input
              value={canvasName}
              onChange={e => setCanvasName(e.target.value)}
              className="text-sm font-semibold outline-none bg-transparent border-b px-1 py-0.5"
              style={{ color: textPrimary, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(26,26,46,0.2)', minWidth: 120, textAlign: 'center' }}
            />
          </div>

          {/* Text Formatting Toolbar */}
          {selectedTextShapes.length > 0 && (
            <div
              className="absolute bottom-20 left-1/2 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl pointer-events-auto"
              style={{
                zIndex: 9999,
                transform: 'translateX(-50%)',
                background: glassBg,
                border: `1px solid ${glassBorder}`,
                backdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
                maxWidth: '90vw'
              }}
            >
              <div className="flex gap-1 border-r border-gray-500/30 pr-3">
                <button onClick={() => updateTextProps({ align: 'start' })} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }} title="Align Left"><AlignLeft size={16} /></button>
                <button onClick={() => updateTextProps({ align: 'middle' })} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }} title="Align Center"><AlignCenter size={16} /></button>
                <button onClick={() => updateTextProps({ align: 'end' })} className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }} title="Align Right"><AlignRight size={16} /></button>
              </div>

              <div className="flex gap-1 border-r border-gray-500/30 px-3">
                <button onClick={() => updateTextProps({ font: 'sans' })} className="px-2 py-1 text-xs font-sans font-medium rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }}>Sans</button>
                <button onClick={() => updateTextProps({ font: 'serif' })} className="px-2 py-1 text-xs font-serif font-medium rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }}>Serif</button>
                <button onClick={() => updateTextProps({ font: 'draw' })} className="px-2 py-1 text-xs font-medium rounded hover:bg-black/10 dark:hover:bg-white/10" style={{ color: textPrimary }}>Draw</button>
              </div>

              <div className="flex gap-1 border-r border-gray-500/30 px-3">
                <button onClick={() => updateTextProps({ size: 's' })} className="px-2 py-1 text-xs rounded hover:bg-black/10 dark:hover:bg-white/10 font-bold" style={{ color: textPrimary }}>S</button>
                <button onClick={() => updateTextProps({ size: 'm' })} className="px-2 py-1 text-sm rounded hover:bg-black/10 dark:hover:bg-white/10 font-bold" style={{ color: textPrimary }}>M</button>
                <button onClick={() => updateTextProps({ size: 'l' })} className="px-2 py-1 text-base rounded hover:bg-black/10 dark:hover:bg-white/10 font-bold" style={{ color: textPrimary }}>L</button>
              </div>

              <div className="flex items-center gap-3 pl-1">
                {/* Preset Colors */}
                <div className="flex gap-1.5">
                  {['black', 'grey', 'red', 'orange', 'yellow', 'green', 'light-green', 'blue', 'light-blue', 'violet', 'light-violet', 'light-red'].map(c => (
                    <button
                      key={c}
                      onClick={() => updateTextProps({ color: c })}
                      className="w-5 h-5 rounded-full border border-gray-500/30 hover:scale-110 transition-transform shadow-sm"
                      style={{ background: c === 'black' ? '#1a1a2e' : c }}
                      title={c}
                    />
                  ))}
                </div>

                {/* Hex / Color Picker */}
                <div className="flex items-center gap-2 border-l border-gray-500/30 pl-3">
                  <div className="relative group">
                    <input
                      type="color"
                      value={customHex}
                      onChange={e => {
                        setCustomHex(e.target.value);
                        updateTextProps({ color: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                      title="Color Wheel"
                    />
                    <Palette size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference invert" />
                  </div>
                  <input
                    type="text"
                    value={customHex}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomHex(val);
                      if (/^#[0-9A-F]{6}$/i.test(val)) {
                        updateTextProps({ color: val });
                      }
                    }}
                    placeholder="#000000"
                    className="w-20 text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-gray-500/30 outline-none"
                    style={{ color: textPrimary }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right Sidebar - Layers & Actions */}
          <div className="absolute flex flex-col gap-3 pointer-events-auto w-64" style={{ zIndex: 99999, top: '320px', right: '10px' }}>
            
            {/* Layer Management */}
            <div className="p-3 rounded-2xl flex flex-col gap-2 shadow-lg" style={{ background: glassBg, border: `1px solid ${glassBorder}`, backdropFilter: 'blur(20px)' }}>
               <div className="flex items-center gap-2 px-1 mb-1">
                 <Layers size={14} style={{ color: textPrimary }} />
                 <h3 className="text-xs font-bold uppercase opacity-60" style={{ color: textPrimary }}>Layers & Frames</h3>
               </div>
               <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => handleLayerAction('bringToFront')} title="Bring to Front" className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex justify-center text-gray-700 dark:text-gray-200 transition-colors"><ArrowUpToLine size={16} /></button>
                  <button onClick={() => handleLayerAction('bringForward')} title="Bring Forward" className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex justify-center text-gray-700 dark:text-gray-200 transition-colors"><ArrowUp size={16} /></button>
                  <button onClick={() => handleLayerAction('sendBackward')} title="Send Backward" className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex justify-center text-gray-700 dark:text-gray-200 transition-colors"><ArrowDown size={16} /></button>
                  <button onClick={() => handleLayerAction('sendToBack')} title="Send to Back" className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex justify-center text-gray-700 dark:text-gray-200 transition-colors"><ArrowDownToLine size={16} /></button>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-1 text-gray-800 dark:text-gray-200">
                  <button onClick={() => addFrame('16:9')} className="text-xs py-1.5 rounded-lg border border-gray-500/30 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium">+ 16:9 Frame</button>
                  <button onClick={() => addFrame('1:1')} className="text-xs py-1.5 rounded-lg border border-gray-500/30 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium">+ 1:1 Frame</button>
               </div>
            </div>

            {/* Actions - Single line icons */}
            <div className="p-2 rounded-2xl flex flex-row items-center justify-around shadow-lg" style={{ background: glassBg, border: `1px solid ${glassBorder}`, backdropFilter: 'blur(20px)' }}>
               <button onClick={handleSaveProjectInternal} title="Save Project" className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95" style={{ color: textPrimary }}>
                  <Save size={18} />
               </button>
               <button onClick={handleExportPNG} title="Export PNG" className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95" style={{ color: textPrimary }}>
                  <ImageIcon size={18} />
               </button>
               <button onClick={handleExportPDF} title="Export PDF" className="p-2 rounded-xl transition-all active:scale-95 shadow-md" style={{ background: 'linear-gradient(135deg,#4ade80,#22d3ee)', color: '#080812' }}>
                  <Download size={18} />
               </button>
            </div>
          </div>
        </div>
  );
}
