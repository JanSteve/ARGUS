import { useCallback, useRef } from "react";

interface DragOptions {
  onDrag: (x: number, y: number) => void;
  onStartDrag?: () => void;
}

export function useWindowDrag({ onDrag, onStartDrag }: DragOptions) {
  const isDragging = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const newX = e.clientX - startOffset.current.x;
      const newY = e.clientY - startOffset.current.y;
      
      onDrag(newX, newY);
    },
    [onDrag]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, currentX: number, currentY: number) => {
      // Only drag with left click
      if (e.button !== 0) return;
      
      // Prevent dragging if clicking interactive control buttons
      const target = e.target as HTMLElement;
      if (target.closest("button") || target.closest("a") || target.closest("input")) {
        return;
      }
      
      isDragging.current = true;
      startOffset.current = {
        x: e.clientX - currentX,
        y: e.clientY - currentY,
      };
      
      if (onStartDrag) {
        onStartDrag();
      }
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      e.preventDefault();
    },
    [handleMouseMove, handleMouseUp, onStartDrag]
  );

  return { handleMouseDown };
}
