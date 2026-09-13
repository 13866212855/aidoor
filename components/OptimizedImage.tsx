'use client';

import React, { useState } from 'react';
import { getOptimizedImageUrl, getCategoryPlaceholderSvg } from '@/lib/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  quality?: number;
  onClick?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  category = '全部',
  className = '',
  priority = false,
  width = 450,
  quality = 65,
  onClick,
}: OptimizedImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 属性变更时自然重置状态（无 cascading effect）
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }

  // 获取优化后的 WebP 高压缩链接与极速 SVG 矢量占位底图
  const targetSrc = getOptimizedImageUrl(src, width, quality);
  const placeholderSrc = getCategoryPlaceholderSvg(category);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center"
      onClick={onClick}
    >
      {/* 极速占位底图（0ms即刻呈现，防止网络延迟导致的卡顿与空白） */}
      {(!isLoaded || hasError) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={placeholderSrc}
          alt="占位预览"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 真实高清家电商品图 */}
      {!hasError && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={targetSrc}
          src={targetSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
}
