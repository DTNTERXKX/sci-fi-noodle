import Link from "next/link";

import { CheckoutButton } from "@/components/checkout-button";
import { PLANS } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0fdfa] text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-[#0c4a6e]">
          bbellweb.info
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="#pricing">Pricing</a>
          <Link href="/studio" className="text-teal-800 hover:underline">
            Site Studio
          </Link>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-800">Memphis · since 2008</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight text-[#0c4a6e] sm:text-5xl">
            Design your own website with AI — on a simple monthly plan
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            BBellWeb is your subscription home for AI site drafts, section layouts, and export-ready pages. Need a full custom build? We still do hands-on work for growing brands.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="rounded-full bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
            >
              See plans
            </a>
            <Link
              href="/studio"
              className="rounded-full border border-teal-800 px-6 py-3 font-medium text-teal-900 hover:bg-teal-50"
            >
              Go to Site Studio
            </Link>
          </div>
        </section>

        <section id="features" className="border-y border-teal-900/10 bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            {[
              {
                title: "Describe it once",
                body: "Tell the studio who you serve, your services, and the tone you want. AI drafts hero, features, about, and contact blocks.",
              },
              {
                title: "Preview instantly",
                body: "See a polished layout in the browser. Iterate on copy until it feels like your brand.",
              },
              {
                title: "We are still here",
                body: "Phone and email support from the same team that built client sites across Memphis and beyond.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-100 p-6">
                <h2 className="text-lg font-semibold text-[#0c4a6e]">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="border-y border-teal-900/10 bg-white py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-[#0c4a6e]">FAQ</h2>
            <dl className="mt-8 space-y-6">
              {[
                {
                  q: "What do I get with a subscription?",
                  a: "Every plan unlocks Site Studio: AI drafts for landing pages, sections, and layouts. Higher tiers add more projects and export options.",
                },
                {
                  q: "Can you still build my site for me?",
                  a: "Yes. Custom design and development is still available. Call (901) 654-8427 or email contact@bbellweb.info for a quote.",
                },
                {
                  q: "Do I need design experience?",
                  a: "No. Describe your business and refine the preview until it matches your brand.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Subscriptions renew monthly. Cancel in the Stripe customer portal; studio access stays active through the paid period.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-slate-900">{item.q}</dt>
                  <dd className="mt-1 text-sm text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="pricing" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-serif text-3xl font-bold text-[#0c4a6e]">Simple monthly pricing</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
              Free consultation on custom projects. Subscriptions include access to the AI Site Studio.
            </p>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                    plan.highlighted
                      ? "border-teal-600 bg-white ring-2 ring-teal-600/30"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-3xl font-bold text-[#0c4a6e]">
                    {plan.priceLabel}
                    <span className="text-base font-normal text-slate-500">/mo</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-teal-700">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <CheckoutButton
                    planId={plan.id}
                    label={`Subscribe to ${plan.name}`}
                    className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                  />
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Custom full-service builds from $300+ are still available —{" "}
              <a href="mailto:contact@bbellweb.info" className="text-teal-800 underline">
                contact us
              </a>
              .
            </p>
          </div>
        </section>

        <section id="contact" className="border-t border-teal-900/10 bg-[#0c4a6e] py-12 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-2xl font-bold">Contact</h2>
            <ul className="mt-4 space-y-1 text-teal-50">
              <li>Phone: (901) 654-8427</li>
              <li>
                Email:{" "}
                <a href="mailto:contact@bbellweb.info" className="underline">
                  contact@bbellweb.info
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm text-teal-100/80">© {new Date().getFullYear()} bbellweb.info · NVESTED REALITY LLC</p>
          </div>
        </section>
      </main>
    </div>
  );
}
