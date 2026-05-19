'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Trophy, Clock, Zap, ChevronRight } from 'lucide-react';


interface TriviaBlastProps {
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'general', name: 'General Knowledge', icon: '🌍', color: 'from-violet-600 to-indigo-600' },
  { id: 'science', name: 'Science & Tech', icon: '🔬', color: 'from-blue-600 to-cyan-600' },
  { id: 'pop', name: 'Pop Culture', icon: '🎬', color: 'from-pink-600 to-rose-600' },
  { id: 'history', name: 'History', icon: '📜', color: 'from-amber-600 to-yellow-600' },
];

const QUESTIONS: Record<string, { q: string; options: string[]; answer: number }[]> = {
  general: [
    { q: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], answer: 1 },
    { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
    { q: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], answer: 2 },
    { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
    { q: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], answer: 1 },
    { q: 'In what year did the Titanic sink?', options: ['1905', '1912', '1918', '1923'], answer: 1 },
    { q: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], answer: 1 },
    { q: 'Which element has the chemical symbol "Au"?', options: ['Silver', 'Gold', 'Aluminum', 'Argon'], answer: 1 },
  ],
  science: [
    { q: 'What is the speed of light approximately?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], answer: 0 },
    { q: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 },
    { q: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], answer: 2 },
    { q: 'How many bones are in the adult human body?', options: ['186', '206', '226', '256'], answer: 1 },
    { q: 'What planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 1 },
    { q: 'What is the chemical formula for water?', options: ['H2O2', 'HO2', 'H2O', 'OH'], answer: 2 },
    { q: 'What particle has a negative charge?', options: ['Proton', 'Neutron', 'Electron', 'Photon'], answer: 2 },
    { q: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], answer: 2 },
  ],
  pop: [
    { q: 'Who played Jack in Titanic?', options: ['Brad Pitt', 'Leonardo DiCaprio', 'Tom Cruise', 'Johnny Depp'], answer: 1 },
    { q: 'What is the highest-grossing film of all time?', options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars'], answer: 1 },
    { q: 'Which band performed "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], answer: 2 },
    { q: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], answer: 2 },
    { q: 'Who is the creator of Facebook?', options: ['Bill Gates', 'Mark Zuckerberg', 'Elon Musk', 'Jeff Bezos'], answer: 1 },
    { q: 'Which TV show features a character named Walter White?', options: ['Lost', 'Breaking Bad', 'The Wire', 'Dexter'], answer: 1 },
    { q: 'What is the name of Harry Potter\'s owl?', options: ['Hedwig', 'Errol', 'Pigwidgeon', 'Fawkes'], answer: 0 },
    { q: 'Which superhero is also known as "The Man of Steel"?', options: ['Batman', 'Superman', 'Iron Man', 'Thor'], answer: 1 },
  ],
  history: [
    { q: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
    { q: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'], answer: 2 },
    { q: 'What ancient wonder was located in Alexandria?', options: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Temple of Artemis'], answer: 1 },
    { q: 'Which empire was ruled by Genghis Khan?', options: ['Ottoman', 'Roman', 'Mongol', 'Persian'], answer: 2 },
    { q: 'When was the Declaration of Independence signed?', options: ['1774', '1775', '1776', '1777'], answer: 2 },
    { q: 'Who painted the ceiling of the Sistine Chapel?', options: ['Da Vinci', 'Michelangelo', 'Raphael', 'Donatello'], answer: 1 },
    { q: 'What was the name of the ship the Pilgrims sailed on?', options: ['Mayflower', 'Santa Maria', 'Victoria', 'Beagle'], answer: 0 },
    { q: 'Which war was fought between the North and South in the US?', options: ['Revolutionary War', 'War of 1812', 'Civil War', 'Spanish-American War'], answer: 2 },
  ],
};

type GameState = 'category' | 'playing' | 'result';

export function TriviaBlast({ onBack }: TriviaBlastProps) {
  const { earnTokens } = useAuraStore();
  const [gameState, setGameState] = useState<GameState>('category');
  const [category, setCategory] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);

  const currentQuestions = category ? QUESTIONS[category] || [] : [];
  const currentQuestion = currentQuestions[questionIndex];

  const startGame = useCallback((catId: string) => {
    setCategory(catId);
    setGameState('playing');
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(15);
    setTimerActive(true);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setTimerActive(false);

    if (answerIndex === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (questionIndex + 1 >= currentQuestions.length) {
      // Game over
      const tokenReward = score * 2;
      if (tokenReward > 0) {
        earnTokens(tokenReward, `Trivia Blast: ${score}/${currentQuestions.length} correct`);
      }
      setGameState('result');
    } else {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
      setTimerActive(true);
    }
  };

  const getCategoryName = () => {
    return CATEGORIES.find(c => c.id === category)?.name || category || '';
  };

  if (gameState === 'category') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-white">Trivia Blast</h2>
          <p className="text-sm text-slate-400 mt-1">Choose a category and test your knowledge!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => startGame(cat.id)}
              className={`glass-panel rounded-2xl p-4 text-center hover:border-violet-500/30 transition-all group`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="text-sm font-bold text-white">{cat.name}</h3>
              <p className="text-[10px] text-slate-500 mt-1">8 questions</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-violet-400 font-bold group-hover:text-violet-300">
                Play <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    const percentage = Math.round((score / currentQuestions.length) * 100);
    const rating = percentage >= 80 ? 'Amazing!' : percentage >= 60 ? 'Great Job!' : percentage >= 40 ? 'Not Bad!' : 'Keep Trying!';
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">{rating}</h2>
          <p className="text-slate-400 text-sm mb-4">{getCategoryName()}</p>

          <div className="text-5xl font-black text-white mb-2">{score}/{currentQuestions.length}</div>
          <p className="text-sm text-slate-400 mb-4">{percentage}% correct</p>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+{score * 2} ORRA earned</span>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => startGame(category!)} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm">
              Play Again
            </button>
            <button onClick={() => setGameState('category')} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">
              Change Category
            </button>
            <button onClick={onBack} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">
              Back to Arena
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-white font-bold">{score}</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400'}`}>
            <Clock className="w-3 h-3" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${((questionIndex + 1) / currentQuestions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="glass-panel rounded-2xl p-5">
        <p className="text-xs text-violet-400 font-bold mb-2">Question {questionIndex + 1} of {currentQuestions.length}</p>
        <h3 className="text-lg font-bold text-white">{currentQuestion?.q}</h3>
      </div>

      {/* Answers */}
      <div className="space-y-2">
        {currentQuestion?.options.map((option, index) => {
          let btnClass = 'glass-panel hover:border-violet-500/30';
          if (showResult) {
            if (index === currentQuestion.answer) {
              btnClass = 'border-green-500/50 bg-green-500/10';
            } else if (index === selectedAnswer && index !== currentQuestion.answer) {
              btnClass = 'border-red-500/50 bg-red-500/10';
            } else {
              btnClass = 'opacity-50';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-xl border border-white/10 transition-all ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  showResult && index === currentQuestion.answer ? 'bg-green-500/20 text-green-400' :
                  showResult && index === selectedAnswer ? 'bg-red-500/20 text-red-400' :
                  'bg-white/5 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-sm font-medium text-white">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <button onClick={nextQuestion} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2">
          {questionIndex + 1 >= currentQuestions.length ? 'See Results' : 'Next Question'} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
