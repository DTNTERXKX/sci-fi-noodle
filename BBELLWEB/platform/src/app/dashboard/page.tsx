import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionEmail } from "@/lib/server/auth";
import { listSitesForUser } from "@/lib/server/sites";
import { getUserByEmail, userHasStudioAccess } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const email = await getSessionEmail();
  if (!email) {
    redirect("/studio");
  }

  let user;
  try {
    user = await getUserByEmail(email);
  } catch {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-slate-700">Database is not configured. Set DATABASE_URL and run migrations.</p>
        <Link href="/studio" className="mt-4 inline-block text-teal-800 underline">
          Back to studio
        </Link>
      </div>
    );
  }

  if (!user || !userHasStudioAccess(user)) {
    redirect("/studio");
  }

  const sites = await listSitesForUser(user.id);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-semibold text-[#0c4a6e]">
            bbellweb.info
          </Link>
          <Link href="/studio" className="text-sm text-teal-800 hover:underline">
            Site Studio
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Your sites</h1>
        <p className="mt-1 text-sm text-slate-600">
          Plan: <span className="font-medium capitalize">{user.plan}</span> · {email}
        </p>
        {sites.length === 0 ? (
          <p className="mt-8 text-slate-600">
            No saved sites yet.{" "}
            <Link href="/studio" className="text-teal-800 underline">
              Generate and save one in Site Studio
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {sites.map((site) => (
              <li
                key={site.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-500">
                    {site.subdomain}.bbellweb.site · {site.status}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Updated {site.updatedAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
