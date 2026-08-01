import { Section } from "./primitives";
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

/**
 * A simple owner-provided photo row — framed to match the clubhouse, no
 * platform chrome, no watermarks.
 */
export function IvyPhotoRow() {
  return (
    <Section
      id="ivy-photos"
      eyebrow="Owner-approved photos"
      title="The Frog Queen, frame by frame"
      intro="A row of Ivy's greatest looks — sunny sprints, headphone sessions, holiday sweaters and one very small birthday puppy."
      tone="leaf"
    >
      <ul className="m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto p-0 pb-4 sm:gap-6">
        {PHOTOS.map((photo, index) => (
          <li
            key={photo.src}
            className="ivy-photo-frame group w-[16rem] shrink-0 snap-center sm:w-[19rem]"
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
          </li>
        ))}
      </ul>
    </Section>
  );
}
