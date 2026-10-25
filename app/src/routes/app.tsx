import { createFileRoute, redirect } from "@tanstack/react-router";

// The public site is the ramen menu. This path used to render the
// Higgsfield generator scaffold, so old links and previews leave it.
export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
