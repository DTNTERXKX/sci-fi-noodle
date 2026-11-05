export type PlanId = "starter" | "pro" | "agency";

export type PlanLimits = {
  sites: number;
  pagesPerSite: number;
  chatEditsPerMonth: number;
  customDomain: boolean;
  blog: boolean;
  monthlyRefresh: boolean;
  htmlExport: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
  limits: PlanLimits;
  highlighted?: boolean;
};

const LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    sites: 1,
    pagesPerSite: 1,
    chatEditsPerMonth: 20,
    customDomain: false,
    blog: false,
    monthlyRefresh: false,
    htmlExport: false,
  },
  pro: {
    sites: 3,
    pagesPerSite: 5,
    chatEditsPerMonth: 1000,
    customDomain: true,
    blog: true,
    monthlyRefresh: true,
    htmlExport: false,
  },
  agency: {
    sites: 1000,
    pagesPerSite: 10,
    chatEditsPerMonth: 3000,
    customDomain: true,
    blog: true,
    monthlyRefresh: true,
    htmlExport: true,
  },
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$19",
    description: "One AI-built site for artists and side hustles.",
    features: [
      "1 site project",
      "AI page drafts and sections",
      "Mobile-ready layouts",
      "Email support",
    ],
    limits: LIMITS.starter,
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$49",
    description: "Growing businesses with more pages and polish.",
    features: [
      "Up to 3 site projects",
      "Custom domain guidance",
      "Forms and contact blocks",
      "Priority email support",
    ],
    limits: LIMITS.pro,
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceLabel: "$99",
    description: "Consultants managing multiple client sites.",
    features: [
      "Unlimited site projects",
      "Client workspaces",
      "Export HTML bundle",
      "Phone and email support",
    ],
    limits: LIMITS.agency,
  },
];

export function stripePriceEnvKey(planId: PlanId): string {
  return `STRIPE_PRICE_${planId.toUpperCase()}`;
}

export function getPlanLimits(planId: PlanId): PlanLimits {
  return LIMITS[planId];
}

export function planIdFromStripePriceId(priceId: string): PlanId | null {
  for (const plan of PLANS) {
    const envKey = stripePriceEnvKey(plan.id);
    if (process.env[envKey] === priceId) return plan.id;
  }
  return null;
}
