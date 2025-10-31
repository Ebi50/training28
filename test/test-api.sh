#!/bin/bash
# API Test Script for Fitness Forecast
# Usage: ./test-api.sh <USER_ID>

if [ -z "$1" ]; then
  echo "❌ Error: USER_ID required"
  echo "Usage: ./test-api.sh <USER_ID>"
  exit 1
fi

USER_ID=$1
BASE_URL="http://localhost:3001"

echo "🧪 Testing Fitness Forecast API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "User ID: $USER_ID"
echo "Base URL: $BASE_URL"
echo ""

echo "📡 Calling API: GET /api/fitness/forecast?userId=$USER_ID"
echo ""

# Make request
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/fitness/forecast?userId=$USER_ID")

# Extract status code (last line)
status_code=$(echo "$response" | tail -n1)

# Extract body (everything except last line)
body=$(echo "$response" | sed '$d')

echo "Status: $status_code"
echo ""

if [ "$status_code" = "200" ]; then
  echo "✅ SUCCESS"
  echo ""
  echo "Response:"
  echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
  
  # Extract key metrics
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Summary:"
  
  ctl=$(echo "$body" | grep -o '"ctl":[0-9.]*' | head -1 | cut -d: -f2)
  atl=$(echo "$body" | grep -o '"atl":[0-9.]*' | head -1 | cut -d: -f2)
  tsb=$(echo "$body" | grep -o '"tsb":[^,}]*' | head -1 | cut -d: -f2)
  
  if [ ! -z "$ctl" ]; then
    echo "  Current CTL: $ctl"
    echo "  Current ATL: $atl"
    echo "  Current TSB: $tsb"
  fi
  
  past=$(echo "$body" | grep -o '"pastActivities":[0-9]*' | cut -d: -f2)
  planned=$(echo "$body" | grep -o '"plannedSessions":[0-9]*' | cut -d: -f2)
  days=$(echo "$body" | grep -o '"forecastDays":[0-9]*' | cut -d: -f2)
  
  if [ ! -z "$past" ]; then
    echo ""
    echo "  Past Activities: $past"
    echo "  Planned Sessions: $planned"
    echo "  Forecast Days: $days"
  fi
  
else
  echo "❌ FAILED"
  echo ""
  echo "Response:"
  echo "$body"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
