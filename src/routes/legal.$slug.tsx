import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/ivy/header";
import { SiteFooter } from "@/components/ivy/sections-b";
import { CookieConsentProvider } from "@/components/ivy/cookie-consent";
import { Sticker } from "@/components/ivy/primitives";
import { getLegalPage, legalPages } from "@/data/legal";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const page = getLegalPage(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Page unavailable — IvyVibing" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.page.title} — IvyVibing`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.page.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.page.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => <LegalMissing message="This policy could not be loaded." />,
  notFoundComponent: () => <LegalMissing message="That policy page does not exist." />,
  component: LegalPageView,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <SiteNav isHome={false} />
      <main id="main" className="bg-cream">
        {children}
      </main>
      <SiteFooter />
    </CookieConsentProvider>
  );
}

function LegalMissing({ message }: { message: string }) {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl text-charcoal sm:text-4xl">Policy unavailable</h1>
        <p className="mt-3 text-charcoal/85">{message}</p>
        <ul className="mt-6 space-y-2">
          {legalPages.map((page) => (
            <li key={page.slug}>
              <Link
                to="/legal/$slug"
                params={{ slug: page.slug }}
                className="font-display text-charcoal underline underline-offset-4"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function LegalPageView() {
  const { page } = Route.useLoaderData();

  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        {page.needsLegalReview ? (
          <Sticker tone="yellow">Draft — requires professional legal review</Sticker>
        ) : null}
        <h1 className="mt-4 text-4xl leading-tight text-charcoal sm:text-5xl">{page.title}</h1>
        <p className="mt-3 text-lg text-charcoal/85">{page.summary}</p>

        <nav aria-label="On this page" className="mt-8 rounded-2xl bg-card p-5 pop-static">
          <h2 className="font-display text-base text-charcoal">On this page</h2>
          <ol className="mt-2 space-y-1">
            {page.sections.map((section, index) => (
              <li key={section.heading}>
                <a
                  href={`#section-${index}`}
                  className="inline-flex min-h-9 items-center text-sm text-charcoal/85 underline-offset-4 hover:underline"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-8">
          {page.sections.map((section, index) => (
            <section key={section.heading} id={`section-${index}`} className="scroll-mt-32">
              <h2 className="font-display text-2xl text-charcoal">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-relaxed text-charcoal/85">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <nav aria-label="Other policies" className="mt-14 border-t-[3px] border-charcoal pt-6">
          <h2 className="font-display text-base text-charcoal">Other policies</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {legalPages
              .filter((other) => other.slug !== page.slug)
              .map((other) => (
                <li key={other.slug}>
                  <Link
                    to="/legal/$slug"
                    params={{ slug: other.slug }}
                    className="inline-flex min-h-11 items-center rounded-full bg-leaf px-4 font-display text-sm text-charcoal pop-static"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </article>
    </Shell>
  );
}
