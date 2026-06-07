import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { z } from "zod";
import { DashboardShell, PageHeader, StateCard } from "@/components/dashboard-shell";
import { fetchReports, fetchReportTypes, PAGE_SIZE } from "@/lib/reports";
import { useReportsRealtime } from "@/hooks/use-reports-realtime";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  type: z.string().optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — Operations Dashboard" },
      { name: "description", content: "Search, filter, and browse every operational report." },
    ],
  }),
  validateSearch: searchSchema,
  component: ReportsListPage,
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type ReportsSearch = z.infer<typeof searchSchema>;

function ReportsListPage() {
  useReportsRealtime();
  const { q, type, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/reports/" });

  const typesQ = useQuery({ queryKey: ["report-types"], queryFn: fetchReportTypes });
  const listQ = useQuery({
    queryKey: ["reports", q, type, page],
    queryFn: () => fetchReports({ search: q, type, page }),
  });

  const totalPages = listQ.data ? Math.max(1, Math.ceil(listQ.data.total / PAGE_SIZE)) : 1;

  return (
    <DashboardShell>
      <PageHeader eyebrow="Archive" title="All reports" description="Filter, search, and dive into individual reports." />

      <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-border bg-surface-elevated/40">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title…"
              value={q}
              onChange={(e) =>
                navigate({ search: (prev: ReportsSearch) => ({ ...prev, q: e.target.value, page: 1 }), replace: true })
              }
              className="w-full bg-input/60 border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <select
            value={type}
            onChange={(e) =>
              navigate({ search: (prev: ReportsSearch) => ({ ...prev, type: e.target.value, page: 1 }), replace: true })
            }
            className="bg-input/60 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-w-44"
          >
            <option value="all">All types</option>
            {(typesQ.data ?? []).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {listQ.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading reports…</div>
        ) : listQ.error ? (
          <div className="p-10">
            <StateCard title="Couldn't load reports">{(listQ.error as Error).message}</StateCard>
          </div>
        ) : !listQ.data || listQ.data.rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-lg font-medium mb-1">No reports found</p>
            <p className="text-sm text-muted-foreground">Try clearing filters or adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <div className="col-span-6">Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Report date</div>
              <div className="col-span-2 text-right">Created</div>
            </div>
            <ul className="divide-y divide-border">
              {listQ.data.rows.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/reports/$id"
                    params={{ id: r.id }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors group"
                  >
                    <div className="md:col-span-6 font-medium flex items-center gap-2 min-w-0">
                      <span className="truncate">{r.title}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="md:col-span-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                        {r.report_type}
                      </span>
                    </div>
                    <div className="md:col-span-2 text-sm text-muted-foreground">{formatDate(r.report_date)}</div>
                    <div className="md:col-span-2 text-sm text-muted-foreground md:text-right tabular-nums">
                      {formatDate(r.created_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between px-5 py-4 border-t border-border text-sm">
              <div className="text-muted-foreground">
                Page <span className="text-foreground tabular-nums">{page}</span> of{" "}
                <span className="text-foreground tabular-nums">{totalPages}</span> · {listQ.data.total} total
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => navigate({ search: (p: ReportsSearch) => ({ ...p, page: page - 1 }), replace: true })}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => navigate({ search: (p: ReportsSearch) => ({ ...p, page: page + 1 }), replace: true })}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-secondary transition-colors"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
