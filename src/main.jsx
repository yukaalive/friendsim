import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, MessageCircle, Plus, RefreshCcw, Trash2, Users } from 'lucide-react';
import './styles.css';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const SITUATIONS = [
  { id: 'school', label: '学校', description: '放課後の教室でグループ課題を進める' },
  { id: 'work', label: '会社', description: '会議前に企画の進め方を相談する' },
  { id: 'cafe', label: 'カフェ', description: '休日に近況を話しながら作戦会議する' },
];

const DEFAULT_FRIENDS = [
  { id: 'sample-1', name: 'あおい', mbti: 'ENFP', relationship: 64 },
  { id: 'sample-2', name: 'れん', mbti: 'ISTJ', relationship: 42 },
];

const STORAGE_KEY = 'friendsim-state-v1';

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function relationshipLabel(score) {
  if (score >= 70) return { text: '仲良し', className: 'good' };
  if (score <= 30) return { text: '喧嘩気味', className: 'bad' };
  return { text: '普通', className: 'normal' };
}

function safeLoadState() {
  if (typeof localStorage === 'undefined') return { friends: DEFAULT_FRIENDS, logs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { friends: DEFAULT_FRIENDS, logs: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.friends) || !Array.isArray(parsed.logs)) {
      return { friends: DEFAULT_FRIENDS, logs: [] };
    }
    return {
      friends: parsed.friends.filter((friend) => friend?.name && MBTI_TYPES.includes(friend.mbti)),
      logs: parsed.logs.slice(0, 20),
    };
  } catch {
    return { friends: DEFAULT_FRIENDS, logs: [] };
  }
}

function usePersistentGameState() {
  const [state, setState] = useState(safeLoadState);

  const updateState = (updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage が使えない環境でも画面操作は継続する。
      }
      return next;
    });
  };

  return [state, updateState];
}

function axisLine(friend) {
  const [energy, perception, decision, planning] = friend.mbti.split('');
  const lines = [];
  lines.push(energy === 'E' ? `${friend.name}は皆を巻き込んで明るく提案した。` : `${friend.name}は少し考えてから落ち着いて意見を出した。`);
  lines.push(decision === 'F' ? '相手の気持ちを優先して、やわらかい言葉を選ぶ。' : '筋道と効率を重視して、はっきり課題を整理する。');
  lines.push(planning === 'J' ? '予定を決めて安心したいタイプなので、段取りを確認した。' : 'その場のひらめきを楽しみ、柔軟な進め方を提案した。');
  lines.push(perception === 'N' ? '「もっと面白い可能性があるかも」と未来の案を広げる。' : '「今ある材料で確実に進めよう」と現実的にまとめる。');
  return lines;
}

function generateEvent(friends, situationId) {
  const situation = SITUATIONS.find((item) => item.id === situationId) || SITUATIONS[0];
  const primary = friends[Math.floor(Math.random() * friends.length)];
  const partner = friends.find((friend) => friend.id !== primary.id) || primary;
  const primaryAxes = axisLine(primary);
  const partnerAxes = axisLine(partner);
  const sameDecision = primary.mbti[2] === partner.mbti[2];
  const samePlanning = primary.mbti[3] === partner.mbti[3];
  const delta = sameDecision && samePlanning ? 8 : sameDecision || samePlanning ? 4 : -6;
  const title = delta >= 0 ? `${situation.label}で距離が近づいた` : `${situation.label}で少しぶつかった`;
  const message = `${situation.description}。${primaryAxes[0]} ${partnerAxes[1]} ${sameDecision ? '価値観が重なり会話が弾んだ。' : '優先したいものが違って、少し言い合いになった。'}`;

  return {
    id: crypto.randomUUID(),
    title,
    message,
    delta,
    friendIds: [primary.id, partner.id],
    createdAt: new Date().toLocaleString('ja-JP'),
  };
}

function App() {
  const [{ friends, logs }, setGameState] = usePersistentGameState();
  const [name, setName] = useState('');
  const [mbti, setMbti] = useState('ENFP');
  const [nameError, setNameError] = useState('');
  const [situation, setSituation] = useState('school');

  const latestLog = logs[0];
  const averageRelationship = useMemo(() => {
    if (!friends.length) return 0;
    return Math.round(friends.reduce((sum, friend) => sum + friend.relationship, 0) / friends.length);
  }, [friends]);

  const addFriend = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('友達の名前を入力してください。');
      return;
    }
    setNameError('');
    setGameState((current) => ({
      ...current,
      friends: [...current.friends, { id: crypto.randomUUID(), name: trimmed, mbti, relationship: 50 }],
    }));
    setName('');
  };

  const deleteFriend = (id) => {
    setGameState((current) => ({
      friends: current.friends.filter((friend) => friend.id !== id),
      logs: current.logs.filter((log) => !log.friendIds.includes(id)),
    }));
  };

  const resetGame = () => {
    const next = { friends: DEFAULT_FRIENDS, logs: [] };
    localStorage.removeItem(STORAGE_KEY);
    setGameState(next);
  };

  const runEvent = () => {
    if (friends.length < 2) return;
    const log = generateEvent(friends, situation);
    setGameState((current) => ({
      friends: current.friends.map((friend) => (
        log.friendIds.includes(friend.id)
          ? { ...friend, relationship: clamp(friend.relationship + log.delta) }
          : friend
      )),
      logs: [log, ...current.logs].slice(0, 20),
    }));
  };

  return (
    <main className="app-shell" data-testid="friendsim-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">MBTI relationship simulator</p>
          <h1>FriendSim 友達コレクション</h1>
          <p>友達を登録してMBTIを設定し、学校・会社・カフェで会話イベントを起こそう。</p>
        </div>
        <div className="score-card">
          <Heart size={24} />
          <span>平均関係値</span>
          <strong>{averageRelationship}</strong>
        </div>
      </section>

      <div className="layout-grid">
        <section className="panel">
          <h2><Plus size={20} /> 友達登録</h2>
          <form onSubmit={addFriend} className="friend-form">
            <label>
              名前
              <input data-testid="friend-name-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="例: みさき" />
            </label>
            <label>
              MBTI
              <select data-testid="mbti-select" value={mbti} onChange={(event) => setMbti(event.target.value)}>
                {MBTI_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            {nameError && <p className="error" data-testid="name-error">{nameError}</p>}
            <button data-testid="add-friend-button" type="submit" className="primary-button">登録する</button>
          </form>

          <div className="section-header">
            <h2><Users size={20} /> 友達一覧</h2>
            <button type="button" className="ghost-button" onClick={resetGame}><RefreshCcw size={16} />リセット</button>
          </div>
          {friends.length === 0 ? (
            <p className="guidance" data-testid="empty-guidance">まずは友達を2人以上登録するとイベントを遊べます。</p>
          ) : (
            <div className="friend-list" data-testid="friend-list">
              {friends.map((friend) => {
                const label = relationshipLabel(friend.relationship);
                return (
                  <article className="friend-card" key={friend.id}>
                    <div>
                      <strong>{friend.name}</strong>
                      <span>{friend.mbti}</span>
                    </div>
                    <div className="relationship-meter"><i style={{ width: `${friend.relationship}%` }} /></div>
                    <span className={`badge ${label.className}`}>{label.text}・{friend.relationship}</span>
                    <button aria-label={`${friend.name}を削除`} type="button" onClick={() => deleteFriend(friend.id)}><Trash2 size={16} /></button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel simulation-panel">
          <h2><MessageCircle size={20} /> シチュエーション</h2>
          <div className="situation-options" data-testid="situation-options">
            {SITUATIONS.map((item) => (
              <button
                data-testid={`situation-${item.id}`}
                key={item.id}
                type="button"
                className={situation === item.id ? 'situation active' : 'situation'}
                onClick={() => setSituation(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
          <button
            data-testid={friends.length < 2 ? 'run-event-disabled-button' : 'run-event-button'}
            type="button"
            className="run-button"
            disabled={friends.length < 2}
            onClick={runEvent}
          >
            イベント発生
          </button>
          {friends.length < 2 && <p className="guidance">イベントには友達が2人以上必要です。</p>}

          <article className="event-result" data-testid="event-result">
            {latestLog ? (
              <>
                <p className="eyebrow">最新イベント</p>
                <h3>{latestLog.title}</h3>
                <p>{latestLog.message}</p>
                <strong className={latestLog.delta >= 0 ? 'delta plus' : 'delta minus'} data-testid="relationship-delta">
                  関係値 {latestLog.delta >= 0 ? '+' : ''}{latestLog.delta}
                </strong>
              </>
            ) : (
              <p className="guidance">シチュエーションを選んでイベントを起こすと、MBTIらしい会話と関係値変化が表示されます。</p>
            )}
          </article>

          <div>
            <h2>イベントログ</h2>
            <ol className="event-log" data-testid="event-log-list">
              {logs.length === 0 ? <li>まだログはありません。</li> : logs.map((log) => (
                <li key={log.id}><time>{log.createdAt}</time><span>{log.title}</span></li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
