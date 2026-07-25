import * as chrono from "chrono-node";

export type ParsedCapture = {
  title: string;
  tags: string[];
  project: string | null;
  due: Date | null;
};

const TAG_RE = /#([\p{L}\p{N}_-]+)/gu;
const PROJECT_RE = /@([\p{L}\p{N}_-]+)/gu;
const CJK_RE = /[一-鿿]/;

// Lighter-weight than parseCapture — just strips #tags, no date parsing.
// Used by quick-add inputs (Today view) that don't need the full NLP pass.
export function extractTags(raw: string): { title: string; tags: string[] } {
  const tags = [...raw.matchAll(TAG_RE)].map((m) => m[1]);
  // collapse horizontal whitespace only — a bare \s+ was swallowing the
  // newlines a user typed, so multi-line captures displayed as one line
  const title = raw.replace(TAG_RE, "").replace(/[^\S\n]+/g, " ").trim();
  return { title: title || raw.trim(), tags };
}

// Local-only parsing (chrono-node, zh + en) — deliberately not routed through
// Hermes. Capture is the zero-friction path; it can't depend on an AI
// process being reachable. See docs/EVERYTHING_SPEC.md "Hermes API 契约".
export function parseCapture(raw: string, referenceDate: Date = new Date()): ParsedCapture {
  const tags = [...raw.matchAll(TAG_RE)].map((m) => m[1]);
  const projectMatch = raw.match(PROJECT_RE);
  const project = projectMatch ? projectMatch[0].slice(1) : null;

  // collapse horizontal whitespace only — a bare \s+ was swallowing the
  // newlines a user typed, so multi-line captures displayed as one line
  const withoutMarkers = raw.replace(TAG_RE, "").replace(PROJECT_RE, "").replace(/[^\S\n]+/g, " ").trim();

  const parser = CJK_RE.test(raw) ? chrono.zh : chrono.en;
  const [result] = parser.parse(withoutMarkers, referenceDate, { forwardDate: true });
  const due = result?.start.date() ?? null;

  let title = withoutMarkers;
  if (result) {
    title = (
      withoutMarkers.slice(0, result.index) +
      withoutMarkers.slice(result.index + result.text.length)
    )
      .replace(/[^\S\n]+/g, " ")
      .trim();
  }
  if (!title) title = withoutMarkers || raw.trim();

  return { title, tags, project, due };
}

export function formatParsePreview(parsed: ParsedCapture): string | null {
  const parts: string[] = [];
  if (parsed.due) {
    parts.push(
      `📅 ${parsed.due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${parsed.due.toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: parsed.due.getMinutes() ? "2-digit" : undefined }
      )}`
    );
  }
  if (parsed.project) parts.push(`@${parsed.project}`);
  if (parsed.tags.length) parts.push(`🏷 ${parsed.tags.join(", ")}`);
  return parts.length ? parts.join(" · ") : null;
}
