import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/connections", label: "Connections" },
  { to: "/admin/media", label: "Media library" },
  { to: "/admin/token", label: "Token & chart" },
  { to: "/admin/settings", label: "Automation" },
] as const;

export function AdminNav() {
  return (
    <nav
      aria-label="Admin sections"
      className="border-b-[3px] border-charcoal bg-cream/70 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-2 sm:px-6">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              activeOptions={{ exact: link.to === "/admin" }}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 font-display text-sm text-charcoal transition-colors hover:bg-leaf",
              )}
              activeProps={{ className: "bg-frog pop-static" }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-leaf">
      <AdminNav />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl text-charcoal sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-charcoal/85">{intro}</p>
        <div className="mt-8 space-y-6">{children}</div>
      </main>
    </div>
  );
}
