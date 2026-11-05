import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0fdfa] px-6 text-center">
      <h1 className="font-serif text-3xl font-bold text-[#0c4a6e]">You are subscribed</h1>
      <p className="mt-3 max-w-md text-slate-700">
        {plan ? `Your ${plan} plan is active.` : "Your plan is active."} Open Site Studio and sign in with the same email you used at checkout.
      </p>
      <Link
        href="/studio"
        className="mt-8 rounded-full bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
      >
        Open Site Studio
      </Link>
      <Link href="/" className="mt-4 text-sm text-teal-800 underline">
        Back to home
      </Link>
    </div>
  );
}
