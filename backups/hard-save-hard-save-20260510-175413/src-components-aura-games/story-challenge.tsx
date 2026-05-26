'use client';

import { useAuraStore } from '@/store/aura-store';
import StoryChallengeGameInner from './story-challenge-game';
import type { GameProps } from './game-types';

interface StoryChallengeProps {
  onBack: () => void;
}

export function StoryChallenge({ onBack }: StoryChallengeProps) {
  const { earnTokens, addXP, currentUserProfile } = useAuraStore();

  const callbacks: GameProps['callbacks'] = {
    earnTokens: (amount, source) => earnTokens(amount, source),
    addXP: (amount) => addXP(amount),
    showToast: () => {},
    submitToServer: () => {},
    submitVote: () => {},
    completeGame: () => {},
  };

  return (
    <StoryChallengeGameInner
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
      tokenReward={4}
      xpReward={8}
      callbacks={callbacks}
      accentColor="cyan"
    />
  );
}
