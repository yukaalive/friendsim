import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FRIENDS,
  STORAGE_KEY,
  axisLine,
  clamp,
  generateEvent,
  mbtiCompatibility,
  relationshipLabel,
  safeLoadState,
} from './simulation.js';

function fakeStorage(initialValue) {
  const store = new Map(initialValue === undefined ? [] : [[STORAGE_KEY, initialValue]]);
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

describe('FriendSim simulation utilities', () => {
  it('classifies relationship scores at acceptance-visible thresholds', () => {
    expect(relationshipLabel(70)).toEqual({ text: '仲良し', className: 'good' });
    expect(relationshipLabel(69)).toEqual({ text: '普通', className: 'normal' });
    expect(relationshipLabel(30)).toEqual({ text: '喧嘩気味', className: 'bad' });
    expect(relationshipLabel(31)).toEqual({ text: '普通', className: 'normal' });
  });

  it('clamps relationship changes to the UI score range', () => {
    expect(clamp(108)).toBe(100);
    expect(clamp(-6)).toBe(0);
    expect(clamp(42)).toBe(42);
  });

  it('loads persisted friends and logs while filtering invalid MBTI entries and limiting logs', () => {
    const persisted = {
      friends: [
        { id: 'valid', name: 'ゆい', mbti: 'ENFP', relationship: 55 },
        { id: 'invalid-mbti', name: '謎', mbti: 'XXXX', relationship: 55 },
        { id: 'no-name', name: '', mbti: 'ISTJ', relationship: 55 },
      ],
      logs: Array.from({ length: 25 }, (_, index) => ({ id: `log-${index}` })),
    };

    const loaded = safeLoadState(fakeStorage(JSON.stringify(persisted)));

    expect(loaded.friends).toEqual([{ id: 'valid', name: 'ゆい', mbti: 'ENFP', relationship: 55 }]);
    expect(loaded.logs).toHaveLength(20);
    expect(loaded.logs[0]).toEqual({ id: 'log-0' });
  });

  it('falls back to default state for missing, malformed, or structurally invalid storage', () => {
    expect(safeLoadState(fakeStorage())).toEqual({ friends: DEFAULT_FRIENDS, logs: [] });
    expect(safeLoadState(fakeStorage('{not json'))).toEqual({ friends: DEFAULT_FRIENDS, logs: [] });
    expect(safeLoadState(fakeStorage(JSON.stringify({ friends: {}, logs: [] })))).toEqual({ friends: DEFAULT_FRIENDS, logs: [] });
  });

  it('generates a positive event that reflects selected situation and matching MBTI axes', () => {
    const friends = [
      { id: 'a', name: 'あおい', mbti: 'ENFJ', relationship: 50 },
      { id: 'b', name: 'みさき', mbti: 'ISFJ', relationship: 50 },
    ];

    const event = generateEvent(friends, 'work', {
      random: () => 0,
      createId: () => 'event-1',
      formatDate: () => '2026/06/22 12:00',
    });

    expect(event).toMatchObject({
      id: 'event-1',
      title: '会社で補完関係',
      delta: 4,
      friendIds: ['a', 'b'],
      createdAt: '2026/06/22 12:00',
    });
    expect(event.message).toContain('会議前に企画の進め方を相談する');
    expect(event.message).toContain('あおいは皆を巻き込んで明るく提案した。');
    expect(event.message).toContain('相手の気持ちを優先して、やわらかい言葉を選ぶ。');
    expect(event.message).toContain('相性判定は「補完関係」');
    expect(event.message).toContain('関係値がプラスに動いた。');
  });

  it('generates a conflict event when decision and planning axes differ', () => {
    const friends = [
      { id: 'a', name: 'れん', mbti: 'INTJ', relationship: 50 },
      { id: 'b', name: 'そら', mbti: 'ESFP', relationship: 50 },
    ];

    const event = generateEvent(friends, 'cafe', {
      random: () => 0,
      createId: () => 'event-2',
      formatDate: () => 'now',
    });

    expect(event.title).toBe('カフェですれ違い注意');
    expect(event.delta).toBe(-5);
    expect(event.message).toContain('休日に近況を話しながら作戦会議する');
    expect(event.message).toContain('れんは少し考えてから落ち着いて意見を出した。');
    expect(event.message).toContain('相性判定は「すれ違い注意」');
    expect(event.message).toContain('関係値がマイナスに動いた。');
  });


  it('calculates detailed MBTI compatibility levels and deltas', () => {
    expect(mbtiCompatibility('ENFP', 'INFJ')).toMatchObject({
      delta: 15,
      level: '最高相性',
    });
    expect(mbtiCompatibility('INTJ', 'ESFP')).toMatchObject({
      delta: -5,
      level: 'すれ違い注意',
    });
    expect(mbtiCompatibility('ISTJ', 'ESTP')).toMatchObject({
      delta: 13,
      level: '最高相性',
    });
    const detailed = mbtiCompatibility('ENFP', 'INFJ');
    expect(detailed.axisBreakdown).toHaveLength(4);
    expect(detailed.reasons.join(' ')).toContain('E/I エネルギー配分');
  });

  it('exposes distinct MBTI axis lines for E/I, T/F, J/P, and S/N behavior', () => {
    expect(axisLine({ name: 'Eさん', mbti: 'ENTJ' })[0]).toContain('皆を巻き込んで');
    expect(axisLine({ name: 'Iさん', mbti: 'INTJ' })[0]).toContain('落ち着いて意見');
    expect(axisLine({ name: 'Tさん', mbti: 'INTJ' })[1]).toContain('筋道と効率');
    expect(axisLine({ name: 'Fさん', mbti: 'INFJ' })[1]).toContain('相手の気持ち');
    expect(axisLine({ name: 'Jさん', mbti: 'ISTJ' })[2]).toContain('段取り');
    expect(axisLine({ name: 'Pさん', mbti: 'ISTP' })[2]).toContain('柔軟な進め方');
    expect(axisLine({ name: 'Nさん', mbti: 'INTJ' })[3]).toContain('未来の案');
    expect(axisLine({ name: 'Sさん', mbti: 'ISTJ' })[3]).toContain('現実的');
  });
});
