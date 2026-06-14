/// <reference types="vite/client" />
import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { useLocation } from 'react-router';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Download, Sparkles, ChevronDown, X,
  FileText, Code, Braces, Upload, Shuffle, Settings2, Bot, ArrowRight, Image as ImageIcon,
  Palette, Save, RefreshCw, Layers, ChevronLeft
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db, auth } from '../../../firebase';
import { useNavigate } from 'react-router';
import { useProjects } from '../../context/ProjectContext';
import { toast } from 'sonner';
import * as htmlToImage from 'html-to-image';

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const c = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return null;
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function getLuminance(r: number, g: number, b: number): number {
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function getContrastInfo(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const L = getLuminance(...rgb);
  const vsWhite = 1.05 / (L + 0.05);
  const vsBlack = (L + 0.05) / 0.05;
  const ratio = +(Math.max(vsWhite, vsBlack).toFixed(1));
  if (ratio >= 7) return { ratio, level: 'AAA', bg: '#22c55e', fg: '#fff' };
  if (ratio >= 4.5) return { ratio, level: 'AA', bg: '#f59e0b', fg: '#080812' };
  if (ratio >= 3) return { ratio, level: 'A', bg: '#f97316', fg: '#fff' };
  return { ratio, level: 'Fail', bg: '#ef4444', fg: '#fff' };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const toBase64 = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) return url;
  try {
    const proxy = 'https://api.allorigins.win/raw?url=';
    const resp = await fetch(proxy + encodeURIComponent(url));
    if (!resp.ok) throw new Error('Proxy fetch failed');
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Base64 conversion failed:', e);
    return TRANSPARENT_PIXEL;
  }
};

async function getBase64Image(url: string): Promise<string> {
  return toBase64(url);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColorItem { hex: string; name: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  'Instrument Serif', 'Inter', 'Playfair Display', 'Montserrat',
  'Raleway', 'Lato', 'Poppins', 'DM Sans', 'Space Grotesk', 'Roboto', 'Pacifico',
  'Cinzel', 'Oswald', 'Bebas Neue', 'Dancing Script', 'Lobster', 'Abril Fatface', 'Righteous', 'Permanent Marker', 'Courgette'
];

const SCHEME_OPTIONS = ['Complementary', 'Analogous', 'Triadic', 'Monochromatic', 'Split-Comp'];

const DEFAULT_COLORS: ColorItem[] = [
  { hex: '#ff9900', name: 'Primary' },
  { hex: '#6d3b00', name: 'Secondary' },
  { hex: '#ffffff', name: 'Accent' },
];

// ─── Font Dropdown ────────────────────────────────────────────────────────────

interface FDProps {
  value: string; onChange: (v: string) => void;
  open: boolean; setOpen: (v: boolean) => void; label: string;
  isDark: boolean; tp: string; tm: string; ib: string; gb: string;
}

function FontDropdown({ value, onChange, open, setOpen, label, isDark, tp, tm, ib, gb }: FDProps) {
  return (
    <div className="relative">
      <label className="block text-xs mb-1.5" style={{ color: tm }}>{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
        style={{ background: ib, border: `1px solid ${gb}`, color: tp, cursor: 'pointer', transition: 'all 0.4s ease' }}
      >
        <span style={{ fontFamily: `'${value}', sans-serif` }}>{value}</span>
        <ChevronDown size={12} style={{ color: tm, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 py-1"
            style={{ background: isDark ? 'rgba(10,10,22,0.98)' : 'rgba(255,255,255,0.98)', border: `1px solid ${gb}`, backdropFilter: 'blur(24px)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', maxHeight: 200, overflowY: 'auto' }}
          >
            {FONT_OPTIONS.map(f => (
              <button key={f} onClick={() => { onChange(f); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm"
                style={{
                  color: f === value ? (isDark ? '#4ade80' : '#16a34a') : tp,
                  background: f === value ? (isDark ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.06)') : 'transparent',
                  fontFamily: `'${f}', sans-serif`, cursor: 'pointer',
                }}
              >{f}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrandKitGenerator() {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';

  // Sidebar Tabs: 'config' | 'ai'
  const [activeTab, setActiveTab] = useState<'config' | 'ai'>('config');

  // AI Agent State
  const [aiBrandName, setAiBrandName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlogan, setAiSlogan] = useState('');
  const [aiAutoSlogan, setAiAutoSlogan] = useState(true);
  const [aiWebsiteType, setAiWebsiteType] = useState('E-commerce');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Image Prompt
  const [brandVibePrompt, setBrandVibePrompt] = useState('');
  const [isFetchingImages, setIsFetchingImages] = useState(false);

  // Brand Kit State
  const [primaryFont, setPrimaryFont] = useState(() => localStorage.getItem('brand-kit-primaryFont') || 'Pacifico');
  const [secondaryFont, setSecondaryFont] = useState(() => localStorage.getItem('brand-kit-secondaryFont') || 'Montserrat');
  const [colors, setColors] = useState<ColorItem[]>(() => {
    const saved = localStorage.getItem('brand-kit-colors');
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });
  const [newHex, setNewHex] = useState('#');
  const [newName, setNewName] = useState('');
  const [primaryFontOpen, setPrimaryFontOpen] = useState(false);
  const [secondaryFontOpen, setSecondaryFontOpen] = useState(false);
  const [logoStyle, setLogoStyle] = useState(() => localStorage.getItem('brand-kit-logoStyle') || 'Bold');
  const [scheme, setScheme] = useState(() => localStorage.getItem('brand-kit-scheme') || 'Triadic');
  const [paletteName, setPaletteName] = useState(() => localStorage.getItem('brand-kit-paletteName') || 'Borcelle Bakery');
  const [brandSlogan, setBrandSlogan] = useState(() => localStorage.getItem('brand-kit-slogan') || 'Freshly Baked, Lovingly Made.');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(() => localStorage.getItem('brand-kit-logo') || null);
  const [templateId, setTemplateId] = useState(() => localStorage.getItem('brand-kit-templateId') || 'classic');

  // Poster Layout State - Every Single Box
  const [posterColors, setPosterColors] = useState<{
    header: string,
    leftBox: string,
    rightBox: string,
    bottomSection: string,
    moodboardBg: string,
    pattern: string
  }>(() => {
    const saved = localStorage.getItem('brand-kit-posterColors');
    return saved ? JSON.parse(saved) : {
      header: '#ff9900',
      leftBox: '#ffffff',
      rightBox: '#6d3b00',
      bottomSection: '#ffffff',
      moodboardBg: '#ffffff',
      pattern: '#ffffff'
    };
  });

  // Main area state
  const [moodImages, setMoodImages] = useState<(string | null)[]>(() => {
    const saved = localStorage.getItem('brand-kit-moodImages');
    return saved ? JSON.parse(saved) : Array(6).fill(null);
  });
  const [draggingOver, setDraggingOver] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // AI Palette State
  const [aiPalettes, setAiPalettes] = useState<{ name: string, colors: ColorItem[] }[]>([]);
  const [isFetchingPalettes, setIsFetchingPalettes] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isAllAssetsLoaded, setIsAllAssetsLoaded] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const glassBg = isDark ? 'rgba(14,14,26,0.93)' : 'rgba(255,255,255,0.93)';
  const gb = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tp = isDark ? '#fff' : '#1a1a2e';
  const tm = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.45)';
  const sb = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
  const ib = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const hdrBg = isDark ? 'rgba(8,8,18,0.65)' : 'rgba(248,248,255,0.85)';

  const pc = colors[0]?.hex || '#ff9900';
  const ac = colors[2]?.hex || '#ffffff';

  const sectionCard = {
    background: sb, border: `1px solid ${gb}`,
    borderRadius: 16, padding: '18px 20px',
    transition: 'all 0.5s ease',
  };

  const label = (color: string) => ({
    fontSize: '0.7rem', fontWeight: 600 as const,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color, marginBottom: 14, display: 'block',
  });

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Project Loading ──────────────────────────────────────────────────────
  useEffect(() => {
    const state = location.state as { projectId?: string } | null;
    if (!state?.projectId) return;

    const loadProject = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'projects', state.projectId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const projectData = data.projectData || data; // Context uses projectData, legacy used top-level

          if (projectData.paletteName) setPaletteName(projectData.paletteName);
          if (projectData.colors) setColors(projectData.colors);
          if (projectData.posterColors) setPosterColors(projectData.posterColors);
          if (projectData.primaryFont) setPrimaryFont(projectData.primaryFont);
          if (projectData.secondaryFont) setSecondaryFont(projectData.secondaryFont);
          if (projectData.logoStyle) setLogoStyle(projectData.logoStyle);
          if (projectData.scheme) setScheme(projectData.scheme);
          if (projectData.brandSlogan) setBrandSlogan(projectData.brandSlogan);
          if (projectData.moodImages) setMoodImages(projectData.moodImages);
          if (projectData.templateId) setTemplateId(projectData.templateId);
          if (projectData.logo) setUploadedLogo(projectData.logo);

          setCurrentProjectId(state.projectId!);
        }
      } catch (err) {
        console.error("Error loading project:", err);
        toast.error("Failed to load project.");
      }
    };
    loadProject();
  }, [location.state]);

  useEffect(() => {
    try {
      localStorage.setItem('brand-kit-primaryFont', primaryFont);
      localStorage.setItem('brand-kit-secondaryFont', secondaryFont);
      localStorage.setItem('brand-kit-colors', JSON.stringify(colors));
      localStorage.setItem('brand-kit-posterColors', JSON.stringify(posterColors));
      localStorage.setItem('brand-kit-logoStyle', logoStyle);
      localStorage.setItem('brand-kit-scheme', scheme);
      localStorage.setItem('brand-kit-paletteName', paletteName);
      localStorage.setItem('brand-kit-slogan', brandSlogan);
      if (uploadedLogo && !uploadedLogo.startsWith('data:')) localStorage.setItem('brand-kit-logo', uploadedLogo);

      const imagesToSave = moodImages.map(img => (img && img.startsWith('data:')) ? null : img);
      localStorage.setItem('brand-kit-moodImages', JSON.stringify(imagesToSave));

      localStorage.setItem('brand-kit-templateId', templateId);
    } catch (e) {
      console.warn('Failed to save state to localStorage (likely quota issue).', e);
    }
  }, [primaryFont, secondaryFont, colors, posterColors, logoStyle, scheme, paletteName, brandSlogan, uploadedLogo, moodImages]);

  // Inject Fonts
  useEffect(() => {
    const fonts = [primaryFont, secondaryFont].map(f => f.replace(/\s+/g, '+')).join('&family=');
    const id = `google-fonts-brandkit`;
    let link = document.getElementById(id) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@400;500;600;700&display=swap`;
  }, [primaryFont, secondaryFont]);

  const fetchAndConvertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Fetch failed');
      }
      const blobData = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Read error'));
        reader.readAsDataURL(blobData);
      });
    } catch (err) {
      console.error('Failed to convert image:', err);
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  };

  useEffect(() => {
    const checkAssets = async () => {
      let needsConversion = false;
      const convertedImages = await Promise.all(moodImages.map(async (img) => {
        if (img && img.startsWith('http')) {
          needsConversion = true;
          return await fetchAndConvertImageToBase64(img);
        }
        return img;
      }));

      if (needsConversion) {
        setMoodImages(convertedImages);
        return;
      }

      const imgs = Array.from(previewRef.current?.querySelectorAll('img') || []);
      const promises = imgs.map(img => {
        if (img.src && img.src.startsWith('http')) {
          return fetchAndConvertImageToBase64(img.src).then(b64 => { img.src = b64; });
        }
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = () => {
            fetchAndConvertImageToBase64('https://picsum.photos/400/400').then(b64 => {
              img.src = b64;
              resolve(null);
            });
          };
        });
      });
      await Promise.all([...promises, document.fonts.ready]);
      setIsAllAssetsLoaded(true);
    };
    checkAssets();
  }, [moodImages, uploadedLogo, paletteName]);

  // ── AI Generation Logic ───────────────────────────────────────────────────
  const handleGenerateAI = async () => {
    if (!aiBrandName || !aiPrompt) {
      setAiError('Brand Name and Description are required.');
      return;
    }
    setIsGenerating(true);
    setAiError(null);

    if (!GROQ_API_KEY) {
      setAiError('API Key is missing.');
      setIsGenerating(false);
      return;
    }

    const systemMessage = `You are an expert brand identity designer. Return a JSON object with this exact structure:
{
  "slogan": "A catchy short slogan",
  "colors": [
    { "name": "Primary", "hex": "#..." },
    { "name": "Secondary", "hex": "#..." },
    { "name": "Accent", "hex": "#..." }
  ],
  "typography": {
    "primary": "Pacifico",
    "secondary": "Montserrat"
  },
  "moodboardPrompts": [
    "Aesthetic minimalist workspace matching the brand vibe", 
    "High-end brand identity detail shot", 
    "Modern architectural abstract with natural light", 
    "Premium texture and material detail shot",
    "Lifestyle photography representing the brand atmosphere",
    "Conceptual abstract art reflecting the brand essence"
  ]
}`;

    const userMessage = `Brand Name: ${aiBrandName}\nDescription: ${aiPrompt}\nSlogan: ${aiAutoSlogan ? 'Auto' : aiSlogan}\nType: ${aiWebsiteType}.
CRITICAL: Generate 6 diverse, premium, and aesthetic image prompts that capture the brand's unique "Vibe" and "Identity". No product mockups like shirts or mugs unless they are central to the brand's core product. Focus on atmosphere, textures, and style.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: userMessage }],
          response_format: { type: 'json_object' },
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stop: null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      setColors(parsed.colors);
      setPrimaryFont(parsed.typography.primary);
      setSecondaryFont(parsed.typography.secondary);
      setPaletteName(aiBrandName);
      setBrandSlogan(parsed.slogan);

      setActiveTab('config');
    } catch (err: any) {
      setAiError(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualRegenerateImages = async () => {
    const description = brandVibePrompt || aiPrompt || 'Modern and professional';
    setIsFetchingImages(true);

    if (!GROQ_API_KEY) {
      // Fallback to basic generation if no API key
      const basePrompts = [
        `Aesthetic minimalist workspace matching ${description}`,
        `High-end brand identity detail shot matching ${description}`,
        `Modern architectural abstract matching ${description}`,
        `Premium texture and material close up matching ${description}`,
        `Lifestyle photography representing the ${description} atmosphere`,
        `Conceptual abstract art reflecting the ${description} essence`
      ];
      setMoodImages(basePrompts.map(p =>
        `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=400&height=400&seed=${Math.floor(Math.random() * 1000)}&nologo=true`
      ));
      setIsFetchingImages(false);
      return;
    }

    const systemMessage = `You are a creative director. Based on the brand description, brainstorm 6 distinct, high-end visual prompts for a moodboard. Return raw JSON: { "prompts": ["prompt 1", "prompt 2", ...] }. Focus on textures, atmosphere, lighting, and lifestyle. NO MOCKUPS.`;

    try {
      console.log('Fetching AI visual prompts for:', description);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: `Brand Vibe: ${description}` }],
          response_format: { type: 'json_object' },
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stop: null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log('AI Prompts received:', content);

      const parsed = JSON.parse(content);
      const prompts = parsed.prompts || parsed.promptsList || [];

      if (prompts.length === 0) throw new Error('No prompts generated by AI');

      const newImageUrls = prompts.map((p: string) =>
        `https://pollinations.ai/p/${encodeURIComponent(p)}?width=400&height=400&seed=${Math.floor(Math.random() * 100000)}`
      );

      // Convert to Base64 for stability
      const b64Images = await Promise.all(newImageUrls.map(async (url: string) => {
        try {
          return await getBase64Image(url);
        } catch (e) {
          console.warn('Failed to convert image to base64:', url);
          return url;
        }
      }));

      console.log('Updating mood images with base64:', b64Images);
      setMoodImages(b64Images);
    } catch (err: any) {
      console.error('Image generation failed:', err);
      alert('Failed to fetch images: ' + err.message);
    } finally {
      setIsFetchingImages(false);
    }
  };

  const fetchAIPalettes = async () => {
    setIsFetchingPalettes(true);
    if (!GROQ_API_KEY) return setIsFetchingPalettes(false);

    const systemMessage = `Generate 3 stunning, modern 3-color palettes. Return raw JSON:
{
  "palettes": [
    { "name": "Name", "colors": [
      { "name": "Primary", "hex": "#..." }, 
      { "name": "Secondary", "hex": "#..." }, 
      { "name": "Accent 1", "hex": "#..." }, 
      { "name": "Accent 2", "hex": "#..." }, 
      { "name": "Background", "hex": "#..." }
    ] },
    ...
  ]
}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: `Brand: ${paletteName}. Description: ${aiPrompt || brandVibePrompt || 'Modern and sleek'}. Generate 5 colors for a complete brand kit.` }],
          response_format: { type: 'json_object' },
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stop: null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Groq Palette Error:', errorData);
        return;
      }
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      setAiPalettes(parsed.palettes);
    } catch (err) { console.error(err); } finally { setIsFetchingPalettes(false); }
  };

  const applyPalette = (paletteColors: ColorItem[]) => {
    setColors(paletteColors);
    // Smartly apply colors to 5 poster sections
    setPosterColors(prev => ({
      ...prev,
      header: paletteColors[0]?.hex || prev.header,
      rightBox: paletteColors[1]?.hex || prev.rightBox,
      leftBox: paletteColors[2]?.hex || prev.leftBox,
      bottomSection: paletteColors[3]?.hex || prev.bottomSection,
      moodboardBg: paletteColors[4]?.hex || prev.moodboardBg,
      pattern: paletteColors[0]?.hex || prev.pattern
    }));
  };

  const handleBulkPaste = (input: string) => {
    const hexRegex = /#([0-9a-fA-F]{3,6})/g;
    const matches = input.match(hexRegex);
    if (matches && matches.length > 0) {
      const newColors = matches.slice(0, 5).map((hex, i) => ({
        hex,
        name: i === 0 ? 'Primary' : i === 1 ? 'Secondary' : i === 2 ? 'Accent' : `Color ${i + 1}`
      }));
      applyPalette(newColors);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: add a toast or temporary tooltip
  };

  // ── Color handlers ────────────────────────────────────────────────────────
  const updateHex = (i: number, hex: string) => setColors(p => p.map((c, idx) => idx === i ? { ...c, hex } : c));
  const removeColor = (i: number) => setColors(p => p.filter((_, idx) => idx !== i));
  const randomizePalette = async () => {
    try {
      const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const res = await fetch(`https://www.thecolorapi.com/scheme?hex=${randomHex}&mode=triad&count=3`);
      const data = await res.json();
      const names = ['Primary', 'Secondary', 'Accent'];
      setColors(data.colors.slice(0, 3).map((c: any, i: number) => ({ hex: c.hex.value, name: names[i] || `Color ${i + 1}` })));
    } catch (err) { console.error(err); }
  };

  // ── Export handlers ──────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const handleExportCSS = () => {
    const hyphen = String.fromCharCode(45);
    const cssLines = colors.map((c, i) => `  ${hyphen}${hyphen}color${hyphen}${i + 1}: ${c.hex};`);
    downloadFile(`:root {\n${cssLines.join('\n')}\n}`, `brand_kit.css`, 'text/css');
  };
  const [isExporting, setIsExporting] = useState(false);


  const handleExportBrandKit = async (format: 'png' | 'pdf') => {
    if (!isAllAssetsLoaded) return;
    setIsExporting(true);

    const hyphen = String.fromCharCode(45);
    const nodeName = ['brand', 'kit', 'capture', 'area'].join(hyphen);
    const node = document.getElementById(nodeName);

    if (!node) {
      console.error("Capture area not found");
      setIsExporting(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await document.fonts.ready;

      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        style: {
          transform: 'none',
          boxShadow: 'none'
        }
      });

      if (format === 'pdf') {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const fileName = paletteName.replace(/\s+/g, '_').toLowerCase() + '_brand_kit.pdf';
        pdf.save(fileName);
        toast.success('Brand Kit exported as PDF!');
      } else {
        const link = document.createElement('a');
        const fileName = paletteName.replace(/\s+/g, '_').toLowerCase() + '_brand_kit.png';
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        toast.success('Brand Kit exported as PNG!');
      }
    } catch (error) {
      console.error("Manual Export Failed:", error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportOpen(false);
    }
  };

  const handleExportPNG = () => handleExportBrandKit('png');
  const handleExportPDF = () => handleExportBrandKit('pdf');
  const { handleSaveProject } = useProjects();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const handleSaveProjectInternal = async () => {
    try {
      const state = { paletteName, brandSlogan, colors, primaryFont, secondaryFont, posterColors, moodImages, uploadedLogo };
      const id = await handleSaveProject(currentProjectId, paletteName || 'Untitled Brand Kit', state, '', 'Brand Kit');
      if (id) setCurrentProjectId(id);
      toast.success('Brand Kit saved!');
    } catch (err) { toast.error('Failed to save.'); }
  };

  const handleBackNavigation = async () => {
    try {
      const state = { paletteName, brandSlogan, colors, primaryFont, secondaryFont, posterColors, moodImages, uploadedLogo };
      await handleSaveProject(currentProjectId, paletteName || 'Untitled Brand Kit', state);
    } catch (err) {
      console.error("Auto-save on back failed:", err);
    }
    navigate('/dashboard');
  };

  // ── Logo & Moodboard Handlers ─────────────────────────────────────────────
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = ev => setUploadedLogo(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };
  const handleMoodDrop = (idx: number, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDraggingOver(null);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = ev => setMoodImages(p => { const n = [...p]; n[idx] = ev.target?.result as string; return n; });
      r.readAsDataURL(f);
    }
  };
  const handleSlotClick = (idx: number) => { setActiveSlot(idx); fileInputRef.current?.click(); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && activeSlot !== null) {
      const r = new FileReader();
      r.onload = ev => setMoodImages(p => { const n = [...p]; n[activeSlot] = ev.target?.result as string; return n; });
      r.readAsDataURL(f);
    }
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* LEFT SIDEBAR */}
      <aside
        className="flex-shrink-0 flex flex-col overflow-y-auto"
        style={{ width: 340, background: glassBg, borderRight: `1px solid ${gb}`, backdropFilter: 'blur(24px)' }}
      >
        <div className="p-5 flex flex-col h-full">
          <div className="flex rounded-xl p-1 mb-6" style={{ background: ib, border: `1px solid ${gb}` }}>
            <button onClick={() => setActiveTab('config')} className="flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all" style={{ background: activeTab === 'config' ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent', color: activeTab === 'config' ? tp : tm }}>
              <Settings2 size={14} /> Manual Setup
            </button>
            <button onClick={() => setActiveTab('ai')} className="flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all" style={{ background: activeTab === 'ai' ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'transparent', color: activeTab === 'ai' ? '#fff' : tm }}>
              <Bot size={14} /> AI Generator
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {activeTab === 'ai' ? (
              <div className="space-y-4">
                <div>
                  <label style={{ color: tp, fontSize: '0.75rem', fontWeight: 600 }}>Brand Name</label>
                  <input value={aiBrandName} onChange={e => setAiBrandName(e.target.value)} placeholder="Borcelle Bakery" className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: ib, border: `1px solid ${gb}`, color: tp }} />
                </div>
                <div>
                  <label style={{ color: tp, fontSize: '0.75rem', fontWeight: 600 }}>Brand Vibe / Prompt</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="A warm, inviting bakery..." rows={3} className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: ib, border: `1px solid ${gb}`, color: tp }} />
                </div>
                <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff' }}>
                  {isGenerating ? 'Generating...' : <><Sparkles size={14} /> Generate Complete Kit</>}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div style={sectionCard}>
                  <span style={label(isDark ? '#60a5fa' : '#2563eb')}>Identity</span>
                  <div className="space-y-3">
                    <input value={paletteName} onChange={e => setPaletteName(e.target.value)} placeholder="Name" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: ib, border: `1px solid ${gb}`, color: tp }} />
                    <input value={brandSlogan} onChange={e => setBrandSlogan(e.target.value)} placeholder="Slogan" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: ib, border: `1px solid ${gb}`, color: tp }} />

                    <div className="pt-2">
                      <label className="text-[10px] font-bold uppercase opacity-50 block mb-2" style={{ color: tp }}>Select Template</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['classic', 'minimal', 'editorial', 'modern', 'studio', 'brutalist'].map(t => (
                          <button
                            key={t}
                            onClick={() => setTemplateId(t)}
                            className="py-2 text-[10px] font-bold rounded-lg border transition-all capitalize"
                            style={{
                              background: templateId === t ? (isDark ? 'rgba(96,165,250,0.1)' : 'rgba(37,99,235,0.05)') : 'transparent',
                              borderColor: templateId === t ? (isDark ? '#60a5fa' : '#2563eb') : gb,
                              color: templateId === t ? (isDark ? '#60a5fa' : '#2563eb') : tm
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => logoInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer mt-2" style={{ background: ib, border: `1px dashed ${gb}`, color: tp }}>
                      <Upload size={14} /> {uploadedLogo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                  </div>
                </div>

                {/* ADVANCED POSTER COLORS */}
                <div style={sectionCard}>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={14} style={{ color: isDark ? '#a855f7' : '#9333ea' }} />
                    <span style={{ ...label(isDark ? '#a855f7' : '#9333ea'), marginBottom: 0 }}>Advanced Poster Colors</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Header Block', key: 'header' },
                      { label: 'Middle Left', key: 'leftBox' },
                      { label: 'Middle Right', key: 'rightBox' },
                      { label: 'Bottom Area', key: 'bottomSection' },
                      { label: 'Mockup Grid', key: 'moodboardBg' },
                      { label: 'Header Pattern', key: 'pattern' }
                    ].map(block => (
                      <div key={block.key} className="flex items-center justify-between p-2 rounded-lg" style={{ background: ib }}>
                        <span className="text-[10px] font-bold uppercase opacity-60" style={{ color: tp }}>{block.label}</span>
                        <div className="flex items-center gap-2">
                          <input type="color" value={posterColors[block.key as keyof typeof posterColors]} onChange={e => setPosterColors({ ...posterColors, [block.key]: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent" />
                          <span className="text-[10px] font-mono opacity-40 uppercase" style={{ color: tp }}>{posterColors[block.key as keyof typeof posterColors]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={sectionCard}>
                  <span style={label(isDark ? '#f472b6' : '#db2777')}>Fonts</span>
                  <div className="space-y-3">
                    <FontDropdown value={primaryFont} onChange={setPrimaryFont} open={primaryFontOpen} setOpen={setPrimaryFontOpen} label="Primary" isDark={isDark} tp={tp} tm={tm} ib={ib} gb={gb} />
                    <FontDropdown value={secondaryFont} onChange={setSecondaryFont} open={secondaryFontOpen} setOpen={setSecondaryFontOpen} label="Secondary" isDark={isDark} tp={tp} tm={tm} ib={ib} gb={gb} />
                  </div>
                </div>

                <div style={sectionCard}>
                  <div className="flex justify-between items-center mb-3">
                    <span style={label(isDark ? '#4ade80' : '#16a34a')}>Colors</span>
                    <button onClick={fetchAIPalettes} disabled={isFetchingPalettes} className="text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 cursor-pointer" style={{ color: isDark ? '#4ade80' : '#16a34a' }}>
                      {isFetchingPalettes ? 'Dreaming...' : <><Palette size={10} /> AI Palette Suggest</>}
                    </button>
                  </div>
                  <div className="mb-4">
                    <input
                      placeholder="Paste hex codes (e.g. #ff0000, #00ff00)..."
                      className="w-full px-3 py-2 rounded-xl text-[10px] outline-none"
                      style={{ background: ib, border: `1px solid ${gb}`, color: tp }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleBulkPaste((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <p className="text-[9px] mt-1 opacity-50 px-1">Press Enter to apply</p>
                  </div>

                  {aiPalettes.map((p, idx) => (
                    <div key={idx} className="mb-2 p-2 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold" style={{ color: tp }}>{p.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(p.colors.map(c => c.hex).join(', '))} className="text-[9px] font-bold opacity-60 hover:opacity-100 transition-opacity" style={{ color: tp }}>Copy</button>
                          <button onClick={() => applyPalette(p.colors)} className="text-[9px] font-bold text-blue-400">Apply</button>
                        </div>
                      </div>
                      <div className="flex h-4 rounded overflow-hidden cursor-pointer">
                        {p.colors.map((c, ci) => (
                          <div
                            key={ci}
                            className="flex-1 hover:scale-110 transition-transform"
                            style={{ background: c.hex }}
                            title={c.hex}
                            onClick={() => copyToClipboard(c.hex)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2">
                    {colors.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl group" style={{ background: ib, border: `1px solid ${gb}` }}>
                        <div
                          style={{ width: 20, height: 20, borderRadius: 5, background: c.hex, cursor: 'copy' }}
                          title="Click to copy hex"
                          onClick={() => copyToClipboard(c.hex)}
                        />
                        <input value={c.hex} onChange={e => updateHex(i, e.target.value)} className="flex-1 bg-transparent outline-none text-[10px] font-mono" style={{ color: tp }} />
                        <button onClick={() => removeColor(i)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: tm }}><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={randomizePalette} className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)', color: '#080812' }}>
                    <Shuffle size={12} /> Shuffle Scheme
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#e5e7eb] dark:bg-[#0a0a0a]">
        <div className="flex items-center justify-between flex-shrink-0 px-7 py-4" style={{ borderBottom: `1px solid ${gb}`, background: hdrBg, backdropFilter: 'blur(14px)' }}>
          <h2 style={{ color: tp, fontSize: '1rem', fontWeight: 700 }}>Brand Identity Workshop</h2>
          <div className="relative flex items-center gap-3" ref={exportRef}>
            <button onClick={handleBackNavigation} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: glassBg, border: `1px solid ${gb}`, color: tp }}>
              <ChevronLeft size={16} /> Dashboard
            </button>
            <button onClick={handleSaveProjectInternal} className="p-2.5 rounded-xl border flex items-center justify-center" style={{ background: glassBg, borderColor: gb, color: tp }}>
              <Save size={16} />
            </button>

            <button
              onClick={() => handleExportBrandKit('png')}
              disabled={!isAllAssetsLoaded}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', border: 'none', boxShadow: '0 8px 20px rgba(167,139,250,0.3)' }}
            >
              <Download size={16} />
              Export High Res
            </button>

            <button
              onClick={() => setExportOpen(v => !v)}
              disabled={!isAllAssetsLoaded}
              className="p-2.5 rounded-xl border disabled:opacity-50"
              style={{ background: glassBg, borderColor: gb, color: tp }}
            >
              <ChevronDown size={14} />
            </button>

            <AnimatePresence>
              {exportOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-[9999] w-56 shadow-2xl" style={{ background: isDark ? '#111122' : '#fff', border: `1px solid ${gb}` }}>
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-white/5 transition-colors" style={{ color: tp }}><FileText size={16} /> Export as PDF Document</button>
                  <button onClick={handleExportCSS} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-white/5 transition-colors border-t border-white/5" style={{ color: tp }}><Code size={16} /> Export CSS Style Tokens</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
          <div id="brand-kit-capture-area">
            <div id="brand-kit-preview" ref={previewRef} className="flex flex-col shadow-2xl overflow-hidden" style={{ width: 700, minHeight: 990, background: '#fff' }}>
              {templateId === 'classic' && (
                <>
                  {/* Header Block */}
                  <div className="relative flex items-center justify-center p-12" style={{ background: posterColors.header, minHeight: 280 }}>
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `radial-gradient(circle at 20px 20px, ${posterColors.pattern} 2px, transparent 0)`, backgroundSize: '40px 40px' }} />
                    <div className="relative z-10 flex flex-col items-center">
                      {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-h-48 max-w-full object-contain drop-shadow-2xl" /> : <div className="flex flex-col items-center"><div style={{ width: 80, height: 80, borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', color: posterColors.header, fontSize: 40, fontWeight: 800, marginBottom: 16 }}>{paletteName.charAt(0)}</div><h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '4rem', color: ac, textAlign: 'center', lineHeight: 1, textShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>{paletteName}</h1></div>}
                    </div>
                  </div>

                  {/* Split Block */}
                  <div className="flex" style={{ height: 260 }}>
                    <div className="w-2/5 flex items-center justify-center p-8" style={{ background: posterColors.leftBox }}>
                      {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Pattern" className="max-h-40 max-w-full object-contain opacity-90" /> : <svg width="120" height="120" viewBox="0 0 100 100" fill="none"><path d="M50 0 A50 50 0 1 0 100 50 L50 50 Z" fill={pc} opacity="0.9" /><circle cx="30" cy="30" r="6" fill={ac} /><circle cx="50" cy="20" r="4" fill={ac} /><circle cx="20" cy="50" r="5" fill={ac} /></svg>}
                    </div>
                    <div className="w-3/5 flex items-center justify-center p-10" style={{ background: posterColors.rightBox }}>
                      <h2 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '2.5rem', color: ac, textAlign: 'center', lineHeight: 1.2 }}>{brandSlogan}</h2>
                    </div>
                  </div>

                  {/* Typography & Colors */}
                  <div className="flex p-12 gap-12" style={{ background: posterColors.bottomSection }}>
                    <div className="flex-1 flex gap-8 items-center border-r border-gray-200 pr-8">
                      <div className="text-center"><div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '4rem', color: '#111', lineHeight: 1 }}>Aa</div><div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', color: '#555', marginTop: 8, fontWeight: 600 }}>{primaryFont}</div></div>
                      <div className="text-center"><div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '3rem', color: '#111', lineHeight: 1 }}>Aa</div><div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', color: '#555', marginTop: 14, fontWeight: 600 }}>{secondaryFont}</div></div>
                    </div>
                    <div className="flex-1 flex justify-center items-center gap-6">
                      {colors.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-3"><div style={{ width: 64, height: 64, borderRadius: '50%', background: c.hex, border: c.hex === '#ffffff' ? '1px solid #ccc' : 'none', boxShadow: `0 4px 12px ${c.hex}66` }} /><span style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.8rem', color: '#444', fontWeight: 600 }}>{c.hex.toLowerCase()}</span></div>
                      ))}
                    </div>
                  </div>

                  {/* Moodboard */}
                  <div className="flex-1 p-2" style={{ background: posterColors.moodboardBg }}>
                    <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[400px]">
                      {moodImages.map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx)} onDragOver={e => { e.preventDefault(); setDraggingOver(idx); }} onDragLeave={() => setDraggingOver(null)} onDrop={e => handleMoodDrop(idx, e)} className="relative cursor-pointer overflow-hidden bg-gray-100 flex items-center justify-center transition-all" style={{ border: draggingOver === idx ? `2px dashed ${pc}` : 'none' }}>
                          {img ? (
                            <>
                              <img src={img} crossOrigin="anonymous" alt="Mood" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${paletteName}${idx}/400/400`; }} />
                              {!isExporting && (
                                <>
                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-[8px] text-white font-bold uppercase tracking-wider backdrop-blur-sm">
                                    Brand Vibe
                                  </div>
                                  <button onClick={e => { e.stopPropagation(); setMoodImages(p => { const n = [...p]; n[idx] = null; return n; }); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg hover:bg-red-600 border-none cursor-pointer z-10"><X size={14} /></button>
                                </>
                              )}
                            </>
                          ) : <div className="flex flex-col items-center text-gray-400 gap-2"><Upload size={24} color={draggingOver === idx ? pc : undefined} /><span className="text-xs font-semibold uppercase tracking-widest">Upload</span></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {templateId === 'minimal' && (
                <div className="flex flex-col h-full flex-1" style={{ background: posterColors.bottomSection }}>
                  {/* Minimal Header */}
                  <div className="p-12 flex flex-col items-center border-b border-gray-100">
                    {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-h-24 object-contain" /> : <h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '3.5rem', color: '#111' }}>{paletteName}</h1>}
                    <p style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.9rem', color: '#888', marginTop: 8, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{brandSlogan}</p>
                  </div>

                  {/* Large Moodboard Grid */}
                  <div className="flex-1 p-8">
                    <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px]">
                      {moodImages.slice(0, 6).map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx)} className={`relative cursor-pointer overflow-hidden bg-gray-50 flex items-center justify-center ${idx === 0 || idx === 3 ? 'col-span-2' : 'col-span-1'}`} style={{ border: draggingOver === idx ? `2px dashed ${pc}` : 'none' }}>
                          {img ? (
                            <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover" />
                          ) : <Upload size={20} className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colors & Typography Bottom Bar */}
                  <div className="p-12 pt-0 flex items-end justify-between">
                    <div className="flex gap-4">
                      {colors.map((c, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div style={{ width: 40, height: 40, background: c.hex, borderRadius: 4 }} />
                          <span className="text-[10px] font-mono opacity-50">{c.hex}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '1.5rem', color: '#111' }}>{primaryFont}</div>
                      <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', color: '#888' }}>{secondaryFont}</div>
                    </div>
                  </div>
                </div>
              )}

              {templateId === 'editorial' && (
                <div className="flex flex-1" style={{ background: posterColors.leftBox }}>
                  {/* Editorial Sidebar */}
                  <div className="w-1/3 border-r border-gray-100 flex flex-col p-10" style={{ background: posterColors.header }}>
                    <div className="flex-1">
                      {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-w-full" /> : <h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '2.5rem', color: ac }}>{paletteName}</h1>}
                      <div className="mt-12 space-y-8">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3 block" style={{ color: ac }}>Primary Typeface</span>
                          <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '2rem', color: ac }}>AaBbCc</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-3 block" style={{ color: ac }}>Palette</span>
                          <div className="flex flex-col gap-4">
                            {colors.map((c, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.hex, border: `2px solid ${ac}` }} />
                                <span className="text-xs font-mono" style={{ color: ac }}>{c.hex}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-10 border-t border-white/10">
                      <p style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1.1rem', color: ac, fontStyle: 'italic', lineHeight: 1.4 }}>{brandSlogan}</p>
                    </div>
                  </div>

                  {/* Editorial Moodboard Content */}
                  <div className="w-2/3 p-4 flex flex-col gap-4" style={{ background: posterColors.moodboardBg }}>
                    <div className="h-2/3 grid grid-cols-2 gap-4">
                      {moodImages.slice(0, 2).map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx)} className="relative cursor-pointer overflow-hidden bg-gray-50">
                          {img ? <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover" /> : <Upload className="m-auto text-gray-200" />}
                        </div>
                      ))}
                    </div>
                    <div className="h-1/3 grid grid-cols-3 gap-4">
                      {moodImages.slice(2, 5).map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx + 2)} className="relative cursor-pointer overflow-hidden bg-gray-50">
                          {img ? <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover" /> : <Upload className="m-auto text-gray-200" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {templateId === 'modern' && (
                <div className="flex flex-col flex-1" style={{ background: posterColors.bottomSection }}>
                  {/* Modern Top Header */}
                  <div className="flex justify-between items-center p-12" style={{ background: posterColors.header }}>
                    <div className="w-1/2">
                      {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-h-32 object-contain" /> : <h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '4.5rem', color: ac, lineHeight: 1 }}>{paletteName}</h1>}
                    </div>
                    <div className="w-1/2 text-right">
                      <p style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1.25rem', color: ac, opacity: 0.9, lineHeight: 1.5 }}>{brandSlogan}</p>
                    </div>
                  </div>

                  {/* Modern Content */}
                  <div className="flex flex-1 p-8 gap-8">
                    <div className="w-1/3 flex flex-col gap-8">
                      {/* Typography */}
                      <div className="p-8 rounded-3xl" style={{ background: posterColors.leftBox }}>
                        <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '3.5rem', color: pc, lineHeight: 1.1 }}>Aa</div>
                        <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.85rem', color: '#666', marginTop: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Primary / {primaryFont}</div>
                        <div className="mt-8 border-t border-black/10 pt-8">
                          <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '2.5rem', color: '#111', lineHeight: 1.1 }}>Aa</div>
                          <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.85rem', color: '#666', marginTop: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secondary / {secondaryFont}</div>
                        </div>
                      </div>
                      {/* Palette */}
                      <div className="p-8 rounded-3xl flex-1" style={{ background: posterColors.rightBox }}>
                        <div className="flex flex-col h-full justify-between gap-4">
                          {colors.map((c, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <div style={{ width: 48, height: 48, borderRadius: 16, background: c.hex, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }} />
                              <div>
                                <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', color: '#111', fontWeight: 600 }}>{c.name || `Color ${i + 1}`}</div>
                                <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.8rem', color: '#666', marginTop: 2 }}>{c.hex}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Moodboard */}
                    <div className="w-2/3 rounded-3xl overflow-hidden p-4 grid grid-cols-2 grid-rows-3 gap-4" style={{ background: posterColors.moodboardBg }}>
                      {moodImages.slice(0, 6).map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx)} className={`relative cursor-pointer overflow-hidden bg-black/5 rounded-2xl ${idx === 0 ? 'row-span-2' : ''} ${idx === 3 ? 'col-span-2' : ''}`}>
                          {img ? <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" /> : <Upload className="m-auto text-black/20 absolute inset-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {templateId === 'studio' && (
                <div className="flex flex-col flex-1 p-10 gap-10" style={{ background: posterColors.pattern }}>
                  {/* Studio Header (Center) */}
                  <div className="flex flex-col items-center text-center p-12 border-4" style={{ borderColor: pc, background: posterColors.header }}>
                    {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-h-40 object-contain" /> : <h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '5rem', color: ac, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{paletteName}</h1>}
                    <div className="mt-8 px-6 py-2 border-t-2 border-b-2" style={{ borderColor: ac }}>
                      <p style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1.2rem', color: ac, letterSpacing: '0.3em', textTransform: 'uppercase' }}>{brandSlogan}</p>
                    </div>
                  </div>

                  {/* Studio Lower Split */}
                  <div className="flex flex-1 gap-10">
                    <div className="w-1/2 flex flex-col gap-10">
                      {/* Typography Panel */}
                      <div className="p-10 border-2 flex flex-col justify-center" style={{ borderColor: pc, background: posterColors.leftBox }}>
                        <div className="flex justify-between items-end border-b-2 pb-6 mb-6" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                          <span style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.9rem', color: '#555', letterSpacing: '0.1em' }}>TYPOGRAPHY 01</span>
                          <span style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1.1rem', color: '#111', fontWeight: 700 }}>{primaryFont}</span>
                        </div>
                        <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '4rem', color: '#111', lineHeight: 1 }}>Ag</div>

                        <div className="flex justify-between items-end border-b-2 pb-6 mb-6 mt-12" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                          <span style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.9rem', color: '#555', letterSpacing: '0.1em' }}>TYPOGRAPHY 02</span>
                          <span style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1.1rem', color: '#111', fontWeight: 700 }}>{secondaryFont}</span>
                        </div>
                        <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '3rem', color: '#111', lineHeight: 1 }}>Ag</div>
                      </div>

                      {/* Color Palette Row */}
                      <div className="flex flex-1 border-2" style={{ borderColor: pc, background: posterColors.bottomSection }}>
                        {colors.map((c, i) => (
                          <div key={i} className="flex-1 flex flex-col">
                            <div className="flex-1" style={{ background: c.hex }} />
                            <div className="p-4 bg-white border-t-2" style={{ borderColor: pc }}>
                              <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.8rem', color: '#111', fontWeight: 700 }}>{c.name}</div>
                              <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '0.7rem', color: '#666', marginTop: 4 }}>{c.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Studio Moodboard */}
                    <div className="w-1/2 border-2 p-4 grid grid-cols-2 gap-4" style={{ borderColor: pc, background: posterColors.moodboardBg }}>
                      {moodImages.slice(0, 4).map((img, idx) => (
                        <div key={idx} onClick={() => handleSlotClick(idx)} className="relative cursor-pointer overflow-hidden bg-gray-100 flex items-center justify-center filter grayscale hover:grayscale-0 transition-all duration-500">
                          {img ? <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover" /> : <Upload className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {templateId === 'brutalist' && (
                <div className="flex flex-col flex-1 relative overflow-hidden" style={{ background: posterColors.leftBox }}>
                  {/* Brutalist Background Elements */}
                  <div className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full mix-blend-multiply opacity-80" style={{ background: pc }} />
                  <div className="absolute -left-20 -bottom-20 w-[600px] h-[600px] rounded-full mix-blend-multiply opacity-80" style={{ background: posterColors.rightBox }} />

                  {/* Brutalist Content Container */}
                  <div className="relative z-10 flex flex-col h-full p-8 gap-8 backdrop-blur-[100px] bg-white/30 border-[16px]" style={{ borderColor: posterColors.header }}>
                    <div className="flex gap-8">
                      {/* Left Header */}
                      <div className="w-2/3 bg-black text-white p-12 border-8 border-black transform -rotate-1 hover:rotate-0 transition-transform">
                        {uploadedLogo ? <img src={uploadedLogo} crossOrigin="anonymous" alt="Logo" className="max-h-40 invert mix-blend-difference" /> : <h1 style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '6rem', lineHeight: 0.9, textTransform: 'uppercase' }}>{paletteName}</h1>}
                      </div>
                      {/* Right Slogan */}
                      <div className="w-1/3 p-8 border-8 border-black flex items-center justify-center bg-white transform rotate-2 hover:rotate-0 transition-transform">
                        <p style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '2rem', fontWeight: 800, color: '#000', lineHeight: 1, textTransform: 'uppercase' }}>{brandSlogan}</p>
                      </div>
                    </div>

                    <div className="flex flex-1 gap-8">
                      {/* Colors & Typography */}
                      <div className="w-1/3 flex flex-col gap-8">
                        <div className="flex-1 border-8 border-black p-8 bg-white overflow-hidden relative">
                          <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '12rem', color: 'rgba(0,0,0,0.05)', position: 'absolute', top: -50, left: -20, lineHeight: 1 }}>Aa</div>
                          <div className="relative z-10 space-y-8">
                            <div>
                              <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Primary Font</div>
                              <div style={{ fontFamily: `'${primaryFont}', sans-serif`, fontSize: '3rem', lineHeight: 1 }}>{primaryFont}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Secondary Font</div>
                              <div style={{ fontFamily: `'${secondaryFont}', sans-serif`, fontSize: '2.5rem', lineHeight: 1 }}>{secondaryFont}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex h-32 border-8 border-black bg-white">
                          {colors.map((c, i) => (
                            <div key={i} className="flex-1 border-r-4 border-black last:border-r-0 relative group">
                              <div className="absolute inset-0" style={{ background: c.hex }} />
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span style={{ fontFamily: `'${secondaryFont}', sans-serif`, color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>{c.hex}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Brutalist Moodboard */}
                      <div className="w-2/3 border-8 border-black p-4 bg-white grid grid-cols-2 gap-4">
                        {moodImages.slice(0, 4).map((img, idx) => (
                          <div key={idx} onClick={() => handleSlotClick(idx)} className="relative cursor-pointer bg-gray-200 border-4 border-black transform hover:scale-[1.02] transition-transform">
                            {img ? <img src={img} crossOrigin="anonymous" alt="Vibe" className="w-full h-full object-cover" /> : <Upload className="m-auto text-black absolute inset-0 w-full h-full p-12" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}