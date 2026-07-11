import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';

export function usePageInfo() {
  const setPageInfo = useChatStore((s) => s.setPageInfo);

  useEffect(() => {
    // Request current tab info from background
    chrome.runtime.sendMessage(
      { type: 'competiprd:get-tab-info', payload: {} },
      (response) => {
        if (response?.url) {
          setPageInfo({
            url: response.url,
            title: response.title,
            description: '',
            bodyText: '',
            pageType: 'unknown',
          });
        }
      },
    );
  }, [setPageInfo]);
}
