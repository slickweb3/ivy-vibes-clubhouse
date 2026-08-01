/**
 * Staff-only moderation for Pond Chat.
 * Returns full wallet addresses; admin or editor role required.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminChatRow {
  id: string;
  wallet: string;
  body: string;
  createdAt: string;
  hidden: boolean;
}

export const getAdminChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminChatRow[]> => {
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(context.supabase, context.userId);

    const { data } = await context.supabase
      .from("chat_messages")
      .select("id, wallet_address, body, created_at, hidden_at")
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((row) => ({
      id: row.id as string,
      wallet: row.wallet_address as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      hidden: row.hidden_at != null,
    }));
  });

const moderateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["hide", "unhide", "delete"]),
});

export const moderateChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => moderateSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { requireStaff, audit } = await import("@/lib/admin-guard.server");
    await requireStaff(context.supabase, context.userId);

    if (data.action === "delete") {
      const { error } = await context.supabase.from("chat_messages").delete().eq("id", data.id);
      if (error) throw new Error("Could not remove that message.");
    } else {
      const hide = data.action === "hide";
      const { error } = await context.supabase
        .from("chat_messages")
        .update({
          hidden_at: hide ? new Date().toISOString() : null,
          hidden_by: hide ? context.userId : null,
          hidden_reason: hide ? "Hidden by staff" : null,
        })
        .eq("id", data.id);
      if (error) throw new Error("Could not update that message.");
    }

    await audit(context.supabase, context.userId, {
      action: `chat_${data.action}`,
      entityType: "chat_messages",
      entityId: data.id,
      summary: `Chat message ${data.action}d by staff.`,
    });

    return { ok: true };
  });
