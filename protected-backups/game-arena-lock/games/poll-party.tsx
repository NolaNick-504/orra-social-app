'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Vote, Users, ChevronRight, Plus } from 'lucide-react';

interface PollPartyProps {
  onBack: () => void;
}

const POLLS = [
  {
    id: '1',
    question: 'Best season of the year?',
    options: ['Spring 🌸', 'Summer ☀️', 'Fall 🍂', 'Winter ❄️'],
    votes: [234, 567, 890, 345],
  },
  {
    id: '2',
    question: 'Go-to late night snack?',
    options: ['Pizza 🍕', 'Ice cream 🍦', 'Ramen 🍜', 'Tacos 🌮'],
    votes: [445, 312, 678, 523],
  },
  {
    id: '3',
    question: 'Dream vacation spot?',
    options: ['Beach paradise 🏖️', 'Mountain retreat 🏔️', 'City adventure 🏙️', 'Countryside 🌾'],
    votes: [567, 234, 890, 123],
  },
  {
    id: '4',
    question: 'Best way to spend a Sunday?',
    options: ['Sleeping in 😴', 'Outdoor adventure 🚴', 'Binge watching 📺', 'Cooking 🍳'],
    votes: [678, 234, 890, 345],
  },
  {
    id: '5',
    question: 'Most useful superpower?',
    options: ['Teleportation 🌍', 'Time travel ⏰', 'Invisibility 👻', 'Flying 🦸'],
    votes: [456, 789, 234, 567],
  },
  {
    id: '6',
    question: 'Pick your streaming go-to?',
    options: ['Netflix', 'YouTube', 'Twitch', 'TikTok'],
    votes: [567, 890, 234, 678],
  },
];

export function PollParty({ onBack }: PollPartyProps) {
  const { earnTokens } = useAuraStore();
  const [currentPoll, setCurrentPoll] = useState(0);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [customPoll, setCustomPoll] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  const poll = POLLS[currentPoll];

  const handleVote = (optionIndex: number) => {
    if (voted.has(poll.id)) return;

    setSelectedOption(optionIndex);
    const newVoted = new Set(voted);
    newVoted.add(poll.id);
    setVoted(newVoted);
    earnTokens(2, 'Poll Party vote');
    setTotalTokens((prev) => prev + 2);
  };

  const nextPoll = () => {
    setCurrentPoll((prev) => (prev + 1) % POLLS.length);
    setSelectedOption(null);
  };

  const getTotalVotes = () => poll.votes.reduce((a, b) => a + b, 0);
  const getPercentage = (votes: number) => Math.round((votes / getTotalVotes()) * 100);

  const addOption = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, '']);
    }
  };

  const submitCustomPoll = () => {
    if (!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2) return;
    // Reset to polls view and add notification
    earnTokens(3, 'Created a Poll Party poll');
    setTotalTokens((prev) => prev + 3);
    setCustomPoll(false);
    setNewQuestion('');
    setNewOptions(['', '']);
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{totalTokens} ORRA</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Poll Party</h2>
          <p className="text-xs text-slate-500">Vote & see results</p>
        </div>
        <button
          onClick={() => setCustomPoll(!customPoll)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-bold hover:bg-indigo-600/30 transition-all"
        >
          <Plus className="w-3 h-3" /> Create Poll
        </button>
      </div>

      {customPoll ? (
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          {newOptions.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => {
                const updated = [...newOptions];
                updated[i] = e.target.value;
                setNewOptions(updated);
              }}
              placeholder={`Option ${i + 1}`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          ))}
          {newOptions.length < 6 && (
            <button onClick={addOption} className="text-xs text-indigo-400 font-bold hover:text-indigo-300">+ Add option</button>
          )}
          <div className="flex gap-2">
            <button onClick={submitCustomPoll} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm">Post Poll</button>
            <button onClick={() => setCustomPoll(false)} className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {/* Poll Card */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Vote className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400">POLL #{currentPoll + 1}</span>
            </div>
            <h3 className="text-base font-bold text-white mb-4">{poll.question}</h3>

            <div className="space-y-2">
              {poll.options.map((option, i) => {
                const hasVoted = voted.has(poll.id);
                const pct = getPercentage(poll.votes[i]);
                const isSelected = selectedOption === i;

                return (
                  <button
                    key={i}
                    onClick={() => handleVote(i)}
                    disabled={hasVoted}
                    className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                      isSelected ? 'border-indigo-500/50 ring-2 ring-indigo-500/20' :
                      hasVoted ? 'border-white/5' :
                      'border-white/10 hover:border-indigo-500/30'
                    }`}
                  >
                    {/* Background bar */}
                    {hasVoted && (
                      <div className="absolute inset-0 bg-indigo-500/10 transition-all duration-700" style={{ width: `${pct}%` }} />
                    )}
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{option}</span>
                      {hasVoted && (
                        <span className="text-xs font-bold text-slate-400">{pct}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {voted.has(poll.id) && (
              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-slate-500">
                <Users className="w-3 h-3" />
                {getTotalVotes().toLocaleString()} votes
              </div>
            )}
          </div>

          {voted.has(poll.id) && (
            <button onClick={nextPoll} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center gap-2">
              Next Poll <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
