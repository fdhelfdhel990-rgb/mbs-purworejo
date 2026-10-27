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
      {/* Toolbar - Hanya Link, Poin, Nomor, dan Kutipan */}
      <div className="admin-visual-toolbar" role="toolbar" aria-label="Editor Pemformatan Teks">
        <button
          type="button"
          className="admin-toolbar-btn"
          title="Tautan / Link"
          onClick={handleLink}
        >
          🔗 Link
        </button>
        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.ul ? "is-active" : ""}`}
          title="Daftar Poin (Bullet List)"
          onClick={() => exec("insertUnorderedList")}
        >
          • Poin
        </button>
        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.ol ? "is-active" : ""}`}
          title="Daftar Nomor (Numbered List)"
          onClick={() => exec("insertOrderedList")}
        >
          1. Nomor
        </button>
        <button
          type="button"
          className={`admin-toolbar-btn ${activeFormats.quote ? "is-active" : ""}`}
          title="Kutipan (Quote)"
          onClick={() => exec("formatBlock", activeFormats.quote ? "p" : "blockquote")}
        >
          ❝ Kutipan
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

