#!/usr/bin/env python3
"""
AURA Load Test - Simulates 50 concurrent users
Uses the 13 seeded accounts (multiple sessions per account) to test
real concurrent load on the server.
"""
import requests
import concurrent.futures
import time
import random
from collections import defaultdict

BASE_URL = "http://localhost:3000"

# Test accounts (13 seeded users)
TEST_USERS = [
    {"email": "nick@aura.app", "password": "password123", "name": "Nick Joseph"},
    {"email": "jessica@aura.app", "password": "password123", "name": "Jessica Art"},
    {"email": "david@aura.app", "password": "password123", "name": "David Chen"},
    {"email": "sarah@aura.app", "password": "password123", "name": "Sarah Kim"},
    {"email": "marcus@aura.app", "password": "password123", "name": "Marcus Rivera"},
    {"email": "elena@aura.app", "password": "password123", "name": "Elena Rodriguez"},
    {"email": "techdaily@aura.app", "password": "password123", "name": "Tech Daily"},
    {"email": "wellness@aura.app", "password": "password123", "name": "Wellness Guru"},
    {"email": "cyberdrift@aura.app", "password": "password123", "name": "Cyber Drifter"},
    {"email": "musiccentral@aura.app", "password": "password123", "name": "Music Central"},
    {"email": "lunasky@aura.app", "password": "password123", "name": "Luna Sky"},
    {"email": "kaistorm@aura.app", "password": "password123", "name": "Kai Storm"},
    {"email": "novablaze@aura.app", "password": "password123", "name": "Nova Blaze"},
]

# 50 virtual users = 13 accounts * ~4 sessions each
VIRTUAL_USERS = []
for i in range(50):
    account = TEST_USERS[i % len(TEST_USERS)]
    VIRTUAL_USERS.append({
        "id": i,
        "email": account["email"],
        "password": account["password"],
        "name": f"{account['name']} (session {i // len(TEST_USERS) + 1})",
    })


class LoadTestResult:
    def __init__(self):
        self.results = defaultdict(list)
        self.errors = defaultdict(int)
        self.start_time = None
        self.end_time = None

    def add(self, action, duration_ms, success=True, error=None):
        self.results[action].append({
            "duration_ms": duration_ms,
            "success": success,
            "error": error,
        })
        if not success and error:
            self.errors[str(error)[:100]] += 1

    def summary(self):
        print("\n" + "=" * 70)
        print("  AURA LOAD TEST RESULTS — 50 CONCURRENT USERS")
        print("=" * 70)
        total_time = (self.end_time - self.start_time) if self.end_time and self.start_time else 0
        print(f"Total test duration: {total_time:.1f}s")
        print(f"Virtual users: 50 (using 13 accounts, multiple sessions each)")
        print()

        all_durations = []
        total_requests = 0
        total_success = 0
        total_fail = 0

        for action, entries in sorted(self.results.items()):
            durations = [e["duration_ms"] for e in entries if e["success"]]
            fails = [e for e in entries if not e["success"]]
            successes = len(durations)
            fail_count = len(fails)
            total_requests += len(entries)
            total_success += successes
            total_fail += fail_count

            if durations:
                all_durations.extend(durations)
                avg = sum(durations) / len(durations)
                sorted_d = sorted(durations)
                p50 = sorted_d[len(sorted_d) // 2]
                p95_idx = int(len(sorted_d) * 0.95)
                p95 = sorted_d[min(p95_idx, len(sorted_d) - 1)]
                max_d = max(durations)
                min_d = min(durations)
                print(f"  {action}:")
                print(f"    Requests: {len(entries)} ({successes} ok, {fail_count} fail)")
                print(f"    Avg: {avg:.0f}ms | P50: {p50:.0f}ms | P95: {p95:.0f}ms")
                print(f"    Min: {min_d:.0f}ms | Max: {max_d:.0f}ms")
            else:
                print(f"  {action}: ALL FAILED ({fail_count} requests)")

        print()
        print(f"TOTAL REQUESTS: {total_requests}")
        print(f"SUCCESS: {total_success} | FAILED: {total_fail}")
        if total_requests > 0:
            rate = total_success / total_requests * 100
            print(f"SUCCESS RATE: {rate:.1f}%")

        if all_durations:
            print(f"\nOVERALL LATENCY:")
            avg = sum(all_durations) / len(all_durations)
            sorted_all = sorted(all_durations)
            p50 = sorted_all[len(sorted_all) // 2]
            p95 = sorted_all[int(len(sorted_all) * 0.95)]
            print(f"  Avg: {avg:.0f}ms | P50: {p50:.0f}ms | P95: {p95:.0f}ms")

        if self.errors:
            print(f"\nTOP ERRORS:")
            for err, count in sorted(self.errors.items(), key=lambda x: -x[1])[:5]:
                print(f"  [{count}x] {err}")

        print("=" * 70)

        # Pass/fail
        if total_requests > 0:
            rate = total_success / total_requests * 100
            if rate >= 95:
                print("✅ PASS: Success rate >= 95%")
            else:
                print(f"❌ FAIL: Success rate {rate:.1f}% < 95%")

            if all_durations:
                sorted_all = sorted(all_durations)
                p95 = sorted_all[int(len(sorted_all) * 0.95)]
                if p95 <= 5000:
                    print("✅ PASS: P95 latency <= 5000ms")
                else:
                    print(f"❌ FAIL: P95 latency {p95:.0f}ms > 5000ms")

            # Check server didn't crash
            try:
                resp = requests.get(f"{BASE_URL}/api/auth/csrf", timeout=5)
                print("✅ PASS: Server still running after load test")
            except:
                print("❌ FAIL: Server crashed during load test")

        print("=" * 70)


def login_user(session, email, password):
    """Login via NextAuth credentials provider"""
    start = time.time()
    try:
        # Get CSRF token
        csrf_resp = session.get(f"{BASE_URL}/api/auth/csrf", timeout=15)
        csrf_data = csrf_resp.json()
        csrf_token = csrf_data.get("csrfToken", "")

        # Login via credentials callback
        resp = session.post(
            f"{BASE_URL}/api/auth/callback/credentials",
            data={
                "email": email,
                "password": password,
                "csrfToken": csrf_token,
            },
            allow_redirects=True,
            timeout=15,
        )
        duration = (time.time() - start) * 1000
        # Check if login succeeded by trying to access /api/me
        check = session.get(f"{BASE_URL}/api/me", timeout=10)
        return duration, check.status_code == 200 and check.json().get("success", False)
    except Exception as e:
        duration = (time.time() - start) * 1000
        return duration, False


def simulate_user(vuser, result):
    """Simulate a single user's session with realistic timing"""
    session = requests.Session()
    
    # Stagger start time - users don't all open the app at the exact same instant
    time.sleep(random.uniform(0, 2))

    # Step 1: Login
    duration, success = login_user(session, vuser["email"], vuser["password"])
    result.add("1_login", duration, success)
    if not success:
        return  # Can't do anything without login

    # Step 2: Get profile (hydration) — user sees loading screen
    time.sleep(random.uniform(0.1, 0.5))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/me", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("2_hydrate_profile", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("2_hydrate_profile", duration, False, str(e))

    # Step 3: Browse feed — user scrolls their feed
    time.sleep(random.uniform(0.5, 2))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/posts?limit=10&page=1", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        success = data.get("success", False)
        result.add("3_browse_feed", duration, success)
        posts = data.get("data", {}).get("posts", []) if success else []
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("3_browse_feed", duration, False, str(e))
        posts = []

    # Step 4: Create a post — user thinks about what to write
    time.sleep(random.uniform(1, 5))
    start = time.time()
    try:
        resp = session.post(
            f"{BASE_URL}/api/posts",
            json={
                "text": f"Hey from {vuser['name']}! Testing AURA 💜",
                "images": [],
                "vibeTag": random.choice(["hyped", "chill", "focused", "peaceful"]),
            },
            timeout=20,
        )
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("4_create_post", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("4_create_post", duration, False, str(e))

    # Step 5: Like a random post — user scrolls and likes
    time.sleep(random.uniform(0.5, 3))
    if posts:
        post = random.choice(posts)
        start = time.time()
        try:
            resp = session.post(
                f"{BASE_URL}/api/likes",
                json={"targetId": post["id"], "targetType": "post"},
                timeout=20,
            )
            duration = (time.time() - start) * 1000
            data = resp.json()
            result.add("5_like_post", duration, data.get("success", False))
        except Exception as e:
            duration = (time.time() - start) * 1000
            result.add("5_like_post", duration, False, str(e))

    # Step 6: Get hubs — user explores hubs
    time.sleep(random.uniform(0.2, 1))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/hubs", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("6_get_hubs", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("6_get_hubs", duration, False, str(e))

    # Step 7: Search
    time.sleep(random.uniform(0.2, 1))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/search?q=dance", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("7_search", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("7_search", duration, False, str(e))

    # Step 8: Get notifications
    time.sleep(random.uniform(0.2, 1))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/notifications", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("8_notifications", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("8_notifications", duration, False, str(e))

    # Step 9: Dance challenge
    time.sleep(random.uniform(0.2, 1))
    start = time.time()
    try:
        resp = session.get(f"{BASE_URL}/api/dance", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp.json()
        result.add("9_dance_challenge", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("9_dance_challenge", duration, False, str(e))

    # Step 10: Refresh feed
    time.sleep(random.uniform(0.5, 2))
    start = time.time()
    try:
        resp1 = session.get(f"{BASE_URL}/api/me", timeout=15)
        resp2 = session.get(f"{BASE_URL}/api/posts?limit=10&page=1", timeout=15)
        duration = (time.time() - start) * 1000
        data = resp2.json()
        result.add("10_page_refresh", duration, data.get("success", False))
    except Exception as e:
        duration = (time.time() - start) * 1000
        result.add("10_page_refresh", duration, False, str(e))

    # Step 11: Comment on a post
    time.sleep(random.uniform(1, 4))
    if posts:
        post = random.choice(posts)
        start = time.time()
        try:
            resp = session.post(
                f"{BASE_URL}/api/comments",
                json={"postId": post["id"], "text": "Great post! 🙌"},
                timeout=20,
            )
            duration = (time.time() - start) * 1000
            data = resp.json()
            result.add("11_comment", duration, data.get("success", False))
        except Exception as e:
            duration = (time.time() - start) * 1000
            result.add("11_comment", duration, False, str(e))


def main():
    result = LoadTestResult()

    print(f"🚀 AURA Load Test — 50 Concurrent Users")
    print(f"   Using {len(TEST_USERS)} accounts with multiple sessions each")
    print(f"   Each user performs: login, hydrate, browse, post, like, hubs, search, notifications, dance, refresh, comment")
    print(f"   Total actions per user: 11")
    print()

    result.start_time = time.time()

    # Run all 50 virtual users concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = {
            executor.submit(simulate_user, vuser, result): vuser["id"]
            for vuser in VIRTUAL_USERS
        }

        completed = 0
        for future in concurrent.futures.as_completed(futures):
            vuser_id = futures[future]
            try:
                future.result()
                completed += 1
                if completed % 10 == 0:
                    print(f"  Progress: {completed}/50 users completed")
            except Exception as e:
                completed += 1
                print(f"  User {vuser_id} error: {e}")

    result.end_time = time.time()
    result.summary()


if __name__ == "__main__":
    main()
