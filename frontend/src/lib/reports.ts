import { supabase } from "@/integrations/supabase/client";

export type Report = {
  id: string;
  created_at: string;
  report_date: string;
  report_type: string;
  title: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
};

export const PAGE_SIZE = 8;

export async function fetchOverview() {
  const { data: all, error } = await supabase
    .from("reports")
    .select("id, created_at, report_date, report_type, title")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (all ?? []) as Pick<Report, "id" | "created_at" | "report_date" | "report_type" | "title">[];
  const byType: Record<string, number> = {};
  for (const r of rows) byType[r.report_type] = (byType[r.report_type] ?? 0) + 1;
  return {
    total: rows.length,
    latestDate: rows[0]?.report_date ?? null,
    mostRecent: rows[0] ?? null,
    byType,
  };
}

export async function fetchReportTypes(): Promise<string[]> {
  const { data, error } = await supabase.from("reports").select("report_type");
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.report_type))).sort();
}

export async function fetchReports(opts: {
  search: string;
  type: string;
  page: number;
}) {
  const from = (opts.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let q = supabase
    .from("reports")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (opts.search.trim()) q = q.ilike("title", `%${opts.search.trim()}%`);
  if (opts.type && opts.type !== "all") q = q.eq("report_type", opts.type);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as Report[], total: count ?? 0 };
}

export async function fetchReport(id: string): Promise<Report> {
  const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Report not found");
  return data as Report;
}
