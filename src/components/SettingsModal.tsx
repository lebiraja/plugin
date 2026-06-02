import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { providerApi, type Provider } from "../api/providers";
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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
            <TabsTrigger value="providers">Providers</TabsTrigger>
          </TabsList>
          <TabsContent value="model" className="pt-2">
            <ModelSettings />
          </TabsContent>
          <TabsContent value="tools" className="pt-2">
            <ToolsSettings />
          </TabsContent>
          <TabsContent value="providers" className="pt-2">
            <ProvidersSettings />
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

function ProvidersSettings() {
  const { fetchProviders } = useSettingsStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [encryptionAvailable, setEncryptionAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { providers, encryption_available } = await providerApi.list();
      setProviders(providers);
      setEncryptionAvailable(encryption_available);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (p: Provider) => {
    setBusy(p.id);
    try {
      await providerApi.upsert({
        id: p.id,
        base_url: p.id === "custom" ? baseUrlInput || p.base_url : undefined,
        api_key: keyInput || undefined,
        enabled: true,
      });
      setEditing(null);
      setKeyInput("");
      setBaseUrlInput("");
      await load();
      await fetchProviders();
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (p: Provider, enabled: boolean) => {
    setBusy(p.id);
    try {
      await providerApi.upsert({ id: p.id, enabled });
      await load();
      await fetchProviders();
    } finally {
      setBusy(null);
    }
  };

  const test = async (p: Provider) => {
    setBusy(p.id);
    try {
      const r = await providerApi.test(p.id);
      setTestResult((prev) => ({ ...prev, [p.id]: r.ok }));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: Provider) => {
    if (!confirm(`Remove ${p.name}?`)) return;
    setBusy(p.id);
    try {
      await providerApi.remove(p.id);
      await load();
      await fetchProviders();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      {!encryptionAvailable && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Set <code className="font-mono">ENCRYPTION_KEY</code> on the server to
            add API keys for cloud providers.
          </span>
        </div>
      )}
      {providers.map((p) => (
        <div key={p.id} className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{p.name}</span>
                {p.local && <Badge variant="secondary">local</Badge>}
                {p.has_key && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.masked_key}
                  </span>
                )}
                {testResult[p.id] === true && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
                {testResult[p.id] === false && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="truncate font-mono text-xs text-muted-foreground">
                {p.base_url || "no base URL"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Switch
                checked={p.enabled}
                disabled={busy === p.id}
                onCheckedChange={(v) => toggle(p, v)}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={busy === p.id}
                onClick={() => test(p)}
              >
                {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Test"}
              </Button>
              {!p.local && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(p)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>

          {(p.requires_key || p.id === "custom") && (
            <div className="mt-3">
              {editing === p.id ? (
                <div className="space-y-2">
                  {p.id === "custom" && (
                    <Input
                      placeholder="Base URL (e.g. https://api.example.com/v1)"
                      value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)}
                    />
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Paste API key"
                      value={keyInput}
                      disabled={!encryptionAvailable}
                      onChange={(e) => setKeyInput(e.target.value)}
                    />
                    <Button size="sm" disabled={busy === p.id} onClick={() => save(p)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(null);
                        setKeyInput("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!encryptionAvailable && p.requires_key}
                  onClick={() => setEditing(p.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {p.has_key ? "Update key" : "Add API key"}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
