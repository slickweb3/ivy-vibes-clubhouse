import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import { listAdminMedia, updateMediaItem, type AdminMediaRow } from "@/lib/admin.functions";
import { PLACEMENTS, PLACEMENT_LABELS, type Placement } from "@/types/media";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({
    meta: [
      { title: "Media library — IvyVibing admin" },
      {
        name: "description",
        content: "Moderate imported posts and owner uploads across the whole website.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const fetchMedia = useServerFn(listAdminMedia);
  const saveItem = useServerFn(updateMediaItem);

  const mediaQuery = useQuery({
    queryKey: ["admin", "media"],
    queryFn: () => fetchMedia(),
    retry: false,
  });

  const rows = mediaQuery.data ?? [];

  return (
    <AdminShell
      title="Media library"
      intro="One library powers Hero, Fresh Posts, Ivy TV, Hall of Fame and the Meme Machine. Edits here change only how an item appears on this website — the original platform post is never modified."
    >
      {mediaQuery.isError ? (
        <div className="rounded-2xl bg-yellow p-5 pop-static text-sm text-charcoal">
          An admin or editor role is required to load the media library.
        </div>
      ) : null}

      {rows.length === 0 && !mediaQuery.isLoading && !mediaQuery.isError ? (
        <div className="rounded-2xl bg-cream p-5 pop-static">
          <h2 className="font-display text-lg text-charcoal">Nothing imported yet</h2>
          <p className="mt-2 text-sm text-charcoal/85">
            Once Ivy&apos;s owner authorizes Instagram or TikTok, imported posts appear here with
            their original captions. No sample or placeholder records are ever inserted.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {rows.map((row) => (
          <MediaRow key={`${row.sourceType}:${row.sourceId}`} row={row} onSave={saveItem} onSaved={() => mediaQuery.refetch()} />
        ))}
      </div>
    </AdminShell>
  );
}

function MediaRow({
  row,
  onSave,
  onSaved,
}: {
  row: AdminMediaRow;
  onSave: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [websiteCaption, setWebsiteCaption] = useState(row.websiteCaption ?? "");
  const [altText, setAltText] = useState(row.altText);
  const [fallback, setFallback] = useState(row.fallbackThumbnailUrl ?? "");
  const [placements, setPlacements] = useState<Placement[]>(row.placements);
  const [flags, setFlags] = useState({
    isVisible: row.isVisible,
    isPinned: row.isPinned,
    isFeatured: row.isFeatured,
    allowAutoplay: row.allowAutoplay,
    allowCommunityReuse: row.allowCommunityReuse,
  });
  const [saving, setSaving] = useState(false);

  async function save(extra: Record<string, unknown> = {}) {
    setSaving(true);
    try {
      await onSave({
        data: {
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          websiteCaption: websiteCaption || null,
          altText,
          fallbackThumbnailUrl: fallback || null,
          placements,
          ...flags,
          ...extra,
        },
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-2xl bg-cream p-5 pop-static">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip
          status={row.approvalStatus === "approved" ? "ok" : row.approvalStatus === "rejected" ? "off" : "pending"}
          label={row.approvalStatus}
        />
        <span className="font-display text-sm text-charcoal capitalize">
          {row.platform ?? "Owner upload"} · {row.mediaKind}
        </span>
        {!row.isActive ? <StatusChip status="off" label="Unavailable upstream" /> : null}
        {row.permalink ? (
          <a
            className="ml-auto min-h-11 text-sm underline underline-offset-4"
            href={row.permalink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Original post
          </a>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        <Meta label="Source account" value={row.accountName ? `@${row.accountName}` : "—"} />
        <Meta label="External account ID" value={row.sourceAccountId ?? "—"} />
        <Meta label="Platform post ID" value={row.platformPostId ?? "—"} />
        <Meta label="Published" value={row.publishedAt ? new Date(row.publishedAt).toLocaleString() : "—"} />
        <Meta label="Approved" value={row.approvedAt ? new Date(row.approvedAt).toLocaleString() : "—"} />
        <Meta label="Approval rule" value={row.approvalSource ?? "—"} />
      </dl>

      <div className="mt-4 rounded-xl bg-card p-3">
        <p className="font-display text-xs tracking-[0.15em] text-charcoal/60 uppercase">
          Original caption (read-only)
        </p>
        <p className="mt-1 text-sm whitespace-pre-wrap text-charcoal/90">
          {row.originalCaption ?? "—"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-display text-charcoal">Website-only caption (optional)</span>
          <Input
            value={websiteCaption}
            onChange={(event) => setWebsiteCaption(event.target.value)}
            placeholder="Leave empty to use Ivy's own words"
            className="mt-1 min-h-11 bg-card"
          />
        </label>
        <label className="text-sm">
          <span className="font-display text-charcoal">Alt text</span>
          <Input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            className="mt-1 min-h-11 bg-card"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-display text-charcoal">Fallback thumbnail URL</span>
          <Input
            value={fallback}
            onChange={(event) => setFallback(event.target.value)}
            placeholder="Used when the platform poster URL expires"
            className="mt-1 min-h-11 bg-card"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="font-display text-sm text-charcoal">Placements</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLACEMENTS.map((placement) => {
            const active = placements.includes(placement);
            return (
              <button
                key={placement}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setPlacements((current) =>
                    active ? current.filter((p) => p !== placement) : [...current, placement],
                  )
                }
                className={`min-h-11 rounded-full px-4 font-display text-sm pop-static ${
                  active ? "bg-frog text-charcoal" : "bg-card text-charcoal hover:bg-leaf"
                }`}
              >
                {PLACEMENT_LABELS[placement]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="font-display text-sm text-charcoal">Presentation</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {(
            [
              ["isVisible", "Visible"],
              ["isPinned", "Pinned"],
              ["isFeatured", "Featured"],
              ["allowAutoplay", "Autoplay"],
              ["allowCommunityReuse", "Community / meme reuse"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(event) => setFlags((f) => ({ ...f, [key]: event.target.checked }))}
                className="h-5 w-5"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={saving}
          onClick={() => save()}
          className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
        >
          Save website presentation
        </Button>
        <Button
          disabled={saving}
          onClick={() => save({ approvalStatus: "approved", isVisible: true })}
          className="min-h-11 rounded-full bg-card px-5 font-display text-charcoal pop hover:bg-card"
        >
          Approve &amp; publish
        </Button>
        <Button
          disabled={saving}
          onClick={() => save({ approvalStatus: "rejected", isVisible: false })}
          className="min-h-11 rounded-full bg-pink px-5 font-display text-charcoal pop hover:bg-pink"
        >
          Hide from website
        </Button>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-charcoal/70">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-display text-charcoal">{value}</dd>
    </div>
  );
}
