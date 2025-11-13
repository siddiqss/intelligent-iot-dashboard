# Data Flow & Refresh Mechanism

This document explains how the application handles data fetching, auto-refresh, and manual refresh.

## Overview

The application uses a **two-layer caching strategy**:
1. **Backend Cache (Redis/DragonflyDB)**: Server-side caching with TTL
2. **Frontend Cache-Busting**: Query parameters to force fresh data

---

## Initial Page Load

When the user first visits the dashboard:

```typescript
useEffect(() => {
  fetchData();           // Fetch current data + history
  fetchPredictions();    // Fetch predictions
  fetchAlerts();         // Fetch alerts
  
  // Set up auto-refresh interval
  const interval = setInterval(() => {
    fetchData();
    fetchPredictions();
    fetchAlerts();
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**What happens:**
1. `fetchData()` is called **without** `forceRefresh` (default: `false`)
2. No cache-busting parameter is added
3. Backend cache is checked first (if Redis is available)
4. If cache hit: Returns cached data immediately (fast response)
5. If cache miss: Generates new data, caches it, returns it

---

## Auto-Refresh (Every 30 seconds)

### Flow Diagram

```
Frontend (Every 30s)          Backend Cache Layer          Data Generator
     |                                |                            |
     |-- GET /api/data/iot ---------->|                            |
     |                                |-- Check Redis Cache         |
     |                                |                            |
     |                                |-- Cache HIT?               |
     |                                |   YES: Return cached data   |
     |<-- Response (cached) ----------|                            |
     |                                |                            |
     |                                |   NO: Generate new data     |
     |                                |-- Generate Current Data --->|
     |                                |<-- New Data ----------------|
     |                                |-- Store in Cache (30s TTL) |
     |<-- Response (fresh) -----------|                            |
```

### Code Flow

```typescript
// Auto-refresh calls fetchData() without forceRefresh
const interval = setInterval(() => {
  fetchData();  // forceRefresh = false (default)
}, 30000);
```

**What happens:**
1. `fetchData(false)` is called (or `fetchData()` with no parameter)
2. **No cache-busting parameter** is added to the URL
3. Request goes to: `/api/data/iot` (no query params)
4. Backend cache middleware checks Redis:
   - **Cache HIT**: Returns cached data immediately (within 30s TTL)
   - **Cache MISS**: Generates new data, caches it, returns it
5. Response includes `X-Cache: HIT` or `X-Cache: MISS` header

### Backend Cache Behavior

**Current Data Endpoint** (`/api/data/iot`):
- **TTL**: 30 seconds
- **Cache Key**: `cache:/api/data/iot`
- **Behavior**: 
  - First request: Cache MISS → Generate data → Cache for 30s
  - Requests within 30s: Cache HIT → Return cached data
  - After 30s: Cache expires → Generate new data

**History Data Endpoint** (`/api/data/history`):
- **TTL**: 5 minutes (300 seconds)
- **Cache Key**: `cache:/api/data/history?hours=24`
- **Behavior**: 
  - Less frequently updated (historical data changes slowly)
  - Cached for 5 minutes to reduce computation

---

## Manual Refresh (User Clicks Button)

### Flow Diagram

```
User Clicks Button          Frontend              Backend Cache Layer
     |                          |                         |
     |-- onClick() ----------->|                         |
     |                          |-- Add cache-buster -----|
     |                          |   ?t=1234567890         |
     |                          |                         |
     |                          |-- GET /api/data/iot?t=1234567890 -->|
     |                          |                         |-- Different cache key!
     |                          |                         |-- Always cache MISS
     |                          |                         |-- Generate new data
     |                          |                         |-- Cache with new key
     |<-- Fresh Data -----------|<-- Fresh Data ----------|
```

### Code Flow

```typescript
// Manual refresh button
<Button
  onClick={() => fetchData(true)}  // forceRefresh = true
  loading={loading}
>
  Refresh Data
</Button>

// fetchData function
const fetchData = async (forceRefresh: boolean = false) => {
  setLoading(true);
  // Add cache-busting query parameter for manual refresh
  const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
  const [data, history] = await Promise.all([
    apiClient.getCurrentData(cacheBuster),  // ?t=1234567890
    apiClient.getHistoryData(24, cacheBuster),
  ]);
  // ...
};
```

**What happens:**
1. User clicks "Refresh Data" button
2. `fetchData(true)` is called with `forceRefresh = true`
3. **Cache-busting parameter** is added: `?t=${Date.now()}`
4. Request goes to: `/api/data/iot?t=1704123456789` (unique timestamp)
5. Backend cache middleware:
   - **Cache Key**: `cache:/api/data/iot?t=1704123456789` (different key!)
   - **Always Cache MISS** (new unique key every time)
   - Generates fresh data immediately
   - Caches it with the new key (but won't be used again due to unique timestamp)
6. User gets **fresh data immediately**, bypassing cache

### Why This Works

The cache key includes the **full URL path including query parameters**:
```typescript
const cacheKey = `cache:${req.originalUrl}`;
// cache:/api/data/iot?t=1704123456789 (unique each time)
```

So each manual refresh creates a **unique cache key**, ensuring:
- ✅ Always gets fresh data
- ✅ Doesn't interfere with auto-refresh cache
- ✅ Backend still generates new data (no stale cache)

---

## Comparison: Auto-Refresh vs Manual Refresh

| Aspect | Auto-Refresh | Manual Refresh |
|--------|-------------|----------------|
| **Trigger** | Automatic (every 30s) | User clicks button |
| **Cache-Busting** | ❌ No (`forceRefresh = false`) | ✅ Yes (`forceRefresh = true`) |
| **URL** | `/api/data/iot` | `/api/data/iot?t=1234567890` |
| **Cache Key** | `cache:/api/data/iot` | `cache:/api/data/iot?t=1234567890` |
| **Cache Behavior** | Respects 30s TTL | Always bypasses cache |
| **Response Time** | Fast (if cached) | Slower (always generates) |
| **Data Freshness** | May be up to 30s old | Always fresh |
| **Backend Load** | Lower (uses cache) | Higher (always generates) |

---

## Complete Request Flow

### Auto-Refresh Request

```
1. Frontend: fetchData() called (no params)
2. Frontend: apiClient.getCurrentData('') → GET /api/data/iot
3. Backend: cacheMiddleware checks cache key: cache:/api/data/iot
4. Backend: Redis lookup
   ├─ HIT: Return cached data (X-Cache: HIT)
   └─ MISS: 
       ├─ Generate new data
       ├─ Store in cache (30s TTL)
       └─ Return data (X-Cache: MISS)
5. Frontend: Update state with data
6. Frontend: UI re-renders with new data
```

### Manual Refresh Request

```
1. User: Clicks "Refresh Data" button
2. Frontend: fetchData(true) called
3. Frontend: cacheBuster = `?t=${Date.now()}`
4. Frontend: apiClient.getCurrentData('?t=1704123456789')
5. Backend: GET /api/data/iot?t=1704123456789
6. Backend: cacheMiddleware checks cache key: cache:/api/data/iot?t=1704123456789
7. Backend: Always MISS (unique key)
8. Backend: Generate fresh data immediately
9. Backend: Cache it (won't be reused due to unique timestamp)
10. Backend: Return data (X-Cache: MISS)
11. Frontend: Update state with fresh data
12. Frontend: UI re-renders immediately
```

---

## Parallel Data Fetching

The application fetches multiple data sources in parallel:

```typescript
// Initial load and auto-refresh
useEffect(() => {
  // All three run in parallel
  fetchData();           // Current + History data
  fetchPredictions();    // Predictions
  fetchAlerts();         // Alerts
  
  // Auto-refresh all three every 30s
  const interval = setInterval(() => {
    fetchData();
    fetchPredictions();
    fetchAlerts();
  }, 30000);
}, []);
```

**Note**: Only `fetchData()` supports manual refresh with cache-busting. Predictions and alerts always use their normal cache behavior.

---

## Cache Headers

The backend includes cache status in response headers:

```http
X-Cache: HIT    # Data served from cache
X-Cache: MISS   # Data was generated fresh
```

You can check these headers in browser DevTools → Network tab to see cache behavior.

---

## Benefits of This Design

1. **Performance**: Auto-refresh uses cache for fast responses
2. **Freshness**: Manual refresh always gets latest data
3. **User Control**: Users can force refresh when needed
4. **Efficiency**: Reduces backend load with smart caching
5. **Flexibility**: Works with or without Redis (graceful degradation)

---

## Edge Cases

### Redis Unavailable
- Cache middleware detects Redis is down
- All requests bypass cache (continue normally)
- System works without caching (graceful degradation)

### Cache Expiration During Auto-Refresh
- If cache expires between auto-refreshes, next request generates fresh data
- Cache is automatically repopulated
- No user-visible impact

### Multiple Manual Refreshes
- Each refresh gets unique timestamp
- Each generates fresh data
- Previous cache entries remain but aren't reused
- Cache cleanup happens via TTL expiration

---

## Summary

- **Auto-Refresh**: Respects backend cache (30s TTL) for performance
- **Manual Refresh**: Bypasses cache with unique query parameter for freshness
- **Backend Cache**: Redis/DragonflyDB with configurable TTL per endpoint
- **Graceful Degradation**: Works without Redis, just without caching benefits

This design balances **performance** (caching) with **freshness** (manual refresh) while giving users control over when they want the latest data.

