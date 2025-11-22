import { useState } from "react";
import { motion } from "framer-motion";
import ChatInterface from "./components/ChatInterface";
import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import SettingsModal from "./components/SettingsModal";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { BackendStatusBanner } from "./components/common/BackendStatusBanner";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  return (
    <ErrorBoundary>
      <BackendStatusBanner />
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            onToggleRightSidebar={() =>
              setIsRightSidebarOpen(!isRightSidebarOpen)
            }
            isRightSidebarOpen={isRightSidebarOpen}
          />
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
  );
}

export default App;
