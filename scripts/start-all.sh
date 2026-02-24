#!/bin/bash
# Start script for Enterprise MCP Bridge

echo "🚀 Starting Enterprise MCP Bridge..."

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
fi

# Run the application (Vite + Electron)
# This will also trigger electron/main.ts which spawns the FastMCP server.
npm run dev
