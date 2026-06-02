import React, { useState } from "react";
import { MessageSquare, Brain, PanelLeft, PanelRight } from "lucide-react";
import ChatInterface from "./ChatInterface";
import { DeepResearchPanel } from "./research/DeepResearchPanel";
import { ResearchResultsView } from "./research/ResearchResultsView";
import { useDeepResearchStore } from "../store/deepResearchStore";
import { useSettingsStore } from "../store/settingsStore";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

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
    <div className="relative flex h-full flex-col">
      {/* Floating sidebar toggles (shown when a sidebar is collapsed) */}
      {onToggleLeftSidebar && !isLeftSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleLeftSidebar}
          className="absolute left-4 top-4 z-40"
          title="Open sessions (Cmd+B)"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}
      {!isRightSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleRightSidebar}
          className="absolute right-4 top-4 z-40"
          title="Open inspector (Cmd+\\)"
        >
          <PanelRight className="h-5 w-5" />
        </Button>
      )}

      {/* Mode toggle */}
      {deepResearchEnabled && (
        <div className="flex justify-center px-4 py-4">
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "chat" | "research")}>
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4" /> Chat
              </TabsTrigger>
              <TabsTrigger value="research">
                <Brain className="h-4 w-4" /> Deep Research
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeMode === "chat" ? (
          <ChatInterface
            onToggleRightSidebar={onToggleRightSidebar}
            isRightSidebarOpen={isRightSidebarOpen}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              <DeepResearchPanel />
              {currentResearch && (
                <ResearchResultsView research={currentResearch} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
