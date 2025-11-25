import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UnifiedChatInterface } from "./components/UnifiedChatInterface";
import { SessionSidebar } from "./components/SessionSidebar";
import RightSidebar from "./components/RightSidebar";
import SettingsModal from "./components/SettingsModal";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { BackendStatusBanner } from "./components/common/BackendStatusBanner";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("rightSidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("leftSidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("leftSidebarWidth");
    return saved ? parseInt(saved) : 320;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("rightSidebarWidth");
    return saved ? parseInt(saved) : 320;
  });

  // Save sidebar states to localStorage
  useEffect(() => {
    localStorage.setItem("leftSidebarOpen", JSON.stringify(isLeftSidebarOpen));
  }, [isLeftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(
      "rightSidebarOpen",
      JSON.stringify(isRightSidebarOpen)
    );
  }, [isRightSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("leftSidebarWidth", leftSidebarWidth.toString());
  }, [leftSidebarWidth]);

  useEffect(() => {
    localStorage.setItem("rightSidebarWidth", rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle left sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setIsLeftSidebarOpen((prev) => !prev);
      }
      // Cmd/Ctrl + \ to toggle right sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setIsRightSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <BackendStatusBanner />
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar - Session History */}
          <SessionSidebar
            isOpen={isLeftSidebarOpen}
            width={leftSidebarWidth}
            onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            onResize={setLeftSidebarWidth}
          />

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/chat/new" replace />} />
              <Route
                path="/chat/:sessionId"
                element={
                  <UnifiedChatInterface
                    onToggleLeftSidebar={() =>
                      setIsLeftSidebarOpen(!isLeftSidebarOpen)
                    }
                    onToggleRightSidebar={() =>
                      setIsRightSidebarOpen(!isRightSidebarOpen)
                    }
                    isLeftSidebarOpen={isLeftSidebarOpen}
                    isRightSidebarOpen={isRightSidebarOpen}
                  />
                }
              />
            </Routes>
          </main>

          {/* Right Sidebar */}
          <motion.div
            initial={false}
            animate={{
              width: isRightSidebarOpen ? rightSidebarWidth : 0,
              opacity: isRightSidebarOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden relative"
            style={{ flexShrink: 0 }}
          >
            <RightSidebar
              width={rightSidebarWidth}
              onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              onResize={setRightSidebarWidth}
            />
          </motion.div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
