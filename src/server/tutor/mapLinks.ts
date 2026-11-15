import { getEvent, isEventActive } from "@/data";
import {
  TUTOR_LIMITS,
  type TutorContext,
  type TutorMapLink,
  type TutorStreamEvent,
} from "@/lib/tutor";
import { YEAR_MAX, YEAR_MIN } from "@/lib/years";

/*
 * Map links in Claude's answers. The model asks for a button with a marker
 * in its text (see "Buttons to the map" in prompt.ts):
 *
 *   [[map:-216:battle-of-cannae]]   an event, at a year within it
 *   [[map:-218]]                    a year
 *
 * MapLinkStream takes the answer as it streams in and splits it into text,
 * which never contains a marker, and `map_link` events, each one checked
 * against the data. A marker may be cut across two pieces of text, so
 * anything that could be the start of one is held back until it is certain.
 */

const OPEN = "[[map:";
const CLOSE = "]]";
/** Longer than any real marker; text that runs on this far is not one. */
const MAX_MARKER_CHARS = 120;
const MARKER = /^\[\[map:(-?\d{1,4})(?::([a-z0-9]+(?:-[a-z0-9]+)*))?\]\]$/;

/** The whitespace with more line breaks (then the longer one). */
function widerSpace(a: string, b: string): string {
  const breaks = (s: string) => s.split("\n").length;
  if (breaks(a) !== breaks(b)) return breaks(a) > breaks(b) ? a : b;
  return a.length >= b.length ? a : b;
}

export interface MapLinkReport {
  /** Links sent to the chat. */
  sent: number;
  /** Markers dropped: malformed, unknown event, out of range, duplicate, over the limit, or the current view. */
  dropped: number;
}

export class MapLinkStream {
  private readonly links: TutorMapLink[] = [];
  private dropped = 0;
  /** Text that may be the start of a marker. */
  private held = "";
  /** Whitespace not sent yet: it is only sent before more text. */
  private pendingSpace = "";
  /** A marker was just removed; the whitespace around it is merged. */
  private afterMarker = false;
  /** Whitespace before the removed marker(s), and whitespace since then. */
  private spaceBefore = "";
  private spaceAfter = "";
  private wroteText = false;
  private out: TutorStreamEvent[] = [];
  /** finish() has run; later calls do nothing. */
  finished = false;

  /** What the person was viewing when they asked. */
  private readonly context: TutorContext;

  constructor(context: TutorContext) {
    this.context = context;
  }

  /** Takes the next piece of the answer; returns what can be sent now. */
  push(piece: string): TutorStreamEvent[] {
    const text = this.held + piece;
    this.held = "";
    let i = 0;
    while (i < text.length) {
      const start = text.indexOf("[[", i);
      if (start === -1) {
        // A single "[" at the very end could become "[[".
        const end = text.endsWith("[") ? text.length - 1 : text.length;
        this.emit(text.slice(i, end));
        this.held = text.slice(end);
        break;
      }
      this.emit(text.slice(i, start));
      const rest = text.slice(start);

      if (rest.length < OPEN.length) {
        if (OPEN.startsWith(rest)) {
          this.held = rest;
          break;
        }
      } else if (rest.startsWith(OPEN)) {
        const close = rest.indexOf(CLOSE);
        const newline = rest.indexOf("\n");
        const end = close === -1 ? -1 : close + CLOSE.length;
        const cut = newline !== -1 && (close === -1 || newline < close);
        if (close === -1 && !cut && rest.length <= MAX_MARKER_CHARS) {
          this.held = rest;
          break;
        }
        if (close !== -1 && !cut && end <= MAX_MARKER_CHARS) {
          this.marker(rest.slice(0, end));
          i = start + end;
          continue;
        }
      }
      // Not a marker: an ordinary "[", and carry on from the next character.
      this.emit("[");
      i = start + 1;
    }
    return this.flush();
  }

  /**
   * The answer is complete (or stopped): sends what was held back, except a
   * marker cut off by the end and the whitespace at the very end.
   */
  finish(): TutorStreamEvent[] {
    if (this.finished) return [];
    this.finished = true;
    if (this.held.startsWith(OPEN)) this.dropped++;
    else this.emit(this.held);
    this.held = "";
    this.pendingSpace = "";
    return this.flush();
  }

  /** True once any text has been sent. */
  get hasText(): boolean {
    return this.wroteText;
  }

  report(): MapLinkReport {
    return { sent: this.links.length, dropped: this.dropped };
  }

  private flush(): TutorStreamEvent[] {
    const events = this.out;
    this.out = [];
    return events;
  }

  /** Queues text, keeping trailing whitespace back until more text comes. */
  private emit(raw: string): void {
    let text = raw;
    if (text === "") return;
    if (this.afterMarker) {
      // The whitespace after a marker may come in several pieces ("\n", then
      // "\n"): add it up before comparing it with the whitespace before.
      const leading = /^\s*/.exec(text)![0];
      this.spaceAfter += leading;
      this.pendingSpace = widerSpace(this.spaceBefore, this.spaceAfter);
      text = text.slice(leading.length);
      if (text === "") return;
      this.afterMarker = false;
    }
    const trailing = /\s*$/.exec(text)![0];
    let body = text.slice(0, text.length - trailing.length);
    if (body === "") {
      this.pendingSpace += trailing;
      return;
    }
    if (this.wroteText) body = this.pendingSpace + body;
    else body = body.trimStart();
    this.pendingSpace = trailing;
    this.wroteText = true;

    const last = this.out[this.out.length - 1];
    if (last?.type === "text") last.text += body;
    else this.out.push({ type: "text", text: body });
  }

  private marker(markup: string): void {
    // Markers in a row ("[[…]]\n[[…]]") count as one gap in the text.
    this.spaceBefore = this.afterMarker
      ? widerSpace(this.spaceBefore, this.spaceAfter)
      : this.pendingSpace;
    this.spaceAfter = "";
    this.afterMarker = true;
    const link = this.toLink(markup);
    if (link) {
      this.links.push(link);
      this.out.push({ type: "map_link", link });
    } else {
      this.dropped++;
    }
  }

  /** The link a marker asks for, or null if it must be dropped. */
  private toLink(markup: string): TutorMapLink | null {
    const match = MARKER.exec(markup);
    if (!match) return null;
    let year = Number(match[1]);
    const eventId = match[2] ?? null;
    if (eventId !== null) {
      const event = getEvent(eventId);
      if (!event) return null;
      // A year outside the event's own years: go to its start instead.
      if (!isEventActive(event, year)) year = event.year;
    }
    if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) return null;

    const link: TutorMapLink = { year, eventId };
    const same = (other: TutorMapLink) =>
      other.year === link.year && other.eventId === link.eventId;
    if (this.links.length >= TUTOR_LIMITS.maxMapLinks) return null;
    if (this.links.some(same)) return null;
    // The person is already looking at exactly this.
    if (same({ year: this.context.year, eventId: this.context.selectedEventId })) return null;
    return link;
  }
}
