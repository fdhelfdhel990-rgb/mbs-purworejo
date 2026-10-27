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

  return (
    <div className="article-body">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // If block is already HTML (e.g. <p>...</p>, <h2>...</h2>, <ul>...</ul>, <blockquote>...</blockquote>)
        if (/^<[a-z1-6]+[\s>]/i.test(trimmed)) {
          return <div key={idx} dangerouslySetInnerHTML={{ __html: trimmed }} />;
        }

        // Markdown formatting fallback
        if (trimmed.startsWith("### ")) {
          return <h3 key={idx} className="article-h3">{renderInlineText(trimmed.slice(4))}</h3>;
        } else if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          return <h2 key={idx} className="article-h2">{renderInlineText(trimmed.replace(/^#+\s*/, ""))}</h2>;
        } else if (trimmed.startsWith("> ")) {
          return <blockquote key={idx} className="article-quote">{renderInlineText(trimmed.slice(2))}</blockquote>;
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          return (
            <ul key={idx} className="article-ul">
              <li>{renderInlineText(trimmed.replace(/^[-*•]\s+/, ""))}</li>
            </ul>
          );
        } else {
          return <p key={idx}>{renderInlineText(trimmed)}</p>;
        }
      })}
    </div>
  );
}
