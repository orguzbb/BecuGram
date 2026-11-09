import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';

interface LottieAnimationProps {
  src?: string;
  animationData?: any;
  size?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  animationData,
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
    if (!src && !animationData) return;

    // Destroy existing animation if any
    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      const animParams: any = {
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
      };

      if (animationData) {
        animParams.animationData = animationData;
      } else if (src) {
        animParams.path = src;
      }

      animRef.current = lottie.loadAnimation(animParams);
    } catch (err) {
      console.warn('Failed to load lottie animation:', src || 'data', err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, animationData, loop, autoplay]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    />
  );
};

