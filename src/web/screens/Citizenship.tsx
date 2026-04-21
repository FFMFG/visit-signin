import type { Citizenship as CitizenshipValue } from "@shared/types";
import { BigButton, Layout } from "../components/Layout";

export function Citizenship({
  onPick,
  onBack,
}: {
  onPick: (c: CitizenshipValue) => void;
  onBack: () => void;
}) {
  return (
    <Layout
      onBack={onBack}
      title="Are you a U.S. Person?"
      subtitle="Required for our ITAR compliance. Please answer honestly."
    >
      <p className="text-base text-white/70 mb-8 leading-relaxed text-center">
        A <span className="font-semibold text-white">U.S. Person</span> is a U.S. citizen,
        lawful permanent resident ("green card" holder), or a person granted protected-individual
        status under 8 U.S.C. § 1324b(a)(3).
      </p>
      <div className="grid gap-5">
        <BigButton onClick={() => onPick("us_person")}>
          Yes, I am a U.S. Person
        </BigButton>
        <BigButton onClick={() => onPick("foreign_national")} variant="secondary">
          No, I am a foreign national
        </BigButton>
      </div>
      <p className="mt-8 text-sm text-white/50 text-center">
        Foreign nationals receive an escort-required badge and stricter NDA as required by U.S. export control law.
      </p>
    </Layout>
  );
}
