# Enterprise MCP Bridge

Enterprise MCP Bridge は、Redmine および ServiceNow と連携し、LLM（OpenAI）を通じてタスクやインシデントを管理するためのデスクトップアプリケーションおよび MCP サーバーのハイブリッドプロジェクトです。

Mastra フレームワークを使用してエージェントを構成し、FastMCP を利用して MCP サーバー機能を提供します。

## 🚀 セットアップ手順

### 1. 依存関係のインストール

プロジェクトルートで以下のコマンドを実行します。

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、必要な情報を設定してください。`.env.example` を参考にしてください。

```bash
cp .env.example .env
```

#### 設定項目:
- `OPENAI_API_KEY`: OpenAI の API キー
- `REDMINE_URL`: Redmine のベース URL
- `REDMINE_API_KEY`: Redmine の API キー
- `SNOW_INSTANCE`: ServiceNow インスタンス名
- `SNOW_USER`: ServiceNow ユーザー名
- `SNOW_PASS`: ServiceNow パスワード

### 3. アプリケーションの起動

以下のスクリプトを実行することで、フロントエンド（Vite）とデスクトップ（Electron）が起動します。
また、アプリ起動時にバックグラウンドで MCP サーバーも自動的に立ち上がります。

```bash
./scripts/start-all.sh
```

## 🛠 プロジェクト構成

- `src/mcp/`: MCP サーバーおよび LLM エージェントの実装
  - `llm.ts`: Mastra エージェントとツールの定義
  - `server.ts`: FastMCP サーバーの起動
- `src/api/`: 各外部サービス（Redmine, ServiceNow）のクライアント実装
- `scripts/`: ユーティリティスクリプト

## ⚠️ Git に関する注意

機密情報（API キーなど）を含む `.env` ファイルは Git 追跡対象から除外されています。
新しい環境変数を追加した場合は、必ず `.env.example` にもダミー値を追記してください。
