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
              className="liquid-button-icon shadow-liquid"
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
              className="liquid-button-icon shadow-liquid"
              title="Open sidebar (Cmd+\\)"
            >
              <PanelRight className="w-5 h-5 text-primary" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Floating Tab Bar for Mode Toggle */}
      {deepResearchEnabled && (
        <div className="flex justify-center py-4 px-4">
          <div className="floating-tab-bar">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveMode("chat")}
              className={`floating-tab-item ${activeMode === "chat" ? "active" : ""}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveMode("research")}
              className={`floating-tab-item ${activeMode === "research" ? "active" : ""}`}
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
