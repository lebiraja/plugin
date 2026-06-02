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
} from "lucide-react";
import { ResearchResult } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface ResearchResultsViewProps {
  research: ResearchResult;
}

function confidenceLabel(c: number) {
  if (c >= 0.8) return { label: "High", variant: "success" as const };
  if (c >= 0.6) return { label: "Medium", variant: "secondary" as const };
  return { label: "Low", variant: "outline" as const };
}

function Section({
  id,
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {expanded && <div className="border-t border-border p-4">{children}</div>}
    </Card>
  );
}

export const ResearchResultsView: React.FC<ResearchResultsViewProps> = ({
  research,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["summary"]));
  const toggle = (s: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const metaCards = [
    { label: "Sources", value: research.evidence_count },
    { label: "Searches", value: research.metadata.searches_performed },
    { label: "Insights", value: research.reasoning_trace.length },
    { label: "Duration", value: `${research.metadata.time_taken.toFixed(1)}s` },
    { label: "LLM Calls", value: research.metadata.llm_calls },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="font-display text-2xl">{research.plan.main_question}</h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {research.research_id} · {new Date(research.created_at).toLocaleString()}
        </p>
        <div className="mt-5 grid grid-cols-5 gap-3">
          {metaCards.map((m) => (
            <div key={m.label} className="rounded-lg border border-border p-3 text-center">
              <div className="font-mono text-xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Section
        id="summary"
        title="Executive Summary"
        icon={<FileText className="h-5 w-5 text-primary" />}
        expanded={expanded.has("summary")}
        onToggle={toggle}
      >
        <MarkdownRenderer content={research.final_report.executive_summary} />
      </Section>

      {research.final_report.insights.length > 0 && (
        <Section
          id="insights"
          title={`Key Insights (${research.final_report.insights.length})`}
          icon={<Lightbulb className="h-5 w-5 text-primary" />}
          expanded={expanded.has("insights")}
          onToggle={toggle}
        >
          <div className="space-y-3">
            {research.final_report.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {research.final_report.recommendations.length > 0 && (
        <Section
          id="recommendations"
          title={`Recommendations (${research.final_report.recommendations.length})`}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          expanded={expanded.has("recommendations")}
          onToggle={toggle}
        >
          <div className="space-y-3">
            {research.final_report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <p className="text-sm text-muted-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        id="reasoning"
        title={`Reasoning Trace (${research.reasoning_trace.length} steps)`}
        icon={<Brain className="h-5 w-5 text-primary" />}
        expanded={expanded.has("reasoning")}
        onToggle={toggle}
      >
        <div className="space-y-3">
          {research.reasoning_trace.map((step, idx) => {
            const conf = confidenceLabel(step.confidence);
            return (
              <div
                key={idx}
                className="space-y-2 rounded-lg border-l-2 border-primary bg-muted/40 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    STEP {step.step}
                  </span>
                  <Badge variant={conf.variant}>{conf.label}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(step.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <h4 className="text-sm font-medium">{step.question}</h4>
                <div className="flex items-start gap-2">
                  <Quote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{step.finding}</p>
                </div>
                {step.contradictions.length > 0 && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="mb-1 text-xs font-medium text-amber-400">
                          Contradictions Detected
                        </p>
                        {step.contradictions.map((c, cIdx) => (
                          <p key={cIdx} className="text-xs text-amber-200/80">
                            • {c}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="evidence"
        title={`Top Evidence Sources (${research.top_evidence.length})`}
        icon={<FileText className="h-5 w-5 text-primary" />}
        expanded={expanded.has("evidence")}
        onToggle={toggle}
      >
        <div className="space-y-3">
          {research.top_evidence.map((e, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium">{e.title}</h4>
                <a
                  href={e.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{e.snippet}</p>
              <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                <span>Quality {(e.quality_score * 100).toFixed(0)}%</span>
                <span>Relevance {(e.relevance_score * 100).toFixed(0)}%</span>
                <span>{e.word_count} words</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="citations"
        title={`Citations (${research.citations.length})`}
        icon={<Quote className="h-5 w-5 text-muted-foreground" />}
        expanded={expanded.has("citations")}
        onToggle={toggle}
      >
        <div className="space-y-2">
          {research.citations.map((c) => (
            <div key={c.id} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-muted-foreground">[{c.id}]</span>
              <div className="flex-1">
                <p>{c.title}</p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-xs text-primary hover:underline"
                >
                  {c.url}
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {research.final_report.caveats.length > 0 && (
        <Section
          id="caveats"
          title={`Caveats & Limitations (${research.final_report.caveats.length})`}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
          expanded={expanded.has("caveats")}
          onToggle={toggle}
        >
          <div className="space-y-2">
            {research.final_report.caveats.map((caveat, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-amber-400">⚠</span>
                <p className="text-sm text-muted-foreground">{caveat}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};
