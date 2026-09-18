import React from 'react';
import { Info } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface DisclaimerBannerProps {
  language: Language;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ language }) => {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-950 flex items-center justify-center gap-2 text-center">
      <Info className="w-4 h-4 text-amber-700 shrink-0" />
      <p className="max-w-4xl font-medium">
        <strong className="font-bold">{getTranslation('medicalNotice', language)}:</strong> {getTranslation('disclaimer', language)}
      </p>
    </div>
  );
};
