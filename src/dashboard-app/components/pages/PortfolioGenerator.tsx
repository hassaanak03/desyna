import {
  useState, useRef, useEffect, useMemo, useCallback,
  DragEvent, ChangeEvent,
} from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, LayoutGrid, List, AlignLeft, AlignCenter, AlignRight,
  X, Tag, Filter, Maximize2, Sparkles, Save, FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db, auth } from '../../../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router';
import { useProjects } from '../../context/ProjectContext';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedImage {
  id: string;
  src: string;
  title: string;
  width: number;
  height: number;
  aspectRatio: number;
  category: string;
}

type LayoutMode = 'Masonry' | 'Grid' | 'List';
type Alignment = 'left' | 'center' | 'right';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['UI Design', 'Branding', 'Mockup', 'Photography', 'Illustration', 'Web Design', 'Motion'];
const ALL_CATS = ['All', ...CATEGORIES];

// Demo seed images with varied real-world aspect ratios
const DEMO_IMAGES: UploadedImage[] = [
  {
    id: 'd1', title: 'Phoenix Rebrand', category: 'Branding', width: 1600, height: 900, aspectRatio: 16 / 9,
    src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd2', title: 'Pulse UI System', category: 'UI Design', width: 900, height: 1200, aspectRatio: 3 / 4,
    src: 'https://images.unsplash.com/photo-1767449280971-46e438b1ce4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd3', title: 'Aurora Design System', category: 'UI Design', width: 1200, height: 900, aspectRatio: 4 / 3,
    src: 'https://images.unsplash.com/photo-1764268602042-88b05a211378?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd4', title: 'Nova Typography', category: 'Branding', width: 900, height: 900, aspectRatio: 1,
    src: 'https://images.unsplash.com/photo-1669909625629-c341fa2d2822?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd5', title: 'Brand Identity Kit', category: 'Branding', width: 1600, height: 1000, aspectRatio: 1.6,
    src: 'https://images.unsplash.com/photo-1769984867572-10dea95bd4f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd6', title: 'Presentation Deck', category: 'Web Design', width: 1600, height: 900, aspectRatio: 16 / 9,
    src: 'https://images.unsplash.com/photo-1771814591138-6aaab1bce775?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd7', title: 'Social Slides', category: 'Illustration', width: 900, height: 1200, aspectRatio: 3 / 4,
    src: 'https://images.unsplash.com/photo-1689852501130-e89d9e54aa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
  {
    id: 'd8', title: 'Motion Reel', category: 'Motion', width: 1200, height: 675, aspectRatio: 16 / 9,
    src: 'https://images.unsplash.com/photo-1765758014805-a7a6cc272982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  },
];

// ─── Masonry Algorithm ────────────────────────────────────────────────────────

interface MasonryItem { img: UploadedImage; x: number; y: number; w: number; h: number; }

function computeMasonry(
  images: UploadedImage[],
  containerW: number,
  cols: number,
  gap: number,
): { items: MasonryItem[]; totalH: number } {
  if (!containerW || !images.length) return { items: [], totalH: 0 };
  const colW = (containerW - gap * (cols - 1)) / cols;
  const heights = Array(cols).fill(0);
  const items = images.map(img => {
    const col = heights.indexOf(Math.min(...heights));
    const h = colW / img.aspectRatio;
    const item = { img, x: col * (colW + gap), y: heights[col], w: colW, h };
    heights[col] += h + gap;
    return item;
  });
  return { items, totalH: Math.max(...heights) - gap };
}

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBg({ isDark }: { isDark: boolean }) {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes pg1{0%,100%{transform:translate(0,0) scale(1);opacity:.8}40%{transform:translate(6%,-10%) scale(1.2);opacity:1}75%{transform:translate(-4%,6%) scale(.9);opacity:.65}}
        @keyframes pg2{0%,100%{transform:translate(0,0) scale(1);opacity:.7}35%{transform:translate(-9%,9%) scale(1.15);opacity:.95}70%{transform:translate(5%,-5%) scale(.88);opacity:.6}}
        @keyframes pg3{0%,100%{transform:translate(0,0) scale(1);opacity:.6}50%{transform:translate(4%,10%) scale(1.22);opacity:.82}}
      `}</style>
      <div style={{ position: 'absolute', inset: 0, background: isDark ? '#08080f' : '#f0f0fa', transition: 'background .6s' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: isDark ? 'radial-gradient(circle,rgba(255,255,255,0.13) 1px,transparent 1px)' : 'radial-gradient(circle,rgba(0,0,0,0.1) 1px,transparent 1px)', backgroundSize: '40px 40px', opacity: .4 }} />
      <div style={{ position: 'absolute', width: '72%', height: '72%', top: '-16%', left: '-12%', borderRadius: '50%', background: isDark ? 'radial-gradient(ellipse,rgba(74,222,128,0.32) 0%,rgba(34,197,94,0.12) 40%,transparent 68%)' : 'radial-gradient(ellipse,rgba(74,222,128,0.12) 0%,transparent 68%)', animation: 'pg1 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: '68%', height: '68%', top: '-6%', right: '-16%', borderRadius: '50%', background: isDark ? 'radial-gradient(ellipse,rgba(139,92,246,0.32) 0%,rgba(167,139,250,0.1) 40%,transparent 68%)' : 'radial-gradient(ellipse,rgba(139,92,246,0.1) 0%,transparent 68%)', animation: 'pg2 18s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: '60%', height: '60%', bottom: '-6%', left: '22%', borderRadius: '50%', background: isDark ? 'radial-gradient(ellipse,rgba(59,130,246,0.26) 0%,rgba(34,211,238,0.08) 40%,transparent 68%)' : 'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 68%)', animation: 'pg3 22s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, background: isDark ? 'radial-gradient(ellipse at 50% 40%,transparent 28%,rgba(0,0,0,0.65) 100%)' : 'radial-gradient(ellipse at 50% 40%,transparent 28%,rgba(200,200,230,0.45) 100%)' }} />
    </div>
  );
}

// ─── Image Card (with hover overlay) ─────────────────────────────────────────

interface CardProps { img: UploadedImage; onRemove: (id: string) => void; onCategoryChange: (id: string, cat: string) => void; onTitleChange: (id: string, t: string) => void; isDark: boolean; }

function ImageCard({ img, onRemove, onCategoryChange, onTitleChange, isDark }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(img.title);
  const tm = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,46,0.5)';

  return (
    <div
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', width: '100%', height: '100%', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setCatMenuOpen(false); }}
    >
      <img src={img.src} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .4s ease', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />

      {/* Hover Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.12) 100%)',
        backdropFilter: hovered ? 'blur(2px)' : 'blur(0px)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity .3s ease, backdrop-filter .3s ease',
      }} />

      {/* Bottom info (always overlay gradient, text appears on hover) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity .3s ease',
      }}>
        {editingTitle ? (
          <input
            autoFocus
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            onBlur={() => { onTitleChange(img.id, localTitle); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onTitleChange(img.id, localTitle); setEditingTitle(false); } }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.5)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 600, outline: 'none', width: '100%',
            }}
          />
        ) : (
          <p onClick={() => setEditingTitle(true)} style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, margin: 0, cursor: 'text' }}>
            {img.title}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.76rem', margin: '3px 0 0', fontFamily: 'Inter, sans-serif' }}>Husnain</p>
      </div>

      {/* Top controls on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}
          >
            {/* Category pill */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setCatMenuOpen(v => !v); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999,
                  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: '0.68rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer',
                }}
              >
                <Tag size={10} /> {img.category}
              </button>
              {catMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 150,
                  background: isDark ? 'rgba(10,10,22,0.98)' : 'rgba(255,255,255,0.98)',
                  border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12,
                  backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 10, overflow: 'hidden', padding: '4px',
                }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={e => { e.stopPropagation(); onCategoryChange(img.id, cat); setCatMenuOpen(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 8,
                        color: cat === img.category ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#fff' : '#1a1a2e'),
                        background: cat === img.category ? (isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.06)') : 'transparent',
                        fontSize: '0.78rem', cursor: 'pointer', border: 'none',
                      }}
                    >{cat}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Delete */}
            <button
              onClick={e => { e.stopPropagation(); onRemove(img.id); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar Slider ───────────────────────────────────────────────────────────

function Slider({ label, value, min, max, unit = '', color, onChange }: { label: string; value: number; min: number; max: number; unit?: string; color: string; onChange: (v: number) => void; }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: color }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortfolioGenerator() {
  const { isDark } = useTheme();
  const location = useLocation();
  const { handleSaveProject: contextSaveProject } = useProjects();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // ── State ──
  const [images, setImages] = useState<UploadedImage[]>(DEMO_IMAGES);
  const [layout, setLayout] = useState<LayoutMode>('Masonry');
  const [columns, setColumns] = useState(3);
  const [spacing, setSpacing] = useState(14);
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [containerW, setContainerW] = useState(900);
  const [isAllAssetsLoaded, setIsAllAssetsLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Theme tokens ──
  const glassBg = isDark ? 'rgba(12,12,24,0.88)' : 'rgba(255,255,255,0.88)';
  const gb = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
  const tp = isDark ? '#fff' : '#1a1a2e';
  const tm = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)';
  const ib = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const sb = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';

  // ── Filtered images ──
  const filtered = activeCategory === 'All' ? images : images.filter(i => i.category === activeCategory);

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
          const projectState = data.projectData || data.state; // Support both for migration
          if (projectState) {
            if (projectState.images) setImages(projectState.images);
            if (projectState.layout) setLayout(projectState.layout);
            if (projectState.columns) setColumns(projectState.columns);
            if (projectState.spacing) setSpacing(projectState.spacing);
            if (projectState.alignment) setAlignment(projectState.alignment);
            if (projectState.activeCategory) setActiveCategory(projectState.activeCategory);
          }
          setCurrentProjectId(state.projectId!);
        }
      } catch (err) {
        console.error("Error loading project:", err);
        toast.error("Failed to load project.");
      }
    };
    loadProject();
  }, [location.state]);

  // ── Measure container width for masonry ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Masonry layout data ──
  const [masonry, setMasonry] = useState<{ items: MasonryItem[]; totalH: number }>({ items: [], totalH: 0 });

  useEffect(() => {
    setMasonry(computeMasonry(filtered, containerW, columns, spacing));
  }, [filtered, containerW, columns, spacing]);

  // Asset Loading Check
  useEffect(() => {
    const checkAssets = async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const promises = imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all([...promises, document.fonts.ready]);
      setIsAllAssetsLoaded(true);
    };
    checkAssets();
  }, [images, activeCategory]);

  // ── Guess Category ──
  const guessCategory = (filename: string) => {
    const name = filename.toLowerCase();
    if (name.includes('brand') || name.includes('logo')) return 'Branding';
    if (name.includes('mockup')) return 'Mockup';
    if (name.includes('photo') || name.includes('cam')) return 'Photography';
    if (name.includes('web') || name.includes('site') || name.includes('page') || name.includes('land')) return 'Web Design';
    if (name.includes('motion') || name.includes('video') || name.includes('anim')) return 'Motion';
    if (name.includes('illustrat') || name.includes('draw') || name.includes('art') || name.includes('sketch')) return 'Illustration';
    return 'UI Design';
  };

  // ── File processing ──
  const processFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedSrc = canvas.toDataURL('image/webp', 0.75);
            const ar = width / height;
            const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            const guessedCategory = guessCategory(title);
            setImages(prev => [...prev, {
              id: crypto.randomUUID(),
              src: compressedSrc,
              title,
              width,
              height,
              aspectRatio: ar || 1,
              category: guessedCategory,
            }]);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDropUpload = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => setImages(p => p.filter(i => i.id !== id));
  const changeCat = (id: string, cat: string) => setImages(p => p.map(i => i.id === id ? { ...i, category: cat } : i));
  const changeTitle = (id: string, t: string) => setImages(p => p.map(i => i.id === id ? { ...i, title: t } : i));

  // ── Drag and Drop Reordering ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDropReorder = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      setImages(prev => {
        const srcIdx = prev.findIndex(img => img.id === sourceId);
        const tgtIdx = prev.findIndex(img => img.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1) return prev;
        const newImgs = [...prev];
        const [moved] = newImgs.splice(srcIdx, 1);
        newImgs.splice(tgtIdx, 0, moved);
        return newImgs;
      });
    }
  };

  // ── Export PDF (The Ultimate Failsafe) ──
  const handleExportPDF = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    const element = canvasRef.current;

    try {
      // 1. Final Safety Wait for Rendering/Fonts
      await new Promise(resolve => setTimeout(resolve, 1000));
      await document.fonts.ready;

      // 2. High-Res DOM Capture
      const canvas = await html2canvas(element, {
        scale: 3, // High scale for professional crispness
        useCORS: true,
        allowTaint: false, // Strict policy to prevent security blocks
        backgroundColor: isDark ? '#08080f' : '#f0f0fa',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[ref="canvasRef"]') as HTMLElement;
          if (el) el.style.transform = 'none';
        }
      });

      // 3. Generate PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if needed
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`portfolio-${Date.now()}.pdf`);

    } catch (err) {
      console.error("PDF Generation Error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Listen for navbar export event ──
  useEffect(() => {
    const h = () => handleExportPDF();
    document.addEventListener('portfolio-export', h);
    return () => document.removeEventListener('portfolio-export', h);
  }, [handleExportPDF]);

  const handleSaveProject = async () => {
    try {
      const state = {
        images, layout, columns, spacing, alignment, activeCategory
      };
      const id = await contextSaveProject(
        currentProjectId,
        'Portfolio Layout',
        state,
        images.length > 0 ? images[images.length - 1].src : '', // Use recent image as preview
        'Portfolio'
      );
      if (id) {
        setCurrentProjectId(id);
        toast.success('Portfolio layout saved successfully!');
      } else {
        throw new Error('Failed to save project');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      toast.error('Failed to save project.');
    }
  };

  // ── Sidebar label style ──
  const sLabel = (color: string) => ({
    fontSize: '0.68rem', fontWeight: 600 as const, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const, color, marginBottom: 10, display: 'block',
  });

  // ── Alignment CSS value ──
  const alignValue = alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', position: 'relative' }}>

      {/* Background */}
      <AuroraBg isDark={isDark} />

      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <aside style={{
        width: 284, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative', zIndex: 2,
        background: glassBg, borderRight: `1px solid ${gb}`,
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        transition: 'all .5s ease',
      }}>
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Sparkles size={14} style={{ color: isDark ? '#a78bfa' : '#7c3aed' }} />
              <span style={{ color: tp, fontWeight: 600, fontSize: '0.9rem' }}>Portfolio Settings</span>
            </div>
            <p style={{ color: tm, fontSize: '0.73rem' }}>Customize your portfolio layout</p>
          </div>

          <div style={{ height: 1, background: gb }} />

          {/* Layout Mode */}
          <div style={{ background: sb, border: `1px solid ${gb}`, borderRadius: 14, padding: '14px 16px' }}>
            <span style={sLabel(isDark ? '#60a5fa' : '#2563eb')}>Layout Mode</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {(['Masonry', 'Grid', 'List'] as LayoutMode[]).map(m => (
                <button key={m} onClick={() => setLayout(m)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                    background: m === layout ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(37,99,235,0.1)') : ib,
                    border: m === layout ? '1px solid rgba(96,165,250,0.45)' : `1px solid ${gb}`,
                    color: m === layout ? (isDark ? '#60a5fa' : '#2563eb') : tm,
                    transition: 'all .3s',
                  }}
                >
                  {m === 'Masonry' && <Maximize2 size={14} />}
                  {m === 'Grid' && <LayoutGrid size={14} />}
                  {m === 'List' && <List size={14} />}
                  <span style={{ fontSize: '0.72rem', fontWeight: m === layout ? 600 : 400 }}>{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Columns + Spacing */}
          <div style={{ background: sb, border: `1px solid ${gb}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Columns */}
            <div>
              <span style={sLabel(isDark ? '#4ade80' : '#16a34a')}>Columns</span>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setColumns(n)}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: n === columns ? (isDark ? 'rgba(74,222,128,0.18)' : 'rgba(22,163,74,0.1)') : ib,
                      border: n === columns ? '1px solid rgba(74,222,128,0.45)' : `1px solid ${gb}`,
                      color: n === columns ? (isDark ? '#4ade80' : '#16a34a') : tm,
                      transition: 'all .25s',
                    }}
                  >{n}</button>
                ))}
              </div>
              <Slider label="" value={columns} min={1} max={4} color={isDark ? '#4ade80' : '#16a34a'} onChange={setColumns} />
            </div>

            {/* Spacing */}
            <Slider label="Spacing" value={spacing} min={0} max={40} unit="px" color={isDark ? '#a78bfa' : '#7c3aed'} onChange={setSpacing} />
          </div>

          {/* Alignment */}
          <div style={{ background: sb, border: `1px solid ${gb}`, borderRadius: 14, padding: '14px 16px' }}>
            <span style={sLabel(isDark ? '#f472b6' : '#db2777')}>Alignment</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { a: 'left' as Alignment, icon: <AlignLeft size={15} /> },
                { a: 'center' as Alignment, icon: <AlignCenter size={15} /> },
                { a: 'right' as Alignment, icon: <AlignRight size={15} /> },
              ]).map(({ a, icon }) => (
                <button key={a} onClick={() => setAlignment(a)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: a === alignment ? (isDark ? 'rgba(244,114,182,0.18)' : 'rgba(219,39,119,0.1)') : ib,
                    border: a === alignment ? '1px solid rgba(244,114,182,0.45)' : `1px solid ${gb}`,
                    color: a === alignment ? '#f472b6' : tm,
                    transition: 'all .3s',
                  }}
                >{icon}</button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ background: sb, border: `1px solid ${gb}`, borderRadius: 14, padding: '14px 16px' }}>
            <span style={sLabel(isDark ? '#fbbf24' : '#d97706')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Filter size={11} /> Category Filter</span>
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALL_CATS.map(cat => {
                const count = cat === 'All' ? images.length : images.filter(i => i.category === cat).length;
                const active = cat === activeCategory;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      background: active ? (isDark ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.08)') : 'transparent',
                      border: active ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
                      color: active ? (isDark ? '#fbbf24' : '#d97706') : tm,
                      fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                      transition: 'all .25s',
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{ fontSize: '0.7rem', opacity: .7 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 2 }}>

        {/* Page header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', flexShrink: 0,
          background: glassBg, borderBottom: `1px solid ${gb}`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          transition: 'all .5s ease',
        }}>
          <div>
            <h2 style={{ color: tp, fontSize: '1.05rem', fontWeight: 600 }}>Portfolio Generator</h2>
            <p style={{ color: tm, fontSize: '0.73rem', marginTop: 2 }}>
              {filtered.length} project{filtered.length !== 1 ? 's' : ''} · {layout} layout · {columns} col{columns !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || !isAllAssetsLoaded}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', border: 'none', color: '#fff', boxShadow: '0 4px 12px rgba(167,139,250,0.3)' }}
            >
              <FileText size={14} /> {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button onClick={handleSaveProject} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: glassBg, border: `1px solid ${gb}`, color: tp, boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
              <Save size={14} /> Save
            </button>
          </div>
        </div>

        {/* Scrollable canvas area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 36px' }}>

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDropUpload}
            style={{
              borderRadius: 16, border: `2px dashed ${isDragging ? (isDark ? '#4ade80' : '#16a34a') : gb}`,
              background: isDragging ? (isDark ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.05)') : sb,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
              padding: '20px 24px', marginBottom: 22, cursor: 'pointer',
              transition: 'all .3s ease',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDragging ? (isDark ? 'rgba(74,222,128,0.2)' : 'rgba(22,163,74,0.12)') : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
              transition: 'background .3s',
            }}>
              <Upload size={20} style={{ color: isDragging ? (isDark ? '#4ade80' : '#16a34a') : tm }} />
            </div>
            <div>
              <p style={{ color: isDragging ? (isDark ? '#4ade80' : '#16a34a') : tp, fontWeight: 600, fontSize: '0.9rem', margin: 0, transition: 'color .3s' }}>
                {isDragging ? 'Drop to add images' : 'Drop images here or click to upload'}
              </p>
              <p style={{ color: tm, fontSize: '0.75rem', margin: '4px 0 0' }}>
                PNG, JPG, WEBP, SVG · Aspect ratio auto-detected · Click image to rename
              </p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {/* Canvas */}
          <div ref={canvasRef}>

            {/* ── Masonry ── */}
            {layout === 'Masonry' && (
              <div ref={containerRef} style={{ position: 'relative', minHeight: 300, transition: 'height .4s ease', height: masonry.totalH || 'auto', justifyContent: alignValue }}>
                {masonry.items.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tm, fontSize: '0.88rem' }}>
                    No images for this category
                  </div>
                )}
                {masonry.items.map(({ img, x, y, w, h }) => (
                  <div key={img.id} 
                    draggable
                    onDragStart={e => handleDragStart(e, img.id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropReorder(e, img.id)}
                    style={{
                    position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${gb}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'left .5s cubic-bezier(.4,0,.2,1), top .5s cubic-bezier(.4,0,.2,1), width .5s cubic-bezier(.4,0,.2,1), height .5s cubic-bezier(.4,0,.2,1)',
                  }}>
                    <ImageCard img={img} onRemove={removeImage} onCategoryChange={changeCat} onTitleChange={changeTitle} isDark={isDark} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Grid ── */}
            {layout === 'Grid' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${spacing}px`,
                justifyItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'end' : 'start',
                transition: 'all .4s ease',
              }}>
                {filtered.length === 0 && (
                  <div style={{ gridColumn: `span ${columns}`, textAlign: 'center', color: tm, padding: '60px 0', fontSize: '0.88rem' }}>
                    No images for this category
                  </div>
                )}
                {filtered.map(img => (
                  <div key={img.id} 
                    draggable
                    onDragStart={e => handleDragStart(e, img.id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropReorder(e, img.id)}
                    style={{
                    width: '100%', aspectRatio: `${img.aspectRatio}`,
                    borderRadius: 14, overflow: 'hidden', border: `1px solid ${gb}`,
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'all .4s ease',
                  }}>
                    <ImageCard img={img} onRemove={removeImage} onCategoryChange={changeCat} onTitleChange={changeTitle} isDark={isDark} />
                  </div>
                ))}
              </div>
            )}

            {/* ── List ── */}
            {layout === 'List' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing}px` }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', color: tm, padding: '60px 0', fontSize: '0.88rem' }}>No images for this category</div>
                )}
                {filtered.map(img => (
                  <motion.div key={img.id}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, img.id)}
                    onDragOver={(e: any) => handleDragOver(e)}
                    onDrop={(e: any) => handleDropReorder(e, img.id)}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                      borderRadius: 16, border: `1px solid ${gb}`,
                      background: glassBg, backdropFilter: 'blur(16px)',
                      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
                      justifyContent: alignValue, transition: 'all .4s ease',
                    }}
                  >
                    <img src={img.src} alt={img.title} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: `1px solid ${gb}` }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: tp, fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>{img.title}</p>
                      <p style={{ color: tm, fontSize: '0.75rem', margin: '3px 0 0' }}>Husnain</p>
                    </div>
                    <span style={{
                      padding: '3px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 500,
                      background: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.08)',
                      color: isDark ? '#60a5fa' : '#2563eb', border: `1px solid ${isDark ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)'}`,
                    }}>
                      {img.category}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => removeImage(img.id)}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: ib, border: `1px solid ${gb}`, color: tm, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}