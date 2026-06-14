  import { createRoot } from "react-dom/client";
  import { RouterProvider } from "react-router";
  import { router } from "./AppRouter.tsx";
  import { ThemeProvider } from "./dashboard-app/context/ThemeContext.tsx";
  import { AuthProvider } from "./context/AuthContext.tsx";
  import { ProjectProvider } from "./dashboard-app/context/ProjectContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <ThemeProvider>
        <ProjectProvider>
          <RouterProvider router={router} />
        </ProjectProvider>
      </ThemeProvider>
    </AuthProvider>
  );