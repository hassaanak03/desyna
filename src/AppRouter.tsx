import { createBrowserRouter } from 'react-router';
import App from './app/App';
import { RootLayout } from './dashboard-app/components/RootLayout';
import { HomePage } from './dashboard-app/components/pages/HomePage';
import { WhiteboardEditor } from './dashboard-app/components/pages/WhiteboardEditor';
import { BrandKitGenerator } from './dashboard-app/components/pages/BrandKitGenerator';
import { PortfolioGenerator } from './dashboard-app/components/pages/PortfolioGenerator';
import { ColorPaletteGenerator } from './dashboard-app/components/pages/ColorPaletteGenerator';
import { PolotnoEditor } from './dashboard-app/components/pages/PolotnoEditor';
import { DesignEditor } from './dashboard-app/components/pages/DesignEditor';
import { ErrorPage } from './ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App, // The landing page
    errorElement: <ErrorPage />,
  },
  {
    path: '/dashboard',
    Component: RootLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: HomePage },
      { path: 'whiteboard', Component: WhiteboardEditor },
      { path: 'structured-editor', Component: PolotnoEditor },
      { path: 'brand-kit', Component: BrandKitGenerator },
      { path: 'portfolio', Component: PortfolioGenerator },
      { path: 'palette', Component: ColorPaletteGenerator },
      { path: 'design-editor', Component: DesignEditor },
    ],
  },
]);
