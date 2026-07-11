import React, { useState, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';

export const ExportBar: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const isAnalyzing = useChatStore((s) => s.isAnalyzing);
  const pageInfo = useChatStore((s) => s.pageInfo);
  const [copied, setCopied] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [printing, setPrinting] = useState(false);

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const hasReport = lastAssistantMsg && lastAssistantMsg.content.length > 50 && !isAnalyzing;

  const buildFilename = () => {
    const safeName = (pageInfo?.title || '竞品分析').replace(/[\\/:*?"<>|]/g, '-').slice(0, 50);
    const date = new Date().toISOString().slice(0, 10);
    return `${date}-${safeName}`;
  };

  const handleDownloadMD = () => {
    if (!lastAssistantMsg) return;
    chrome.runtime.sendMessage({
      type: 'competiprd:export-md',
      payload: { markdown: lastAssistantMsg.content, filename: `${buildFilename()}.md` },
    });
  };

  const handleDownloadWord = useCallback(async () => {
    if (!lastAssistantMsg) return;
    setExportingWord(true);
    try {
      // Dynamic import — docx is heavy, only load when used
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = await import('docx');
      const { saveAs } = await import('file-saver');

      const paragraphs: any[] = [];
      const lines = lastAssistantMsg.content.split('\n');

      for (const line of lines) {
        if (line.startsWith('# ')) {
          paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
        } else if (line.startsWith('## ')) {
          paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
        } else if (line.startsWith('### ')) {
          paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
        } else if (line.startsWith('---')) {
          paragraphs.push(new Paragraph({ text: '──────────────────────────────', spacing: { before: 200, after: 200 } }));
        } else if (line.startsWith('|') && line.includes('|')) {
          // Simple table row — collect and render as table later
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line, font: 'Courier New', size: 18 })],
            spacing: { before: 40, after: 40 },
          }));
        } else if (line.startsWith('- ')) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `• ${line.slice(2)}` })],
            bullet: { level: 0 },
          }));
        } else if (line.startsWith('```')) {
          // Code block markers — skip, code blocks handled as monospaced text
          continue;
        } else if (line.trim() === '') {
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        } else {
          // Bold handling: **text** → bold TextRun
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const runs = parts.map((part) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return new TextRun({ text: part.slice(2, -2), bold: true });
            }
            return new TextRun({ text: part });
          });
          paragraphs.push(new Paragraph({ children: runs }));
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${buildFilename()}.docx`);
    } catch (err) {
      console.error('[CompetiPrd] Word export failed:', err);
      // Fallback: trigger MD download if Word export fails
      handleDownloadMD();
    } finally {
      setExportingWord(false);
    }
  }, [lastAssistantMsg, pageInfo]);

  const handlePrint = useCallback(async () => {
    if (!lastAssistantMsg) return;
    setPrinting(true);
    try {
      const { marked } = await import('marked');
      const DOMPurify = (await import('dompurify')).default;

      const raw = marked.parse(lastAssistantMsg.content) as string;
      const clean = DOMPurify.sanitize(raw);

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        alert('请允许弹出窗口以进行打印');
        setPrinting(false);
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${buildFilename()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; }
            h1 { font-size: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
            h2 { font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 28px; }
            h3 { font-size: 15px; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
            th { background: #f3f4f6; font-weight: 600; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
            pre { background: #1f2937; color: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
            pre code { background: none; padding: 0; color: inherit; }
            blockquote { border-left: 4px solid #2563eb; padding: 8px 16px; margin: 16px 0; background: #f8fafc; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
            img { max-width: 100%; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>${clean}</body>
        </html>
      `);
      printWindow.document.close();

      // Give the browser a moment to render, then trigger print
      setTimeout(() => {
        printWindow.print();
        setPrinting(false);
      }, 500);
    } catch (err) {
      console.error('[CompetiPrd] Print export failed:', err);
      setPrinting(false);
    }
  }, [lastAssistantMsg, pageInfo]);

  const handleCopy = useCallback(async () => {
    if (!lastAssistantMsg) return;
    try {
      await navigator.clipboard.writeText(lastAssistantMsg.content);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lastAssistantMsg.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [lastAssistantMsg]);

  return (
    <div className="border-t border-gray-200 p-2 bg-gray-50 shrink-0">
      <div className="flex gap-2 mb-1.5">
        <button
          onClick={handleDownloadMD}
          disabled={!hasReport}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="下载 Markdown 文件"
        >
          📥 MD
        </button>
        <button
          onClick={handleDownloadWord}
          disabled={!hasReport || exportingWord}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="下载 Word 文档"
        >
          {exportingWord ? '⏳' : '📄'} Word
        </button>
        <button
          onClick={handlePrint}
          disabled={!hasReport || printing}
          className="flex-1 px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="打印或另存为 PDF（在打印对话框中选「另存为 PDF」）"
        >
          {printing ? '⏳' : '🖨'} PDF
        </button>
      </div>
      <button
        onClick={handleCopy}
        disabled={!hasReport}
        className="w-full px-2 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="复制 Markdown 到剪贴板"
      >
        {copied ? '✅ 已复制!' : '📋 复制到剪贴板'}
      </button>
    </div>
  );
};
