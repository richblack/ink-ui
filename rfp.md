# Inkstone 規劃書：AI 調度的前端系統

## 📌 系統定位

Inkstone 是一個允許 AI 調度的前端平台，讓無技術背景用戶僅透過 Docker Compose 即可部署一個可視化系統，支援 AI 模組、客製化工作區、模組化應用畫面組合，並提供雲端與本地兩種執行模式。

目前版本聚焦於：
 • 本地部署版本：不含登入機制（無 auth）
 • AI 調度功能為核心，向量儲存與資料庫交由後端或 n8n 處理
 • 前端僅負責呈現與調度，不儲存資料、不包含 DB 實作

⸻

## 🚀 使用場景

 • 一般用戶：在本機以 Docker Compose 啟動，用瀏覽器即可存取完整前端功能。
 • 進階用戶：將系統部署至雲端（未來版本會提供登入與帳號管理整合）

⸻

## 🧱 UI 結構架構

1. Menu Bar（主選單）
 • 永遠存在
 • 用戶可將常用模組釘選於選單

2. Workspace（工作區）
 • 每次啟動為空白，可透過 GUI 設定或 AI 指令動態產生 Layout

3. Layout
 • 一個畫面只能存在一個 layout
 • 可巢狀配置
 • 可透過 GUI 進行新增、調整

4. Pane
 • Layout 下的區塊單位
 • 支援：
 • 垂直、水平切割
 • 固定比例、可拖拉大小
 • 巢狀 panes 組合

5. View（顯示元件）
 • Pane 中可放置：
 • table_view
 • text_view
 • gallery_view
 • list_view
 • dropdown_view
 • html_view

⸻

## 🧩 模組化邏輯：Module

模組定義：

一個 module = 前端 view API + 後端 webhook API 的組合

 • 支援獨立命名、掛入 Menu
 • 模組內含可重用的 layout + view + 資料來源
 • 不包含前端資料儲存邏輯（由後端 API 處理）

GUI 設定界面：
 • 使用者可透過圖形化操作：
 • 選擇 Layout 模板
 • 拖拉前端元件（View）
 • 選擇後端 API URL 綁定元件
 • 設定內容仍以 YAML 儲存，但 GUI 對使用者隱藏 YAML 細節
 • LLM 直接產出的也是 YAML；GUI 編輯也是 YAML，因此 GUI 與 YAML 同步（GUI = YAML）

檔案儲存設計
 • 所有設定檔皆以 YAML 儲存在檔案系統中
 • 建議結構如下：

```text
inkstone/
├── modules/
│   ├── diary_module.yaml
│   └── task_board.yaml
├── layouts/
│   ├── default_layout.yaml
│   └── dashboard_layout.yaml
├── views/
│   ├── text_editor.yaml
│   └── table_product.yaml
└── settings.yaml  # 全局設定，如 AI key、Copilot 狀態
```

⸻

## 🤖 AI 調度能力

AI 調度邏輯：
 • 系統設定可貼入 LLM API Key
 • LLM 主要負責產出：
 • Layout 結構
 • View 排版與綁定
 • Module 配置提案（前後端對應）

Copilot 模式：
 • 用戶可開關 AI Copilot（小圖示）
 • AI 可：
 • 監聽 text_view 等元件
 • 提出建議、摘要、內容重寫等互動
 • 呼叫對應的後端 API

⸻

📱 裝置相容性
 • 完全響應式設計（Responsive Design）
 • 支援桌機、手機、平板

⸻

## ⚙️ 技術規劃（技術 Stacks）

前端
 • React + Tailwind CSS
 • Zustand（狀態管理）
 • React Router / Dynamic import
 • Responsive Grid Layout / Split.js

後端
 • FastAPI
 • AI 調度邏輯集中於後端或 LLM
 • 向量儲存與資料庫互動由 n8n / 專用後端 API 處理

⸻

## 🔧 程式開發模組建議（MVP 階段）

基本模組：
 • core/layout-manager
 • core/pane-renderer
 • core/view-factory
 • core/module-registry
 • settings/gui-editor
 • ai/copilot-engine
 • io/yaml-loader（負責載入/儲存 YAML 設定）

⸻

## 🔗 API 規劃草案（可擴充）

Layout API

```bash
POST /api/layout
{ "id": "main", "type": "horizontal", "splits": [...] }


View API

```bash
POST /api/view
{ "id": "text1", "type": "text_view", "parent": "pane_1", "bind": "/api/save" }
```

Module API

```bash
POST /api/module
{ "id": "diary_module", "layout": "main", "views": [...] }
```

⸻

✅ 小結

Inkstone 是一套「讓 AI 調度使用者介面」的前端系統，提供 GUI 設定功能讓非技術用戶可視化管理畫面模組與 API 串接，初期聚焦於本地部署與最小實用架構（MVP），所有設定均以 YAML 儲存，並與 GUI 介面同步（GUI = YAML = AI 可產生的結構），未來可擴展至雲端帳號管理與模組商店等功能。
