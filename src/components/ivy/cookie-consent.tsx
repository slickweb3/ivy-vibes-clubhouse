import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export type ConsentState = "unknown" | "granted" | "denied";

const STORAGE_KEY = "ivy.embed-consent";

interface ConsentContextValue {
  consent: ConsentState;
  embedsAllowed: boolean;
  grant: () => void;
  deny: () => void;
  openSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: "unknown",
  embedsAllowed: false,
  grant: () => {},
  deny: () => {},
  openSettings: () => {},
});

export function useEmbedConsent() {
  return useContext(ConsentContext);
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftAllowed, setDraftAllowed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "granted" || stored === "denied") setConsent(stored);
    } catch {
      /* storage unavailable — stay on the safe default */
    }
  }, []);

  const persist = useCallback((next: ConsentState) => {
    setConsent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const grant = useCallback(() => persist("granted"), [persist]);
  const deny = useCallback(() => persist("denied"), [persist]);

  const openSettings = useCallback(() => {
    setDraftAllowed(consent !== "denied");
    setSettingsOpen(true);
  }, [consent]);

  // Official Instagram/TikTok embeds load by default so Ivy's posts appear
  // straight away; visitors can switch them off in the banner or settings.
  // Gated on `hydrated` so a stored "denied" choice is respected before any
  // third-party request is made.
  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      embedsAllowed: hydrated && consent !== "denied",
      grant,
      deny,
      openSettings,
    }),
    [consent, hydrated, grant, deny, openSettings],
  );

  const showBanner = hydrated && consent === "unknown";

  return (
    <ConsentContext.Provider value={value}>
      {children}

      {showBanner ? (
        <div
          role="region"
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-3 z-50 rounded-2xl bg-card p-4 pop-static sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
        >
          <h2 className="font-display text-base text-charcoal">Ivy&apos;s posts are loading from Instagram &amp; TikTok</h2>
          <p className="mt-1.5 text-sm text-charcoal/80">
            Her official embeds show up automatically so you can watch straight away. They can set
            cookies belonging to Instagram or TikTok — switch them off any time and you&apos;ll get a
            card with a link to the original post instead.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={grant} className="min-h-11 rounded-full bg-frog font-display text-charcoal pop hover:bg-frog">
              Keep embeds on
            </Button>

            <Button
              onClick={deny}
              variant="secondary"
              className="min-h-11 rounded-full bg-card font-display text-charcoal pop hover:bg-card"
            >
              Keep them off
            </Button>
            <Button
              onClick={openSettings}
              variant="ghost"
              className="min-h-11 rounded-full font-display text-charcoal underline"
            >
              Cookie settings
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card pop-static">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-charcoal">Cookie settings</DialogTitle>
            <DialogDescription className="text-charcoal/80">
              IvyVibing uses no analytics or advertising cookies. Only optional third-party embeds
              can be enabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl bg-card p-4 pop-static">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-base text-charcoal">Strictly necessary</h3>
                  <p className="mt-1 text-sm text-charcoal/75">
                    Remembers your cookie choice and basic interface preferences. Always on.
                  </p>
                </div>
                <Switch checked disabled aria-label="Strictly necessary storage is always on" />
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 pop-static">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-base text-charcoal">
                    Optional social video embeds
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/75">
                    Loads Instagram or TikTok players only after you press play. Off by default.
                  </p>
                </div>
                <Switch
                  checked={draftAllowed}
                  onCheckedChange={setDraftAllowed}
                  aria-label="Allow optional social video embeds"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={() => {
                if (draftAllowed) grant();
                else deny();
                setSettingsOpen(false);
              }}
              className="min-h-11 rounded-full bg-frog font-display text-charcoal pop hover:bg-frog"
            >
              Save choices
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSettingsOpen(false)}
              className="min-h-11 rounded-full bg-card font-display text-charcoal pop hover:bg-card"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsentContext.Provider>
  );
}
