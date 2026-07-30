import {
  createContext,
  useCallback,
  useContext,
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

interface ConsentContextValue {
  consent: ConsentState;
  embedsAllowed: boolean;
  grant: () => void;
  deny: () => void;
  openSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: "granted",
  embedsAllowed: true,
  grant: () => {},
  deny: () => {},
  openSettings: () => {},
});

export function useEmbedConsent() {
  return useContext(ConsentContext);
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const noop = useCallback(() => {}, []);

  // Ivy's official Instagram and TikTok embeds ARE the content of this site, so
  // they always load — no banner, no gate, no "load post" step. The settings
  // dialog stays available so visitors can see exactly what those players do.
  const value = useMemo<ConsentContextValue>(
    () => ({
      consent: "granted",
      embedsAllowed: true,
      grant: noop,
      deny: noop,
      openSettings,
    }),
    [noop, openSettings],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card pop-static">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-charcoal">Cookie settings</DialogTitle>
            <DialogDescription className="text-charcoal/80">
              IvyVibing uses no analytics or advertising cookies. The only third-party storage
              comes from Ivy&apos;s own Instagram and TikTok players.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl bg-card p-4 pop-static">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-base text-charcoal">Strictly necessary</h3>
                  <p className="mt-1 text-sm text-charcoal/75">
                    Basic interface preferences. Always on.
                  </p>
                </div>
                <Switch checked disabled aria-label="Strictly necessary storage is always on" />
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 pop-static">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-base text-charcoal">
                    Official social embeds
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/75">
                    Ivy&apos;s posts are shown with Instagram and TikTok&apos;s own players, which
                    may set their own cookies. They are part of the site&apos;s content, so they
                    always load.
                  </p>
                </div>
                <Switch checked disabled aria-label="Official social embeds are always on" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={() => setSettingsOpen(false)}
              className="min-h-11 rounded-full bg-frog font-display text-charcoal pop hover:bg-frog"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsentContext.Provider>
  );
}
