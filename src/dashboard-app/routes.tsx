import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { HomePage } from './components/pages/HomePage';
import { WhiteboardEditor } from './components/pages/WhiteboardEditor';
import { BrandKitGenerator } from './components/pages/BrandKitGenerator';
import { PortfolioGenerator } from './components/pages/PortfolioGenerator';
import { ColorPaletteGenerator } from './components/pages/ColorPaletteGenerator';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'whiteboard', Component: WhiteboardEditor },
      { path: 'brand-kit', Component: BrandKitGenerator },
      { path: 'portfolio', Component: PortfolioGenerator },
      { path: 'palette', Component: ColorPaletteGenerator },
    ],
  },
]);
