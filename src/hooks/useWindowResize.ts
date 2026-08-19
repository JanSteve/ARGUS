import { useCallback, useRef } from "react";

export type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

interface ResizeOptions {
  onResize: (x: number, y: number, width: number, height: number) => void;
  minWidth?: number;
  minHeight?: number;
}

export function useWindowResize({
  onResize,
  minWidth = 300,
  minHeight = 200,
}: ResizeOptions) {
  const isResizing = useRef(false);
  const resizeDirection = useRef<ResizeDirection | null>(null);
  
  // Track start coordinates & dimensions
  const startState = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current || !resizeDirection.current) return;

      const deltaX = e.clientX - startState.current.mouseX;
      const deltaY = e.clientY - startState.current.mouseY;
      const dir = resizeDirection.current;

      let newX = startState.current.x;
      let newY = startState.current.y;
      let newWidth = startState.current.width;
      let newHeight = startState.current.height;

      // Handle horizontal resizing
      if (dir.includes("e")) {
        newWidth = Math.max(minWidth, startState.current.width + deltaX);
      } else if (dir.includes("w")) {
        const potentialWidth = startState.current.width - deltaX;
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newX = startState.current.x + deltaX;
        }
      }

      // Handle vertical resizing
      if (dir.includes("s")) {
        newHeight = Math.max(minHeight, startState.current.height + deltaY);
      } else if (dir.includes("n")) {
        const potentialHeight = startState.current.height - deltaY;
        if (potentialHeight >= minHeight) {
          newHeight = potentialHeight;
          newY = startState.current.y + deltaY;
        }
      }

      onResize(newX, newY, newWidth, newHeight);
    },
    [minWidth, minHeight, onResize]
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    resizeDirection.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      direction: ResizeDirection,
      currentX: number,
      currentY: number,
      currentWidth: number,
      currentHeight: number
    ) => {
      if (e.button !== 0) return; // Left click only

      isResizing.current = true;
      resizeDirection.current = direction;
      
      startState.current = {
        x: currentX,
        y: currentY,
        width: currentWidth,
        height: currentHeight,
        mouseX: e.clientX,
        mouseY: e.clientY,
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      e.preventDefault();
    },
    [handleMouseMove, handleMouseUp]
  );

  return { handleMouseDown };
}
