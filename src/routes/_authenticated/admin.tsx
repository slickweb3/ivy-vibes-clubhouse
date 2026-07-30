import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusChip, Sticker, MediaPlaceholder } from "@/components/ivy/primitives";
import { IvyWordmark } from "@/components/ivy/doodles";
import { getAdminStatus, getConnectionCards, refreshSocialFeed } from "@/lib/admin.functions";
import { projectConfig, displayValue } from "@/config/project";
import { faqEntries, ivyTvItems, loreChapters, memeMachine } from "@/data/site-content";
import { legalPages } from "@/data/legal";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — IvyVibing" },
      { name: "description", content: "Manage IvyVibing content, media and social connections." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-cream p-5 pop-static">
      <h3 className="font-display text-lg text-charcoal">{title}</h3>
      <p className="mt-1 text-sm text-charcoal/80">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchStatus = useServerFn(getAdminStatus);
  const fetchConnections = useServerFn(getConnectionCards);
  const runRefresh = useServerFn(refreshSocialFeed);

  const statusQuery = useQuery({ queryKey: ["admin", "status"], queryFn: () => fetchStatus() });
  const connectionsQuery = useQuery({
    queryKey: ["admin", "connections"],
    queryFn: () => fetchConnections(),
    enabled: statusQuery.data?.roles.includes("admin") ?? false,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const status = statusQuery.data;

  return (
    <div className="min-h-dvh bg-leaf">
      <header className="border-b-[3px] border-charcoal bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="IvyVibing home">
            <IvyWordmark />
          </Link>
          <Sticker tone="yellow">Admin</Sticker>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-charcoal/80 sm:inline">{status?.email ?? ""}</span>
            <Button
              onClick={signOut}
              variant="secondary"
              className="min-h-11 rounded-full bg-card px-4 font-display text-charcoal pop hover:bg-card"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl text-charcoal sm:text-4xl">Ivy control room</h1>
        <p className="mt-2 max-w-2xl text-charcoal/85">
          Nothing here is connected to Instagram or TikTok yet. Every panel reports its real state —
          no simulated connections, no invented data.
        </p>

        {statusQuery.isLoading ? (
          <p className="mt-6 text-charcoal/80">Checking your access…</p>
        ) : status?.setupRequired ? (
          <div className="mt-6 rounded-2xl bg-yellow p-5 pop-static">
            <h2 className="font-display text-lg text-charcoal">Role required</h2>
            <p className="mt-2 text-sm text-charcoal/85">
              You are signed in, but no admin or editor role has been granted to your account yet.
              An existing administrator must add a row to the roles table before these tools unlock.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <StatusChip status={status?.signedIn ? "ok" : "off"} label="Signed in" />
          <StatusChip
            status={status?.isStaff ? "ok" : "pending"}
            label={status?.roles.length ? `Roles: ${status.roles.join(", ")}` : "No role granted"}
          />
          <StatusChip status="pending" label="Social sync not configured" />
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-cream p-1.5 pop-static">
            {[
              ["overview", "Overview"],
              ["social", "Social"],
              ["media", "Media"],
              ["content", "Content"],
              ["legal", "Legal"],
              ["audit", "Audit log"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="min-h-10 rounded-full px-4 font-display text-sm data-[state=active]:bg-frog"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid gap-4 md:grid-cols-2">
            <Panel
              title="Project configuration"
              description="Token facts stay blank until Ivy's team verifies them."
            >
              <dl className="space-y-1.5 text-sm">
                {[
                  ["Blockchain", displayValue(projectConfig.blockchain)],
                  ["Contract address", displayValue(projectConfig.contractAddress)],
                  ["Launch date", displayValue(projectConfig.launchDate)],
                  ["Contact email", displayValue(projectConfig.contactEmail)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-charcoal/70">{label}</dt>
                    <dd className="font-display text-charcoal">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel
              title="Site health"
              description="The public feed endpoint reads only from this project's own cache."
            >
              <ul className="space-y-1.5 text-sm text-charcoal/85">
                <li>Feed endpoint: /api/social-feed</li>
                <li>Sync hook: /api/public/hooks/social-sync (requires SOCIAL_SYNC_SECRET)</li>
                <li>Sync interval: every {projectConfig.socialFeed.syncIntervalHours} hours</li>
                <li>Posts per platform: {projectConfig.socialFeed.postsPerPlatform}</li>
              </ul>
            </Panel>
          </TabsContent>

          <TabsContent value="social" className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  await runRefresh();
                  connectionsQuery.refetch();
                }}
                className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
              >
                Refresh feed now
              </Button>
            </div>

            {connectionsQuery.data?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {connectionsQuery.data.map((card) => (
                  <Panel
                    key={card.platform}
                    title={card.platform === "instagram" ? "Instagram" : "TikTok"}
                    description={
                      card.credentialsConfigured
                        ? "Credentials found. Complete the connection to begin syncing."
                        : `Not configured. Missing: ${card.missingEnvVars.join(", ") || "credentials"}.`
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <StatusChip
                        status={card.connected ? "ok" : "pending"}
                        label={card.connected ? "Connected" : "Not connected"}
                      />
                      <StatusChip
                        status="off"
                        label={`Last sync: ${card.lastSyncAt ?? "never"}`}
                      />
                      <StatusChip status="off" label={card.tokenRenewal} />
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <Panel
                title="Connections"
                description="Connection details load once an administrator role is granted and credentials exist."
              />
            )}

            <Panel
              title="Manual fallback posts"
              description="When no platform is connected, the site shows clearly labelled placeholders instead of inventing posts."
            >
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((slot) => (
                  <MediaPlaceholder key={slot} label={`Manual post ${slot}`} compact tone="leaf" />
                ))}
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="media" className="mt-6 grid gap-4 md:grid-cols-2">
            <Panel
              title="Media library"
              description="Upload targets for owner-approved photos and videos. Alt text is required on every item."
            />
            <Panel
              title="Ivy TV shelves"
              description={`${ivyTvItems.length} slots defined across ${new Set(ivyTvItems.map((item) => item.category)).size} categories.`}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6 grid gap-4 md:grid-cols-3">
            <Panel title="FAQ entries" description={`${faqEntries.length} published questions.`} />
            <Panel title="Lore chapters" description={`${loreChapters.length} chapters, dates unconfirmed.`} />
            <Panel title="Meme captions" description={`${memeMachine.captions.length} approved captions.`} />
          </TabsContent>

          <TabsContent value="legal" className="mt-6 grid gap-4 md:grid-cols-2">
            {legalPages.map((page) => (
              <Panel
                key={page.slug}
                title={page.title}
                description={`${page.sections.length} sections · draft pending professional review`}
              >
                <Link
                  to="/legal/$slug"
                  params={{ slug: page.slug }}
                  className="font-display text-sm text-charcoal underline underline-offset-4"
                >
                  View public page
                </Link>
              </Panel>
            ))}
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Panel
              title="Audit log"
              description="Every administrative change is recorded with the actor, action, entity and timestamp. No entries yet."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
