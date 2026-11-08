import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/inbox")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createInboxResponse } = await import("@/lib/inbox.server");
        return createInboxResponse(request);
      },
    },
  },
});
