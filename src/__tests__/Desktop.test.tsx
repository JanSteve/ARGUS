import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Desktop } from "../components/Desktop/Desktop";

// Mock Tauri invoke to prevent backend errors during testing
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("ARGUS Desktop Window Manager UI", () => {
  it("renders the desktop wallpaper, shortcuts, and taskbar", () => {
    render(<Desktop />);
    
    // Check main elements
    expect(screen.getByTestId("desktop-wallpaper")).toBeInTheDocument();
    expect(screen.getByTestId("start-button")).toBeInTheDocument();
    expect(screen.getByTestId("taskbar-clock")).toBeInTheDocument();
    
    // Check shortcuts
    expect(screen.getByTestId("shortcut-chat")).toBeInTheDocument();
    expect(screen.getByTestId("shortcut-settings")).toBeInTheDocument();
  });

  it("toggles Start Menu launcher visibility when clicked", () => {
    render(<Desktop />);
    
    // Start menu should be closed initially
    expect(screen.queryByTestId("start-menu")).not.toBeInTheDocument();
    
    // Click start button to open
    fireEvent.click(screen.getByTestId("start-button"));
    expect(screen.getByTestId("start-menu")).toBeInTheDocument();
    
    // Click start button again to close
    fireEvent.click(screen.getByTestId("start-button"));
    expect(screen.queryByTestId("start-menu")).not.toBeInTheDocument();
  });

  it("launches app window when double-clicking desktop shortcuts", () => {
    render(<Desktop />);
    
    // Double click Chat shortcut
    fireEvent.doubleClick(screen.getByTestId("shortcut-chat"));
    
    // Check that chat window frame exists on desktop
    expect(screen.getByTestId(/^window-frame-chat/)).toBeInTheDocument();
  });

  it("toggles minimize status of windows when clicking taskbar indicator", () => {
    render(<Desktop />);
    
    // Launch Chat
    fireEvent.doubleClick(screen.getByTestId("shortcut-chat"));
    
    // Window should be visible
    expect(screen.getByTestId(/^window-frame-chat/)).toBeInTheDocument();
    
    // Get taskbar item to toggle minimize
    const taskbarItem = screen.getByTestId(/^taskbar-item-chat/);
    expect(taskbarItem).toBeInTheDocument();
    
    // Click to minimize
    fireEvent.click(taskbarItem);
    expect(screen.queryByTestId(/^window-frame-chat/)).not.toBeInTheDocument();
    
    // Click again to restore
    fireEvent.click(taskbarItem);
    expect(screen.getByTestId(/^window-frame-chat/)).toBeInTheDocument();
  });

  it("closes window when clicking close (x) button", () => {
    render(<Desktop />);
    
    // Launch Chat
    fireEvent.doubleClick(screen.getByTestId("shortcut-chat"));
    expect(screen.getByTestId(/^window-frame-chat/)).toBeInTheDocument();
    
    // Click Close Button
    const closeBtn = screen.getByTitle("Close");
    fireEvent.click(closeBtn);
    
    // Window should be removed from DOM
    expect(screen.queryByTestId(/^window-frame-chat/)).not.toBeInTheDocument();
  });
});
