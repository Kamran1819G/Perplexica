'use client';

import { usePersonalization } from '@/hooks/usePersonalization';
import { User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonalizationStatusProps {
  className?: string;
}

export default function PersonalizationStatus({ className }: PersonalizationStatusProps) {
  const { personalizationData, hasData } = usePersonalization();

  if (!hasData) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center space-x-2 text-xs text-black/60 dark:text-white/60',
      className
    )}>
      <div className="flex items-center space-x-1">
        {personalizationData.introduceYourself && (
          <div className="flex items-center space-x-1">
            <User size={12} />
            <span>Personalized</span>
          </div>
        )}
        {personalizationData.userLocation && (
          <div className="flex items-center space-x-1">
            <MapPin size={12} />
            <span>Location-aware</span>
          </div>
        )}
      </div>
    </div>
  );
}
