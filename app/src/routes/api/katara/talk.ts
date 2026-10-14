import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/katara/talk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { createKataraTalkResponse } = await import("@/lib/katara.server");
        return createKataraTalkResponse(request);
      },
    },
  },
});
