"use client";

import { useState } from "react";
import { AlertCircle, Camera, Images, LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createId } from "@/lib/utils";
import type { UploadedPhoto } from "@/types";

type PhotoUploaderProps = {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
};

const maximumPhotos = 6;

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length || processing) return;
    const remaining = maximumPhotos - photos.length;
    if (remaining <= 0) {
      setMessage(`Maximal ${maximumPhotos} Fotos pro Auftrag.`);
      return;
    }

    setProcessing(true);
    setMessage("");
    try {
      const selected = Array.from(files).slice(0, remaining);
      const nextPhotos: UploadedPhoto[] = [];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 25 * 1024 * 1024) throw new Error("Ein Foto ist größer als 25 MB.");
        nextPhotos.push({
          id: createId("photo"),
          name: file.name,
          dataUrl: await resizePhoto(file)
        });
      }
      if (nextPhotos.length === 0) throw new Error("Es wurde kein unterstütztes Foto ausgewählt.");
      onChange([...photos, ...nextPhotos]);
      if (files.length > remaining) setMessage(`Es wurden die ersten ${remaining} Fotos übernommen.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Das Foto konnte nicht verarbeitet werden.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <PhotoInput
          icon={Camera}
          label="Foto aufnehmen"
          capture="environment"
          disabled={processing || photos.length >= maximumPhotos}
          onFiles={handleFiles}
        />
        <PhotoInput
          icon={Images}
          label="Aus Fotos auswählen"
          multiple
          disabled={processing || photos.length >= maximumPhotos}
          onFiles={handleFiles}
        />
      </div>

      <div className="flex min-h-6 items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {processing ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" /> Foto wird für das iPad verkleinert …
          </>
        ) : message ? (
          <>
            <AlertCircle className="h-4 w-4" /> {message}
          </>
        ) : (
          <span>
            {photos.length} von {maximumPhotos} Fotos · platzsparend lokal gespeichert
          </span>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-lg border bg-white">
              <img src={photo.dataUrl} alt={photo.name} className="aspect-square w-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-9 w-9"
                aria-label={`${photo.name} entfernen`}
                onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PhotoInput({
  icon: Icon,
  label,
  capture,
  multiple = false,
  disabled,
  onFiles
}: {
  icon: typeof Camera;
  label: string;
  capture?: "environment";
  multiple?: boolean;
  disabled: boolean;
  onFiles: (files: FileList | null) => Promise<void>;
}) {
  return (
    <label
      className={`flex min-h-24 items-center justify-center gap-3 rounded-lg border border-dashed px-5 py-4 text-center text-base font-semibold transition-colors ${
        disabled
          ? "cursor-not-allowed bg-secondary text-muted-foreground opacity-60"
          : "cursor-pointer border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
      }`}
    >
      <Icon className="h-6 w-6" />
      {label}
      <input
        className="sr-only"
        type="file"
        accept="image/*"
        capture={capture}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const input = event.currentTarget;
          void onFiles(input.files).finally(() => {
            input.value = "";
          });
        }}
      />
    </label>
  );
}

async function resizePhoto(file: File) {
  const image = await loadImage(file);
  const maximumEdge = 1400;
  const scale = Math.min(1, maximumEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Das Foto konnte auf diesem Gerät nicht verarbeitet werden.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.76);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Dieses Bildformat wird auf dem Gerät nicht unterstützt."));
    };
    image.src = url;
  });
}
