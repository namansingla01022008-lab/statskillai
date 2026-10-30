import { PRELOADED_OFFLINE_QUESTIONS } from '../../constants/offlineQuestions';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { GeminiService } from '../../services/geminiService';
import { OfflineStorage, OutboxMutation } from '../../services/offlineStorage';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { DomainType, DifficultyLevel, QuestionRecord, AssessmentAttempt } from '../../types';
import { DOMAINS, DIFFICULTY_WEIGHTS, calculateDomainScore, getProficiencyLevel } from '../../constants/competency';
import { ScoreBadge } from '../../components/common/ScoreBadge';
import {
  BrainCircuit,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Award,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdaptiveAssessmentPage: React.FC = () => {
  const { currentUser, activeProfile, refreshScores, t, language } = useApp();
  const { isOnline } = useNetworkStatus();

  const [selectedDomain, setSelectedDomain] = useState<DomainType>('Statistical');
  const [assessmentState, setAssessmentState] = useState<'idle' | 'testing' | 'results'>('idle');

  // Offline assessment states
  const [isOfflineAttempt, setIsOfflineAttempt] = useState(false);
  const [offlineSubmitted, setOfflineSubmitted] = useState(false);
  const [attemptStartTime, setAttemptStartTime] = useState<string>('');
  const [offlineAnswers, setOfflineAnswers] = useState<Array<{ questionId: string; selectedOption: number; answeredAt: string }>>([]);
  const [offlineQuestionsList, setOfflineQuestionsList] = useState<any[]>([]);

  // Assessment run state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0 to 4 (5 questions)
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('Medium');
  const [servedQuestions, setServedQuestions] = useState<QuestionRecord[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionRecord | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [earnedWeights, setEarnedWeights] = useState<number[]>([]);
  const [servedWeights, setServedWeights] = useState<number[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Timer: 60s per question (can be toggled)
  const [enableTimer, setEnableTimer] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);

  // Result state
  const [lastAttempt, setLastAttempt] = useState<AssessmentAttempt | null>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);

  // Load question for current index & difficulty
  const fetchNextQuestion = async (
    domain: DomainType,
    difficulty: DifficultyLevel,
    prevQuestions: string[]
  ) => {
    setLoadingQuestion(true);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setTimeLeft(60);

    try {
      const { question } = await GeminiService.generateAdaptiveQuestion(
        domain,
        difficulty,
        currentUser.profileType || 'Student',
        prevQuestions,
        language
      );
      setCurrentQuestion(question);
    } catch (err) {
      console.error('Failed loading question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (assessmentState !== 'testing' || !enableTimer || isAnswerSubmitted || loadingQuestion) {
      return;
    }

    if (timeLeft <= 0) {
      // Auto-submit empty/wrong answer if time expires
      handleConfirmAnswer(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [assessmentState, enableTimer, isAnswerSubmitted, loadingQuestion, timeLeft]);

  // Start assessment
  const handleStart = async (domain: DomainType) => {
    setSelectedDomain(domain);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setEarnedWeights([]);
    setServedWeights([]);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setTimeLeft(60);

    // Find previous score for this domain
    const attempts = StorageService.getAttempts(currentUser.id).filter(
      (a) => a.domain === domain && a.completed
    );
    if (attempts.length > 0) {
      setPreviousScore(attempts[0].score);
    } else {
      setPreviousScore(undefined);
    }

    // Check if offline
    if (!isOnline) {
      setIsOfflineAttempt(true);
      setOfflineSubmitted(false);
      setAttemptStartTime(new Date().toISOString());
      setOfflineAnswers([]);

      let cached = await OfflineStorage.getCache<any[]>('offline_questions');
      let domainQuestions = (cached?.data || []).filter((q: any) => q.domain === domain);

      if (domainQuestions.length === 0) {
        // Instant fallback to client-safe preloaded question set
        domainQuestions = (PRELOADED_OFFLINE_QUESTIONS as any[]).filter((q: any) => q.domain === domain);
        OfflineStorage.setCache('offline_questions', PRELOADED_OFFLINE_QUESTIONS, currentUser.id).catch(() => {});
      }

      const selected5 = domainQuestions.slice(0, 5);
      if (selected5.length > 0) {
        setOfflineQuestionsList(selected5);
        setCurrentQuestion(selected5[0]);
        setCurrentDifficulty(selected5[0].difficulty || 'Medium');
        setAssessmentState('testing');
        return;
      }
    }

    // Online path
    setIsOfflineAttempt(false);
    setOfflineSubmitted(false);
    setCurrentDifficulty('Medium');
    setServedQuestions([]);
    setAssessmentState('testing');

    await fetchNextQuestion(domain, 'Medium', []);
  };

  // Submit answer
  const handleConfirmAnswer = async (timeExpired = false) => {
    if (!currentQuestion) return;

    // Offline assessment submission handler
    if (isOfflineAttempt) {
      const answerIdx = timeExpired ? -1 : (selectedAnswerIndex !== null ? selectedAnswerIndex : -1);
      const nextAnswers = [
        ...offlineAnswers,
        {
          questionId: currentQuestion.id,
          selectedOption: answerIdx,
          answeredAt: new Date().toISOString(),
        },
      ];
      setOfflineAnswers(nextAnswers);

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < 5 && nextIndex < offlineQuestionsList.length) {
        setCurrentQuestionIndex(nextIndex);
        const nextQ = offlineQuestionsList[nextIndex];
        setCurrentQuestion(nextQ);
        setCurrentDifficulty(nextQ.difficulty || 'Medium');
        setSelectedAnswerIndex(null);
        setTimeLeft(60);
      } else {
        // Complete 5 offline questions -> store outbox mutation
        const attemptId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const mutation: OutboxMutation = {
          mutationId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mut-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'ASSESSMENT_SUBMIT',
          payload: {
            attemptId,
            domain: selectedDomain,
            questionSetVersion: 'v1',
            answers: nextAnswers,
            startedAt: attemptStartTime,
            submittedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        await OfflineStorage.addToOutbox(mutation);
        setOfflineSubmitted(true);
        setAssessmentState('results');
      }
      return;
    }

    // Online path with immediate pedagogical feedback
    if (isAnswerSubmitted) return;
    const answerIdx = timeExpired ? -1 : (selectedAnswerIndex !== null ? selectedAnswerIndex : -1);
    const isCorrect = answerIdx === currentQuestion.correctIndex;
    const weight = DIFFICULTY_WEIGHTS[currentQuestion.difficulty];

    const newAnswers = [...answers, answerIdx];
    const newServedWeights = [...servedWeights, weight];
    const newEarnedWeights = [...earnedWeights, isCorrect ? weight : 0];

    setAnswers(newAnswers);
    setServedWeights(newServedWeights);
    setEarnedWeights(newEarnedWeights);
    setServedQuestions([...servedQuestions, currentQuestion]);
    setIsAnswerSubmitted(true);
  };

  // Proceed to next question or results
  const handleNext = async () => {
    if (!currentQuestion) return;

    const lastAnswer = answers[answers.length - 1];
    const isCorrect = lastAnswer === currentQuestion.correctIndex;

    // Adapt difficulty for next question:
    // Start at Medium. Correct -> raise one level (max Hard); Incorrect -> lower one level (min Easy).
    let nextDiff: DifficultyLevel = currentDifficulty;
    if (isCorrect) {
      if (currentDifficulty === 'Easy') nextDiff = 'Medium';
      else if (currentDifficulty === 'Medium') nextDiff = 'Hard';
    } else {
      if (currentDifficulty === 'Hard') nextDiff = 'Medium';
      else if (currentDifficulty === 'Medium') nextDiff = 'Easy';
    }

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < 5) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentDifficulty(nextDiff);
      const prevQTexts = [...servedQuestions.map((q) => q.question), currentQuestion.question];
      await fetchNextQuestion(selectedDomain, nextDiff, prevQTexts);
    } else {
      // 5 questions completed -> Compute Final Domain Score
      const totalEarned = earnedWeights.reduce((a, b) => a + b, 0);
      const totalMax = servedWeights.reduce((a, b) => a + b, 0);
      const finalScore = calculateDomainScore(totalEarned, totalMax);

      const attemptRecord: AssessmentAttempt = {
        id: `att-${Date.now()}`,
        userId: currentUser.id,
        domain: selectedDomain,
        date: new Date().toISOString(),
        questions: [...servedQuestions],
        userAnswers: answers,
        score: finalScore,
        earnedWeight: totalEarned,
        maxWeight: totalMax,
        previousScore,
        completed: true,
      };

      try {
        await ApiService.submitAttempt(attemptRecord);
      } catch (err) {
        console.warn('Backend attempt submission fallback to local storage:', err);
      }

      StorageService.saveAttempt(attemptRecord);
      await refreshScores();
      setLastAttempt(attemptRecord);
      setAssessmentState('results');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Psychometric Measurement
            </span>
            <span className="text-xs text-slate-500">5 Questions Adaptive Battery</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('adaptiveAssessmentTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('assessmentSubtitle')}
          </p>
        </div>

        {assessmentState === 'testing' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTimer}
                onChange={(e) => setEnableTimer(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
              />
              <span>60s Timer</span>
            </label>
          </div>
        )}
      </div>

      {/* STATE 1: IDLE - SELECT DOMAIN */}
      {assessmentState === 'idle' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400">
              Scoring Methodology & Adaptive Logic
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('scoringWeightsNotice')} Questions start at Medium difficulty. Accurate responses elevate the subsequent item to Hard, while incorrect answers guide the test to Easy to pinpoint your baseline competency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOMAINS.map((domain) => {
              const currentScores = StorageService.getLatestDomainScores(currentUser.id);
              const score = currentScores[domain] || 0;

              return (
                <div
                  key={domain}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-400 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900">{domain}</h3>
                      <ScoreBadge score={score} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {domain === 'Statistical'
                        ? 'Survey sampling, NSSO/MoSPI methodologies, variance estimation, and hypothesis testing.'
                        : domain === 'Technical'
                        ? 'Relational databases, SQL optimization, Python microdata pipelines, and algorithms.'
                        : domain === 'Digital'
                        ? 'India Stack, DigiLocker, DPDP data protection, and e-Office public systems.'
                        : 'Public leadership ethics, citizen grievance resolution (CPGRAMS), and policy briefs.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Latest Score: <strong className="text-slate-800">{score}/100</strong>
                    </span>
                    <button
                      onClick={() => handleStart(domain)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Start Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATE 2: TESTING - ACTIVE QUESTIONS */}
      {assessmentState === 'testing' && (
        <div className="bg-white rounded-xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Progress Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question {currentQuestionIndex + 1} of {isOfflineAttempt ? offlineQuestionsList.length : 5}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-900">{selectedDomain} Domain</span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  currentDifficulty === 'Hard'
                    ? 'bg-rose-100 text-rose-800'
                    : currentDifficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                Difficulty: {currentDifficulty} ({DIFFICULTY_WEIGHTS[currentDifficulty]} pts)
              </span>
            </div>

            {enableTimer && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  timeLeft <= 10
                    ? 'bg-rose-100 text-rose-800 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s remaining</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          {loadingQuestion ? (
            <div className="text-center py-12 space-y-3">
              <BrainCircuit className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Generating {currentDifficulty}-level question adapted to your previous answer...
              </p>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    Skill: {currentQuestion.skillTag}
                  </span>
                  {(currentQuestion as any).isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      ✓ Expert-verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      ⚡ AI-generated, not expert-verified
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  let optionStyle =
                    'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800';

                  if (isOfflineAttempt) {
                    if (isSelected) {
                      optionStyle = 'border-teal-600 bg-teal-50 text-teal-950 font-semibold ring-2 ring-teal-500';
                    }
                  } else if (isAnswerSubmitted) {
                    if (idx === currentQuestion.correctIndex) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    } else if (isSelected) {
                      optionStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50 opacity-60 text-slate-600';
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-teal-600 bg-teal-50 text-teal-950 font-semibold ring-2 ring-teal-500';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isOfflineAttempt && isAnswerSubmitted}
                      onClick={() => setSelectedAnswerIndex(idx)}
                      className={`w-full p-3.5 rounded-lg border text-left text-xs sm:text-sm flex items-start gap-3 transition-all ${optionStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                      {!isOfflineAttempt && isAnswerSubmitted && idx === currentQuestion.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {!isOfflineAttempt && isAnswerSubmitted && isSelected && idx !== currentQuestion.correctIndex && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback with Explanation (Online only) */}
              {!isOfflineAttempt && isAnswerSubmitted && (
                <div
                  className={`p-4 rounded-lg border text-xs sm:text-sm space-y-1.5 ${
                    selectedAnswerIndex === currentQuestion.correctIndex
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {selectedAnswerIndex === currentQuestion.correctIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Correct! Earned {DIFFICULTY_WEIGHTS[currentQuestion.difficulty]} points. Next difficulty will adapt upwards.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-700" />
                        <span>Incorrect. Next question will adapt to baseline difficulty.</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    <strong className="text-slate-900">Explanation: </strong>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessmentState('idle')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Exit Assessment
                </button>

                {isOfflineAttempt ? (
                  <button
                    type="button"
                    disabled={selectedAnswerIndex === null}
                    onClick={() => handleConfirmAnswer(false)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <span>{currentQuestionIndex >= (offlineQuestionsList.length - 1) ? 'Submit Offline Assessment' : 'Next Question'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : !isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedAnswerIndex === null}
                    onClick={() => handleConfirmAnswer(false)}
                    className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
                  >
                    Confirm Selection
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>{currentQuestionIndex === 4 ? 'View Final Results' : 'Next Question'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* STATE 3: RESULTS PAGE */}
      {assessmentState === 'results' && (
        offlineSubmitted ? (
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-center animate-in fade-in-50">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Offline Submission Recorded
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Answers saved. Results will be available after you reconnect.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Your responses for the <strong>{selectedDomain}</strong> domain have been safely stored in your device outbox. To prevent score tampering, your official score and gap analysis will be calculated by the authoritative server upon reconnection.
              </p>
            </div>

            <div className="max-w-xs mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Domain:</span>
                <strong className="text-slate-900">{selectedDomain}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Questions Completed:</span>
                <strong className="text-slate-900">{offlineAnswers.length} / {offlineQuestionsList.length || 5}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sync Status:</span>
                <strong className="text-amber-700 font-bold">Pending Reconnection</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setAssessmentState('idle')}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                Choose Another Domain
              </button>
              <a
                href="#/learning-path"
                className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Go to Learning Path
              </a>
            </div>
          </div>
        ) : lastAttempt ? (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-center animate-in fade-in-50">
          <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-800 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {t('resultsTitle')}: {lastAttempt.domain}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Adaptive scoring computed according to psychometric question weights
            </p>
          </div>

          {/* Score Tile */}
          <div className="max-w-xs mx-auto p-5 rounded-xl bg-slate-900 text-white space-y-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Earned Domain Score
            </span>
            <div className="text-4xl font-black tracking-tight">
              {lastAttempt.score}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Proficiency:</span>
              <ScoreBadge score={lastAttempt.score} />
            </div>
          </div>

          {/* Comparison with previous attempt */}
          {typeof previousScore === 'number' && (
            <div className="max-w-md mx-auto p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-600">{t('previousScoreCompare')}:</span>
              <div className="font-bold flex items-center gap-2">
                <span className="text-slate-700">Previous: {previousScore}/100</span>
                <span>→</span>
                <span className={lastAttempt.score >= previousScore ? 'text-emerald-700' : 'text-rose-700'}>
                  Current: {lastAttempt.score}/100 ({lastAttempt.score >= previousScore ? `+${lastAttempt.score - previousScore}` : `${lastAttempt.score - previousScore}`} pts)
                </span>
              </div>
            </div>
          )}

          {/* Review of 5 Questions */}
          <div className="text-left space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Assessment Item Log (Difficulty Progression):
            </h3>
            <div className="space-y-2">
              {lastAttempt.questions.map((q, idx) => {
                const userAns = lastAttempt.userAnswers[idx];
                const isCorrect = userAns === q.correctIndex;
                const weight = DIFFICULTY_WEIGHTS[q.difficulty];

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Q{idx + 1}.</span>
                        <span className="text-slate-600 line-clamp-1">{q.question}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {q.skillTag} • Difficulty: {q.difficulty} ({weight} pts)
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {isCorrect ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          +{weight} pts
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          0 pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleStart(lastAttempt.domain)}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('retakeDomain')}</span>
            </button>
            <a
              href="#/gap-analysis"
              className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {t('goToLearningPath')}
            </a>
          </div>
        </div>
        ) : null
      )}
    </div>
  );
};
