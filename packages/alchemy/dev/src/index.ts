import React, { Component, ErrorInfo, ReactNode } from "react";

/**
 * Error boundary component for Alchemy applications
 */
export class AlchemyErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Alchemy Error Boundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === "development") {
      console.error("Error stack:", error.stack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ||
        React.createElement(
          "div",
          {
            style: {
              padding: "20px",
              border: "1px solid #ff6b6b",
              borderRadius: "4px",
              backgroundColor: "#ffeaea",
              color: "#d63031",
              fontFamily: "monospace",
              fontSize: "14px",
            },
          },
          [
            React.createElement("h3", { key: "title" }, "🚨 Alchemy Error"),
            React.createElement(
              "p",
              { key: "message" },
              "Something went wrong with your Alchemy application.",
            ),
            this.state.error
              ? React.createElement("details", { key: "details" }, [
                  React.createElement(
                    "summary",
                    { key: "summary" },
                    "Error Details",
                  ),
                  React.createElement(
                    "pre",
                    { key: "stack" },
                    this.state.error.message,
                  ),
                ])
              : null,
            React.createElement(
              "button",
              {
                key: "retry",
                onClick: () =>
                  this.setState({ hasError: false, error: undefined }),
                style: {
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#d63031",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                },
              },
              "Try Again",
            ),
          ],
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Development overlay component for debugging
 */
export function AlchemyDevOverlay({
  enabled = true,
  position = "bottom-right" as const,
}: {
  enabled?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  if (!enabled || process.env.NODE_ENV !== "development") {
    return null;
  }

  const positionStyles = {
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
  };

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        ...positionStyles[position],
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "300px",
      },
    },
    [
      React.createElement(
        "div",
        {
          key: "title",
          style: { marginBottom: "8px", fontWeight: "bold" },
        },
        "🧪 Alchemy Dev Mode",
      ),
      React.createElement(
        "div",
        { key: "hot-reload" },
        "Hot reload: ✅ Active",
      ),
      React.createElement(
        "div",
        { key: "boundaries" },
        "Error boundaries: ✅ Enabled",
      ),
      React.createElement(
        "div",
        { key: "devtools" },
        "React DevTools: Check console",
      ),
    ],
  );
}

/**
 * Hook for hot reload detection and handling
 */
export function useHotReload(onReload?: () => void) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const handleHotReload = () => {
        console.log("🔄 Alchemy hot reload detected");
        onReload?.();
      };

      // Listen for hot reload events (this would be framework-specific)
      window.addEventListener("alchmenyrun:hot-reload", handleHotReload);

      return () => {
        window.removeEventListener("alchmenyrun:hot-reload", handleHotReload);
      };
    }
  }, [onReload]);
}

/**
 * Development helper for debugging Alchemy state
 */
export function createAlchemyDebugger() {
  return {
    log: (message: string, data?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`🧪 Alchemy: ${message}`, data);
      }
    },

    warn: (message: string, data?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`⚠️ Alchemy: ${message}`, data);
      }
    },

    error: (message: string, data?: any) => {
      console.error(`🚨 Alchemy: ${message}`, data);
    },
  };
}
