import { useSettingsStore } from "../store/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="backends">Backends</TabsTrigger>
          </TabsList>
          <TabsContent value="model" className="pt-2">
            <ModelSettings />
          </TabsContent>
          <TabsContent value="tools" className="pt-2">
            <ToolsSettings />
          </TabsContent>
          <TabsContent value="backends" className="pt-2">
            <BackendsSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ModelSettings() {
  const { settings, updateModelConfig } = useSettingsStore();
  const { temperature, topP, maxTokens } = settings.modelConfig;

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Temperature</Label>
          <span className="font-mono text-sm text-primary">{temperature.toFixed(1)}</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={([v]) => updateModelConfig({ temperature: v })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Top P</Label>
          <span className="font-mono text-sm text-primary">{topP.toFixed(2)}</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[topP]}
          onValueChange={([v]) => updateModelConfig({ topP: v })}
        />
      </div>

      <div className="space-y-2">
        <Label>Max Tokens</Label>
        <Input
          type="number"
          value={maxTokens}
          onChange={(e) =>
            updateModelConfig({ maxTokens: parseInt(e.target.value) || 0 })
          }
        />
      </div>
    </div>
  );
}

function ToolsSettings() {
  const { settings, updateToolsConfig } = useSettingsStore();
  const tools = [
    { key: "webSearch", label: "Web Search", description: "Live web search in answers" },
    { key: "rag", label: "RAG", description: "Retrieval from uploaded files" },
    { key: "deepResearch", label: "Deep Research", description: "Multi-step iterative reasoning" },
    { key: "fileUpload", label: "File Upload", description: "Upload and process documents" },
  ] as const;

  return (
    <div className="space-y-2 py-2">
      {tools.map((tool) => {
        const enabled = settings.toolsConfig[tool.key];
        return (
          <div
            key={tool.key}
            className={cn(
              "flex items-center justify-between rounded-lg border border-border p-4 transition-colors",
              enabled && "border-primary/40 bg-primary/5"
            )}
          >
            <div>
              <div className="text-sm font-medium">{tool.label}</div>
              <div className="text-xs text-muted-foreground">{tool.description}</div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => updateToolsConfig({ [tool.key]: v })}
            />
          </div>
        );
      })}
    </div>
  );
}

function BackendsSettings() {
  const { settings } = useSettingsStore();
  return (
    <div className="space-y-2 py-2">
      {settings.backends.map((backend) => (
        <div key={backend.id} className="rounded-lg border border-border p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">{backend.name}</span>
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                backend.isActive ? "bg-emerald-400" : "bg-muted-foreground/40"
              )}
            />
          </div>
          <div className="font-mono text-xs text-muted-foreground">{backend.url}</div>
        </div>
      ))}
    </div>
  );
}
