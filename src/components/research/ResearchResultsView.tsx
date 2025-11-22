import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Quote,
  Download,
} from "lucide-react";
import { ResearchResult } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface ResearchResultsViewProps {
  research: ResearchResult;
}

export const ResearchResultsView: React.FC<ResearchResultsViewProps> = ({
  research,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-orange-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-glass-bg backdrop-blur-sm border border-glass-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {research.plan.main_question}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>Research ID: {research.research_id}</span>
              <span>•</span>
              <span>
                {new Date(research.created_at).toLocaleDateString()} at{" "}
                {new Date(research.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Export Report"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-glass-bg border border-glass-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {research.evidence_count}
            </div>
            <div className="text-xs text-gray-300">Sources</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {research.metadata.searches_performed}
            </div>
            <div className="text-xs text-gray-300">Searches</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {research.reasoning_trace.length}
            </div>
            <div className="text-xs text-gray-300">Insights</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {research.metadata.time_taken.toFixed(1)}s
            </div>
            <div className="text-xs text-gray-400">Duration</div>
          </div>
          <div className="bg-glass-bg border border-glass-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {research.metadata.llm_calls}
            </div>
            <div className="text-xs text-gray-300">LLM Calls</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("summary")}
          className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              Executive Summary
            </h3>
          </div>
          {expandedSections.has("summary") ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has("summary") && (
          <div className="p-4 border-t border-gray-700">
            <MarkdownRenderer
              content={research.final_report.executive_summary}
              className="text-gray-300"
            />
          </div>
        )}
      </div>

      {/* Key Insights */}
      {research.final_report.insights.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("insights")}
            className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">
                Key Insights ({research.final_report.insights.length})
              </h3>
            </div>
            {expandedSections.has("insights") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has("insights") && (
            <div className="p-4 border-t border-gray-700 space-y-3">
              {research.final_report.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {research.final_report.recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("recommendations")}
            className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">
                Recommendations ({research.final_report.recommendations.length})
              </h3>
            </div>
            {expandedSections.has("recommendations") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has("recommendations") && (
            <div className="p-4 border-t border-gray-700 space-y-3">
              {research.final_report.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="text-gray-300">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reasoning Trace */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("reasoning")}
          className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              Reasoning Trace ({research.reasoning_trace.length} steps)
            </h3>
          </div>
          {expandedSections.has("reasoning") ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has("reasoning") && (
          <div className="p-4 border-t border-gray-700 space-y-4">
            {research.reasoning_trace.map((step, idx) => (
              <div
                key={idx}
                className="bg-gray-750 rounded-lg p-4 space-y-3 border-l-4 border-purple-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-bold text-purple-400">
                        STEP {step.step}
                      </span>
                      <span
                        className={`text-xs font-medium ${getConfidenceColor(
                          step.confidence
                        )}`}
                      >
                        {getConfidenceLabel(step.confidence)} Confidence
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(step.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <h4 className="font-medium text-white mb-2">
                      {step.question}
                    </h4>
                    <div className="flex items-start space-x-2">
                      <Quote className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                      <p className="text-gray-300 text-sm">{step.finding}</p>
                    </div>
                  </div>
                </div>

                {step.contradictions.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-yellow-400 mb-1">
                          Contradictions Detected
                        </p>
                        {step.contradictions.map((contradiction, cIdx) => (
                          <p key={cIdx} className="text-xs text-yellow-200">
                            • {contradiction}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Evidence Sources */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("evidence")}
          className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              Top Evidence Sources ({research.top_evidence.length})
            </h3>
          </div>
          {expandedSections.has("evidence") ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has("evidence") && (
          <div className="p-4 border-t border-gray-700 space-y-3">
            {research.top_evidence.map((evidence, idx) => (
              <div key={idx} className="bg-gray-750 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white flex-1">
                    {evidence.title}
                  </h4>
                  <a
                    href={evidence.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 ml-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-400 mb-3">{evidence.snippet}</p>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-gray-500">
                    Quality: {(evidence.quality_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-500">
                    Relevance: {(evidence.relevance_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-500">
                    {evidence.word_count} words
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citations */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("citations")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Quote className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">
              Citations ({research.citations.length})
            </h3>
          </div>
          {expandedSections.has("citations") ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has("citations") && (
          <div className="p-4 border-t border-gray-700 space-y-2">
            {research.citations.map((citation) => (
              <div
                key={citation.id}
                className="flex items-start space-x-3 text-sm"
              >
                <span className="text-gray-500 font-mono">[{citation.id}]</span>
                <div className="flex-1">
                  <p className="text-gray-300">{citation.title}</p>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-xs break-all"
                  >
                    {citation.url}
                  </a>
                  <p className="text-gray-500 text-xs mt-1">
                    Accessed: {citation.accessed}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caveats */}
      {research.final_report.caveats.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("caveats")}
            className="w-full p-4 flex items-center justify-between hover:bg-glass-hover transition-colors"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">
                Caveats & Limitations ({research.final_report.caveats.length})
              </h3>
            </div>
            {expandedSections.has("caveats") ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has("caveats") && (
            <div className="p-4 border-t border-gray-700 space-y-2">
              {research.final_report.caveats.map((caveat, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-orange-400">⚠</span>
                  <p className="text-gray-300 text-sm">{caveat}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
