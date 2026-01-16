import React, { useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  FileText,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDeepResearchStore } from "../../store/deepResearchStore";
import { useSettingsStore } from "../../store/settingsStore";
import { deepResearchService } from "../../services/deepResearchService";
import { ResearchStage } from "../../types";

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
  const activeBackend = settings.activeBackend;
  const activeModel = settings.activeModel;

  const handleResearch = async () => {
    if (!query.trim()) return;

    try {
      setIsResearching(true);
      setError(null);
      clearCurrentResearch();

      updateStage("planning", "Generating research plan...", 10);

      setTimeout(() => {
        updateStage("searching", "Conducting multi-level search...", 30);
      }, 1000);

      setTimeout(() => {
        updateStage(
          "reasoning",
          "Analyzing evidence with multi-hop reasoning...",
          60
        );
      }, 3000);

      setTimeout(() => {
        updateStage("synthesizing", "Synthesizing final report...", 85);
      }, 5000);

      const result = await deepResearchService.conductResearch({
        query,
        backend: activeBackend,
        model: activeModel,
        max_depth: maxDepth,
        max_sources: maxSources,
      });

      updateStage("complete", "Research complete!", 100);
      setCurrentResearch(result);
      addToHistory(result);
      setIsResearching(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Research failed";
      setError(errorMessage);
      updateStage("error", errorMessage, 0);
    }
  };

  const getStageIcon = (stage: ResearchStage) => {
    switch (stage) {
      case "planning":
        return <FileText className="w-5 h-5 text-gray-400 animate-pulse" />;
      case "searching":
        return <Search className="w-5 h-5 text-gray-400 animate-pulse" />;
      case "reasoning":
        return <Brain className="w-5 h-5 text-gray-400 animate-pulse" />;
      case "synthesizing":
        return <Lightbulb className="w-5 h-5 text-gray-400 animate-pulse" />;
      case "complete":
        return <CheckCircle2 className="w-5 h-5 text-accent-green" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-accent-red" />;
      default:
        return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStageLabel = (stage: ResearchStage) => {
    switch (stage) {
      case "planning":
        return "Planning";
      case "searching":
        return "Searching";
      case "reasoning":
        return "Reasoning";
      case "synthesizing":
        return "Synthesizing";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <div className="liquid-glass p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Deep Research</h2>
          <p className="text-sm text-gray-500">Multi-hop reasoning with evidence synthesis</p>
        </div>
      </div>

      {/* Research Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Research Question
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to research in depth?"
            className="liquid-input resize-none"
            rows={3}
            disabled={isResearching}
          />
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Research Depth
            </label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="liquid-select"
              disabled={isResearching}
            >
              <option value={1}>Basic (1 level)</option>
              <option value={2}>Detailed (2 levels)</option>
              <option value={3}>Comprehensive (3 levels)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Max Sources
            </label>
            <select
              value={maxSources}
              onChange={(e) => setMaxSources(Number(e.target.value))}
              className="liquid-select"
              disabled={isResearching}
            >
              <option value={5}>Quick (5 sources)</option>
              <option value={10}>Standard (10 sources)</option>
              <option value={15}>Thorough (15 sources)</option>
              <option value={20}>Comprehensive (20 sources)</option>
            </select>
          </div>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleResearch}
          disabled={isResearching || !query.trim()}
          className="w-full liquid-button-primary py-3.5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResearching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Researching...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Start Deep Research</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Progress Indicator */}
      {(isResearching || progress.stage !== "idle") && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {getStageIcon(progress.stage)}
                <span className="text-gray-300">
                  {getStageLabel(progress.stage)}
                </span>
              </div>
              <span className="text-gray-500">{progress.progress}%</span>
            </div>
            <div className="liquid-progress">
              <div
                className={`liquid-progress-fill ${
                  progress.stage === "error"
                    ? "!bg-accent-red"
                    : progress.stage === "complete"
                    ? "!bg-accent-green"
                    : ""
                }`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{progress.message}</p>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {(
              ["planning", "searching", "reasoning", "synthesizing"] as const
            ).map((stage) => {
              const stageIndex = ["planning", "searching", "reasoning", "synthesizing"].indexOf(stage);
              const currentIndex = ["planning", "searching", "reasoning", "synthesizing"].indexOf(progress.stage);
              const isActive = progress.stage === stage;
              const isComplete = currentIndex > stageIndex;

              return (
                <div
                  key={stage}
                  className={`p-2 rounded-xl text-center text-xs transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : isComplete
                      ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                      : "bg-liquid-frosted border border-liquid-border text-gray-500"
                  }`}
                >
                  {getStageLabel(stage)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-accent-red/10 border border-accent-red/30 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-accent-red">Research Failed</h4>
            <p className="text-sm text-accent-red/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {currentResearch && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-liquid-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentResearch.evidence_count}
            </div>
            <div className="text-xs text-gray-500">Sources</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentResearch.reasoning_trace.length}
            </div>
            <div className="text-xs text-gray-500">Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-green">
              {currentResearch.metadata.time_taken.toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500">Time</div>
          </div>
        </div>
      )}
    </div>
  );
};
