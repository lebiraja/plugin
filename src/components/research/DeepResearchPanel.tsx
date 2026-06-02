import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
} from "lucide-react";
import { useDeepResearchStore } from "../../store/deepResearchStore";
import { useSettingsStore } from "../../store/settingsStore";
import { streamDeepResearch } from "../../api/stream";
import type { ResearchResult, ResearchStage } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { NumberTicker } from "../ui/number-ticker";
import { cn } from "@/lib/utils";

const STAGES: ResearchStage[] = ["planning", "searching", "reasoning", "synthesizing"];
const STAGE_LABEL: Record<string, string> = {
  idle: "Ready",
  planning: "Planning",
  searching: "Searching",
  reasoning: "Reasoning",
  synthesizing: "Synthesizing",
  complete: "Complete",
  cached: "Complete",
  error: "Error",
};

export const DeepResearchPanel: React.FC = () => {
  const [query, setQuery] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxSources, setMaxSources] = useState(15);

  const {
    currentResearch,
    progress,
    isResearching,
    error,
    setIsResearching,
    setError,
    setCurrentResearch,
    updateStage,
    addToHistory,
    clearCurrentResearch,
  } = useDeepResearchStore();

  const { settings } = useSettingsStore();

  const handleResearch = async () => {
    if (!query.trim()) return;
    setIsResearching(true);
    setError(null);
    clearCurrentResearch();

    try {
      for await (const event of streamDeepResearch({
        query,
        backend: settings.activeBackend,
        model: settings.activeModel,
        max_depth: maxDepth,
        max_sources: maxSources,
      })) {
        if (event.stage === "complete" || event.stage === "cached") {
          updateStage("complete", "Research complete", 100);
          const result = event.result as ResearchResult;
          setCurrentResearch(result);
          addToHistory(result);
        } else {
          updateStage(
            event.stage as ResearchStage,
            event.message || STAGE_LABEL[event.stage] || "",
            event.progress
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Research failed";
      setError(message);
      updateStage("error", message, 0);
    } finally {
      setIsResearching(false);
    }
  };

  const currentIndex = STAGES.indexOf(progress.stage as ResearchStage);

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl leading-none">Deep Research</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-hop reasoning with evidence synthesis
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Research Question</Label>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to research in depth?"
            rows={3}
            disabled={isResearching}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Research Depth</Label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              disabled={isResearching}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={1}>Basic (1 level)</option>
              <option value={2}>Detailed (2 levels)</option>
              <option value={3}>Comprehensive (3 levels)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Max Sources</Label>
            <select
              value={maxSources}
              onChange={(e) => setMaxSources(Number(e.target.value))}
              disabled={isResearching}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={5}>Quick (5 sources)</option>
              <option value={10}>Standard (10 sources)</option>
              <option value={15}>Thorough (15 sources)</option>
              <option value={20}>Comprehensive (20 sources)</option>
            </select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleResearch}
          disabled={isResearching || !query.trim()}
        >
          {isResearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Researching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Start Deep Research
            </>
          )}
        </Button>
      </div>

      {(isResearching || progress.stage !== "idle") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{STAGE_LABEL[progress.stage]}</span>
            <span className="font-mono text-muted-foreground">{progress.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress.stage === "error"
                  ? "bg-destructive"
                  : progress.stage === "complete"
                    ? "bg-emerald-500"
                    : "bg-primary"
              )}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{progress.message}</p>

          <div className="grid grid-cols-4 gap-2">
            {STAGES.map((stage, i) => {
              const active = progress.stage === stage;
              const done = currentIndex > i || progress.stage === "complete";
              return (
                <div
                  key={stage}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-center text-xs transition-colors",
                    active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : done
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {STAGE_LABEL[stage]}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h4 className="font-medium text-destructive">Research Failed</h4>
            <p className="mt-1 text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {currentResearch && (
        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
          {[
            { label: "Sources", value: currentResearch.evidence_count, decimals: 0 },
            { label: "Insights", value: currentResearch.reasoning_trace.length, decimals: 0 },
            { label: "Time", value: currentResearch.metadata.time_taken, decimals: 1, suffix: "s" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="flex items-center justify-center gap-1 font-mono text-2xl font-bold text-primary">
                <CheckCircle2 className="hidden h-0 w-0" />
                <NumberTicker value={s.value} decimalPlaces={s.decimals} suffix={s.suffix} />
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
