#!/bin/bash
# ============================================================
# Infinity Heroes V5 — Diagnostic Script
# Run this in your Replit Shell: bash diagnose.sh
# ============================================================

echo "============================================"
echo "  INFINITY HEROES V5 — SYSTEM DIAGNOSTIC"
echo "  $(date)"
echo "============================================"
echo ""

# 1. Server health
echo "--- [1/7] SERVER HEALTH ---"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
  echo "✅ Express server is running (port 5000)"
  curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "(raw response)"
else
  echo "❌ Express server NOT responding (HTTP $HEALTH)"
  echo "   → Check Replit console for startup errors"
  echo "   → Try: npm run server:dev"
fi
echo ""

# 2. AI Provider status
echo "--- [2/7] AI PROVIDER STATUS ---"
PROVIDERS=$(curl -s http://localhost:5000/api/ai-providers 2>/dev/null)
if [ -n "$PROVIDERS" ]; then
  echo "$PROVIDERS" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    providers = data.get('providers', [])
    available = [p for p in providers if p.get('available')]
    unavailable = [p for p in providers if not p.get('available')]
    print(f'  {len(available)}/{len(providers)} providers active:')
    for p in available:
        caps = []
        if p.get('capabilities', {}).get('text'): caps.append('text')
        if p.get('capabilities', {}).get('image'): caps.append('image')
        if p.get('capabilities', {}).get('streaming'): caps.append('stream')
        print(f'    ✅ {p[\"displayName\"]} [{\"|\".join(caps)}]')
    for p in unavailable:
        print(f'    ❌ {p[\"displayName\"]} (not configured)')
    if len(available) == 0:
        print('')
        print('  🚨 CRITICAL: No AI providers available!')
        print('  → Stories, images, and suggestions will ALL fail')
        print('  → Check Replit AI Integrations panel (Settings → AI)')
except Exception as e:
    print(f'  Parse error: {e}')
" 2>/dev/null
else
  echo "❌ Could not reach /api/ai-providers"
fi
echo ""

# 3. Environment variables
echo "--- [3/7] ENVIRONMENT VARIABLES ---"
check_env() {
  if [ -n "${!1}" ]; then
    echo "  ✅ $1 = set (${#1} chars)"
  else
    echo "  ❌ $1 = NOT SET"
  fi
}

echo "  AI Providers:"
check_env "AI_INTEGRATIONS_GEMINI_API_KEY"
check_env "AI_INTEGRATIONS_GEMINI_BASE_URL"
check_env "AI_INTEGRATIONS_ANTHROPIC_API_KEY"
check_env "AI_INTEGRATIONS_ANTHROPIC_BASE_URL"
check_env "AI_INTEGRATIONS_OPENAI_API_KEY"
check_env "AI_INTEGRATIONS_OPENAI_BASE_URL"
check_env "AI_INTEGRATIONS_OPENROUTER_API_KEY"
check_env "AI_INTEGRATIONS_OPENROUTER_BASE_URL"
echo ""
echo "  Direct Keys:"
check_env "OPENAI_API_KEY"
check_env "ELEVENLABS_API_KEY"
echo ""
echo "  Infrastructure:"
check_env "DATABASE_URL"
check_env "REPLIT_CONNECTORS_HOSTNAME"
check_env "REPLIT_DEV_DOMAIN"
check_env "REPLIT_DOMAINS"
check_env "EXPO_PUBLIC_DOMAIN"
echo ""

# 4. TTS / ElevenLabs
echo "--- [4/7] TTS (ElevenLabs) ---"
VOICES=$(curl -s http://localhost:5000/api/voices 2>/dev/null)
if [ -n "$VOICES" ]; then
  VOICE_COUNT=$(echo "$VOICES" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('voices',[])))" 2>/dev/null)
  echo "  ✅ Voice endpoint responding ($VOICE_COUNT voices registered)"
  
  # Try a TTS preview to see if ElevenLabs actually works
  TTS_TEST=$(curl -s -X POST http://localhost:5000/api/tts-preview \
    -H "Content-Type: application/json" \
    -d '{"voice":"moonbeam"}' 2>/dev/null)
  TTS_ERROR=$(echo "$TTS_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
  TTS_URL=$(echo "$TTS_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('audioUrl',''))" 2>/dev/null)
  
  if [ -n "$TTS_URL" ] && [ "$TTS_URL" != "" ]; then
    echo "  ✅ ElevenLabs TTS working (preview generated)"
  elif [ -n "$TTS_ERROR" ] && [ "$TTS_ERROR" != "" ]; then
    echo "  ❌ ElevenLabs TTS FAILED: $TTS_ERROR"
    echo "  → Check Replit Connectors panel for ElevenLabs connection"
  else
    echo "  ⚠️  ElevenLabs TTS status unclear (response: $TTS_TEST)"
  fi
else
  echo "  ❌ Voice endpoint not responding"
fi
echo ""

# 5. Story generation test
echo "--- [5/7] STORY GENERATION TEST ---"
echo "  (Sending minimal story request...)"
STORY_TEST=$(curl -s -X POST http://localhost:5000/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{
    "heroName": "Nova",
    "heroTitle": "Guardian of Light",
    "heroPower": "Starlight Shield",
    "heroDescription": "Protects sleeping children",
    "duration": "short",
    "mode": "classic"
  }' \
  --max-time 30 2>/dev/null)

STORY_ERROR=$(echo "$STORY_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
STORY_TITLE=$(echo "$STORY_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('title',''))" 2>/dev/null)
STORY_PARTS=$(echo "$STORY_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('parts',[])))" 2>/dev/null)

if [ -n "$STORY_TITLE" ] && [ "$STORY_TITLE" != "" ]; then
  echo "  ✅ Story generated: \"$STORY_TITLE\" ($STORY_PARTS parts)"
elif [ -n "$STORY_ERROR" ] && [ "$STORY_ERROR" != "" ]; then
  echo "  ❌ Story generation FAILED: $STORY_ERROR"
else
  echo "  ❌ Story generation returned unexpected response"
  echo "  Raw (first 200 chars): $(echo "$STORY_TEST" | head -c 200)"
fi
echo ""

# 6. Image generation test
echo "--- [6/7] IMAGE GENERATION TEST ---"
echo "  (Sending avatar request...)"
IMAGE_TEST=$(curl -s -X POST http://localhost:5000/api/generate-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "heroName": "Nova",
    "heroTitle": "Guardian of Light",
    "heroPower": "Starlight Shield",
    "heroDescription": "Protects sleeping children with starlight"
  }' \
  --max-time 30 2>/dev/null)

IMAGE_ERROR=$(echo "$IMAGE_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
IMAGE_DATA=$(echo "$IMAGE_TEST" | python3 -c "import json,sys; d=json.load(sys.stdin); img=d.get('image',''); print('yes' if img.startswith('data:') else 'no')" 2>/dev/null)

if [ "$IMAGE_DATA" = "yes" ]; then
  echo "  ✅ Avatar image generated successfully"
elif [ -n "$IMAGE_ERROR" ] && [ "$IMAGE_ERROR" != "" ]; then
  echo "  ❌ Avatar generation FAILED: $IMAGE_ERROR"
else
  echo "  ❌ Avatar generation returned unexpected response"
  echo "  Raw (first 200 chars): $(echo "$IMAGE_TEST" | head -c 200)"
fi
echo ""

# 7. Music files
echo "--- [7/7] MUSIC FILES ---"
for MODE in classic madlibs sleep; do
  MUSIC_INFO=$(curl -s http://localhost:5000/api/music-info/$MODE 2>/dev/null)
  TRACK_COUNT=$(echo "$MUSIC_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('trackCount',0))" 2>/dev/null)
  if [ "$TRACK_COUNT" -gt 0 ] 2>/dev/null; then
    echo "  ✅ $MODE: $TRACK_COUNT tracks"
  else
    echo "  ⚠️  $MODE: no tracks found"
  fi
done
echo ""

# Summary
echo "============================================"
echo "  DIAGNOSTIC COMPLETE"
echo "============================================"
echo ""
echo "If providers show ❌, check:"
echo "  1. Replit → Settings → AI Integrations"
echo "  2. Reconnect Gemini, Anthropic, OpenAI"
echo "  3. Replit → Settings → Connectors → ElevenLabs"
echo ""
echo "If server is ❌, check:"
echo "  1. Run: npm run server:dev"  
echo "  2. Look for port conflicts or missing deps"
echo ""
echo "Copy this output and share it for targeted fixes."
