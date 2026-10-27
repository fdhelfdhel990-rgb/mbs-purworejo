"use client";

import { useEffect, useRef, useState } from "react";

function markdownOrPlainToHtml(text: string): string {
  if (!text) return "<p><br></p>";
  // If it already looks like HTML
  if (/<(p|div|h[1-6]|ul|ol|blockquote)[\s>]/i.test(text)) {
    return text;
  }

  const lines = text.split("\n");
  const htmlParts: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      htmlParts.push("<p><br></p>");
      return;
    }

    let parsed = trimmed
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    if (parsed.startsWith("### ")) {
      htmlParts.push(`<h3>${parsed.slice(4)}</h3>`);
    } else if (parsed.startsWith("## ")) {
      htmlParts.push(`<h2>${parsed.slice(3)}</h2>`);
    } else if (parsed.startsWith("# ")) {
      htmlParts.push(`<h2>${parsed.slice(2)}</h2>`);
    } else if (parsed.startsWith("> ")) {
      htmlParts.push(`<blockquote>${parsed.slice(2)}</blockquote>`);
    } else if (parsed.startsWith("- ") || parsed.startsWith("• ")) {
      htmlParts.push(`<ul><li>${parsed.slice(2)}</li></ul>`);
    } else {
      htmlParts.push(`<p>${parsed}</p>`);
    }
  });

  return htmlParts.join("");
}

export default function VisualEditor({
  value,
  onChange,
  placeholder = "Mulai ketik isi berita di sini...",
}: {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h2: false,
    h3: false,
    ul: false,
    ol: false,
    quote: false,
  });

  // Initialize content once or when value significantly differs
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const initialHtml = markdownOrPlainToHtml(value);
    if (editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [value]);

  const sync = () => {
    if (!editorRef.current) return;
    isInternalUpdate.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateFormatState();
  };

  const updateFormatState = () => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        h2: document.queryCommandValue("formatBlock") === "h2",
        h3: document.queryCommandValue("formatBlock") === "h3",
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        quote: document.queryCommandValue("formatBlock") === "blockquote",
      });
    } catch {
      // ignore
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    sync();
  };

  const handleLink = () => {
    const url = window.prompt("Masukkan URL tautan (contoh: https://contoh.sch.id):");
    if (url) {
      exec("createLink", url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        exec("bold");
      } else if (key === "i") {
        e.preventDefault();
        exec("italic");
      } else if (key === "u") {
        e.preventDefault();
        exec("underline");
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        exec("redo");
      } else if (key === "z") {
        // Native browser Ctrl+Z handles undo in contentEditable,
        // sync after next tick
        setTimeout(sync, 10);
      }
    }
  };

  return (
    <div className="admin-visual-editor-container">
      {/* Toolbar - Hanya Icon Minimalis Sesuai Referensi */}
      <div className="admin-visual-toolbar" role="toolbar" aria-label="Editor Pemformatan Teks">
        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.bold ? "is-active" : ""}`}
          title="Tebal (Ctrl+B)"
          onClick={() => exec("bold")}
          aria-label="Tebal"
        >
          <span className="admin-toolbar-icon-text font-bold">B</span>
        </button>

        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.italic ? "is-active" : ""}`}
          title="Miring (Ctrl+I)"
          onClick={() => exec("italic")}
          aria-label="Miring"
        >
          <span className="admin-toolbar-icon-text font-italic">I</span>
        </button>

        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.underline ? "is-active" : ""}`}
          title="Garis Bawah (Ctrl+U)"
          onClick={() => exec("underline")}
          aria-label="Garis Bawah"
        >
          <span className="admin-toolbar-icon-text font-underline">U</span>
        </button>

        <div className="admin-toolbar-separator" />

        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.ul ? "is-active" : ""}`}
          title="Daftar Poin"
          onClick={() => exec("insertUnorderedList")}
          aria-label="Daftar Poin"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.ol ? "is-active" : ""}`}
          title="Daftar Nomor"
          onClick={() => exec("insertOrderedList")}
          aria-label="Daftar Nomor"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="2" y="7.5" fontSize="7.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
            <text x="2" y="13.5" fontSize="7.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
            <text x="2" y="19.5" fontSize="7.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
          </svg>
        </button>

        <div className="admin-toolbar-separator" />

        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.quote ? "is-active" : ""}`}
          title="Kutipan"
          onClick={() => exec("formatBlock", activeFormats.quote ? "p" : "blockquote")}
          aria-label="Kutipan"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
          </svg>
        </button>

        <button
          type="button"
          className="admin-toolbar-btn"
          title="Tautan / Link"
          onClick={handleLink}
          aria-label="Tautan"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
      </div>

      {/* Live WYSIWYG Editable Canvas */}
      <div
        ref={editorRef}
        className="admin-visual-canvas article-body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={sync}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

