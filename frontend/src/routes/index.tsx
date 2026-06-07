import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, FileText, Calendar, Layers, Clock, Sparkles, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DashboardShell, PageHeader, StateCard } from "@/components/dashboard-shell";
import { fetchOverview } from "@/lib/reports";
import { useReportsRealtime } from "@/hooks/use-reports-realtime";

const WEBHOOK_URL = "YOUR_N8N_WEBHOOK_URL";

type GeneratedReport = {
  title: string;
  report_type: string;
  report_date: string | null;
  created_at: string;
  markdown: string;
  metadata: Record<string, unknown> | null;
};

function parseWebhookResponse(raw: unknown): GeneratedReport | null {
  // Webhook may return an object or an array containing one
  const payload = Array.isArray(raw) ? raw[0] : raw;
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  let markdown = "";
  let innerMeta: Record<string, unknown> | null = null;
  const rawContent = p.content;

  if (typeof rawContent === "string") {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === "object") {
        innerMeta = parsed as Record<string, unknown>;
        markdown = typeof (parsed as { content?: unknown }).content === "string"
          ? (parsed as { content: string }).content
          : rawContent;
      } else {
        markdown = String(parsed ?? "");
      }
    } catch {
      markdown = rawContent;
    }
  } else if (rawContent && typeof rawContent === "object") {
    innerMeta = rawContent as Record<string, unknown>;
    const inner = (rawContent as { content?: unknown }).content;
    markdown = typeof inner === "string" ? inner : JSON.stringify(rawContent);
  }

  const pick = (key: string) =>
    (p[key] as string | undefined) ??
    (innerMeta?.[key] as string | undefined);

  return {
    title: pick("title") ?? "Generated report",
    report_type: pick("report_type") ?? "Generated",
    report_date: pick("report_date") ?? null,
    created_at: pick("created_at") ?? new Date().toISOString(),
    markdown,
    metadata: (p.metadata as Record<string, unknown> | null) ?? innerMeta ?? null,
  };
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Operations Dashboard" },
      { name: "description", content: "Key operational metrics and the latest reports at a glance." },
    ],
  }),
  component: OverviewPage,
});

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function OverviewPage() {
  useReportsRealtime();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggeredAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const payload = await res.json();
      const parsed = parseWebhookResponse(payload);
      if (!parsed) throw new Error("Unexpected response shape");
      setGenerated(parsed);
      toast.success("Report generated");
      // Refresh background list too
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error("Failed to generate report", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBtn = (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {loading ? "Generating…" : "Generate report"}
    </button>
  );

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Live operations"
        title="Executive overview"
        description="Real-time snapshot of operational reporting across every business unit."
        actions={generateBtn}
      />

      {generated && (
        <section className="mb-6 rounded-xl border border-primary/40 bg-card/80 p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-flex w-fit items-center rounded-full bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 mb-2">
                Just generated · {generated.report_type}
              </span>
              <h2 className="font-display text-xl font-semibold leading-tight">{generated.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(generated.report_date)} · {formatDateTime(generated.created_at)}
              </p>
            </div>
            <button
              onClick={() => setGenerated(null)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Dismiss generated report"
            >
              <X className="size-3.5" /> Dismiss
            </button>
          </div>
          <article className="prose-report">
            {generated.markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generated.markdown}</ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">No content returned.</p>
            )}
          </article>
        </section>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : error ? (
        <StateCard title="Couldn't load metrics">{(error as Error).message}</StateCard>
      ) : !data || data.total === 0 ? (
        <StateCard title="No reports yet">Add reports to populate the dashboard.</StateCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric icon={<FileText className="size-4" />} label="Total reports" value={String(data.total)} />
            <Metric icon={<Calendar className="size-4" />} label="Latest report date" value={formatDate(data.latestDate)} />
            <Metric icon={<Layers className="size-4" />} label="Report categories" value={String(Object.keys(data.byType).length)} />
            <Metric
              icon={<Clock className="size-4" />}
              label="Most recent"
              value={data.mostRecent ? formatDateTime(data.mostRecent.created_at) : "—"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold">Reports by type</h2>
                <span className="text-xs text-muted-foreground">{data.total} total</span>
              </div>
              <div className="space-y-3">
                {Object.entries(data.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = (count / data.total) * 100;
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground tabular-nums">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-6 flex flex-col">
              <h2 className="font-display text-lg font-semibold mb-1">Most recent report</h2>
              <p className="text-xs text-muted-foreground mb-4">Latest entry in the pipeline</p>
              {data.mostRecent ? (
                <>
                  <span className="inline-flex w-fit items-center rounded-full bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 mb-3">
                    {data.mostRecent.report_type}
                  </span>
                  <h3 className="font-medium text-base mb-2 leading-snug">{data.mostRecent.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(data.mostRecent.report_date)} · {formatDateTime(data.mostRecent.created_at)}
                  </p>
                  <Link
                    to="/reports/$id"
                    params={{ id: data.mostRecent.id }}
                    className="mt-auto pt-4 inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
                  >
                    View report <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No reports available.</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated/60 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Browse all reports <ArrowRight className="size-4" />
            </Link>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <span className="grid place-items-center size-7 rounded-md bg-primary/10 text-primary">{icon}</span>
        {label}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl border border-border bg-card/40 animate-pulse" />
      ))}
    </div>
  );
}
