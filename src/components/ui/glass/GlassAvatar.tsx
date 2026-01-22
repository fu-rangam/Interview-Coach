import React from 'react';
import { cn } from '../../../lib/utils';
import { User, Bot } from 'lucide-react';

interface GlassAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isBot?: boolean;
}

export const GlassAvatar: React.FC<GlassAvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className,
  isBot = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center shrink-0',
        'bg-white/5 backdrop-blur-md border border-white/10 shadow-lg',
        'bg-linear-to-br from-white/10 to-transparent',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-white/80 font-semibold">
          {isBot ? <Bot className="w-1/2 h-1/2" /> : fallback || <User className="w-1/2 h-1/2" />}
        </div>
      )}

      {/* Glossy Overlay */}
      <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
