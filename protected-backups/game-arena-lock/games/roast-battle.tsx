'use client';

import { useAuraStore } from '@/store/aura-store';
import RoastBattleGameInner from './roast-battle-game';
import type { GameProps } from './game-types';

interface RoastBattleProps {
  onBack: () => void;
}

export function RoastBattle({ onBack }: RoastBattleProps) {
  const { earnTokens, addXP, currentUser } = useAuraStore();

  const callbacks: GameProps['callbacks'] = {
    earnTokens: (amount, source) => earnTokens(amount, source),
    addXP: (amount) => addXP(amount),
    showToast: () => {},
    submitToServer: () => {},
    submitVote: () => {},
    completeGame: () => {},
  };

  return (
    <RoastBattleGameInner
      onClose={onBack}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        handle: currentUser.handle,
        bio: '',
      }}
      opponent={null}
      isVsBot={true}
      gameSessionId={null}
      tokenReward={5}
      xpReward={10}
      callbacks={callbacks}
      accentColor="red"
    />
  );
}
