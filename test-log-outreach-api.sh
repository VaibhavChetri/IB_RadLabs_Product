#!/bin/bash

# Test Log Outreach API with curl
# Replace TOKEN with your actual bearer token

TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUyMywiaWF0IjoxNzY5MzE5MzM5LCJleHAiOjE3Njk0MDU3MzksInR5cGUiOiJhY2Nlc3MifQ.7cRuJzHeSLpUAlcbUdnyDc37Ob5oGz_svccGz5_THWg"
API_URL="http://localhost:3099/v1/api/leads/log-outreach"

echo "=== Testing Log Outreach API ==="
echo "URL: $API_URL"
echo "Method: POST"
echo ""

# Test 1: Basic request with token
echo "Test 1: Basic request with contact_id, outreach_type, status_id"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -d '{
    "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
    "outreach_type": "phone",
    "status_id": 1
  }' \
  -v

echo ""
echo ""
echo "=== Test 2: With notes ==="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -d '{
    "contact_id": "f5fd6572-93a0-5ef9-9423-6e4bd3b8e206",
    "outreach_type": "phone",
    "status_id": 1,
    "notes": "Test notes"
  }' \
  -v

echo ""
echo ""
echo "=== Test 3: Check if endpoint exists (OPTIONS) ==="
curl -X OPTIONS "$API_URL" \
  -H "Authorization: $TOKEN" \
  -v

echo ""
echo ""
echo "=== Test 4: Compare with working endpoint (tracking) ==="
curl -X GET "http://localhost:3099/v1/api/leads/tracking?page=1&per_page=25" \
  -H "Authorization: $TOKEN" \
  -H "Accept: application/json" \
  -v
