import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Play,
  Trophy,
  ShieldAlert,
  Send,
  Plus,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Check,
  Trash2,
  AlertTriangle,
  Code2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { executeUserCode } from '../../services/codeRunner';

export const CommunityView: React.FC = () => {
  const {
    t,
    theme,
    language,
    user,
    studyRooms,
    activeRoomId,
    setActiveRoomId,
    sendRoomMessage,
    updateRoomCode,
    questions,
    askQuestion,
    addAnswer,
    voteQuestion,
    moderationQueue,
    moderateItem,
    triggerConfetti,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rooms' | 'challenges' | 'qa' | 'moderation'>('rooms');

  // Study Room Chat input
  const [chatInput, setChatInput] = useState<string>('');
  const [roomExecutionLog, setRoomExecutionLog] = useState<string>('');

  // Ask Question form state
  const [showAskForm, setShowAskForm] = useState<boolean>(false);
  const [qTitle, setQTitle] = useState<string>('');
  const [qContent, setQContent] = useState<string>('');
  const [qTrackId, setQTrackId] = useState<any>('deeplearning');
  const [qCodeSnippet, setQCodeSnippet] = useState<string>('');
  const [qTags, setQTags] = useState<string>('deeplearning, neural-net');

  // Group challenge state
  const [challengeCode, setChallengeCode] = useState<string>(`function solveChallenge(arr) {\n  // Optimisez le partitionnement\n  return arr.sort((a, b) => a - b);\n}`);
  const [challengeResult, setChallengeResult] = useState<string>('');

  const currentRoom = studyRooms.find((r) => r.id === activeRoomId);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoomId) return;
    sendRoomMessage(activeRoomId, chatInput);
    setChatInput('');
  };

  const handleRunSharedCode = () => {
    if (!currentRoom) return;
    const result = executeUserCode(currentRoom.code, [], language);
    if (result.logs.length > 0) {
      setRoomExecutionLog(result.logs.join('\n'));
    } else if (result.syntaxError) {
      setRoomExecutionLog('Erreur: ' + result.syntaxError);
    } else {
      setRoomExecutionLog('Code exécuté avec succès en ' + result.executionTimeMs + 'ms');
    }
  };

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qContent.trim()) return;

    askQuestion({
      title: qTitle,
      trackId: qTrackId,
      content: qContent,
      codeSnippet: qCodeSnippet.trim() ? qCodeSnippet : undefined,
      tags: qTags.split(',').map((s) => s.trim()).filter(Boolean),
    });

    setQTitle('');
    setQContent('');
    setQCodeSnippet('');
    setShowAskForm(false);
    triggerConfetti();
  };

  const handleRunChallenge = () => {
    const res = executeUserCode(
      challengeCode,
      [
        { call: 'solveChallenge([4, 2, 5, 1])', expected: [1, 2, 4, 5], description: { fr: 'Tri rapide standard', en: 'Standard quicksort' } },
      ],
      language
    );

    if (res.success) {
      setChallengeResult('Félicitations ! Défi validé en ' + res.executionTimeMs + 'ms. +120 XP !');
      triggerConfetti();
    } else {
      setChallengeResult('Échec : ' + (res.syntaxError || 'Certains tests ont échoué.'));
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.community.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.community.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'rooms', label: t.community.studyRooms, icon: Users },
          { id: 'challenges', label: t.community.groupChallenges, icon: Trophy },
          { id: 'qa', label: t.community.qaForum, icon: MessageSquare },
          { id: 'moderation', label: t.community.moderation, icon: ShieldAlert, badge: moderationQueue.filter((m) => m.status === 'pending').length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 1. STUDY ROOMS (LIVE COLLABORATION & SHARED EDITOR) */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {!activeRoomId ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {studyRooms.map((room) => (
                <div
                  key={room.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all hover:scale-[1.01] ${
                    theme === 'noir'
                      ? 'border-slate-800 bg-[#0E131F]'
                      : 'border-slate-200 bg-white shadow-xs hover:border-orange-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{room.collaborators.length} en direct</span>
                      </span>
                      <span className="text-[11px] font-mono-code text-slate-400 uppercase">
                        {room.language}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {room.topic}
                    </p>

                    {/* Collaborators avatars */}
                    <div className="mt-4 flex items-center -space-x-2">
                      {room.collaborators.map((c) => (
                        <div
                          key={c.id}
                          title={`${c.name} - ${c.activeStatus}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 text-sm shadow-xs bg-slate-100 dark:bg-slate-800"
                        >
                          {c.avatar}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setActiveRoomId(room.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition-all"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{t.community.joinRoom}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Active Live Study Room Workspace */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveRoomId(null)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold"
                  >
                    &larr; {t.community.leaveRoom}
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentRoom?.name}
                    </h2>
                    <p className="text-xs text-slate-500">{currentRoom?.topic}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunSharedCode}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{t.community.runSharedCode}</span>
                  </button>
                </div>
              </div>

              {/* Collaborative Screen Layout: Editor + Chat */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Shared Code Editor */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-[#090D16] overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono-code text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>{t.community.sharedCodeEditor}</span>
                      </div>
                      <span className="text-orange-400 font-bold">Synchronisation active</span>
                    </div>

                    <textarea
                      value={currentRoom?.code || ''}
                      onChange={(e) => updateRoomCode(currentRoom!.id, e.target.value)}
                      rows={12}
                      className="w-full resize-none bg-transparent p-4 font-mono-code text-xs sm:text-sm text-slate-100 focus:outline-hidden leading-relaxed"
                    />

                    {roomExecutionLog && (
                      <div className="border-t border-slate-800 bg-[#070A11] p-3 text-xs font-mono-code text-emerald-400">
                        <span className="text-[10px] text-slate-500 block mb-1">Sortie partagée :</span>
                        <pre className="whitespace-pre-wrap">{roomExecutionLog}</pre>
                      </div>
                    )}
                  </div>

                  {/* Connected Collaborators list */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold">{t.community.collaboratorsOnline}</span>
                    <div className="flex items-center gap-2">
                      {currentRoom?.collaborators.map((c) => (
                        <span key={c.id} className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <span>{c.avatar}</span>
                          <span>{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Room Chat Sidebar */}
                <div
                  className={`rounded-2xl border flex flex-col justify-between h-[450px] ${
                    theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-xs">
                    {t.community.chatRoom}
                  </div>

                  {/* Messages stream */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                    {currentRoom?.messages.map((m) => (
                      <div key={m.id} className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                          <span>{m.avatar}</span>
                          <span className={m.isAi ? 'text-orange-500 font-bold' : ''}>{m.user}</span>
                          <span className="text-slate-500 ml-auto">{m.time}</span>
                        </div>
                        <p className={`p-2 rounded-xl text-slate-800 dark:text-slate-200 leading-relaxed ${
                          m.isAi
                            ? 'bg-orange-500/10 border border-orange-500/20 text-orange-950 dark:text-orange-200'
                            : 'bg-slate-100 dark:bg-slate-800/80'
                        }`}>
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="p-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={t.community.typeMessage}
                      className={`flex-1 rounded-xl border px-3 py-1.5 text-xs focus:outline-hidden ${
                        theme === 'noir' ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                      }`}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GROUP CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 ${
              theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 text-xs uppercase">
                  Défi Hebdomadaire
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Speed Coding : Tri Rapide & Partition In-Place
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rendez la fonction la plus efficace possible sans allocation mémoire superflue.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Clock className="h-4 w-4" />
                <span>24:12:00</span>
              </div>
            </div>

            {/* Code Box for Challenge */}
            <div className="rounded-xl border border-slate-800 bg-[#090D16] p-4 text-xs font-mono-code mb-4">
              <textarea
                value={challengeCode}
                onChange={(e) => setChallengeCode(e.target.value)}
                rows={6}
                className="w-full resize-none bg-transparent text-slate-100 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-500">
                {challengeResult}
              </span>
              <button
                onClick={handleRunChallenge}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>{t.community.submitChallenge}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMMUNITY Q&A */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Questions & Entraide Finjaro
            </h3>
            <button
              onClick={() => setShowAskForm(!showAskForm)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.community.askQuestion}</span>
            </button>
          </div>

          {/* Ask question form */}
          {showAskForm && (
            <form
              onSubmit={handlePostQuestion}
              className={`rounded-2xl border p-5 space-y-4 ${
                theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white'
              }`}
            >
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.community.askQuestion}
              </h4>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.community.questionTitle}</label>
                <input
                  type="text"
                  required
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="Ex: Pourquoi mon gradient explose-t-il après 10 époques ?"
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.community.questionDetails}</label>
                <textarea
                  required
                  rows={3}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs ${
                    theme === 'noir' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t.community.codeSnippetOptional}</label>
                <textarea
                  rows={2}
                  placeholder="// Collez votre extrait de code ici"
                  value={qCodeSnippet}
                  onChange={(e) => setQCodeSnippet(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#090D16] p-3 text-xs font-mono-code text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAskForm(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500"
                >
                  {t.community.postQuestion}
                </button>
              </div>
            </form>
          )}

          {/* Questions list */}
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 ${
                  theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => voteQuestion(q.id)}
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-bold hover:border-orange-500 transition-colors"
                    >
                      <ThumbsUp className="h-3.5 w-3.5 text-orange-500" />
                      <span>{q.votes}</span>
                    </button>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {q.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {q.content}
                      </p>

                      {q.codeSnippet && (
                        <pre className="mt-2 p-2.5 rounded-lg bg-[#090D16] text-[11px] font-mono-code text-slate-200 overflow-x-auto">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Par {q.author}
                        </span>
                        {q.tags.map((tg) => (
                          <span key={tg} className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 text-[10px] font-bold">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {q.answered && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Résolu</span>
                    </span>
                  )}
                </div>

                {/* Answers list */}
                {q.answers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {q.answers.map((ans) => (
                      <div
                        key={ans.id}
                        className={`rounded-xl p-3 text-xs leading-relaxed ${
                          ans.isAccepted
                            ? 'border border-emerald-500/30 bg-emerald-950/10 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-50 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                          <span className="text-orange-600 dark:text-orange-400">{ans.author}</span>
                          {ans.isAccepted && (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Solution acceptée</span>
                            </span>
                          )}
                        </div>
                        <p>{ans.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODERATION DASHBOARD */}
      {activeTab === 'moderation' && (
        <div
          className={`rounded-2xl border p-6 ${
            theme === 'noir' ? 'border-slate-800 bg-[#0E131F]' : 'border-slate-200 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold text-sm">
            <ShieldAlert className="h-5 w-5" />
            <h3>{t.community.moderationQueue}</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Espace réservé à la modération communautaire pour maintenir un environnement respectueux, bienveillant et dénué de spam.
          </p>

          {moderationQueue.filter((m) => m.status === 'pending').length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {t.community.emptyModeration}
            </div>
          ) : (
            <div className="space-y-4">
              {moderationQueue
                .filter((m) => m.status === 'pending')
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-400 uppercase">
                        Signalé pour : {item.reportReason}
                      </span>
                      <span className="text-slate-400">Auteur : {item.author}</span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      "{item.content}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => moderateItem(item.id, 'rejected')}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{t.community.reject}</span>
                      </button>
                      <button
                        onClick={() => moderateItem(item.id, 'approved')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{t.community.approve}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
