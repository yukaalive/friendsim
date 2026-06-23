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

const TEMPERAMENTS = {
  NT: { name: '分析家', rhythm: '論理と未来像' },
  NF: { name: '外交官', rhythm: '共感と意味づけ' },
  SJ: { name: '番人', rhythm: '責任感と安定' },
  SP: { name: '探検家', rhythm: '実践と瞬発力' },
};

const IDEAL_PAIRS = new Set([
  'ENFP:INFJ', 'ENTP:INTJ', 'ENFJ:INFP', 'ENTJ:INTP',
  'ESFP:ISFJ', 'ESTP:ISTJ', 'ESFJ:ISFP', 'ESTJ:ISTP',
]);

const AXIS_DETAILS = [
  { label: 'E/I エネルギー配分', same: '外向/内向のリズムが同じで、話す量や一人で考える時間の期待値がそろいやすい。', different: '外向と内向が分かれ、片方が場を動かし片方が深く整理する補完関係になりやすい。', sameScore: 1, differentScore: 2 },
  { label: 'S/N 情報の見方', same: '事実重視/可能性重視の視点が一致し、会話の粒度が合いやすい。', different: '現実重視と未来重視で前提がずれやすく、確認不足だとすれ違いになる。', sameScore: 5, differentScore: -4 },
  { label: 'T/F 判断基準', same: '論理重視/気持ち重視の判断軸が近く、納得する理由を共有しやすい。', different: '論理と感情の優先順位が違い、言葉の強さや配慮の量で衝突しやすい。', sameScore: 6, differentScore: -5 },
  { label: 'J/P 進め方', same: '計画型/柔軟型のテンポが同じで、安心できる進行速度を作りやすい。', different: '計画役と即興役に分かれ、役割が噛み合えば強いが放置すると不満が出る。', sameScore: 3, differentScore: 1 },
];

const TEMPERAMENT_SYNERGY = {
  'NT:NT': { score: 6, text: '分析家同士で戦略・仮説検証が高速に進む。' },
  'NF:NF': { score: 6, text: '外交官同士で価値観や気持ちの共有が深まりやすい。' },
  'SJ:SJ': { score: 6, text: '番人同士で責任感と安定運用への信頼が生まれやすい。' },
  'SP:SP': { score: 5, text: '探検家同士でその場の楽しさと実践力が噛み合う。' },
  'NF:NT': { score: 4, text: '理想と戦略が結びつくと、意味のある計画に発展しやすい。' },
  'NF:SJ': { score: 1, text: '思いやりと堅実さで支え合えるが、抽象度の違いは調整が必要。' },
  'NF:SP': { score: -3, text: '価値観重視と即興重視で、深刻さの温度差が出やすい。' },
  'NT:SJ': { score: -4, text: '革新志向と安定志向がぶつかり、変更の理由説明が重要になる。' },
  'NT:SP': { score: -5, text: '理論重視と体感重視で、納得する材料が大きく異なる。' },
  'SJ:SP': { score: 2, text: '安定運用と現場対応が合うと強いが、ルール運用で摩擦も出る。' },
};

function pairKey(typeA, typeB) {
  return [typeA, typeB].sort().join(':');
}

function temperament(type) {
  if (type[1] === 'N' && type[2] === 'T') return 'NT';
  if (type[1] === 'N' && type[2] === 'F') return 'NF';
  if (type[1] === 'S' && type[3] === 'J') return 'SJ';
  return 'SP';
}

function role(type) {
  return type[3] === 'J' ? '締め切りを守る設計役' : '変化に強い探索役';
}

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

export function mbtiCompatibility(typeA, typeB) {
  const axisBreakdown = AXIS_DETAILS.map((axis, index) => {
    const matched = typeA[index] === typeB[index];
    return { label: axis.label, score: matched ? axis.sameScore : axis.differentScore, matched, text: matched ? axis.same : axis.different };
  });
  const tempA = temperament(typeA);
  const tempB = temperament(typeB);
  const tempKey = [tempA, tempB].sort().join(':');
  const synergy = TEMPERAMENT_SYNERGY[tempKey];
  let score = axisBreakdown.reduce((sum, item) => sum + item.score, 0) + synergy.score;

  if (IDEAL_PAIRS.has(pairKey(typeA, typeB))) score += 10;

  const delta = clamp(Math.round(score / 2), -15, 15);
  const level = delta >= 12 ? '最高相性' : delta >= 7 ? '好相性' : delta >= 2 ? '補完関係' : delta >= -3 ? '要調整' : delta >= -8 ? 'すれ違い注意' : '衝突しやすい';
  const summary = `${TEMPERAMENTS[tempA].name}(${TEMPERAMENTS[tempA].rhythm}) × ${TEMPERAMENTS[tempB].name}(${TEMPERAMENTS[tempB].rhythm}) / ${role(typeA)}と${role(typeB)}`;
  const reasons = [
    synergy.text,
    ...axisBreakdown.slice().sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 3).map((axis) => `${axis.label}: ${axis.text}`),
  ];
  if (IDEAL_PAIRS.has(pairKey(typeA, typeB))) reasons.unshift('定番の理想ペアとして、刺激と安心のバランスが非常に良い。');
  return { delta, level, score, summary, reasons, axisBreakdown, temperamentSynergy: synergy };
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
  const compatibility = mbtiCompatibility(primary.mbti, partner.mbti);
  const delta = compatibility.delta;
  const title = `${situation.label}で${compatibility.level}`;
  const resultLine = delta >= 0
    ? `相性判定は「${compatibility.level}」。${compatibility.reasons[0]} その結果、関係値がプラスに動いた。`
    : `相性判定は「${compatibility.level}」。${compatibility.reasons[0]} その結果、関係値がマイナスに動いた。`;
  const message = `${situation.description}。${primaryAxes[0]} ${partnerAxes[1]} ${compatibility.summary}。${resultLine}`;

  return {
    id: createId(),
    title,
    message,
    delta,
    compatibility,
    friendIds: [primary.id, partner.id],
    createdAt: formatDate(),
  };
}
