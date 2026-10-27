"use client";

import { useState } from "react";
import Image from "next/image";
import { safeImageUrl } from "../../data/image-utils";

export default function ImageUploadDropzone({
  value,
  onChange,
  required = false,
  label = "Foto / Gambar",
  hint,
}: {
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  label?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Gagal mengunggah gambar.");
      }
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="admin-field-group is-wide">
      <label>{label}</label>

      {value ? (
        <div className="admin-upload-card">
          <div className="admin-upload-thumb">
            <Image
              src={safeImageUrl(value)}
              alt="Pratinjau foto"
              fill
              sizes="240px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="admin-upload-meta">
            <span className="admin-upload-status">✓ Foto Terpasang</span>
            <div className="admin-upload-actions">
              <label className={`admin-secondary-button ${uploading ? "is-disabled" : ""}`} style={{ cursor: "pointer" }}>
                {uploading ? "Mengunggah…" : "Ganti Foto"}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </label>
              <button
                type="button"
                className="admin-danger-button"
                onClick={handleRemove}
                disabled={uploading}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className={`admin-dropzone ${uploading ? "is-uploading" : ""}`}>
          <div className="admin-dropzone-inner">
            <span className="admin-dropzone-icon" aria-hidden="true">📁</span>
            <strong>{uploading ? "Sedang Mengunggah Gambar…" : "Choose your file"}</strong>
            <p>Klik untuk memilih file foto dari komputer Anda (JPG, PNG, WebP, AVIF hingga 10MB)</p>
          </div>
          <input
            hidden
            type="file"
            required={required}
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
      )}

      {error && <p className="admin-form-error" role="alert">{error}</p>}
      {hint && <small>{hint}</small>}
    </div>
  );
}

