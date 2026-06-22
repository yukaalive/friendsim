export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export const SITUATIONS = [
  { id: 'school', label: '学校', description: '放課後の教室でグループ課題を進める' },
  { id: 'work', label: '会社', description: '会議前に企画の進め方を相談する' },
  { id: 'cafe', label: 'カフェ', description: '休日に近況を話しながら作戦会議する' },
];

export const DEFAULT_FRIENDS = [
  { id: 'sample-1', name: 'あおい', mbti: 'ENFP', relationship: 64 },
  { id: 'sample-2', name: 'れん', mbti: 'ISTJ', relationship: 42 },
];

export const STORAGE_KEY = 'friendsim-state-v1';

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function relationshipLabel(score) {
  if (score >= 70) return { text: '仲良し', className: 'good' };
  if (score <= 30) return { text: '喧嘩気味', className: 'bad' };
  return { text: '普通', className: 'normal' };
}

export function safeLoadState(storage = globalThis.localStorage) {
  if (!storage) return { friends: DEFAULT_FRIENDS, logs: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
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

export function axisLine(friend) {
  const [energy, perception, decision, planning] = friend.mbti.split('');
  const lines = [];
  lines.push(energy === 'E' ? `${friend.name}は皆を巻き込んで明るく提案した。` : `${friend.name}は少し考えてから落ち着いて意見を出した。`);
  lines.push(decision === 'F' ? '相手の気持ちを優先して、やわらかい言葉を選ぶ。' : '筋道と効率を重視して、はっきり課題を整理する。');
  lines.push(planning === 'J' ? '予定を決めて安心したいタイプなので、段取りを確認した。' : 'その場のひらめきを楽しみ、柔軟な進め方を提案した。');
  lines.push(perception === 'N' ? '「もっと面白い可能性があるかも」と未来の案を広げる。' : '「今ある材料で確実に進めよう」と現実的にまとめる。');
  return lines;
}

export function generateEvent(friends, situationId, options = {}) {
  const random = options.random ?? Math.random;
  const createId = options.createId ?? (() => crypto.randomUUID());
  const formatDate = options.formatDate ?? (() => new Date().toLocaleString('ja-JP'));
  const situation = SITUATIONS.find((item) => item.id === situationId) || SITUATIONS[0];
  const primary = friends[Math.floor(random() * friends.length)];
  const partner = friends.find((friend) => friend.id !== primary.id) || primary;
  const primaryAxes = axisLine(primary);
  const partnerAxes = axisLine(partner);
  const sameDecision = primary.mbti[2] === partner.mbti[2];
  const samePlanning = primary.mbti[3] === partner.mbti[3];
  const delta = sameDecision && samePlanning ? 8 : sameDecision || samePlanning ? 4 : -6;
  const title = delta >= 0 ? `${situation.label}で距離が近づいた` : `${situation.label}で少しぶつかった`;
  const message = `${situation.description}。${primaryAxes[0]} ${partnerAxes[1]} ${sameDecision ? '価値観が重なり会話が弾んだ。' : '優先したいものが違って、少し言い合いになった。'}`;

  return {
    id: createId(),
    title,
    message,
    delta,
    friendIds: [primary.id, partner.id],
    createdAt: formatDate(),
  };
}
