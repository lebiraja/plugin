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

      // Stage 1: Planning
      updateStage("planning", "Generating research plan...", 10);

      // Simulate stage progression (in real implementation, this would be SSE)
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

      // Conduct actual research
      const result = await deepResearchService.conductResearch({
        query,
        backend: activeBackend,
        model: activeModel,
        max_depth: maxDepth,
        max_sources: maxSources,
      });

      // Complete
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
        return <FileText className="w-5 h-5 text-gray-300 animate-pulse" />;
      case "searching":
        return <Search className="w-5 h-5 text-gray-300 animate-pulse" />;
      case "reasoning":
        return <Brain className="w-5 h-5 text-gray-300 animate-pulse" />;
      case "synthesizing":
        return <Lightbulb className="w-5 h-5 text-gray-300 animate-pulse" />;
      case "complete":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStageLabel = (stage: ResearchStage) => {
    switch (stage) {
      case "planning":
        return "Research Planning";
      case "searching":
        return "Multi-Level Search";
      case "reasoning":
        return "Multi-Hop Reasoning";
      case "synthesizing":
        return "Report Synthesis";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <div className="bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold text-white">Deep Research</h2>
      </div>

      {/* Research Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Research Question
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to research in depth?"
            className="w-full px-4 py-3 bg-glass-bg border border-glass-border text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
            rows={3}
            disabled={isResearching}
          />
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Research Depth
            </label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-glass-bg border border-glass-border text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
              disabled={isResearching}
            >
              <option value={1}>Basic (1 level)</option>
              <option value={2}>Detailed (2 levels)</option>
              <option value={3}>Comprehensive (3 levels)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Sources
            </label>
            <select
              value={maxSources}
              onChange={(e) => setMaxSources(Number(e.target.value))}
              className="w-full px-3 py-2 bg-glass-bg border border-glass-border text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
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
        <button
          onClick={handleResearch}
          disabled={isResearching || !query.trim()}
          className="w-full py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
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
        </button>
      </div>

      {/* Progress Indicator */}
      {(isResearching || progress.stage !== "idle") && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {getStageIcon(progress.stage)}
                <span className="text-gray-300">
                  {getStageLabel(progress.stage)}
                </span>
              </div>
              <span className="text-gray-400">{progress.progress}%</span>
            </div>
            <div className="w-full bg-glass-bg border border-glass-border rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress.stage === "error"
                    ? "bg-red-500"
                    : progress.stage === "complete"
                    ? "bg-green-500"
                    : "bg-primary"
                }`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{progress.message}</p>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {(
              ["planning", "searching", "reasoning", "synthesizing"] as const
            ).map((stage) => (
              <div
                key={stage}
                className={`p-2 rounded-lg text-center text-xs ${
                  progress.stage === stage
                    ? "bg-primary text-white"
                    : [
                        "planning",
                        "searching",
                        "reasoning",
                        "synthesizing",
                      ].indexOf(progress.stage) >
                      [
                        "planning",
                        "searching",
                        "reasoning",
                        "synthesizing",
                      ].indexOf(stage)
                    ? "bg-green-900/50 text-green-400"
                    : "bg-glass-bg border border-glass-border text-gray-400"
                }`}
              >
                {getStageLabel(stage)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-400">Research Failed</h4>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {currentResearch && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentResearch.evidence_count}
            </div>
            <div className="text-xs text-gray-400">Sources</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentResearch.reasoning_trace.length}
            </div>
            <div className="text-xs text-gray-400">Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {currentResearch.metadata.time_taken.toFixed(1)}s
            </div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
        </div>
      )}
    </div>
  );
};
