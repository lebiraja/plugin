import React, { useState } from "react";
import { MessageSquare, Brain } from "lucide-react";
import ChatInterface from "./ChatInterface";
import { DeepResearchPanel } from "./research/DeepResearchPanel";
import { ResearchResultsView } from "./research/ResearchResultsView";
import { useDeepResearchStore } from "../store/deepResearchStore";
import { useSettingsStore } from "../store/settingsStore";

interface UnifiedChatInterfaceProps {
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
}

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({
  onToggleRightSidebar,
  isRightSidebarOpen,
}) => {
  const { settings } = useSettingsStore();
  const { currentResearch } = useDeepResearchStore();
  const [activeMode, setActiveMode] = useState<"chat" | "research">("chat");

  // Use deep research setting to determine if the mode toggle should be available
  const deepResearchEnabled = settings.toolsConfig.deepResearch;

  return (
    <div className="flex flex-col h-full">
      {/* Mode Toggle */}
      {deepResearchEnabled && (
        <div className="bg-gray-800 border-b border-gray-700 p-2">
          <div className="flex space-x-2 max-w-md mx-auto">
            <button
              onClick={() => setActiveMode("chat")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeMode === "chat"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-650"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveMode("research")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeMode === "research"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-650"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Deep Research</span>
            </button>
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
          <div className="h-full overflow-y-auto p-6">
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
