import { useState } from "react";
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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <BackendStatusBanner />
        <div className="flex h-screen overflow-hidden">
          {/* Left Sidebar - Session History */}
          <SessionSidebar isOpen={isLeftSidebarOpen} />

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/chat/new" replace />} />
              <Route
                path="/chat/:sessionId"
                element={
                  <UnifiedChatInterface
                    onToggleRightSidebar={() =>
                      setIsRightSidebarOpen(!isRightSidebarOpen)
                    }
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
              width: isRightSidebarOpen ? 320 : 0,
              opacity: isRightSidebarOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <RightSidebar />
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
