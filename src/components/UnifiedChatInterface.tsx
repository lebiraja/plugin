import React, { useState } from "react";
import { MessageSquare, Brain, PanelLeft, PanelRight } from "lucide-react";
import { motion } from "framer-motion";
import ChatInterface from "./ChatInterface";
import { DeepResearchPanel } from "./research/DeepResearchPanel";
import { ResearchResultsView } from "./research/ResearchResultsView";
import { useDeepResearchStore } from "../store/deepResearchStore";
import { useSettingsStore } from "../store/settingsStore";

interface UnifiedChatInterfaceProps {
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar: () => void;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen: boolean;
}

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftSidebarOpen,
  isRightSidebarOpen,
}) => {
  const { settings } = useSettingsStore();
  const { currentResearch } = useDeepResearchStore();
  const [activeMode, setActiveMode] = useState<"chat" | "research">("chat");

  // Use deep research setting to determine if the mode toggle should be available
  const deepResearchEnabled = settings.toolsConfig.deepResearch;

  return (
    <div className="flex flex-col h-full relative">
      {/* Floating Sidebar Toggle Buttons */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          {onToggleLeftSidebar && !isLeftSidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleLeftSidebar}
              className="w-10 h-10 bg-dark-850/95 backdrop-blur-md border border-glass-border-strong rounded-xl flex items-center justify-center shadow-glow hover:shadow-glow-strong transition-all duration-300"
              title="Open sessions (Cmd+B)"
            >
              <PanelLeft className="w-5 h-5 text-primary" />
            </motion.button>
          )}
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          {!isRightSidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleRightSidebar}
              className="w-10 h-10 bg-dark-850/95 backdrop-blur-md border border-glass-border-strong rounded-xl flex items-center justify-center shadow-glow hover:shadow-glow-strong transition-all duration-300"
              title="Open sidebar (Cmd+\\)"
            >
              <PanelRight className="w-5 h-5 text-primary" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      {deepResearchEnabled && (
        <div className="bg-dark-850/50 backdrop-blur-md border-b border-glass-border-strong p-3">
          <div className="flex space-x-2 max-w-md mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveMode("chat")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeMode === "chat"
                  ? "bg-gradient-to-r from-primary to-neon-cyan text-white shadow-glow"
                  : "bg-glass-bg/30 border border-glass-border text-gray-300 hover:bg-glass-hover"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveMode("research")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeMode === "research"
                  ? "bg-gradient-to-r from-primary to-neon-cyan text-white shadow-glow"
                  : "bg-glass-bg/30 border border-glass-border text-gray-300 hover:bg-glass-hover"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Deep Research</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeMode === "chat" ? (
          <ChatInterface
            onToggleRightSidebar={onToggleRightSidebar}
            isRightSidebarOpen={isRightSidebarOpen}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 scrollbar-thin">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Deep Research Panel */}
              <DeepResearchPanel />

              {/* Research Results */}
              {currentResearch && (
                <div className="mt-8">
                  <ResearchResultsView research={currentResearch} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
