import { createRoot } from "react-dom/client";
import { useSyncExternalStore } from "react";
import { StudioLanding } from "./StudioLanding";
import { StudioApp } from "./studio/StudioApp";
import { DesignLab } from "./studio/DesignLab";
import { KitLab } from "./studio/KitLab";
import { GateLab } from "./studio/GateLab";
import { LearnLab } from "./studio/LearnLab";

function useHash(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash.replace(/^#/, ""),
  );
}

function Router() {
  const h = useHash();
  if (h.startsWith("studio") || h.startsWith("build")) return <StudioApp />;
  if (h.startsWith("dslab")) return <DesignLab />;
  if (h.startsWith("kit")) return <KitLab />;
  if (h.startsWith("gatelab")) return <GateLab />;
  if (h.startsWith("learn")) return <LearnLab />;
  return <StudioLanding />;
}

createRoot(document.getElementById("root") as HTMLElement).render(<Router />);
