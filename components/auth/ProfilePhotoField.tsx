"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Check, RotateCcw, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressProfilePhoto } from "@/lib/compress-profile-photo";
import "@/lib/i18n";

const MAX_BYTES = 5 * 1024 * 1024;

type ProfilePhotoFieldProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  /** Current profile photo URL (e.g. when editing) — shown until user picks a new file */
  existingPhotoUrl?: string;
};

export function ProfilePhotoField({ file, onChange, existingPhotoUrl }: ProfilePhotoFieldProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStep, setCameraStep] = useState<"live" | "preview">("live");
  const [captureUrl, setCaptureUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraOpen(false);
      setChooserOpen(true);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }
    if (cameraStep === "live") void startCamera();
    return () => stopCamera();
  }, [cameraOpen, cameraStep, startCamera, stopCamera]);

  const closeCamera = () => {
    if (captureUrl) URL.revokeObjectURL(captureUrl);
    setCaptureUrl(null);
    setCameraStep("live");
    setCameraOpen(false);
  };

  const acceptFile = async (next: File | null) => {
    if (!next) {
      onChange(null);
      return;
    }
    if (next.size > MAX_BYTES) return;
    const compressed = await compressProfilePhoto(next);
    onChange(compressed);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/")) return;
    void acceptFile(picked);
    setChooserOpen(false);
  };

  const openChooser = () => setChooserOpen(true);

  const openCamera = () => {
    setChooserOpen(false);
    setCameraStep("live");
    setCameraOpen(true);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight) || 480;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const url = URL.createObjectURL(blob);
        setCaptureUrl(url);
        setCameraStep("preview");
      },
      "image/jpeg",
      0.92
    );
  };

  const useCapture = async () => {
    if (!captureUrl) return;
    const res = await fetch(captureUrl);
    const blob = await res.blob();
    await acceptFile(new File([blob], "profile-photo.jpg", { type: "image/jpeg" }));
    closeCamera();
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">
        {t("register.seeker.fields.photo")}{" "}
        <span className="text-xs font-normal text-muted-foreground">({t("common.optional")})</span>
      </p>

      <button
        type="button"
        onClick={openChooser}
        className="flex w-full cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-line bg-soft/40 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-soft"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-line bg-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : existingPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={existingPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green">
                <Check className="h-4 w-4 shrink-0" />
                {t("register.seeker.photo.selected")}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{file.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  acceptFile(null);
                }}
                className="mt-1 text-xs font-semibold text-red hover:underline"
              >
                {t("register.seeker.photo.remove")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">
                {existingPhotoUrl ? t("register.seeker.fields.photoChange") : t("register.seeker.fields.photoUpload")}
              </p>
              <p className="text-xs text-muted-foreground">{t("register.seeker.fields.photoHint")}</p>
            </>
          )}
        </div>
      </button>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickFile} />

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <DialogContent className="max-w-md border-line bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-ink">
              {t("register.seeker.photo.updateTitle")}
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground">
              {t("register.seeker.photo.intro")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={openCamera}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-white text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <Camera className="h-4 w-4" />
              {t("register.seeker.photo.useCamera")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              {t("register.seeker.photo.uploadPhoto")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cameraOpen}
        onOpenChange={(open) => {
          if (!open) closeCamera();
          else setCameraOpen(true);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden border-0 bg-black p-0 text-white sm:rounded-2xl [&>button:last-child]:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <DialogTitle className="text-base font-semibold text-white">
              {t("register.seeker.photo.takePhoto")}
            </DialogTitle>
            <button
              type="button"
              onClick={closeCamera}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {cameraStep === "live" ? (
            <div className="relative aspect-square w-full bg-black">
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-[min(72vw,280px)] w-[min(72vw,280px)] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
              <p className="absolute bottom-20 left-0 right-0 text-center text-xs text-white/80">
                {t("register.seeker.photo.centerFace")}
              </p>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
                  aria-label={t("register.seeker.photo.takePhoto")}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white">
                    <Camera className="h-6 w-6 text-ink" />
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black">
              {captureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={captureUrl} alt="" className="aspect-square w-full object-cover" />
              )}
              <p className="py-3 text-center text-sm text-white/80">{t("register.seeker.photo.preview")}</p>
              <div className="flex gap-3 border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={() => {
                    if (captureUrl) URL.revokeObjectURL(captureUrl);
                    setCaptureUrl(null);
                    setCameraStep("live");
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/15 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("register.seeker.photo.retake")}
                </button>
                <button
                  type="button"
                  onClick={() => void useCapture()}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-white py-2.5 text-sm font-semibold text-ink hover:bg-white/90"
                >
                  {t("register.seeker.photo.usePhoto")}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
