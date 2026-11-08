import { expect, test } from "bun:test";

import { features, isReleased, watchLibrary, youtubeFor } from "../src/content/catalog";
import { realWatchHref } from "../src/content/from-segments";

function assertRealOrEmpty(href: string | undefined) {
  if (!href) return;
  expect(href).not.toContain("youtube.com/results");
  expect(href).not.toContain("search_query");
  expect(realWatchHref(href)).toBe(href);
}

test("a youtube search url is not a watch link", () => {
  expect(realWatchHref("https://www.youtube.com/results?search_query=SCI-FI+NOODLES")).toBeUndefined();
  expect(youtubeFor("No such noodle")).toBeUndefined();
});

test("stored videos stay direct links, including the colon title the watch board uses", () => {
  expect(youtubeFor("Neo-Osaka Rain")).toBe("https://www.youtube.com/watch?v=G-YEM6LOE8Y");
  expect(youtubeFor("T.I.R.A. // RIFT: The Key Awakens")).toBe("https://www.youtube.com/watch?v=buCKa4pm0Rw");
  expect(youtubeFor("T.I.R.A. // RIFT The Key Awakens")).toBe("https://www.youtube.com/watch?v=buCKa4pm0Rw");
  expect(youtubeFor("Frankenstein: The Commit")).toBe("https://youtu.be/8bp4f2vml6A");
  expect(youtubeFor("The Stranger: Part 1")).toBe("https://www.youtube.com/shorts/15IGDVeL080");
  expect(youtubeFor("The Stranger Part 2")).toBe("https://www.youtube.com/shorts/uu762gNCTXY");
  expect(youtubeFor("Iron Beats Wood: Rise of the Ironclad")).toBe("https://www.youtube.com/watch?v=sY7_WU6iOz0");
  expect(youtubeFor("Bluff City Immune: EP01 · In and Out")).toBe("https://youtube.com/shorts/bi-EmlOjDhA");
});

test("a date-only premiere follows the Chicago calendar day", () => {
  const beforeChicagoNov7 = new Date("2026-11-07T00:00:00.000Z");
  const chicagoNov7Starts = new Date("2026-11-07T06:00:00.000Z");
  const chicagoNov7Ends = new Date("2026-11-08T05:59:00.000Z");
  const beforeChicagoJuly4 = new Date("2026-07-04T04:59:00.000Z");
  const chicagoJuly4Starts = new Date("2026-07-04T05:00:00.000Z");

  expect(isReleased("Nov 7, 2026", beforeChicagoNov7)).toBe(false);
  expect(isReleased("Nov 7, 2026", chicagoNov7Starts)).toBe(true);
  expect(isReleased("Nov 7, 2026", chicagoNov7Ends)).toBe(true);
  expect(isReleased("Nov 8, 2026", chicagoNov7Ends)).toBe(false);
  expect(isReleased("Jul 4, 2026", beforeChicagoJuly4)).toBe(false);
  expect(isReleased("Jul 4, 2026", chicagoJuly4Starts)).toBe(true);
  expect(isReleased("Coming soon")).toBe(false);
  expect(isReleased("Feb 31, 2026", chicagoNov7Starts)).toBe(false);
});

test("a passed date with no stored video does not fall back to search", () => {
  expect(isReleased("Oct 5, 2026")).toBe(true);
  expect(youtubeFor("Failed noodles")).toBeUndefined();
  expect(youtubeFor("How a shot is cooked")).toBeUndefined();
  expect(youtubeFor("T.I.R.A. // RIFT: The Ball Crashers")).toBeUndefined();
});

test("no visitor title or feature resolves to a youtube search", () => {
  for (const item of watchLibrary()) assertRealOrEmpty(youtubeFor(item.title));
  for (const feature of features) assertRealOrEmpty(feature.watchHref || undefined);
  expect(features.find((feature) => feature.slug === "neo-osaka-rain")?.watchHref).toBe(
    "https://www.youtube.com/watch?v=G-YEM6LOE8Y",
  );
  expect(features.find((feature) => feature.slug === "tira-rift")?.watchHref).toBe(
    "https://www.youtube.com/watch?v=buCKa4pm0Rw",
  );
  expect(features.find((feature) => feature.slug === "the-commit")?.watchHref).toBe("https://youtu.be/8bp4f2vml6A");
});
