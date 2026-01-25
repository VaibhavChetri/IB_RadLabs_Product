#!/bin/bash

# Test Log Outreach API with curl
# Extract token from browser or use current token

# Update this token with your current token from browser
TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUyMywiaWF0IjoxNzY5MzE5MzM5LCJleHAiOjE3Njk0MDU3MzksInR5cGUiOiJhY2Nlc3MifQ.7cRuJzHeSLpUAlcbUdnyDc37Ob5oGz_svccGz5_THWg"
API_URL="http://localhost:3099/v1/api/leads/log-outreach"

echo "=========================================="
echo "Testing Log Outreach API"
echo "=========================================="
echo "URL: $API_URL"
echo "Token: ${TOKEN:0:50}..."
echo ""
echo ""

# Test 1: Exact request as browser
echo "=== Test 1: Exact Browser Request ==="
echo "Request:"
echo "  POST $API_URL"
echo "  Headers: Authorization: $TOKEN"
echo "  Body: {\"contact_id\": \"f5fd6572-93a0-5ef9-9423-6e4bd3b8e206\", \"outreach_type\": \"phone\", \"status_id\": 1}"
echo ""
echo "Response:"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -d '{
    "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
    "outreach_type": "phone",
    "status_id": 1
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=========================================="
echo ""

# Test 2: Check if token is valid by testing another endpoint
echo "=== Test 2: Verify Token with Tracking Endpoint ==="
echo "Testing: GET /api/leads/tracking (should work if token is valid)"
echo ""
curl -X GET "http://localhost:3099/v1/api/leads/tracking?page=1&per_page=25" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=========================================="
echo ""

# Test 3: Try with snake_case (backend might expect this)
echo "=== Test 3: Try with snake_case field names ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -d '{
    "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
    "outreach_type": "phone",
    "status_id": 1
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "=========================================="
echo ""

# Test 4: Check endpoint exists
echo "=== Test 4: Check if endpoint exists (HEAD request) ==="
curl -X HEAD "$API_URL" \
  -H "Authorization: $TOKEN" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s -o /dev/null

echo ""
echo "=========================================="
echo ""

# Test 5: Test token refresh endpoint (correct URL)
echo "=== Test 5: Test Token Refresh Endpoint ==="
echo "Testing: POST /api/oauth/refresh (correct endpoint)"
echo "Note: You need to provide refresh_token in body"
echo ""
echo "This test requires refresh_token - skipping for now"
echo ""

# Test 6: Decode token to check expiration
echo "=== Test 6: Token Information ==="
echo "Token payload (decoded):"
TOKEN_PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null)
if [ ! -z "$TOKEN_PAYLOAD" ]; then
    echo "$TOKEN_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_PAYLOAD"
    echo ""
    echo "Checking expiration:"
    EXP_TIME=$(echo "$TOKEN_PAYLOAD" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('exp', 0))" 2>/dev/null)
    if [ ! -z "$EXP_TIME" ] && [ "$EXP_TIME" != "0" ]; then
        CURRENT_TIME=$(date +%s)
        if [ "$CURRENT_TIME" -ge "$EXP_TIME" ]; then
            echo "❌ TOKEN IS EXPIRED (exp: $EXP_TIME, now: $CURRENT_TIME)"
        else
            echo "✅ Token is valid (expires in $((EXP_TIME - CURRENT_TIME)) seconds)"
        fi
    fi
else
    echo "Could not decode token"
fi
echo ""
