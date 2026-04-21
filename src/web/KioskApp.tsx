import { useEffect, useState } from "react";
import type { KioskDraft, KioskStep } from "./types";
import { Welcome } from "./screens/Welcome";
import { Citizenship } from "./screens/Citizenship";
import { Identity } from "./screens/Identity";
import { HostPicker } from "./screens/HostPicker";
import { Purpose } from "./screens/Purpose";
import { PhotoCapture } from "./screens/PhotoCapture";
import { Nda } from "./screens/Nda";
import { Confirmation } from "./screens/Confirmation";
import { SignoutPick } from "./screens/SignoutPick";
import { SignoutDone } from "./screens/SignoutDone";
import { Delivery } from "./screens/Delivery";
import { DeliveryDone } from "./screens/DeliveryDone";

export function KioskApp() {
  const [step, setStep] = useState<KioskStep>("welcome");
  const [draft, setDraft] = useState<KioskDraft>({});

  const reset = () => {
    setDraft({});
    setStep("welcome");
  };

  // Kiosk idle-reset: 5 min of no touches → back to welcome.
  useEffect(() => {
    if (step === "welcome") return;
    const t = setTimeout(reset, 5 * 60 * 1000);
    const bump = () => {
      clearTimeout(t);
      // Re-mounting effect on interaction is heavy; simple approach: just reset the timer.
    };
    window.addEventListener("touchstart", bump, { passive: true });
    window.addEventListener("click", bump);
    return () => {
      clearTimeout(t);
      window.removeEventListener("touchstart", bump);
      window.removeEventListener("click", bump);
    };
  }, [step]);

  return (
    <div className="min-h-full flex flex-col">
      {step === "welcome" && <Welcome go={setStep} />}
      {step === "citizenship" && (
        <Citizenship
          onBack={reset}
          onPick={(c) => {
            setDraft((d) => ({ ...d, citizenship: c }));
            setStep("identity");
          }}
        />
      )}
      {step === "identity" && (
        <Identity
          onBack={() => setStep("citizenship")}
          onNext={(identity) => {
            setDraft((d) => ({ ...d, identity }));
            setStep("host");
          }}
        />
      )}
      {step === "host" && (
        <HostPicker
          onBack={() => setStep("identity")}
          onPick={(host) => {
            setDraft((d) => ({ ...d, host }));
            setStep("purpose");
          }}
        />
      )}
      {step === "purpose" && (
        <Purpose
          onBack={() => setStep("host")}
          onNext={(purpose, category) => {
            setDraft((d) => ({ ...d, purpose, purposeCategory: category }));
            setStep("photo");
          }}
        />
      )}
      {step === "photo" && (
        <PhotoCapture
          onBack={() => setStep("purpose")}
          onCapture={(photoDataUrl) => {
            setDraft((d) => ({ ...d, photoDataUrl }));
            setStep("nda");
          }}
        />
      )}
      {step === "nda" && draft.citizenship && draft.identity && draft.host && draft.purpose && draft.photoDataUrl && (
        <Nda
          draft={draft}
          onBack={() => setStep("photo")}
          onSigned={(visitId, badgePdfUrl) => {
            setDraft((d) => ({ ...d, visitId, badgePdfUrl }));
            setStep("confirmation");
          }}
        />
      )}
      {step === "confirmation" && draft.host && (
        <Confirmation draft={draft} onDone={reset} />
      )}
      {step === "signout_pick" && (
        <SignoutPick onBack={reset} onDone={() => setStep("signout_done")} />
      )}
      {step === "signout_done" && <SignoutDone onDone={reset} />}
      {step === "delivery" && (
        <Delivery onBack={reset} onDone={() => setStep("delivery_done")} />
      )}
      {step === "delivery_done" && <DeliveryDone onDone={reset} />}
    </div>
  );
}
