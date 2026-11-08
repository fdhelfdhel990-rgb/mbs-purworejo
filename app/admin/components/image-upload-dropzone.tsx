"use client";

import { useState } from "react";
import Image from "next/image";
import { safeImageUrl } from "../../data/image-utils";

export default function ImageUploadDropzone({
  value,
  onChange,
  required = false,
  label,
  hint,
  placeholderTitle = "Unggah file foto",
}: {
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  label?: string;
  hint?: string;
  placeholderTitle?: string;
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
      {label && <label className="admin-field-label">{label}</label>}

      {value ? (
        <div className="admin-upload-card">
          <div className="admin-upload-thumb">
            <Image
              src={safeImageUrl(value)}
              alt="Pratinjau foto"
              fill
              sizes="240px"
              unoptimized
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="admin-upload-meta">
            <span className="admin-upload-status">✓ Foto Terunggah</span>
            <span className="admin-upload-filename" title={value}>
              {value.split("/").pop() || value}
            </span>
            <div className="admin-upload-actions">
              <label className={`admin-btn-outline ${uploading ? "is-disabled" : ""}`}>
                {uploading ? "Mengunggah…" : "Ganti Foto"}
                <input
                  style={{ display: "none" }}
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
                className="admin-btn-danger"
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
            <div className="admin-dropzone-icon-box" aria-hidden="true">
              <svg className="admin-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <strong className="admin-dropzone-title">
              {uploading ? "Sedang Mengunggah Gambar…" : placeholderTitle}
            </strong>
            <p className="admin-dropzone-desc">
              Seret file ke area ini atau pilih dari perangkat
            </p>
            <span className="admin-dropzone-sub">
              Format PNG, JPG, atau WEBP • Maksimal 10 MB
            </span>
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
      {hint && <small className="admin-field-hint">{hint}</small>}
    </div>
  );
}
