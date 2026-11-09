import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottieAnimationProps {
  src: string;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  size = 28,
  loop = true,
  autoplay = true,
  className = '',
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing animation if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: src,
      });
    } catch (err) {
      console.warn('Failed to load lottie animation from:', src, err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, loop, autoplay]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    />
  );
};

