import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface QrScannerPanelProps {
  /** Se invoca con el contenido crudo escaneado. Devuelve true si el escaneo se consumió. */
  onDecoded: (raw: string) => Promise<boolean>;
  hint?: string;
}

/**
 * Panel de cámara para escanear el QR del carnet.
 * Compartido por la asistencia del día y la de eventos.
 */
export default function QrScannerPanel({
  onDecoded,
  hint = "Apunta a la cámara al QR del carnet. También acepta el código del miembro.",
}: Readonly<QrScannerPanelProps>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const cameraActiveRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    cameraActiveRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleDecoded = useCallback(
    async (raw: string) => {
      if (!scanningRef.current) return;
      scanningRef.current = false;
      const consumed = await onDecoded(raw);
      if (consumed) {
        stopCamera();
      } else {
        scanningRef.current = true;
      }
    },
    [onDecoded, stopCamera],
  );

  const tick = useCallback(() => {
    if (!cameraActiveRef.current || !scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, width, height, {
            inversionAttempts: "dontInvert",
          });
          if (code?.data) {
            void handleDecoded(code.data);
            return;
          }
        }
      }
    }
    requestAnimationFrame(tick);
  }, [handleDecoded]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      cameraActiveRef.current = true;
      scanningRef.current = true;
      requestAnimationFrame(tick);
    } catch {
      setCameraError("No se pudo acceder a la cámara. Usa la entrada manual.");
    }
  }, [tick]);

  return (
    <div>
      <p className="mt-1 text-xs leading-relaxed text-(--support-grey)">{hint}</p>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-(--support-gunmetal) bg-[#050916]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`aspect-video w-full object-cover ${cameraActive ? "" : "hidden"}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        {!cameraActive && !cameraError && (
          <div className="flex aspect-video items-center justify-center">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-full border border-(--cyan) bg-(--cyan)/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-(--cyan) shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 hover:bg-(--cyan) hover:text-(--bg-black)"
            >
              Activar cámara
            </button>
          </div>
        )}
        {!cameraActive && cameraError && (
          <div className="flex aspect-video items-center justify-center p-6 text-center text-[10px] font-bold uppercase tracking-widest text-(--support-lila)">
            {cameraError}
          </div>
        )}
      </div>
    </div>
  );
}
