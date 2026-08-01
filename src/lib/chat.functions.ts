/**
 * Public server functions for Pond Chat. Thin wrappers only — logic lives in
 * chat.server.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ChatMessage, PostResult } from "@/lib/chat.server";

export const getChat = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChatMessage[]> => {
    const { readChat } = await import("@/lib/chat.server");
    return readChat(50);
  },
);

export const startChatMessage = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ nonce: string }> => {
    const { issueChatNonce } = await import("@/lib/chat.server");
    return issueChatNonce();
  },
);

const postSchema = z.object({
  wallet: z.string().min(32).max(64),
  body: z.string().min(1).max(400),
  nonce: z.string().min(16).max(64),
  signature: z.string().min(32).max(160),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => postSchema.parse(data))
  .handler(async ({ data }): Promise<PostResult> => {
    const { postChatMessage } = await import("@/lib/chat.server");
    return postChatMessage(data);
  });
