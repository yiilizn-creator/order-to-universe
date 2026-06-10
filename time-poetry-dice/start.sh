#!/usr/bin/env bash
cd "$(dirname "$0")"
PORT="${PORT:-3850}"
echo "时间的诗 → http://localhost:${PORT}"
python3 -m http.server "$PORT"
