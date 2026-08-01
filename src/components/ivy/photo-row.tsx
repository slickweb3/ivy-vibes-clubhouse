import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Section } from "./primitives";
import { discover } from "@/lib/discoveries";

import photo1 from "@/assets/ivy-photo-1.jpg.asset.json";
import photo2 from "@/assets/ivy-photo-2.jpg.asset.json";
import photo3 from "@/assets/ivy-photo-3.jpg.asset.json";
import photo4 from "@/assets/ivy-photo-4.jpg.asset.json";
import photo5 from "@/assets/ivy-photo-5.jpg.asset.json";
import photo6 from "@/assets/ivy-photo-6.jpg.asset.json";
import photo7 from "@/assets/ivy-photo-7.jpg.asset.json";

const PHOTOS: { src: string; alt: string }[] = [
  { src: photo1.url, alt: "Ivy standing in a park at dusk, head tilted" },
  { src: photo2.url, alt: "Ivy sitting sideways wearing big headphones" },
  { src: photo3.url, alt: "Ivy sitting up on a bed with her chin in the air" },
  { src: photo4.url, alt: "Ivy running through sunny grass, tongue out, mid-smile" },
  { src: photo5.url, alt: "Ivy sitting in front of a colourful graffiti wall" },
  { src: photo6.url, alt: "Ivy trotting across the grass in a festive holiday sweater" },
  { src: photo7.url, alt: "Puppy Ivy being held up by her owner on her birthday" },
];

/** The first photo doubles as the homepage LCP image, so routes can preload it. */
export const heroPhotoUrl = PHOTOS[0].src;

/**
 * A simple owner-provided photo row — framed to match the clubhouse, no
 * platform chrome, no watermarks.
 */
export function IvyPhotoRow() {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    const last = open;
    setOpen(null);
    if (last !== null) triggerRefs.current[last]?.focus();
  }, [open]);

  const step = useCallback((delta: number) => {
    setOpen((current) =>
      current === null ? current : (current + delta + PHOTOS.length) % PHOTOS.length,
    );
  }, []);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, step]);

  useEffect(() => {
    if (open !== null) discover("gaze");
  }, [open]);

  const active = open === null ? null : PHOTOS[open];

  return (
    <Section
      id="ivy-photos"
      eyebrow="Owner-approved photos"
      title="The Frog Queen, frame by frame"
      intro="A row of Ivy's greatest looks — sunny sprints, headphone sessions, holiday sweaters and one very small birthday puppy. Tap any photo to see it big."
      tone="leaf"
    >
      <ul className="m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto p-0 pb-4 sm:gap-6">
        {PHOTOS.map((photo, index) => (
          <li
            key={photo.src}
            className="ivy-photo-frame group w-[16rem] shrink-0 snap-center sm:w-[19rem]"
          >
            <button
              type="button"
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              onClick={() => setOpen(index)}
              aria-label={`Expand photo: ${photo.alt}`}
              className="block w-full cursor-zoom-in rounded-[1.15rem]"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
                width={1079}
                height={1080}
                className="block h-[19rem] w-full rounded-[1.15rem] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:h-[23rem]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded photo of Ivy"
          onClick={close}
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-charcoal/85 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-3xl animate-scale-in"
          >
            <img
              src={active.src}
              alt={active.alt}
              className="mx-auto max-h-[78vh] w-auto max-w-full rounded-[1.5rem] bg-card object-contain ink-border"
            />
            <p className="mt-3 text-center text-sm text-cream/90">{active.alt}</p>

            <button
              type="button"
              ref={closeRef}
              onClick={close}
              aria-label="Close expanded photo"
              className="pop absolute -top-3 -right-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-pink text-charcoal ink-border"
            >
              <XIcon aria-hidden className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="pop absolute left-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-charcoal ink-border"
            >
              <ChevronLeftIcon aria-hidden className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="pop absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-charcoal ink-border"
            >
              <ChevronRightIcon aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
