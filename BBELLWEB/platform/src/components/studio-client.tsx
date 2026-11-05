"use client";

import { useState } from "react";

import type { SiteSpecV2 } from "@/lib/site-schema";
import { SitePreview } from "@/components/site-preview";

export function StudioClient() {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [brief, setBrief] = useState("");
  const [site, setSite] = useState<SiteSpecV2 | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verifyEmail() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSite() {
    if (!site) return;
    setBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName.trim() || site.brand.name,
          spec: site,
        }),
      });
      const data = (await res.json()) as { site?: { name: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setSaveMessage(`Saved “${data.site?.name ?? "site"}”. View it on your dashboard.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateSite() {
    setBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/generate/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, businessName }),
      });
      const data = (await res.json()) as { site?: SiteSpecV2; error?: string };
      if (!res.ok || !data.site) throw new Error(data.error ?? "Generation failed.");
      setSite(data.site);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!verified) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Open Site Studio</h1>
        <p className="text-sm text-slate-600">
          Use the same email you used at Stripe checkout. We confirm your active subscription, then unlock the AI builder.
        </p>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="you@business.com"
          />
        </label>
        <button
          type="button"
          disabled={busy || !email}
          onClick={verifyEmail}
          className="w-full rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock studio"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Design your site with AI</h1>
        <label className="block text-sm font-medium text-slate-700">
          Business name
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Memphis Auto Detail"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          What should the site do?
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Who you serve, services, tone, and must-have sections…"
          />
        </label>
        <button
          type="button"
          disabled={busy || brief.trim().length < 10}
          onClick={generateSite}
          className="w-full rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate site draft"}
        </button>
        {site ? (
          <button
            type="button"
            disabled={busy}
            onClick={saveSite}
            className="w-full rounded-lg border border-teal-800 px-4 py-2 font-medium text-teal-900 hover:bg-teal-50 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save to dashboard"}
          </button>
        ) : null}
        {saveMessage ? (
          <p className="text-sm text-teal-800">
            {saveMessage}{" "}
            <a href="/dashboard" className="underline">
              Open dashboard
            </a>
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <div>{site ? <SitePreview site={site} /> : <p className="text-slate-500">Your preview will appear here.</p>}</div>
    </div>
  );
}
