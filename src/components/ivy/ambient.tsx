import { CrownDoodle, FrogDoodle, LeafDoodle, PawDoodle } from "./doodles";

type Sprite = {
  Icon: typeof LeafDoodle;
  left: string;
  size: string;
  delay: string;
  duration: string;
  tone: string;
};

/**
 * Purely decorative ambient layer: leaves, paws, crowns and frogs drifting
 * slowly behind the clubhouse. It never captures pointer events and every
 * animation is disabled under `prefers-reduced-motion`.
 */
const sprites: Sprite[] = [
  { Icon: LeafDoodle, left: "4%", size: "h-16 w-16", delay: "0s", duration: "26s", tone: "text-frog" },
  { Icon: PawDoodle, left: "18%", size: "h-8 w-8", delay: "6s", duration: "34s", tone: "text-pink" },
  { Icon: FrogDoodle, left: "33%", size: "h-10 w-12", delay: "12s", duration: "30s", tone: "text-frog" },
  { Icon: CrownDoodle, left: "48%", size: "h-8 w-12", delay: "3s", duration: "38s", tone: "text-yellow" },
  { Icon: LeafDoodle, left: "62%", size: "h-20 w-20", delay: "16s", duration: "28s", tone: "text-leaf" },
  { Icon: PawDoodle, left: "77%", size: "h-9 w-9", delay: "9s", duration: "36s", tone: "text-lavender" },
  { Icon: FrogDoodle, left: "90%", size: "h-12 w-14", delay: "20s", duration: "32s", tone: "text-frog" },
];

export function AmbientVibes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden opacity-[0.13] mix-blend-luminosity"
    >
      {sprites.map(({ Icon, left, size, delay, duration, tone }, index) => (
        <span
          key={`${left}-${index}`}
          className={`absolute top-[-15%] ${size} ${tone} motion-safe:ivy-drift`}
          style={{ left, animationDelay: delay, animationDuration: duration }}
        >
          <Icon className="h-full w-full" />
        </span>
      ))}
      <span className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-frog blur-3xl motion-safe:ivy-glow" />
      <span
        className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-lavender blur-3xl motion-safe:ivy-glow"
        style={{ animationDelay: "5s" }}
      />
    </div>
  );
}
