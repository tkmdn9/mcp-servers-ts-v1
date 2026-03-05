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

#### 設定項目

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
  - `server.ts`: FastMCP サーバー（stdio トランスポート）
  - `hono-server.ts`: Hono サーバー（Streamable HTTP トランスポート）
  - `llm.ts`: Mastra エージェントとツールの定義
- `src/api/`: 各外部サービス（Redmine, ServiceNow）のクライアント実装
- `scripts/`: ユーティリティスクリプト

## 🔌 MCP サーバーの起動モード

このプロジェクトは 2 種類のトランスポートで MCP サーバーを提供します。

### STDIO モード vs Streamable HTTP モードの違い

| 比較項目 | STDIO (FastMCP) | Streamable HTTP (Hono) |
| --- | --- | --- |
| 通信方式 | プロセスの stdin/stdout | HTTP (port 3000) |
| 接続範囲 | ローカルのみ | ネットワーク越しも可 |
| サーバー起動 | クライアントが自動起動 | 事前に手動起動が必要 |
| 主な用途 | Claude Desktop / Claude Code | リモートクライアント、Web |

**STDIO の仕組み:**

- Claude Desktop などのクライアントが `config.json` の `command` に書かれたコマンドをサブプロセスとして自動起動する
- プロセスが stdin/stdout で JSON-RPC メッセージをやり取りする
- サーバーを事前起動する必要はない（クライアントが都度起動する）

**Streamable HTTP の仕組み:**

- `npm run mcp:http` でサーバーを先に起動しておく必要がある
- クライアントは `http://localhost:3000/mcp` に HTTP POST でリクエストを送る
- 複数クライアントが同一サーバーに同時接続できる

### STDIO モードの起動

```bash
npm run mcp
```

Claude Desktop / Claude Code の設定（`claude_desktop_config.json`）:

```json
{
  "mcpServers": {
    "enterprise-mcp": {
      "command": "node",
      "args": ["--env-file=.env", "--import=tsx/esm", "src/mcp/server.ts"],
      "cwd": "/path/to/this/project"
    }
  }
}
```

### Streamable HTTP モードの起動

```bash
npm run mcp:http
```

Claude Desktop / Claude Code の設定（事前に `npm run mcp:http` で起動済みが前提）:

```json
{
  "mcpServers": {
    "enterprise-mcp-http": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## 🔍 MCP Inspector での動作確認

### STDIO モード

Inspector が stdio サーバーを自動起動します。事前起動は不要です。

```bash
npm run inspect
```

ブラウザが開いたら **Transport Type: STDIO** のまま **Connect** をクリックします。

### Streamable HTTP モード

**2 ステップ必要です。** Inspector はサーバーを自動起動しないため、事前起動が必要です。

```bash
# ① 別ターミナルで Hono サーバーを起動（起動したままにする）
npm run mcp:http

# ② Inspector を起動
npm run inspect:http
```

ブラウザが開いたら以下を設定して **Connect** をクリックします。

1. Transport Type を **`Streamable HTTP`** に変更
2. URL に `http://localhost:3000/mcp` を入力

## ⚠️ Git に関する注意

機密情報（API キーなど）を含む `.env` ファイルは Git 追跡対象から除外されています。
新しい環境変数を追加した場合は、必ず `.env.example` にもダミー値を追記してください。
