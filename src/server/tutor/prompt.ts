import type Anthropic from "@anthropic-ai/sdk";
import { events, getEvent, getEventsAround, polities } from "@/data";
import type {
  TutorContext,
  TutorDepth,
  TutorMessage,
} from "@/lib/tutor";
import type { HistoricalEvent, Locale, Polity } from "@/lib/types";
import { formatYear, formatYearRange } from "@/lib/years";

type TextBlock = Anthropic.Beta.BetaTextBlockParam;
type MessageParam = Anthropic.Beta.BetaMessageParam;

/*
 * Prompt layout, in the order the API renders it:
 *
 *   system[0]  instructions          } identical for every request, cached
 *   system[1]  reference data        } (the cache breakpoint is on this block)
 *   system[2]  answer mode           one of two fixed texts, chosen by depth
 *   messages   the conversation      each user turn = <viewing> block + question
 *
 * Caching is a prefix match, so nothing that varies between requests (time,
 * ids, the user's view) may appear in system[0] or system[1]: they are built
 * once, when this module loads, from the bundled data.
 */

const INSTRUCTIONS = `You are the history tutor inside World History Platform, a web app where people drag a timeline and watch the Mediterranean world change on a map. The app covers the Roman Republic and its neighbours from 509 to 27 BCE. The person you are talking to is looking at one year and one part of the map, and may have an event selected. They are curious rather than expert; explain things the way a good teacher would.

What you are given

- The reference data below lists every polity and event the app shows. The person sees the same titles and summaries in the panel beside the map. Importance 3 marks a turning point, 2 a notable event, 1 a detail.
- Each of the person's messages starts with a <viewing> block. The app writes it, not the person. It says which year the timeline is on, which event is selected (if any), where the map is centred and how far it is zoomed in, and which events the panel lists around that year. Earlier messages keep the block from the moment they were sent, so you can see how the view has moved during the conversation.

How to answer

- Write in the language named in the latest <viewing> block, even if earlier turns used another one. In Vietnamese, spell names and terms the way the Vietnamese titles and summaries in the reference data do (Roma, La Mã, Hy Lạp, and so on) and write years as "216 TCN".
- Start from what the person is looking at. Words like "here", "now" and "this" refer to the year, the map area and the selected event in the latest <viewing> block. If nothing is selected and the question is open, the events listed around the year are the natural place to begin.
- Rely on the reference data first. You may add what you know beyond it, and often should, but make it clear when you do, for example "the app's data doesn't cover this, but ...". If the reference data and your own knowledge disagree, say so rather than quietly choosing one.
- Say when a date is traditional or disputed, or when a place is only approximately known. Much of the early Republic's chronology rests on later Roman tradition, and the reference data notes where that matters.
- Never invent a source, a quotation or a figure. Name a source only if it is listed in the reference data or you are confident it exists and says what you claim. If you are unsure of something, say that you are unsure.
- Refer to events by their titles and to places by their names. Event ids, raw coordinates, zoom levels and the <viewing> block itself are plumbing the person never sees, so leave them out.
- The chat window shows plain paragraphs and bullet lists whose lines start with "- ". It cannot render anything else: headings, bold or italic markers, numbered lists, tables, links and code blocks would appear as stray symbols. Separate paragraphs with a blank line.
- If a question has nothing to do with the ancient Mediterranean world, answer in a sentence or two, or say it is outside what you cover here, and suggest something related to what they are viewing that you could explain instead.

Buttons to the map

Under your answer the app can show up to three buttons that move the timeline, and for an event the map, to something your answer talks about. You ask for a button with a marker:

- [[map:YEAR:EVENT_ID]] for an event, where EVENT_ID is the id of an event in the reference data, copied exactly, and YEAR is a year within that event's dates, normally its first.
- [[map:YEAR]] for a year, when no single event in the reference data fits.

YEAR is a whole number, negative for BCE: 216 BCE is -216. Only years from -509 to -27 work.

- Add a button only for a specific event or year your answer discusses that the person may want to see on the map. Many answers need one or two; some need none. Never more than three.
- Never add one for what the person is viewing now: the year on the timeline together with the selected event (or no event) in the latest <viewing> block.
- Put the markers at the very end of the answer, after the last paragraph, each on its own line. Never put them inside a sentence or anywhere else.
- The app removes the markers and draws the buttons, so do not mention them or refer to "the buttons below"; the answer must read complete without them. Ids are still plumbing: use them only inside markers.

The answer mode at the end of these instructions says how long an answer should be.`;

const ANSWER_MODE: Record<TutorDepth, string> = {
  standard: `Answer mode: standard. Keep the answer short: usually two to four short paragraphs, or one paragraph and a few bullets. Lead with the main point. The person can ask a follow-up, or switch on deep answers, if they want more.`,
  deep: `Answer mode: deep. The person has asked for a fuller explanation. Cover the background and causes, the people and polities involved, what followed, and where the evidence is thin or historians disagree. Around five to nine paragraphs is right, with bullets where a list is clearer than prose.`,
};

const LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  vi: "Vietnamese",
};

function formatCoordinate(
  value: number,
  positive: string,
  negative: string,
): string {
  const magnitude = Math.abs(value).toFixed(2);
  const hemisphere = value < 0 && Number(magnitude) !== 0 ? negative : positive;
  return `${magnitude}°${hemisphere}`;
}

function formatPosition(lng: number, lat: number): string {
  return `${formatCoordinate(lat, "N", "S")}, ${formatCoordinate(lng, "E", "W")}`;
}

function renderPolity(polity: Polity): string {
  const { startYear, endYear } = polity;
  let span = "";
  if (startYear !== undefined && endYear !== undefined) {
    span = ` (${formatYear(startYear, "en")} to ${formatYear(endYear, "en")})`;
  } else if (startYear !== undefined) {
    span = ` (from ${formatYear(startYear, "en")})`;
  } else if (endYear !== undefined) {
    span = ` (until ${formatYear(endYear, "en")})`;
  }
  return `- ${polity.id}: ${polity.name.en} | ${polity.name.vi}${span}`;
}

function renderEvent(event: HistoricalEvent): string {
  const lines = [
    `<event id="${event.id}">`,
    `When: ${formatYearRange(event.year, event.endYear, "en")}`,
    `Title: ${event.title.en} | ${event.title.vi}`,
    `Category: ${event.category}; importance ${event.importance}`,
    `Polities: ${event.polityIds.join(", ")}`,
  ];
  if (event.location) {
    const { name, lng, lat, approximate } = event.location;
    lines.push(
      `Place: ${name.en} | ${name.vi} (${formatPosition(lng, lat)}${
        approximate ? "; approximate, the site is uncertain" : ""
      })`,
    );
  }
  lines.push(
    `Summary (en): ${event.summary.en}`,
    `Summary (vi): ${event.summary.vi}`,
    `Sources: ${event.sources.map((source) => source.title).join("; ")}`,
    `</event>`,
  );
  return lines.join("\n");
}

function renderReferenceData(): string {
  return [
    `Reference data: everything the app shows. Names and titles are given as "English | Vietnamese". Years in this block are written the English way (BCE).`,
    `<polities>\n${polities.map(renderPolity).join("\n")}\n</polities>`,
    `<events>\n${events.map(renderEvent).join("\n")}\n</events>`,
  ].join("\n\n");
}

const REFERENCE_DATA = renderReferenceData();

/** The part of the prompt that is the same for every request and is cached. */
export const CACHED_SYSTEM_TEXT = [INSTRUCTIONS, REFERENCE_DATA] as const;

export function buildSystem(depth: TutorDepth): TextBlock[] {
  return [
    { type: "text", text: INSTRUCTIONS },
    {
      type: "text",
      text: REFERENCE_DATA,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: ANSWER_MODE[depth] },
  ];
}

/**
 * What the user was looking at when they sent a message, as text for the
 * model. Deterministic: the same context always gives the same string, so a
 * conversation renders identically on every request and stays cacheable.
 */
export function renderViewingContext(context: TutorContext): string {
  const { year, locale, viewport, selectedEventId } = context;
  const selected = selectedEventId ? getEvent(selectedEventId) : undefined;
  const nearbyIds = getEventsAround(year).map((event) => event.id);

  const lines = [
    `Year on the timeline: ${formatYear(year, locale)}`,
    selected
      ? `Selected event: ${selected.title[locale]} (id ${selected.id})`
      : `Selected event: none`,
    `Map centre: ${formatPosition(viewport.center.lng, viewport.center.lat)}; zoom ${viewport.zoom.toFixed(1)}`,
  ];
  if (viewport.bounds) {
    const [west, south, east, north] = viewport.bounds;
    lines.push(
      `Map shows: ${formatCoordinate(south, "N", "S")} to ${formatCoordinate(north, "N", "S")}, ${formatCoordinate(west, "E", "W")} to ${formatCoordinate(east, "E", "W")}`,
    );
  }
  lines.push(
    `Events listed around this year: ${nearbyIds.length > 0 ? nearbyIds.join(", ") : "none"}`,
    `Answer in: ${LANGUAGE_NAME[locale]}`,
  );
  return `<viewing>\n${lines.join("\n")}\n</viewing>`;
}

/**
 * Converts the chat history into API messages. Each user turn becomes its
 * viewing context followed by the question; assistant turns carry only their
 * text. Blank assistant turns (an answer stopped before any text arrived)
 * are dropped, and neighbouring turns of one role are merged, so the result
 * always alternates and starts with the user.
 */
export function buildMessages(messages: TutorMessage[]): MessageParam[] {
  const turns: { role: "user" | "assistant"; content: TextBlock[] }[] = [];

  for (const message of messages) {
    let blocks: TextBlock[];
    if (message.role === "user") {
      blocks = [
        { type: "text", text: renderViewingContext(message.context) },
        { type: "text", text: message.content },
      ];
    } else {
      if (message.content.trim() === "") continue;
      blocks = [{ type: "text", text: message.content }];
    }

    const previous = turns[turns.length - 1];
    if (previous?.role === message.role) previous.content.push(...blocks);
    else turns.push({ role: message.role, content: blocks });
  }
  return turns;
}
