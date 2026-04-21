import { useRef, useState } from "react";
import type { CreateVisitRequest, CreateVisitResponse } from "@shared/types";
import { BigButton, Layout } from "../components/Layout";
import { SignatureCanvas } from "../components/SignatureCanvas";
import type { KioskDraft } from "../types";

export function Nda({
  draft,
  onSigned,
  onBack,
}: {
  draft: KioskDraft;
  onSigned: (visitId: string, badgePdfUrl: string) => void;
  onBack: () => void;
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isFn = draft.citizenship === "foreign_national";

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      setScrolledToEnd(true);
    }
  };

  const submit = async () => {
    if (!signature) return;
    setSubmitting(true);
    setErr(null);
    const body: CreateVisitRequest = {
      identity: draft.identity!,
      citizenship: draft.citizenship!,
      hostEntraId: draft.host!.entraId,
      purpose: draft.purpose!,
      purposeCategory: draft.purposeCategory!,
      photoDataUrl: draft.photoDataUrl!,
      signatureDataUrl: signature,
    };
    try {
      const resp = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const e = (await resp.json().catch(() => ({}))) as { detail?: string };
        throw new Error(e.detail ?? `HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as CreateVisitResponse;
      onSigned(data.id, data.badgePdfUrl);
    } catch (e) {
      setErr((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Layout
      onBack={onBack}
      title={isFn ? "Foreign National NDA" : "Visitor NDA"}
      subtitle="Please read and sign."
    >
      {isFn ? (
        <div className="bg-[#e76f51]/20 border border-[#e76f51]/60 rounded-xl px-4 py-3 mb-4">
          <div className="font-semibold text-[#e76f51]">ESCORT REQUIRED</div>
          <div className="text-sm text-white/80">
            As a foreign national visitor, you must remain with your authorized escort at all times while on-site.
          </div>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="bg-white text-[#1a1a2e] rounded-xl p-6 h-[40vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed"
      >
        <NdaText isFn={isFn} />
      </div>
      {!scrolledToEnd ? (
        <div className="text-center text-white/60 text-sm mt-2">Scroll to the bottom to continue</div>
      ) : null}
      {scrolledToEnd ? (
        <div className="mt-6">
          <SignatureCanvas onChange={setSignature} />
        </div>
      ) : null}
      {err ? <div className="text-[#e76f51] mt-3 text-sm">{err}</div> : null}
      <div className="mt-6">
        <BigButton disabled={!signature || submitting} onClick={submit}>
          {submitting ? "Saving…" : "I agree and sign"}
        </BigButton>
      </div>
    </Layout>
  );
}

function NdaText({ isFn }: { isFn: boolean }) {
  // Summary shown in the iPad UI; the legal version lives in the stored PDF.
  if (isFn) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-2">Foreign National Visitor NDA</h2>
        <p>
          By signing below you acknowledge: (1) you are not a U.S. Person under 22 CFR 120.62;
          (2) you will be escorted at all times; (3) you will not photograph, video, or record any
          part of the facility; (4) you understand that exposure to export-controlled technical
          data without prior authorization constitutes a deemed export under U.S. law.
        </p>
        <p className="mt-3">
          Confidential information disclosed to you during this visit may not be shared with third
          parties. You will surrender your visitor badge upon departure.
        </p>
        <p className="mt-3 italic text-[#6c757d]">
          The full legal language is in the PDF version, which is stored with your signed record.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Visitor NDA</h2>
      <p>
        By signing below you acknowledge: (1) you are a U.S. Person under 22 CFR 120.62;
        (2) you will remain in visitor-accessible areas unless escorted; (3) you will not
        photograph or record any part of the facility without permission; (4) you will not
        disclose confidential information observed during this visit to third parties.
      </p>
      <p className="mt-3">You will wear your issued badge visibly at all times while on-site.</p>
      <p className="mt-3 italic text-[#6c757d]">
        The full legal language is in the PDF version, which is stored with your signed record.
      </p>
    </div>
  );
}
