import React from 'react';
import { useChatStore } from '../stores/chatStore';

export const PageInfoBar: React.FC = () => {
  const pageInfo = useChatStore((s) => s.pageInfo);

  if (!pageInfo) {
    return (
      <div className="px-3 py-2 text-xs text-gray-400 bg-gray-100 border-b border-gray-200">
        正在获取页面信息...
      </div>
    );
  }

  const displayUrl = pageInfo.url.length > 50
    ? pageInfo.url.slice(0, 50) + '...'
    : pageInfo.url;

  return (
    <div className="px-3 py-2 text-xs bg-gray-100 border-b border-gray-200">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400">📄</span>
        <span className="font-medium text-gray-700 truncate" title={pageInfo.title}>
          {pageInfo.title || '未知页面'}
        </span>
      </div>
      <div className="text-gray-400 truncate mt-0.5" title={pageInfo.url}>
        {displayUrl}
      </div>
      {pageInfo.truncated && (
        <div className="mt-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
          ⚠️ 页面内容已截断（超过 25,000 字符），部分信息可能未被分析
        </div>
      )}
    </div>
  );
};
