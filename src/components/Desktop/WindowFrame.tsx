import React from "react";
import styles from "./WindowFrame.module.css";
import { useWindowDrag } from "../../hooks/useWindowDrag";
import { useWindowResize, ResizeDirection } from "../../hooks/useWindowResize";

interface WindowFrameProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  id,
  title,
  x,
  y,
  width,
  height,
  isActive,
  isMinimized,
  isMaximized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onDragEnd,
  onResize,
  children,
}) => {
  const { handleMouseDown: startDrag } = useWindowDrag({
    onDrag: onMove,
    onStartDrag: onFocus,
    onDragEnd,
  });

  const { handleMouseDown: startResize } = useWindowResize({
    onResize,
  });

  if (isMinimized) return null;

  const windowClass = `${styles.window} ${isActive ? styles.active : ""} ${
    isMaximized ? styles.maximized : ""
  }`;

  const inlineStyles: React.CSSProperties = isMaximized
    ? { zIndex }
    : {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      };

  const handleResizeStart = (e: React.MouseEvent, dir: ResizeDirection) => {
    if (isMaximized) return;
    onFocus();
    startResize(e, dir, x, y, width, height);
  };

  const handleDoubleClickHeader = () => {
    onMaximize();
  };

  return (
    <div
      className={windowClass}
      style={inlineStyles}
      onMouseDown={onFocus}
      data-testid={`window-frame-${id}`}
    >
      {/* Title bar / Drag Handle */}
      <div
        className={styles.header}
        onMouseDown={(e) => startDrag(e, x, y)}
        onDoubleClick={handleDoubleClickHeader}
      >
        <span className={styles.title}>{title}</span>
        
        {/* Orb Controls (Mac/Windows layout mix) */}
        <div className={styles.controls}>
          <button
            className={`${styles.btn} ${styles.minimize}`}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize"
          >
            -
          </button>
          <button
            className={`${styles.btn} ${styles.maximize}`}
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            +
          </button>
          <button
            className={`${styles.btn} ${styles.close}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main Window Client Content Area */}
      <div className={styles.content}>{children}</div>

      {/* Resize Borders (hidden if maximized) */}
      {!isMaximized && (
        <>
          <div className={`${styles.resizeHandle} ${styles.n}`} onMouseDown={(e) => handleResizeStart(e, "n")} />
          <div className={`${styles.resizeHandle} ${styles.s}`} onMouseDown={(e) => handleResizeStart(e, "s")} />
          <div className={`${styles.resizeHandle} ${styles.e}`} onMouseDown={(e) => handleResizeStart(e, "e")} />
          <div className={`${styles.resizeHandle} ${styles.w}`} onMouseDown={(e) => handleResizeStart(e, "w")} />
          <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={(e) => handleResizeStart(e, "nw")} />
          <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={(e) => handleResizeStart(e, "ne")} />
          <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={(e) => handleResizeStart(e, "sw")} />
          <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={(e) => handleResizeStart(e, "se")} />
        </>
      )}
    </div>
  );
};
