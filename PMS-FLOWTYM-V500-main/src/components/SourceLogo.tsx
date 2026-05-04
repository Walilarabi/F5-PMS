import React from 'react';
import { CHANNELS } from '../constants/channels';
import { getContrastColor, adjustColor } from '../lib/colorUtils';

interface SourceLogoProps {
  channelName: string | null;
  externalId?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideName?: boolean;
}

export const SourceLogo: React.FC<SourceLogoProps> = ({ 
  channelName, 
  externalId = null,
  className = "", 
  size = 'md',
  hideName = false
}) => {
  if (!channelName && !externalId) return null;
  
  const sourceLower = (channelName || "").toLowerCase();
  const extLower = (externalId || "").toLowerCase();

  const channel = CHANNELS.find(c => 
    (sourceLower && sourceLower.includes(c.name.toLowerCase())) || 
    (extLower && extLower.includes(c.code.toLowerCase()))
  ) || CHANNELS.find(c => c.code === 'DIRECT');

  if (!channel) return <span className="text-[10px] font-bold text-slate-400">{channelName}</span>;

  const sizeClasses = {
    sm: { circle: 'w-4 h-4', text: 'text-[7px]', name: 'text-[8px]' },
    md: { circle: 'w-6 h-6', text: 'text-[8px]', name: 'text-[10px]' },
    lg: { circle: 'w-8 h-8', text: 'text-[10px]', name: 'text-xs' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 group cursor-help ${className}`} title={channel.name}>
      <div 
        className={`${currentSize.circle} rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0`}
        style={{ backgroundColor: channel.color }}
      >
        <span className={`${currentSize.text} font-black uppercase tracking-tighter`} style={{ color: getContrastColor(channel.color) }}>
           {channel.initials}
        </span>
      </div>
      {!hideName && (
        <span className={`${currentSize.name} font-black uppercase tracking-widest truncate`} style={{ color: adjustColor(channel.color, -50) }}>
          {channel.name}
        </span>
      )}
    </div>
  );
};
