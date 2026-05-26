'use client';

import { useAuraStore } from '@/store/aura-store';
import RateMyFitGameInner from './rate-my-fit-game';
import type { GameProps } from './game-types';

interface RateMyFitProps {
  onBack: () => void;
}

export function RateMyFit({ onBack }: RateMyFitProps) {
  const { earnTokens, addXP, currentUserProfile } = useAuraStore();

  const callbacks: GameProps['callbacks'] = {
    earnTokens: (amount, source) => earnTokens(amount, source),
    addXP: (amount) => addXP(amount),
    showToast: (msg, opts) => {},
    submitToServer: () => {},
    submitVote: () => {},
    completeGame: () => {},
  };

  return (
    <RateMyFitGameInner
      onClose={onBack}
      currentUser={{
        id: currentUserProfile?.id || 'anonymous',
        name: currentUserProfile?.name || 'You',
        avatar: currentUserProfile?.avatar || '/api/uploads?path=images/avatars/founder-avatar.jpg',
        handle: currentUserProfile?.handle || '',
        bio: currentUserProfile?.bio || '',
      }}
      opponent={null}
      isVsBot={true}
      gameSessionId={null}
      tokenReward={5}
      xpReward={10}
      callbacks={callbacks}
      accentColor="pink"
    />
  );
}
