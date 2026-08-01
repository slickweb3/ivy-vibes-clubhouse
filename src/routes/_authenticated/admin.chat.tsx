import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import { Button } from "@/components/ui/button";
import { getAdminChat, moderateChatMessage } from "@/lib/chat-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  head: () => ({
    meta: [
      { title: "Pond chat moderation — ivy vibing admin" },
      {
        name: "description",
        content: "Hide or remove community chat messages from the ivy vibing pond chat.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatModerationPage,
});

function ChatModerationPage() {
  const fetchChat = useServerFn(getAdminChat);
  const moderate = useServerFn(moderateChatMessage);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "chat"],
    queryFn: () => fetchChat({ data: undefined }),
    retry: false,
  });

  const action = useMutation({
    mutationFn: (input: { id: string; action: "hide" | "unhide" | "delete" }) =>
      moderate({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "chat"] }),
  });

  const rows = query.data ?? [];
  const visible = rows.filter((row) => !row.hidden).length;

  return (
    <AdminShell
      title="Pond chat"
      intro="Every message is signed by the wallet that sent it. Hide anything that does not belong, or remove it for good."
    >
      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg text-charcoal">
            {visible} live · {rows.length - visible} hidden
          </h2>
          <Button
            onClick={() => query.refetch()}
            className="min-h-11 rounded-full bg-frog px-4 font-display text-charcoal pop hover:bg-frog"
          >
            Refresh
          </Button>
          {query.isError ? <StatusChip status="pending" label="Staff role required" /> : null}
        </div>
      </section>

      <section className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-card p-5 text-sm text-charcoal/80 pop-static">
            No messages yet.
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl bg-card p-4 pop-static"
              data-hidden={row.hidden}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal/70">
                <span className="font-mono">{row.wallet}</span>
                <span>{new Date(row.createdAt).toLocaleString("en-GB")}</span>
                {row.hidden ? <StatusChip status="pending" label="Hidden" /> : null}
              </div>
              <p className="mt-2 break-words text-sm text-charcoal">{row.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    action.mutate({ id: row.id, action: row.hidden ? "unhide" : "hide" })
                  }
                  disabled={action.isPending}
                  className="min-h-11 rounded-full bg-yellow px-4 font-display text-charcoal pop hover:bg-yellow"
                >
                  {row.hidden ? "Show again" : "Hide"}
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm("Remove this message for good?")) {
                      action.mutate({ id: row.id, action: "delete" });
                    }
                  }}
                  disabled={action.isPending}
                  className="min-h-11 rounded-full bg-pink px-4 font-display text-charcoal pop hover:bg-pink"
                >
                  Delete
                </Button>
              </div>
            </article>
          ))
        )}
      </section>
    </AdminShell>
  );
}
