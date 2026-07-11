import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github.css';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);

marked.use({ breaks: true, gfm: true });

interface Props {
  markdown: string;
  isStreaming?: boolean;
}

export const ReportPreview: React.FC<Props> = ({ markdown, isStreaming }) => {
  const html = useMemo(() => {
    if (!markdown) return '';
    try {
      const raw = marked.parse(markdown) as string;
      return DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
          'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'code', 'pre', 'blockquote', 'em', 'strong', 'del', 'a', 'img',
          'span', 'div', 'sup', 'sub', 'details', 'summary'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
      });
    } catch {
      return `<p>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
    }
  }, [markdown]);

  if (!markdown && isStreaming) {
    return <p className="text-gray-400 italic">正在生成报告...</p>;
  }

  return (
    <div
      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-code:text-pink-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:border-collapse"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
