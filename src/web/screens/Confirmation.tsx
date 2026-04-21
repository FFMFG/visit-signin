import { useEffect } from "react";
import type { KioskDraft } from "../types";
import { Layout } from "../components/Layout";

export function Confirmation({ draft, onDone }: { draft: KioskDraft; onDone: () => void }) {
  useEffect(() => {
    // Auto-trigger print + auto-return after 15s
    const printTimer = setTimeout(() => {
      if (draft.badgePdfUrl) printPdf(draft.badgePdfUrl);
    }, 300);
    const backTimer = setTimeout(onDone, 15000);
    return () => {
      clearTimeout(printTimer);
      clearTimeout(backTimer);
    };
    // We want this effect once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout title="You're checked in." subtitle={`${draft.host?.displayName} has been notified.`}>
      <div className="text-center text-white/80 leading-relaxed max-w-lg mx-auto">
        <p>A visitor badge is printing. Please take it from the printer and wear it visibly.</p>
        {draft.citizenship === "foreign_national" ? (
          <p className="mt-4 text-[#e76f51] font-semibold">
            Please wait here for your escort to arrive.
          </p>
        ) : null}
        <p className="mt-6 text-sm text-white/50">
          This screen will return to the start in a moment.
        </p>
      </div>
      <div className="mt-8 grid gap-3">
        <button
          type="button"
          onClick={() => draft.badgePdfUrl && printPdf(draft.badgePdfUrl)}
          className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15"
        >
          Reprint badge
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-4 rounded-xl bg-[#00b4d8] text-[#1a1a2e] font-semibold"
        >
          Done
        </button>
      </div>
    </Layout>
  );
}

function printPdf(url: string) {
  // Hidden iframe → window.print triggers AirPrint dialog on iPad
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
  };
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 60_000);
}
