#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${PORT:-3847}"
echo "向宇宙下单 → http://localhost:${PORT}"
python3 -m http.server "$PORT"
