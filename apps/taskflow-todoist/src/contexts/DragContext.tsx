import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Task } from "../services/taskService";

interface DragContextValue {
  isDragging: boolean;
  draggedTask: Task | null;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  showDropZones: boolean;
}

const DragContext = createContext<DragContextValue | undefined>(undefined);

interface DragProviderProps {
  children: ReactNode;
}

export function DragProvider({ children }: DragProviderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showDropZones, setShowDropZones] = useState(false);

  const onDragStart = useCallback((task: Task) => {
    setIsDragging(true);
    setDraggedTask(task);
    setShowDropZones(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTask(null);
    setShowDropZones(false);
  }, []);

  return (
    <DragContext.Provider
      value={{
        isDragging,
        draggedTask,
        onDragStart,
        onDragEnd,
        showDropZones,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDrag must be used within a DragProvider");
  }
  return context;
}

