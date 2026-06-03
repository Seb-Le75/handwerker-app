"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#0f172a";

    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, width, height);
      image.src = value;
    }
  });

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
      setHasSignature(true);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange("");
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Unterschrift Kunde</p>
          <p className="text-sm text-muted-foreground">Mit Finger oder Apple Pencil unterschreiben.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={!hasSignature}>
          <RotateCcw className="h-4 w-4" />
          Loeschen
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-44 w-full touch-none rounded-md border border-dashed border-primary/45 bg-sky-50"
        onPointerDown={(event) => {
          const context = event.currentTarget.getContext("2d");
          if (!context) {
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = getPoint(event);
          drawingRef.current = true;
          context.beginPath();
          context.moveTo(point.x, point.y);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current) {
            return;
          }
          const context = event.currentTarget.getContext("2d");
          if (!context) {
            return;
          }
          const point = getPoint(event);
          context.lineTo(point.x, point.y);
          context.stroke();
        }}
        onPointerUp={(event) => {
          drawingRef.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
          saveSignature();
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
        }}
      />
    </div>
  );
}
