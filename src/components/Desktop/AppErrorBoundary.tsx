import React from "react";

interface AppErrorBoundaryProps {
  appName: string;
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

/**
 * Error Boundary that catches crashes inside individual app windows.
 * Instead of killing the entire OS, shows a friendly recovery card.
 */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[ARGUS] ${this.props.appName} crashed:`,
      error,
      errorInfo.componentStack
    );
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "16px",
            padding: "32px",
            textAlign: "center",
            color: "var(--fg-default)",
          }}
        >
          {/* Warning Icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>

          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "8px",
                color: "#f59e0b",
              }}
            >
              {this.props.appName} encountered an error
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--fg-muted)",
                maxWidth: "300px",
                lineHeight: 1.5,
              }}
            >
              The application stopped unexpectedly. Click below to restart it.
            </p>
            {this.state.error && (
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--fg-muted)",
                  opacity: 0.6,
                  marginTop: "8px",
                  fontFamily: "monospace",
                  maxWidth: "300px",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error}
              </p>
            )}
          </div>

          <button
            onClick={this.handleRestart}
            style={{
              padding: "8px 24px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              color: "#60a5fa",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(59, 130, 246, 0.25)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background =
                "rgba(59, 130, 246, 0.15)";
            }}
          >
            Restart {this.props.appName}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
