# HTML モックアップ結果

## 判定
- HTML モックアップ: 必要
- 理由: 1画面内に友達登録、MBTI選択、友達一覧、シチュエーション選択、イベント実行、関係値/ログ表示、空/エラー/無効/読込状態を配置する新規ゲーム画面で、UI/UX 影響が大きいため。

## 抽出した既存デザインシステム
- 既存アプリは `src/main.jsx` の最小表示のみで、確立済みコンポーネント/配色は未定義。
- 今回のモックでは Tailwind 標準クラスで以下を初期方針として定義。
  - 背景: `bg-slate-100`、カード: `bg-white rounded-2xl shadow-sm`
  - Primary: `indigo-600`（登録/選択強調）
  - Success/実行: `emerald-500/600`
  - Warning/空状態: `amber-50/amber-800`
  - Error/喧嘩/入力エラー: `rose-50/rose-600/rose-700`
  - 情報/読込: `sky-50/sky-700`
  - レイアウト: モバイル1カラム、PCは左操作カラム + 右結果カラムの2カラム。

## 作成物
- 軽量モック: `tasks/html-mockup/mockup.html`（`task put` で格納）
- ブラウザ確認エビデンス: `tasks/html-mockup/evidence/friendsim-html-mockup.png`

## 確認した表示・操作
- AC-001: 名前入力、MBTIセレクト、登録ボタンを配置。
- AC-003: 学校/会社のシチュエーション選択とイベント発生ボタンを配置。
- AC-004: MBTI軸（E/F、I/T）に応じた会話例を最新イベントに表示。
- AC-005: 関係値、仲良し/普通/喧嘩気味の状態ラベルを友達カードに表示。
- AC-006: 友達0件、入力不正、友達不足による Disabled、localStorage 復元中 Loading を状態バリエーションとして同梱。
- AC-007: `max-w-6xl` + responsive grid によりスマートフォン幅では縦積み、PCでは2カラムになる想定。

## E2E / 実装への引き継ぎ
### 主要 data-testid
- `friendsim-page`
- `friend-name-input`
- `mbti-select`
- `add-friend-button`
- `situation-options`
- `situation-school`
- `situation-work`
- `run-event-button`
- `friend-list`
- `event-result`
- `relationship-delta`
- `event-log-list`
- `empty-guidance`
- `name-error`
- `run-event-disabled-button`
- `loading-message`

## 未解決点
- 実装時に 16 MBTI 全タイプを select に展開する。
- 実イベント文言は簡易ルールで開始し、後続改善でタイプ別パターンを増やせる構造にする。
