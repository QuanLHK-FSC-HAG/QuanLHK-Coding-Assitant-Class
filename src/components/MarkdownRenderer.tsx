import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Process markdown into simple HTML-like structure
  const lines = content.split("\n");
  let inList = false;
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = "";

  const elements: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-6 mb-4 space-y-1 text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushCodeBlock = (key: number) => {
    if (codeContent.length > 0) {
      elements.push(
        <div key={`codeblock-${key}`} className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
          {codeLang && (
            <div className="bg-slate-800 px-4 py-1.5 text-xs font-mono text-slate-300 border-b border-slate-700 flex justify-between items-center">
              <span>{codeLang.toUpperCase()}</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400">
            <code>{codeContent.join("\n")}</code>
          </pre>
        </div>
      );
      codeContent = [];
      codeLang = "";
    }
  };

  const parseInline = (text: string): string => {
    // Parse bold text **bold**
    let parsed = text.replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-indigo-700'>$1</strong>");
    // Parse inline code `code`
    parsed = parsed.replace(/`(.*?)`/g, "<code class='bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200'>$1</code>");
    return parsed;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock(i);
      } else {
        flushList(i);
        inCodeBlock = true;
        codeLang = line.replace("```", "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList(i);
      const text = line.replace("### ", "").trim();
      elements.push(
        <h4 key={i} className="text-base font-semibold text-slate-800 mt-5 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h4>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList(i);
      const text = line.replace("## ", "").trim();
      elements.push(
        <h3 key={i} className="text-lg font-bold text-indigo-900 mt-6 mb-3 border-b border-slate-100 pb-1">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h3>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList(i);
      const text = line.replace("# ", "").trim();
      elements.push(
        <h2 key={i} className="text-xl font-extrabold text-indigo-950 mt-8 mb-4">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h2>
      );
      continue;
    }

    // List items
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    const numListMatch = line.match(/^(\s*)\d+\.\s+(.*)/);

    if (listMatch) {
      inList = true;
      listItems.push(listMatch[2]);
    } else if (numListMatch) {
      inList = true;
      listItems.push(numListMatch[2]);
    } else {
      if (inList) {
        inList = false;
        flushList(i);
      }

      if (line.trim() === "") {
        continue;
      }

      // Normal paragraph
      elements.push(
        <p key={i} className="text-slate-600 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
      );
    }
  }

  // Flush any remaining lists or code blocks
  flushList(lines.length);
  flushCodeBlock(lines.length);

  return <div className="markdown-body space-y-2">{elements}</div>;
}
