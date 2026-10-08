import { createFileRoute } from "@tanstack/react-router";

import { EnterBracket } from "@/components/site/ctas";
import { SiteFrame } from "@/components/site/site-frame";
import { labEntries } from "@/content/catalog";

export const Route = createFileRoute("/lab/")({
  head: () => ({
    meta: [
      { title: "The Lab | SCI-FI NOODLES" },
      {
        name: "description",
        content: "How SCI-FI NOODLES cooks a shot, what failed experiments teach, and what stays inside a series.",
      },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  return (
    <SiteFrame
      lede="The bridge between the films and the making of them. Curious, not a manual."
      title="The Lab"
    >
      <ul className="lab-index">
        {labEntries.map((entry) => (
          <li key={entry.slug}>
            <img alt="" src={entry.image} />
            <div>
              <p className="meta-line">
                {entry.category} · {entry.date}
              </p>
              <h2>{entry.title}</h2>
              <p>{entry.paragraphs[0]}</p>
              <EnterBracket href={`/lab/${entry.slug}`} />
            </div>
          </li>
        ))}
      </ul>
    </SiteFrame>
  );
}
