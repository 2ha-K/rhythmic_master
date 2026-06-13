# Rhythmic Master

Rhythmic Master 是一個用 agent 協作做出的音樂節奏考試工具。

這個專案的目的不是一次把所有功能想完，而是示範如何把「學員需要的音樂考試」拆成小問題，先做出可以測試的版本，再一層一層疊代更新。

## 專案目的

這個工具用來幫助學員練習節奏聽辨。

目前版本的流程是：

1. 使用者選擇拍號：`4/4`、`3/4`、`6/8`。
2. 按下產生題目。
3. 系統產生兩小節節奏。
4. 使用者可以播放節奏，播放前會先有標準節拍器預備拍。
5. 使用者從音符籃拖曳音符到五線譜上的 La 位置。
6. 每次拖曳後，系統會驗證是否和答案相同。
7. 可以按答案鍵顯示正確答案。

## 用 Agent 開發的步驟

這個專案前面的開發流程大致是：

1. 先手寫並整理初始需求
   - 想清楚學員要練什麼。
   - 先列出前端需要哪些功能。
   - 先列出後端需要哪些服務。
   - 建立 `agent.md`，讓之後的 agent 可以知道專案方向。

2. 和 AI 討論技術與實作細節
   - 前端採用 Web。
   - 五線譜使用 VexFlow。
   - 拖曳使用 dnd-kit。
   - 後端使用 Node.js + TypeScript + Fastify。
   - 不使用資料庫，題目先存在記憶體。

3. 建立第一版本
   - 做出可以選拍號、產生題目、播放、拖曳、驗證的 MVP。
   - 先讓主要流程跑得起來，而不是一開始就追求完整。

4. 慢慢疊代更新
   - 播放前加入標準拍。
   - 修正重複播放會疊音的問題。
   - 音符籃從文字改成音符圖示。
   - 五線譜上只顯示真正的黑色音符。
   - 加入附點音符。
   - 用正統樂理處理 beat grouping、符槓與 tie。
   - 加入答案鍵。

## 核心觀念

使用 agent 開發時，最重要的是先了解自己的需求。

不要一次丟一個很大的模糊任務，而是把問題拆成小的：

- 先確認使用者流程。
- 再確認資料長什麼樣子。
- 再確認前端要怎麼操作。
- 再確認後端要提供哪些 API。
- 每次只修正一個明確問題。

這樣做的好處是：

- 比較容易和 AI 討論。
- 比較容易測試。
- 比較容易回頭修改。
- 不會一次改太多導致不知道哪裡壞掉。

## 目前功能

- 拍號選擇：`4/4`、`3/4`、`6/8`
- 隨機產生兩小節節奏
- 支援二分、四分、八分、十六分與附點音符
- 播放固定 La：`A4 / 440Hz`
- 播放前會有標準節拍器預備拍
- 五線譜顯示固定 La 位置
- 拖曳音符到五線譜
- 拖出五線譜刪除
- 左右拖曳交換順序
- 即時驗證答案
- 顯示正確答案
- 正統記譜顯示：
  - 同拍內八分與十六分用符槓連接
  - 跨 beat group 的音符會拆開並用 tie 連接
  - `6/8` 使用 `3+3` 分組

## 技術架構

前端：

- React
- Vite
- TypeScript
- VexFlow
- dnd-kit
- Web Audio API

後端：

- Node.js
- TypeScript
- Fastify

資料儲存：

- 目前不使用資料庫
- 題目暫存在後端記憶體中

## 專案結構

```text
rhythmic_master/
  agent.md
  README.md
  package.json
  client/
    src/
      App.tsx
      StaffNotation.tsx
      api.ts
      music.ts
      styles.css
      types.ts
  server/
    src/
      index.ts
      rhythm.ts
      rhythm.test.ts
      types.ts
```

## 啟動方式

先安裝套件：

```powershell
npm install
```

啟動前後端開發伺服器：

```powershell
npm run dev
```

打開前端：

```text
http://127.0.0.1:5173
```

後端 API 會跑在：

```text
http://127.0.0.1:3001
```

確認後端是否啟動：

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

## 測試與建置

執行測試：

```powershell
npm test
```

建置專案：

```powershell
npm run build
```

## 給之後 Agent 的提醒

開發前先讀：

1. `README.md`
2. `agent.md`

修改時請保持小步疊代。

如果要改節奏規則，優先檢查：

- `server/src/rhythm.ts`
- `client/src/music.ts`
- `client/src/StaffNotation.tsx`

如果要改介面或拖曳互動，優先檢查：

- `client/src/App.tsx`
- `client/src/styles.css`
