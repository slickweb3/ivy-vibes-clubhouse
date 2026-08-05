/**
 * SectionRail — the pond stem.
 *
 * A custom, mobile-first scroll rail pinned to the right edge. Each lily pad is
 * one section of the page: tap a pad to leap there, or drag the frog thumb down
 * the stem and it bounces to the nearest section when you let go. This is the
 * fast way past the tall TikTok / Instagram windows on a phone.
 *
 * Everything is compositor friendly: active state is one transform + one
 * data attribute per frame, driven by a rAF-throttled scroll listener.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToSection } from "@/lib/scroll-to-section";
import { onScrollFrame } from "@/lib/scroll-observer";

/** Short labels for the pads; ids that are absent are skipped automatically. */
const RAIL_SECTIONS: { id: string; label: string }[] = [
  { id: "main", label: "Top of the pond" },
  { id: "ivy-photos", label: "Frame by frame" },
  { id: "meet-ivy", label: "Meet Ivy" },
  { id: "social-windows", label: "Instagram, TikTok & X" },
  { id: "the-lore", label: "The lore" },
  { id: "why-ivy", label: "Why $ivy" },
  { id: "token-record", label: "Token record" },
  { id: "live-chart", label: "Live chart" },
  { id: "how-to-buy", label: "How to buy" },
  { id: "arcade", label: "Lily Pad Leap" },
  { id: "royal-court", label: "Royal court" },
  { id: "pond-chat", label: "Pond chat" },
  { id: "faq", label: "Questions" },
  { id: "site-footer", label: "Footer" },
];

const NAV_OFFSET = 76;

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SectionRail() {
  const [pads, setPads] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const padsRef = useRef<{ id: string; label: string }[]>([]);
  const lockRef = useRef(0);

  padsRef.current = pads;

  // Only keep pads whose section actually exists in this page's DOM.
  useEffect(() => {
    const present = RAIL_SECTIONS.filter((entry) => document.getElementById(entry.id));
    setPads(present);
  }, []);

  const topOf = useCallback((id: string) => {
    const node = document.getElementById(id);
    if (!node) return 0;
    const raw = node.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, raw - NAV_OFFSET);
  }, []);

  const leapTo = useCallback((index: number) => {
    const entry = padsRef.current[index];
    if (!entry) return;
    lockRef.current = Date.now() + 700;
    setActive(index);
    if (index === 0) {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
      return;
    }
    scrollToSection(entry.id);
  }, []);

  // Track which pad the visitor is currently sitting on.
  useEffect(() => {
    if (pads.length === 0) return;
    return onScrollFrame((y) => {
      if (Date.now() < lockRef.current) return;
      const probe = y + window.innerHeight * 0.32;
      let next = 0;
      pads.forEach((entry, index) => {
        if (topOf(entry.id) <= probe) next = index;
      });
      setActive((was) => (was === next ? was : next));
    });
  }, [pads, topOf]);

  const indexFromPointer = useCallback((clientY: number) => {
    const rail = railRef.current;
    if (!rail || padsRef.current.length === 0) return 0;
    const rect = rail.getBoundingClientRect();
    const ratio = (clientY - rect.top) / Math.max(1, rect.height);
    const clamped = Math.min(1, Math.max(0, ratio));
    return Math.round(clamped * (padsRef.current.length - 1));
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== undefined && event.button > 0) return;
    railRef.current?.setPointerCapture(event.pointerId);
    setDragging(true);
    setPreview(indexFromPointer(event.clientY));
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    event.preventDefault();
    setPreview(indexFromPointer(event.clientY));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    const index = indexFromPointer(event.clientY);
    setPreview(null);
    // Release = bounce onto the nearest section rather than stopping mid-scroll.
    leapTo(index);
  };

  if (pads.length < 3) return null;

  const shown = preview ?? active;
  const label = pads[shown]?.label ?? "";
  const fill = pads.length > 1 ? shown / (pads.length - 1) : 0;

  return (
    <div
      ref={railRef}
      className="section-rail"
      data-dragging={dragging ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="navigation"
      aria-label="Leap between sections"
    >
      <span aria-hidden className="section-rail-stem" />
      <span
        aria-hidden
        className="section-rail-glow"
        style={{ transform: `scaleY(${Math.max(0.02, fill).toFixed(3)})` }}
      />
      {pads.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className="section-rail-pad"
          data-state={index === shown ? "on" : "off"}
          aria-current={index === active ? "true" : undefined}
          onClick={() => leapTo(index)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const next = Math.min(
                pads.length - 1,
                Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)),
              );
              leapTo(next);
              const rail = railRef.current;
              const buttons = rail?.querySelectorAll<HTMLButtonElement>(".section-rail-pad");
              buttons?.[next]?.focus();
            }
          }}
        >
          <span className="sr-only">{entry.label}</span>
          <span aria-hidden className="section-rail-dot" />
        </button>
      ))}
      <span aria-hidden className="section-rail-tag" data-visible={dragging ? "true" : "false"}>
        {label}
      </span>
    </div>
  );
}
