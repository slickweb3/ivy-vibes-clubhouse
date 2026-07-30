import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import {
  createCuratedPost,
  deleteCuratedPost,
  listCuratedPosts,
  updateCuratedPost,
} from "@/lib/curated-admin.functions";
import {
  CURATED_PLACEMENTS,
  CURATED_PLACEMENT_LABELS,
  platformLabel,
  type CuratedPlacement,
  type CuratedPost,
} from "@/types/curated";

export const Route = createFileRoute("/_authenticated/admin/curated")({
  head: () => ({
    meta: [
      { title: "Curated posts — ivy vibing admin" },
      {
        name: "description",
        content:
          "Add official Instagram and TikTok post links by URL and choose where each official embed appears on the site.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CuratedPage,
});

function CuratedPage() {
  const fetchPosts = useServerFn(listCuratedPosts);
  const addPost = useServerFn(createCuratedPost);
  const editPost = useServerFn(updateCuratedPost);
  const removePost = useServerFn(deleteCuratedPost);
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [placements, setPlacements] = useState<CuratedPlacement[]>(["fresh_posts"]);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instagram /p/ and /reel/ URLs contain only a shortcode — never the account
  // handle — and this workflow never scrapes or calls an API, so ownership can
  // only be confirmed by a human opening the original post.
  const looksInstagram = /instagram\.com/i.test(url);
  const needsOwnershipConfirmation = looksInstagram && !ownershipConfirmed;

  const postsQuery = useQuery({
    queryKey: ["admin", "curated"],
    queryFn: () => fetchPosts(),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "curated"] });

  const addMutation = useMutation({
    mutationFn: () =>
      addPost({
        data: {
          url: url.trim(),
          adminLabel: label.trim() || null,
          placements,
          instagramOwnershipConfirmed: ownershipConfirmed,
        },
      }),
    onSuccess: () => {
      setUrl("");
      setLabel("");
      setOwnershipConfirmed(false);
      setError(null);
      void invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Parameters<typeof editPost>[0]["data"]) => editPost({ data: input }),
    onSuccess: () => void invalidate(),
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePost({ data: { id } }),
    onSuccess: () => void invalidate(),
    onError: (err: Error) => setError(err.message),
  });

  const posts = postsQuery.data ?? [];

  return (
    <AdminShell
      title="Curated official posts"
      intro="Paste a public Instagram or TikTok post link. The site stores only the link, the post id and the platform's own embed URL — never Ivy's media or captions. Her words stay inside the official embed."
    >
      <div className="rounded-2xl bg-frog p-5 pop-static">
        <p className="font-display text-lg text-charcoal">
          Official embed only — media and original captions remain hosted by Instagram/TikTok.
        </p>
      </div>

      <section className="rounded-2xl bg-card p-5 pop-static">
        <h2 className="font-display text-xl text-charcoal">Add a post by URL</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-charcoal">
            <span className="font-display">Public post link</span>
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.instagram.com/reel/... or https://www.tiktok.com/@ivyvibing/video/..."
              className="mt-1 border-[3px] border-charcoal bg-background text-cream"
            />
          </label>
          <label className="text-sm text-charcoal">
            <span className="font-display">Website-only label — not Ivy&rsquo;s caption</span>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Frog pose classic"
              className="mt-1 border-[3px] border-charcoal bg-background text-cream"
            />
            <span className="mt-1 block text-xs text-charcoal/70">
              Internal navigation copy only. Ivy&rsquo;s original caption stays inside the official
              embed and is never rewritten here.
            </span>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="font-display text-sm text-charcoal">Where it appears</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CURATED_PLACEMENTS.map((placement) => {
              const active = placements.includes(placement);
              return (
                <button
                  key={placement}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setPlacements((current) =>
                      current.includes(placement)
                        ? current.filter((item) => item !== placement)
                        : [...current, placement],
                    )
                  }
                  className={`min-h-11 rounded-full px-4 font-display text-sm pop-static ${
                    active ? "bg-frog text-charcoal" : "bg-leaf/60 text-charcoal"
                  }`}
                >
                  {CURATED_PLACEMENT_LABELS[placement]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 rounded-xl bg-yellow p-4 text-sm text-charcoal">
          <p className="font-display">Instagram ownership must be confirmed by a human</p>
          <p className="mt-1">
            An Instagram <code>/p/</code> or <code>/reel/</code> link contains only the post
            shortcode — not the account handle — and this workflow never scrapes or calls an API, so
            the account cannot be checked automatically. TikTok links do contain the handle, so
            those are validated against @ivyvibing automatically.
          </p>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={ownershipConfirmed}
              onChange={(event) => setOwnershipConfirmed(event.target.checked)}
              className="mt-1 size-5 accent-[#174F36]"
            />
            <span>
              I opened the original post and verified it belongs to <strong>@frogqueenivy</strong>.
            </span>
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-pink px-3 py-2 text-sm text-charcoal">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={!url.trim() || needsOwnershipConfirmation || addMutation.isPending}
          onClick={() => addMutation.mutate()}
          className="mt-4 min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog disabled:opacity-70"
        >
          {addMutation.isPending ? "Adding…" : "Add curated post"}
        </Button>
        {needsOwnershipConfirmation ? (
          <p className="mt-2 text-xs text-charcoal/75">
            Tick the confirmation above to add an Instagram post.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl text-charcoal">Curated library</h2>
          <StatusChip
            status={posts.length > 0 ? "ok" : "off"}
            label={`${posts.length} post${posts.length === 1 ? "" : "s"}`}
          />
        </div>

        {postsQuery.isLoading ? (
          <p className="mt-4 text-sm text-charcoal/80">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/80">
            Nothing curated yet. Add a public post link above.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {posts.map((post: CuratedPost) => (
              <CuratedRow
                key={post.id}
                post={post}
                onUpdate={(input) => updateMutation.mutate(input)}
                onDelete={() => deleteMutation.mutate(post.id)}
                saving={updateMutation.isPending}
              />
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

interface CuratedRowProps {
  post: CuratedPost;
  onUpdate: (input: {
    id: string;
    adminLabel?: string | null;
    placements?: CuratedPlacement[];
    isVisible?: boolean;
    isPinned?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
  }) => void;
  onDelete: () => void;
  saving: boolean;
}

function CuratedRow({ post, onUpdate, onDelete, saving }: CuratedRowProps) {
  const [labelDraft, setLabelDraft] = useState(post.adminLabel ?? "");
  const [orderDraft, setOrderDraft] = useState(String(post.displayOrder));

  useEffect(() => {
    setLabelDraft(post.adminLabel ?? "");
    setOrderDraft(String(post.displayOrder));
  }, [post.adminLabel, post.displayOrder]);

  const dirty =
    labelDraft.trim() !== (post.adminLabel ?? "") ||
    (Number(orderDraft) || 0) !== post.displayOrder;

  return (
    <li className="rounded-xl border-[3px] border-charcoal bg-leaf/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status="ok" label={platformLabel(post.platform)} />
        <span className="font-display text-sm text-charcoal">
          {post.adminLabel ?? post.platformPostId}
        </span>
        <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-charcoal/75">
          @{post.sourceAccountHandle}
        </span>
        <a
          href={post.originalPostUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ivy underline underline-offset-4"
        >
          Open original
        </a>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <label className="text-sm text-charcoal">
          <span className="font-display text-xs uppercase tracking-wide">
            Website-only label — not Ivy&rsquo;s caption
          </span>
          <Input
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            placeholder="Internal label"
            className="mt-1 border-[3px] border-charcoal bg-background text-cream"
          />
        </label>
        <label className="text-sm text-charcoal">
          <span className="font-display text-xs uppercase tracking-wide">Display order</span>
          <Input
            type="number"
            value={orderDraft}
            onChange={(event) => setOrderDraft(event.target.value)}
            className="mt-1 border-[3px] border-charcoal bg-background text-cream"
          />
        </label>
        <Button
          type="button"
          disabled={!dirty || saving}
          onClick={() =>
            onUpdate({
              id: post.id,
              adminLabel: labelDraft.trim() || null,
              displayOrder: Number(orderDraft) || 0,
            })
          }
          className="min-h-11 rounded-full bg-frog px-5 font-display text-sm text-charcoal pop hover:bg-frog disabled:opacity-60"
        >
          Save
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CURATED_PLACEMENTS.map((placement) => {
          const active = post.placements.includes(placement);
          return (
            <button
              key={placement}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onUpdate({
                  id: post.id,
                  placements: active
                    ? post.placements.filter((item) => item !== placement)
                    : [...post.placements, placement],
                })
              }
              className={`min-h-9 rounded-full px-3 font-display text-xs pop-static ${
                active ? "bg-frog text-charcoal" : "bg-card text-charcoal/70"
              }`}
            >
              {CURATED_PLACEMENT_LABELS[placement]}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Switch
            checked={post.isVisible}
            onCheckedChange={(checked) => onUpdate({ id: post.id, isVisible: checked })}
          />
          Visible
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Switch
            checked={post.isPinned}
            onCheckedChange={(checked) => onUpdate({ id: post.id, isPinned: checked })}
          />
          Pinned
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Switch
            checked={post.isFeatured}
            onCheckedChange={(checked) => onUpdate({ id: post.id, isFeatured: checked })}
          />
          Featured
        </label>
        <Button
          type="button"
          onClick={onDelete}
          className="ml-auto min-h-9 rounded-full bg-pink px-4 font-display text-xs text-charcoal pop hover:bg-pink"
        >
          Remove
        </Button>
      </div>
    </li>
  );
}
