import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

interface Project {
  id: string;
  title: string;
  type: string;
  projectData: any;
  img?: string;
  timestamp: number;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  handleSaveProject: (projectId: string | null, projectTitle: string, storeData: any, previewImage?: string, projectType?: string) => Promise<string | null>;
  fetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const q = query(
        collection(db, 'projects'),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchProjects();
      else setProjects([]);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProject = async (projectId: string | null, projectTitle: string, storeData: any, previewImage?: string, projectType?: string) => {
    try {
      const uid = auth.currentUser?.uid || 'guest';
      const projectPayload = {
        uid,
        title: projectTitle || 'Untitled Design',
        projectData: JSON.parse(JSON.stringify(storeData)), // Ensure plain object
        img: previewImage || '',
        timestamp: Date.now(),
        type: projectType || (storeData.pages ? 'Design' : 'Brand Kit')
      };

      if (projectId) {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, projectPayload);

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...projectPayload } : p));
        return projectId;
      } else {
        const docRef = await addDoc(collection(db, 'projects'), projectPayload);
        const newProject = { id: docRef.id, ...projectPayload };
        setProjects(prev => [newProject, ...prev]);
        return docRef.id;
      }
    } catch (err) {
      console.error("Error saving project:", err);
      return null;
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, loading, handleSaveProject, fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
