import { defineContentScript } from 'wxt/sandbox';
import { Readability } from '@mozilla/readability';
import type { PageInfo, PageType } from '../../shared/types';

export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // ========== Page Type Classifier ==========
    function classifyPage(url: string, doc: Document): PageType {
      const hostname = new URL(url).hostname;

      if (hostname.includes('github.com')) return 'github';
      if (hostname.includes('chromewebstore.google.com') || hostname.includes('apps.apple.com')) return 'app-store';
      if (doc.querySelector('meta[name="generator"]')?.getAttribute('content')?.includes('Docusaurus')
        || url.includes('/docs/') || url.includes('/documentation/')) return 'docs';
      if (hostname.includes('medium.com') || hostname.includes('zhihu.com') || hostname.includes('36kr.com')) return 'media';
      return 'unknown';
    }

    // ========== Content Extraction ==========
    function extractContent(): PageInfo | { error: string } {
      try {
        const documentClone = document.cloneNode(true) as Document;
        const reader = new Readability(documentClone);
        const article = reader.parse();

        const bodyText = article?.textContent?.trim() || document.body.innerText.trim() || '';

        if (!bodyText || bodyText.length < 50) {
          return { error: '页面内容不足，无法提取有效信息（最少需要 50 字符）' };
        }

        const isTruncated = bodyText.length > 25000;
        const bodyTextTrimmed = isTruncated
          ? bodyText.slice(0, 25000)
          : bodyText;

        const metaDesc = document.querySelector('meta[name="description"]')
          ?.getAttribute('content') || '';

        return {
          url: window.location.href,
          title: document.title,
          description: metaDesc,
          bodyText: bodyTextTrimmed,
          truncated: isTruncated || undefined,
          ogImage: document.querySelector('meta[property="og:image"]')
            ?.getAttribute('content') || undefined,
          pageType: classifyPage(window.location.href, document),
        };
      } catch (err) {
        return { error: `页面解析异常: ${err instanceof Error ? err.message : String(err)}` };
      }
    }

    // ========== Message Listener ==========
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'competiprd:extract-content') {
        const result = extractContent();
        sendResponse(result);
      }
      // Return false — we handle sync
      return false;
    });
  },
});
