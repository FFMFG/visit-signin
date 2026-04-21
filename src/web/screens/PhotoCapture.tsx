import { useEffect, useRef, useState } from "react";
import { BigButton, Layout } from "../components/Layout";

export function PhotoCapture({
  onCapture,
  onBack,
}: {
  onCapture: (dataUrl: string) => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((e) => setErr(e?.message ?? "Camera unavailable"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const start = () => {
    setCountdown(3);
    const tick = (n: number) => {
      if (n === 0) {
        setCountdown(null);
        snap();
        return;
      }
      setCountdown(n);
      setTimeout(() => tick(n - 1), 800);
    };
    setTimeout(() => tick(2), 800);
  };

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <Layout onBack={onBack} title="Smile!" subtitle="We'll print this on your badge.">
      <div className="flex flex-col items-center">
        <div className="w-[320px] h-[320px] rounded-2xl overflow-hidden bg-black/40 border border-white/20 relative">
          {snapshot ? (
            <img src={snapshot} alt="Snapshot" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
          {countdown !== null ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[120px] font-bold bg-black/30">
              {countdown}
            </div>
          ) : null}
        </div>
        {err ? (
          <div className="text-[#e76f51] mt-4 text-center">Camera error: {err}</div>
        ) : null}
        <div className="grid gap-3 mt-6 w-full">
          {!snapshot ? (
            <BigButton disabled={!stream || countdown !== null} onClick={start}>
              Take photo
            </BigButton>
          ) : (
            <>
              <BigButton onClick={() => onCapture(snapshot)}>Use this photo</BigButton>
              <BigButton variant="secondary" onClick={() => setSnapshot(null)}>
                Retake
              </BigButton>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
