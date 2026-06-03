"use client";

import { ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UploadedPhoto } from "@/types";

type PhotoUploaderProps = {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
};

export function PhotoUploader({ photos, onChange }: PhotoUploaderProps) {
  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const nextPhotos = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<UploadedPhoto>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                dataUrl: String(reader.result)
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    onChange([...photos, ...nextPhotos]);
  }

  return (
    <div className="space-y-4">
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-6 py-8 text-center transition-colors hover:bg-primary/10">
        <ImagePlus className="h-8 w-8 text-primary" />
        <span className="text-base font-semibold">Bilder auswaehlen oder aufnehmen</span>
        <span className="text-sm text-muted-foreground">Mehrere Fotos sind moeglich und werden lokal gespeichert.</span>
        <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => handleFiles(event.target.files)} />
      </label>

      {photos.length > 0 && (
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
      )}
    </div>
  );
}
