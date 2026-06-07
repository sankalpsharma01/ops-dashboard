import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Activity } from "lucide-react";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-border bg-surface/60 backdrop-blur">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary/15 grid place-items-center text-primary">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="font-display text-base font-semibold leading-tight">Operations</div>
            <div className="text-xs text-muted-foreground">Executive dashboard</div>
          </div>
        </div>
        <nav className="px-3 pb-4 flex md:flex-col gap-1">
          <NavItem to="/" icon={<LayoutDashboard className="size-4" />}>Overview</NavItem>
          <NavItem to="/reports" icon={<FileText className="size-4" />}>Reports</NavItem>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-8 md:py-12">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
      activeProps={{ "data-status": "active" } as Record<string, string>}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StateCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-8 text-center">
      <h3 className="font-display text-lg font-medium mb-1">{title}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
