import React from "react";

export function renderInlineText(text: string): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)|\*\*([^*]+)\*\*|<b>([^<]+)<\/b>|<strong>([^<]+)<\/strong>|\*([^*]+)\*|_([^_]+)_|<i>([^<]+)<\/i>|<em>([^<]+)<\/em>|<u>([^<]+)<\/u>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      elements.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="article-link">
          {match[1]}
        </a>
      );
    } else if (match[3] || match[4] || match[5]) {
      elements.push(<strong key={key++}>{match[3] || match[4] || match[5]}</strong>);
    } else if (match[6] || match[7] || match[8] || match[9]) {
      elements.push(<em key={key++}>{match[6] || match[7] || match[8] || match[9]}</em>);
    } else if (match[10]) {
      elements.push(<u key={key++}>{match[10]}</u>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

export default function FormattedArticleBody({ paragraphs }: { paragraphs: string[] }) {
  if (!paragraphs || paragraphs.length === 0) return null;

  const rendered: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      rendered.push(
        <ul key={`ul-${keyPrefix}`} className="article-ul">
          {currentList.map((item, idx) => (
            <li key={idx}>{renderInlineText(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  paragraphs.forEach((p, idx) => {
    const trimmed = p.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      currentList.push(trimmed.replace(/^[-*•]\s+/, ""));
      return;
    }

    flushList(idx);

    if (trimmed.startsWith("### ")) {
      rendered.push(<h3 key={idx} className="article-h3">{renderInlineText(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith("## ")) {
      rendered.push(<h2 key={idx} className="article-h2">{renderInlineText(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith("# ")) {
      rendered.push(<h2 key={idx} className="article-h2">{renderInlineText(trimmed.slice(2))}</h2>);
    } else if (trimmed.startsWith("> ")) {
      rendered.push(<blockquote key={idx} className="article-quote">{renderInlineText(trimmed.slice(2))}</blockquote>);
    } else {
      rendered.push(<p key={idx}>{renderInlineText(trimmed)}</p>);
    }
  });

  flushList(paragraphs.length);

  return <div className="article-body">{rendered}</div>;
}

