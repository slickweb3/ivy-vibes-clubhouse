import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getLegalPage } from "@/data/content";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const page = getLegalPage(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — IvyVibing" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.page.title} — IvyVibing`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.page.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.page.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => <LegalShell title="This page didn't load" body={["Try again shortly."]} />,
  notFoundComponent: () => <LegalShell title="Page not found" body={["That legal page doesn't exist."]} />,
  component: LegalPage,
});

function LegalShell({ title, body, updatedAt }: { title: string; body: string[]; updatedAt?: string | null }) {
  return (
    <main className="min-h-dvh bg-cream py-16">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Link to="/" className="inline-flex rounded-full bg-frog px-4 py-2 font-display text-sm pop">
          ← Back to the clubhouse
        </Link>
        <h1 className="mt-8 text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {updatedAt ?? "Coming Soon"}
        </p>
        <div className="mt-8 space-y-5 rounded-3xl bg-card p-6 pop-static sm:p-8">
          {body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed sm:text-base">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}

function LegalPage() {
  const { page } = Route.useLoaderData();
  return <LegalShell title={page.title} body={page.body} updatedAt={page.updatedAt} />;
}
