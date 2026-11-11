import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageLightbox } from './ImageLightbox';

interface TutorialMarkdownRendererProps {
  content: string;
}

export const TutorialMarkdownRenderer: React.FC<TutorialMarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; alt: string } | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // 预解析 Markdown 为结构化块
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;
  let headingIndex = 0;
  let codeBlockIndex = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. 空行
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. 代码块：```lang
    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace(/^```/, '').trim() || 'text';
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // 跳过结束的 ```

      const codeString = codeLines.join('\n');
      const currentIndex = codeBlockIndex++;
      const isCopied = copiedIndex === currentIndex;

      blocks.push(
        <div
          key={`code-${blockKey++}`}
          className="my-5 rounded-xl overflow-hidden border border-slate-700/80 bg-[#0F172A] text-slate-100 shadow-md font-mono text-xs"
        >
          {/* 代码块标题栏 */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="uppercase">{lang}</span>
            </div>
            <button
              onClick={() => handleCopy(codeString, currentIndex)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
              title="复制代码"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制</span>
                </>
              )}
            </button>
          </div>

          {/* 代码内容，支持水平滚动 */}
          <pre className="p-4 overflow-x-auto leading-relaxed text-xs text-sky-200">
            <code>{codeString}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 3. 标题：# / ## / ###
    if (trimmed.startsWith('# ')) {
      // 一级标题（如果正文中出现）
      const text = trimmed.replace(/^#\s+/, '');
      blocks.push(
        <h1
          key={`h1-${blockKey++}`}
          className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight"
        >
          {renderInlineText(text)}
        </h1>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
      const hId = `heading-${headingIndex++}`;
      blocks.push(
        <h2
          id={hId}
          key={`h2-${blockKey++}`}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-8 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 scroll-mt-24"
        >
          <span className="w-1.5 h-5 rounded-full bg-[#1769D2]" />
          <span>{renderInlineText(text)}</span>
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
      const hId = `heading-${headingIndex++}`;
      blocks.push(
        <h3
          id={hId}
          key={`h3-${blockKey++}`}
          className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2.5 flex items-center gap-2 scroll-mt-24"
        >
          <span className="w-1 h-3 rounded-full bg-slate-400" />
          <span>{renderInlineText(text)}</span>
        </h3>
      );
      i++;
      continue;
    }

    // 4. 引用块：>
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote-${blockKey++}`}
          className="my-4 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-[#1769D2] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-2xs"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={qIdx > 0 ? 'mt-2' : ''}>
              {renderInlineText(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 5. 分割线：---
    if (trimmed === '---' || trimmed === '***') {
      blocks.push(
        <hr key={`hr-${blockKey++}`} className="my-6 border-slate-200 dark:border-slate-800" />
      );
      i++;
      continue;
    }

    // 6. 无序列表：- 或 *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${blockKey++}`} className="my-3 space-y-1.5 list-disc pl-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. 有序列表：1. 2.
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${blockKey++}`} className="my-3 space-y-1.5 list-decimal pl-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. 图片：![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      blocks.push(
        <figure key={`img-${blockKey++}`} className="my-5 text-center">
          <div
            className="inline-block relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-zoom-in group shadow-xs"
            onClick={() => setLightboxImg({ src, alt })}
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="max-w-full max-h-[500px] object-contain transition-transform group-hover:scale-[1.01]"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
              <ImageIcon className="w-4 h-4" />
              <span>点击查看大图</span>
            </div>
          </div>
          {alt && (
            <figcaption className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {alt}
            </figcaption>
          )}
        </figure>
      );
      i++;
      continue;
    }

    // 9. 普通段落
    blocks.push(
      <p key={`p-${blockKey++}`} className="my-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {renderInlineText(trimmed)}
      </p>
    );
    i++;
  }

  return (
    <div className="tutorial-content leading-relaxed space-y-2">
      {blocks}

      {/* 图片放大预览模态框 */}
      {lightboxImg && (
        <ImageLightbox
          isOpen={!!lightboxImg}
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
};

/**
 * 行内文本渲染：处理加粗 **bold**、行内代码 `code`、超链接 [text](url)
 */
function renderInlineText(text: string): React.ReactNode {
  // 简易行内 Tokenizer
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // 1. 链接：[text](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      const isInternal = href.startsWith('/') || href.startsWith('#');
      tokens.push(
        isInternal ? (
          <Link
            key={key++}
            to={href}
            className="text-[#1769D2] hover:underline font-semibold"
          >
            {label}
          </Link>
        ) : (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[#1769D2] hover:underline font-semibold"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 2. 加粗：**bold**
    const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} className="font-bold text-slate-900 dark:text-white">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. 行内代码：`code`
    const codeMatch = remaining.match(/^`(.*?)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-sky-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 4. 普通字符
    const nextSpecial = remaining.search(/(\[|\*\*|`)/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{tokens}</>;
}
