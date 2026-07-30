import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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
      { title: "Curated posts — IvyVibing admin" },
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
  const [error, setError] = useState<string | null>(null);

  const postsQuery = useQuery({
    queryKey: ["admin", "curated"],
    queryFn: () => fetchPosts(),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "curated"] });

  const addMutation = useMutation({
    mutationFn: () =>
      addPost({ data: { url: url.trim(), adminLabel: label.trim() || null, placements } }),
    onSuccess: () => {
      setUrl("");
      setLabel("");
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
            <span className="font-display">Admin label (private)</span>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Frog pose classic"
              className="mt-1 border-[3px] border-charcoal bg-background text-cream"
            />
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

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-pink px-3 py-2 text-sm text-charcoal">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={!url.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate()}
          className="mt-4 min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
        >
          {addMutation.isPending ? "Adding…" : "Add curated post"}
        </Button>
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
              <li key={post.id} className="rounded-xl border-[3px] border-charcoal bg-leaf/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status="ok" label={platformLabel(post.platform)} />
                  <span className="font-display text-sm text-charcoal">
                    {post.adminLabel ?? post.platformPostId}
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

                <div className="mt-3 flex flex-wrap gap-2">
                  {CURATED_PLACEMENTS.map((placement) => {
                    const active = post.placements.includes(placement);
                    return (
                      <button
                        key={placement}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          updateMutation.mutate({
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
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: post.id, isVisible: checked })
                      }
                    />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-sm text-charcoal">
                    <Switch
                      checked={post.isPinned}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: post.id, isPinned: checked })
                      }
                    />
                    Pinned
                  </label>
                  <label className="flex items-center gap-2 text-sm text-charcoal">
                    <Switch
                      checked={post.isFeatured}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: post.id, isFeatured: checked })
                      }
                    />
                    Featured
                  </label>
                  <Button
                    type="button"
                    onClick={() => deleteMutation.mutate(post.id)}
                    className="ml-auto min-h-9 rounded-full bg-pink px-4 font-display text-xs text-charcoal pop hover:bg-pink"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
