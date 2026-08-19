import React, { useEffect, useRef } from "react";
import styles from "./ContextMenu.module.css";

interface ContextMenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  dividerBefore?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={`${styles.contextMenu} glass-blur`}
      style={{ left: `${x}px`, top: `${y}px` }}
      data-testid="context-menu"
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.dividerBefore && <div className={styles.divider} />}
          <div
            className={styles.item}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
