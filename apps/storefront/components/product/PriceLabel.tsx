'use client';

import React from 'react';
import { formatInr, withGstInclusive } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const priceClass: Record<Size, string> = {
  sm: 'font-bold text-sm',
  md: 'font-bold text-base',
  lg: 'font-bold text-3xl',
};

const originalClass: Record<Size, string> = {
  sm: 'text-muted-foreground line-through text-xs',
  md: 'text-muted-foreground line-through text-sm',
  lg: 'text-muted-foreground line-through text-xl',
};

const labelClass: Record<Size, string> = {
  sm: 'text-[9px] leading-none',
  md: 'text-[10px] leading-none',
  lg: 'text-[11px] leading-none',
};

type PriceLabelProps = {
  /** Tax-exclusive amount from Medusa / product map */
  price: number;
  originalPrice?: number;
  size?: Size;
  className?: string;
  /** Stack label under price (default) or inline after */
  layout?: 'stack' | 'inline';
  /** Prices already include tax — do not apply GST */
  alreadyInclusive?: boolean;
};

/**
 * Catalog price with a tiny “GST inclusive” caption.
 * Converts exclusive Medusa amounts to inclusive display by default.
 */
export function PriceLabel({
  price,
  originalPrice,
  size = 'md',
  className,
  layout = 'stack',
  alreadyInclusive = false,
}: PriceLabelProps) {
  const display = withGstInclusive(price, { alreadyInclusive });
  const displayOriginal =
    originalPrice != null
      ? withGstInclusive(originalPrice, { alreadyInclusive })
      : undefined;

  const amounts = (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={priceClass[size]}>{formatInr(display)}</span>
      {displayOriginal != null && displayOriginal > display && (
        <span className={originalClass[size]}>{formatInr(displayOriginal)}</span>
      )}
    </div>
  );

  const gst = (
    <span
      className={cn(
        'text-muted-foreground font-medium tracking-wide uppercase',
        labelClass[size]
      )}
    >
      GST inclusive
    </span>
  );

  if (layout === 'inline') {
    return (
      <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
        {amounts}
        {gst}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {amounts}
      {gst}
    </div>
  );
}
