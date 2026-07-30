import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ConsentState = "unknown" | "granted" | "denied";

const KEY = "ivy-embed-consent";

const ConsentContext = createContext<{
  consent: ConsentState;
  grant: () => void;
  deny: () => void;
}>({ consent: "unknown", grant: () => {}, deny: () => {} });

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "granted" || stored === "denied") setConsent(stored);
    setHydrated(true);
  }, []);

  const grant = useCallback(() => {
    window.localStorage.setItem(KEY, "granted");
    setConsent("granted");
  }, []);
  const deny = useCallback(() => {
    window.localStorage.setItem(KEY, "denied");
    setConsent("denied");
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, grant, deny }}>
      {children}
      {hydrated && consent === "unknown" ? (
        <div
          role="dialog"
          aria-label="Cookie and embed consent"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl bg-cream p-4 pop-static sm:p-5"
        >
          <p className="font-display text-base">Third-party embeds are switched off</p>
          <p className="mt-2 text-sm text-charcoal/80">
            Ivy TV and social embeds load content from third parties that may set cookies. Nothing loads
            until you allow it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={grant} className="rounded-full bg-frog px-5 py-2 font-display text-sm pop">
              Allow embeds
            </button>
            <button type="button" onClick={deny} className="rounded-full bg-card px-5 py-2 font-display text-sm pop">
              Keep them off
            </button>
          </div>
        </div>
      ) : null}
    </ConsentContext.Provider>
  );
}

export function useEmbedConsent() {
  return useContext(ConsentContext);
}
