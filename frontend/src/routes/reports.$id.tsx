import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DashboardShell, PageHeader, StateCard } from "@/components/dashboard-shell";
import { fetchReport } from "@/lib/reports";

export const Route = createFileRoute("/reports/$id")({
  head: () => ({
    meta: [{ title: "Report — Operations Dashboard" }],
  }),
  component: ReportDetailPage,
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function ReportDetailPage() {
  const { id } = Route.useParams();
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id),
  });

  return (
    <DashboardShell>
      <Link
        to="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to reports
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-1/3 rounded bg-card/60 animate-pulse" />
          <div className="h-64 rounded-xl bg-card/40 animate-pulse" />
        </div>
      ) : error ? (
        <StateCard title="Couldn't load this report">{(error as Error).message}</StateCard>
      ) : !report ? (
        <StateCard title="Report not found">It may have been removed.</StateCard>
      ) : (
        <>
          <PageHeader eyebrow={report.report_type} title={report.title} />

          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <Meta icon={<Calendar className="size-3.5" />} label="Report date" value={formatDate(report.report_date)} />
            <Meta icon={<Tag className="size-3.5" />} label="Type" value={report.report_type} />
            <Meta icon={<Clock className="size-3.5" />} label="Created" value={formatDateTime(report.created_at)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <article className="lg:col-span-2 rounded-xl border border-border bg-card/60 p-8">
              {report.content ? (
                <div className="prose-report">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No content provided.</p>
              )}
            </article>

            <aside className="rounded-xl border border-border bg-card/60 p-6 h-fit">
              <h3 className="font-display text-base font-semibold mb-3">Metadata</h3>
              {report.metadata && Object.keys(report.metadata).length > 0 ? (
                <dl className="space-y-2 text-sm">
                  {Object.entries(report.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-border/60 last:border-0">
                      <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                      <dd className="font-medium text-right break-all">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No metadata available.</p>
              )}
            </aside>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated/60 px-3 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
