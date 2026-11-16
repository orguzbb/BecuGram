import React from 'react';
import {
  ProfileAppearanceModal,
  PROFILE_BADGES,
  PROFILE_PATTERNS,
  PROFILE_BANNER_PRESETS,
  PROFILE_ACCENT_COLORS,
} from './profile/ProfileAppearanceModal';

export {
  PROFILE_BADGES as PREMIUM_BADGES,
  PROFILE_PATTERNS,
  PROFILE_BANNER_PRESETS,
  PROFILE_ACCENT_COLORS,
};

interface PremiumModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onSuccess }) => {
  return <ProfileAppearanceModal onClose={onClose} onSuccess={onSuccess} />;
};

export default PremiumModal;
