import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { GeminiService } from '../../services/geminiService';
import { QuestionRecord, QuizRecord } from '../../types';
import {
  FileQuestion,
  Upload,
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  FileUp,
  History,
  ArrowLeft,
  BookOpen,
  Award,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const QuizGeneratorPage: React.FC = () => {
  const { currentUser, t, language } = useApp();

  // Top View Mode: 'generator' | 'history'
  const [viewMode, setViewMode] = useState<'generator' | 'history'>('generator');
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>(() =>
    StorageService.getQuizzes(currentUser.id)
  );
  const [selectedHistoryQuiz, setSelectedHistoryQuiz] = useState<QuizRecord | null>(null);

  // Sync quiz history from server on mount
  useEffect(() => {
    ApiService.getQuizzes()
      .then((records) => {
        if (records && records.length > 0) {
          setQuizHistory(records);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server quizzes, using local storage:', err);
      });
  }, [currentUser.id]);

  // Input states
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
  const [pastedText, setPastedText] = useState(
    `National Statistical System & Survey Methodology Overview:
Under the Ministry of Statistics and Programme Implementation (MoSPI), the National Sample Survey (NSS) conducts nationwide household enquiries. 
The sampling framework utilizes a stratified two-stage design where revenue villages (rural) and Urban Frame Survey (UFS) blocks serve as Primary Sampling Units (PSUs).
To estimate population totals from samples with varying selection probabilities, the Horvitz-Thompson unbiased estimator is applied: Y_hat = sum(y_i / pi_i).
Non-sampling errors, including item non-response and recall bias, are mitigated using hot-deck donor imputation and digital handheld validation checks.
Furthermore, in alignment with NEP-2020 and Mission Karmayogi, statistical investigators undergo continuous skilling on administrative data linkages and DPDP Act compliance.`
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Quiz Options
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [loading, setLoading] = useState(false);

  // Active Quiz taking state
  const [activeQuestions, setActiveQuestions] = useState<QuestionRecord[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isRetryingIncorrect, setIsRetryingIncorrect] = useState(false);

  // Handle PDF file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds 10 MB maximum limit. Please select a smaller document.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Please select a valid PDF document.');
      return;
    }

    setSelectedFile(file);

    // Read base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setPdfBase64(base64Data);
    };
    reader.onerror = () => {
      setFileError('Error reading PDF file. Ensure document is not corrupted.');
    };
    reader.readAsDataURL(file);
  };

  // Generate Quiz
  const handleGenerate = async () => {
    let materialText = pastedText.trim();

    if (activeTab === 'upload') {
      if (!selectedFile) {
        setFileError('Please select a PDF file before generating.');
        return;
      }
      materialText = `Uploaded document: "${selectedFile.name}". Context: Official government / study material on competencies and methodologies.`;
    }

    if (!materialText && !pdfBase64) {
      setFileError('Please provide text material or select a valid PDF.');
      return;
    }

    setLoading(true);
    setFileError(null);
    setIsEvaluated(false);
    setIsRetryingIncorrect(false);

    try {
      const { questions } = await GeminiService.generateQuiz(
        materialText,
        questionCount,
        difficulty,
        language,
        activeTab === 'upload' && pdfBase64 ? pdfBase64 : undefined
      );

      setActiveQuestions(questions);
      setUserAnswers(new Array(questions.length).fill(-1));
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setFileError('Could not parse document. If this is a scanned image PDF, please copy and paste the text excerpt.');
    } finally {
      setLoading(false);
    }
  };

  // Select Option
  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isEvaluated) return;
    const updated = [...userAnswers];
    updated[qIdx] = optIdx;
    setUserAnswers(updated);
  };

  // Evaluate and persist to ApiService + local storage
  const handleEvaluate = async () => {
    setIsEvaluated(true);

    let score = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });

    const quizRecord: QuizRecord = {
      id: `quiz-rec-${Date.now()}`,
      userId: currentUser.id,
      title: selectedFile ? selectedFile.name : 'Custom Material Practice Quiz',
      sourceType: activeTab === 'upload' ? 'pdf' : 'text',
      sourceSnippet: pastedText.slice(0, 150),
      timestamp: new Date().toISOString(),
      difficulty,
      questions: activeQuestions,
      userAnswers,
      score,
      totalQuestions: activeQuestions.length,
    };

    try {
      await ApiService.saveQuiz(quizRecord);
    } catch (err) {
      console.warn('Backend saveQuiz fallback to local storage:', err);
    }

    StorageService.saveQuiz(quizRecord);
    setQuizHistory((prev) => [quizRecord, ...prev]);
  };

  // Retry only incorrect questions
  const handleRetryIncorrect = () => {
    const incorrectIndices = activeQuestions
      .map((q, idx) => (userAnswers[idx] !== q.correctIndex ? idx : -1))
      .filter((idx) => idx !== -1);

    if (incorrectIndices.length === 0) return;

    const remainingQuestions = incorrectIndices.map((i) => activeQuestions[i]);
    setActiveQuestions(remainingQuestions);
    setUserAnswers(new Array(remainingQuestions.length).fill(-1));
    setIsEvaluated(false);
    setIsRetryingIncorrect(true);
  };

  // Download quiz as .txt file
  const handleExportTxt = () => {
    let content = `========================================================\n`;
    content += `STATSKILLAI PRACTICE QUIZ & EVALUATION REPORT\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Difficulty: ${difficulty} | Questions: ${activeQuestions.length}\n`;
    content += `========================================================\n\n`;

    activeQuestions.forEach((q, idx) => {
      content += `Question ${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        content += `  [${String.fromCharCode(65 + oIdx)}] ${opt}\n`;
      });
      content += `Correct Answer: [${String.fromCharCode(65 + q.correctIndex)}]\n`;
      if (isEvaluated) {
        const uAns = userAnswers[idx];
        content += `Your Answer: [${uAns >= 0 ? String.fromCharCode(65 + uAns) : 'Unanswered'}]\n`;
        content += `Result: ${uAns === q.correctIndex ? 'CORRECT' : 'INCORRECT'}\n`;
      }
      content += `Explanation: ${q.explanation}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StatSkillAI_Quiz_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculatedScore = activeQuestions.filter((q, idx) => userAnswers[idx] === q.correctIndex).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Pedagogical Material Parsing
            </span>
            <span className="text-xs text-slate-500">Strictly Material Grounded</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('quizGenTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('quizGenSubtitle')}
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => { setViewMode('generator'); setSelectedHistoryQuiz(null); }}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'generator'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Practice Generator</span>
          </button>
          <button
            type="button"
            onClick={() => { setViewMode('history'); setSelectedHistoryQuiz(null); }}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Quiz History & Review ({quizHistory.length})</span>
          </button>
        </div>
      </div>

      {fileError && (
        <NoticeBanner type="warning" title="Document Notice">
          {fileError}
        </NoticeBanner>
      )}

      {viewMode === 'generator' && (
        <>
          {/* Generator Configuration Card */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Input Mode Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Text Excerpt</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Upload PDF Circular / Chapter</span>
          </button>
        </div>

        {/* Tab 1: Text */}
        {activeTab === 'paste' ? (
          <div className="space-y-1.5 text-xs">
            <label className="block font-semibold text-slate-700">
              Source Text Excerpt (Syllabus, circular, or case study)
            </label>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 leading-relaxed font-mono text-[11px]"
              placeholder="Paste relevant text here..."
            />
            <p className="text-[11px] text-slate-500">
              Questions will be generated strictly from statements within this text.
            </p>
          </div>
        ) : (
          /* Tab 2: PDF Upload */
          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-700">
              Select PDF Document (Max 10 MB)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="pdf-upload-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-2 block">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click to select PDF or drag and drop here'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis`
                    : 'PDF circulars, NSSO field manuals, or course notes up to 10 MB'}
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Question Count & Difficulty Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('questionCount')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-md font-bold text-center border transition-colors ${
                    questionCount === cnt
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cnt} Qs
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('difficultyMode')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-md font-bold text-center border transition-colors ${
                    difficulty === diff
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? 'Synthesizing Verified MCQs...' : t('generateQuiz')}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE QUIZ QUESTIONS DISPLAY */}
      {activeQuestions.length > 0 && (
        <div className="bg-white rounded-xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isRetryingIncorrect ? 'Retry Mode: Reviewing Incorrect Questions' : 'Generated Document MCQs'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeQuestions.length} multiple-choice questions grounded in provided source material
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTxt}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download Quiz as text file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('exportTxt')}</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {activeQuestions.map((q, qIdx) => {
              const selectedAns = userAnswers[qIdx];
              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-800">Q{qIdx + 1}.</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {q.skillTag}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Difficulty: {q.difficulty}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((option, oIdx) => {
                      const isChosen = selectedAns === oIdx;
                      let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';

                      if (isEvaluated) {
                        if (oIdx === q.correctIndex) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isChosen) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                        } else {
                          btnStyle = 'border-slate-200 bg-white opacity-60 text-slate-600';
                        }
                      } else if (isChosen) {
                        btnStyle = 'border-teal-600 bg-teal-50 text-teal-950 font-semibold ring-2 ring-teal-500';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isEvaluated}
                          onClick={() => handleSelectOption(qIdx, oIdx)}
                          className={`w-full p-3 rounded-lg border text-left text-xs flex items-start gap-2.5 transition-all ${btnStyle}`}
                        >
                          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                          {isEvaluated && oIdx === q.correctIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isEvaluated && isChosen && oIdx !== q.correctIndex && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation shown after evaluation */}
                  {isEvaluated && (
                    <div className="p-3 rounded-md bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">
                        Verified Explanation (Grounded in Material):
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            {!isEvaluated ? (
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={userAnswers.filter((a) => a >= 0).length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors"
              >
                Submit Answers for Instant Evaluation
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-900">
                  Final Score: <span className="text-teal-700 text-sm font-black">{calculatedScore}</span> / {activeQuestions.length} ({Math.round((calculatedScore / activeQuestions.length) * 100)}%)
                </div>

                <div className="flex items-center gap-2">
                  {calculatedScore < activeQuestions.length && (
                    <button
                      type="button"
                      onClick={handleRetryIncorrect}
                      className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      {t('retryIncorrect')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuestions([]);
                      setUserAnswers([]);
                      setIsEvaluated(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                  >
                    Start New Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )}

  {/* TAB 2: QUIZ HISTORY & MISTAKE ANALYSIS */}
  {viewMode === 'history' && (
    <div className="space-y-6">
      {selectedHistoryQuiz ? (
        /* Detailed Review of Single Past Quiz */
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedHistoryQuiz(null)}
                className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-bold hover:underline mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Quiz History</span>
              </button>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {selectedHistoryQuiz.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Completed: {new Date(selectedHistoryQuiz.timestamp).toLocaleDateString()}</span>
                <span>•</span>
                <span className="capitalize">{selectedHistoryQuiz.difficulty} Difficulty</span>
                <span>•</span>
                <span className="uppercase">{selectedHistoryQuiz.sourceType} Source</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-center">
                <span className="text-[10px] text-teal-400 font-bold uppercase block">Result</span>
                <span className="text-base font-black">
                  {selectedHistoryQuiz.score} / {selectedHistoryQuiz.totalQuestions}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({Math.round((selectedHistoryQuiz.score / selectedHistoryQuiz.totalQuestions) * 100)}%)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveQuestions(selectedHistoryQuiz.questions);
                  setUserAnswers(new Array(selectedHistoryQuiz.questions.length).fill(-1));
                  setIsEvaluated(false);
                  setViewMode('generator');
                }}
                className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Retake This Quiz
              </button>
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-4">
            {selectedHistoryQuiz.questions.map((q, idx) => {
              const userAns = selectedHistoryQuiz.userAnswers[idx];
              const isCorrect = userAns === q.correctIndex;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border bg-white shadow-xs space-y-4 ${
                    isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-sm text-slate-900 leading-snug">
                      <span className="text-slate-400 font-semibold mr-1.5">{idx + 1}.</span>
                      {q.question}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isCorrect ? 'Correct' : 'Mistake'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = userAns === oIdx;
                      const isOptionCorrect = q.correctIndex === oIdx;

                      let optClass = 'border-slate-200 bg-slate-50/60 text-slate-700';
                      if (isSelected && isCorrect) {
                        optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isCorrect) {
                        optClass = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-500';
                      } else if (isOptionCorrect && !isCorrect) {
                        optClass = 'border-emerald-400 bg-emerald-50/70 text-emerald-900 font-semibold';
                      }

                      return (
                        <div key={oIdx} className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${optClass}`}>
                          <span>
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                          </span>
                          {isSelected && !isCorrect && (
                            <span className="text-[10px] font-bold text-rose-700 shrink-0">Your Answer</span>
                          )}
                          {isOptionCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 shrink-0">Correct Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-teal-800">
                      Pedagogical Explanation:
                    </span>
                    <p className="leading-relaxed text-slate-600">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* History Overview List */
        <div className="space-y-4">
          {quizHistory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Custom Quizzes Completed Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a document or paste curriculum text in the Practice Generator tab to generate and solve your first quiz.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('generator')}
                className="mt-2 px-4 py-2 rounded-lg bg-teal-700 text-white font-bold text-xs"
              >
                Go to Practice Generator
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizHistory.map((q) => {
                const percent = Math.round((q.score / (q.totalQuestions || 5)) * 100);
                return (
                  <div
                    key={q.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-400 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                          {q.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                            percent >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : percent >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.score} / {q.totalQuestions} ({percent}%)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{new Date(q.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{q.difficulty}</span>
                        <span>•</span>
                        <span className="uppercase">{q.sourceType}</span>
                        <span>•</span>
                        <span>{q.questions.length} Questions</span>
                      </div>

                      {q.sourceSnippet && (
                        <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded">
                          "{q.sourceSnippet}..."
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryQuiz(q)}
                        className="flex-1 py-1.5 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs text-center transition-colors"
                      >
                        Review Explanations
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuestions(q.questions);
                          setUserAnswers(new Array(q.questions.length).fill(-1));
                          setIsEvaluated(false);
                          setViewMode('generator');
                        }}
                        className="py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>
);
};

