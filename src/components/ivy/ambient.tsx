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
  { Icon: LeafDoodle, left: "4%", size: "h-16 w-16", delay: "0s", duration: "24s", tone: "text-frog" },
  { Icon: PawDoodle, left: "12%", size: "h-8 w-8", delay: "6s", duration: "31s", tone: "text-pink" },
  { Icon: CrownDoodle, left: "24%", size: "h-7 w-10", delay: "14s", duration: "27s", tone: "text-yellow" },
  { Icon: FrogDoodle, left: "33%", size: "h-10 w-12", delay: "10s", duration: "28s", tone: "text-frog" },
  { Icon: LeafDoodle, left: "41%", size: "h-10 w-10", delay: "19s", duration: "33s", tone: "text-lavender" },
  { Icon: CrownDoodle, left: "48%", size: "h-8 w-12", delay: "3s", duration: "35s", tone: "text-yellow" },
  { Icon: PawDoodle, left: "56%", size: "h-7 w-7", delay: "22s", duration: "29s", tone: "text-cream" },
  { Icon: LeafDoodle, left: "62%", size: "h-20 w-20", delay: "16s", duration: "26s", tone: "text-leaf" },
  { Icon: FrogDoodle, left: "70%", size: "h-9 w-11", delay: "26s", duration: "34s", tone: "text-pink" },
  { Icon: PawDoodle, left: "77%", size: "h-9 w-9", delay: "9s", duration: "32s", tone: "text-lavender" },
  { Icon: LeafDoodle, left: "84%", size: "h-12 w-12", delay: "30s", duration: "30s", tone: "text-frog" },
  { Icon: FrogDoodle, left: "92%", size: "h-12 w-14", delay: "20s", duration: "29s", tone: "text-frog" },
];

export function AmbientVibes() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] overflow-hidden opacity-[0.18]">
      {sprites.map(({ Icon, left, size, delay, duration, tone }, index) => (
        <span
          key={`${left}-${index}`}
          className={`absolute top-[-15%] ${size} ${tone} motion-safe:ivy-drift`}
          style={{ left, animationDelay: delay, animationDuration: duration }}
        >
          <Icon className="h-full w-full" />
        </span>
      ))}
      <span className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-frog opacity-70 blur-3xl motion-safe:ivy-glow" />
      <span
        className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-lavender opacity-70 blur-3xl motion-safe:ivy-glow"
        style={{ animationDelay: "5s" }}
      />
      <span
        className="absolute left-1/3 top-2/3 h-56 w-56 rounded-full bg-pink opacity-50 blur-3xl motion-safe:ivy-glow"
        style={{ animationDelay: "9s" }}
      />
      <span
        className="absolute right-1/4 top-0 h-52 w-52 rounded-full bg-yellow opacity-40 blur-3xl motion-safe:ivy-glow"
        style={{ animationDelay: "13s" }}
      />
    </div>
  );
}

