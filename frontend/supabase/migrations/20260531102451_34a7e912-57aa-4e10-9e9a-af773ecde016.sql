
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB
);

GRANT SELECT ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reports"
ON public.reports FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX reports_report_type_idx ON public.reports (report_type);

-- Seed sample data
INSERT INTO public.reports (report_date, report_type, title, content, metadata) VALUES
(CURRENT_DATE, 'Operations', 'Daily Operations Summary', '# Daily Operations Summary

Today saw **strong throughput** across all primary channels.

## Highlights
- Order volume up 12% WoW
- Average fulfillment time: 2.4h
- Zero critical incidents

## Next steps
1. Review warehouse staffing
2. Optimize routing for Zone B', '{"author":"J. Smith","region":"NA","priority":"high"}'::jsonb),

(CURRENT_DATE - 1, 'Incident', 'Network Latency Spike', '## Summary
Brief latency spike at 14:22 UTC, resolved within 8 minutes.

**Root cause:** upstream provider failover.

No customer impact reported.', '{"severity":"medium","duration_minutes":8}'::jsonb),

(CURRENT_DATE - 2, 'Finance', 'Weekly Revenue Report', '# Weekly Revenue

Revenue: **$1.24M** (+8.3% WoW)

- New customers: 312
- Churn: 1.1%
- LTV trending positive', '{"currency":"USD","period":"weekly"}'::jsonb),

(CURRENT_DATE - 3, 'Operations', 'Logistics Throughput', 'Fleet operating at 94% capacity. Maintenance scheduled for Sunday.', '{"fleet_utilization":0.94}'::jsonb),

(CURRENT_DATE - 4, 'Security', 'Quarterly Security Audit', '# Q-Audit Findings

All critical controls **passing**. Two medium findings remediated.', '{"findings":2,"status":"passed"}'::jsonb),

(CURRENT_DATE - 5, 'Performance', 'System Performance Review', 'API p95: 142ms. Database CPU avg 38%. Healthy.', '{"p95_ms":142}'::jsonb),

(CURRENT_DATE - 6, 'Operations', 'Vendor SLA Review', 'All vendors meeting SLA except VendorX (98.2%, threshold 99%).', '{"vendor_count":12,"breaches":1}'::jsonb),

(CURRENT_DATE - 7, 'Incident', 'Database Failover Drill', 'Planned failover executed successfully in 47s.', '{"planned":true}'::jsonb),

(CURRENT_DATE - 8, 'Finance', 'Expense Reconciliation', 'Monthly reconciliation complete. Variance < 0.1%.', '{"variance_pct":0.08}'::jsonb),

(CURRENT_DATE - 9, 'Performance', 'CDN Cache Hit Analysis', 'Cache hit rate: 96.4%. Origin load reduced 22% MoM.', '{"hit_rate":0.964}'::jsonb),

(CURRENT_DATE - 10, 'Operations', 'Inventory Snapshot', 'Stock levels healthy. 3 SKUs flagged for reorder.', '{"low_stock_skus":3}'::jsonb),

(CURRENT_DATE - 11, 'Security', 'Access Review', 'Reviewed 142 privileged accounts. 4 deprovisioned.', '{"reviewed":142,"removed":4}'::jsonb);
