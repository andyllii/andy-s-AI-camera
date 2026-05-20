import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';

interface CanvasProject {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  lastModified: number;
}

interface CanvasState {
  projects: CanvasProject[];
  currentProjectId: string | null;
  nodes: Node[];
  edges: Edge[];
  
  loadProjects: () => void;
  createProject: (name: string) => void;
  switchProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  saveCurrentProject: () => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const STORAGE_KEY = 'infinite-canvas-projects';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  nodes: [],
  edges: [],
  
  loadProjects: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const projects = JSON.parse(data);
        set({ projects });
        if (projects.length > 0 && !get().currentProjectId) {
          get().switchProject(projects[0].id);
        }
      }
    } catch(e) {}
  },
  
  createProject: (name: string) => {
    const newProject: CanvasProject = {
      id: Date.now().toString(),
      name,
      nodes: [],
      edges: [],
      lastModified: Date.now()
    };
    const newProjects = [...get().projects, newProject];
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    get().switchProject(newProject.id);
  },
  
  switchProject: (id: string) => {
    get().saveCurrentProject(); // Save current before switching
    const p = get().projects.find(p => p.id === id);
    if (p) {
      set({ currentProjectId: id, nodes: p.nodes, edges: p.edges });
    }
  },

  renameProject: (id: string, name: string) => {
    const newProjects = get().projects.map(p => p.id === id ? { ...p, name, lastModified: Date.now() } : p);
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
  },
  
  deleteProject: (id: string) => {
    const newProjects = get().projects.filter(p => p.id !== id);
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    if (get().currentProjectId === id) {
      if (newProjects.length > 0) {
        get().switchProject(newProjects[0].id);
      } else {
        set({ currentProjectId: null, nodes: [], edges: [] });
      }
    }
  },
  
  saveCurrentProject: () => {
    const { currentProjectId, nodes, edges, projects } = get();
    if (!currentProjectId) return;
    const newProjects = projects.map(p => 
      p.id === currentProjectId 
        ? { ...p, nodes, edges, lastModified: Date.now() } 
        : p
    );
    set({ projects: newProjects });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    get().saveCurrentProject();
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    get().saveCurrentProject();
  },
  
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    get().saveCurrentProject();
  },
  
  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
    get().saveCurrentProject();
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
    get().saveCurrentProject();
  },
  
  setEdges: (edges: Edge[]) => {
    set({ edges });
    get().saveCurrentProject();
  }
}));
