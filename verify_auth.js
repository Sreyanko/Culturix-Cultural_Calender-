// Using global fetch (Node 18+)

const BASE_URL = 'http://localhost:3000/api';
let cookieJar = {};

// Helper to manage cookies for session
async function request(method, endpoint, body = null, user = 'default') {
    const headers = { 'Content-Type': 'application/json' };
    if (cookieJar[user]) {
        headers['Cookie'] = cookieJar[user];
    }

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);

    // Update cookies
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
        cookieJar[user] = setCookie.split(';')[0];
    }

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runTests() {
    console.log("Starting Auth & Logbook Verification...");

    const userA = { username: 'testUserA_' + Date.now(), password: 'password123' };
    const userB = { username: 'testUserB_' + Date.now(), password: 'password123' };

    // 1. Register User A
    console.log(`\n1. Registering User A (${userA.username})...`);
    let res = await request('POST', '/register', userA);
    if (res.status === 201) console.log("✅ User A registered.");
    else console.error("❌ Failed to register User A:", res.data);

    // 2. Login User A
    console.log(`\n2. Logging in User A...`);
    res = await request('POST', '/login', userA, 'A');
    if (res.status === 200) console.log("✅ User A logged in.");
    else console.error("❌ Failed to login User A:", res.data);

    // 3. Create Log for User A
    console.log(`\n3. Creating log for User A...`);
    const logA = { content: 'Secret log for User A' };
    res = await request('POST', '/logs', logA, 'A');
    if (res.status === 201) console.log("✅ Log created.");
    else console.error("❌ Failed to create log:", res.data);

    // 4. Get Logs for User A
    console.log(`\n4. Fetching logs for User A...`);
    res = await request('GET', '/logs', null, 'A');
    if (res.status === 200 && res.data.length === 1 && res.data[0].content === logA.content) {
        console.log("✅ User A sees their log.");
    } else {
        console.error("❌ User A failed to retrieve correct logs:", res.data);
    }

    // 5. Register User B
    console.log(`\n5. Registering User B (${userB.username})...`);
    res = await request('POST', '/register', userB);
    if (res.status === 201) console.log("✅ User B registered.");
    else console.error("❌ Failed to register User B:", res.data);

    // 6. Login User B
    console.log(`\n6. Logging in User B...`);
    res = await request('POST', '/login', userB, 'B');
    if (res.status === 200) console.log("✅ User B logged in.");
    else console.error("❌ Failed to login User B:", res.data);

    // 7. Get Logs for User B (Should be empty)
    console.log(`\n7. Fetching logs for User B (expecting empty)...`);
    res = await request('GET', '/logs', null, 'B');
    if (res.status === 200 && res.data.length === 0) {
        console.log("✅ User B sees empty logs (User A's logs are hidden).");
    } else {
        console.error("❌ User B sees logs (Data Isolation Failure):", res.data);
    }

    // 8. Create Log for User B
    console.log(`\n8. Creating log for User B...`);
    const logB = { content: 'Private log for User B' };
    res = await request('POST', '/logs', logB, 'B');
    if (res.status === 201) console.log("✅ Log created for User B.");
    else console.error("❌ Failed to create log:", res.data);

    // 9. Get Logs for User B Again
    console.log(`\n9. Fetching logs for User B...`);
    res = await request('GET', '/logs', null, 'B');
    if (res.status === 200 && res.data.length === 1 && res.data[0].content === logB.content) {
        console.log("✅ User B sees their own log.");
    } else {
        console.error("❌ User B failed to retrieve correct logs:", res.data);
    }

    console.log("\n✅ Verification Complete!");
}

runTests().catch(console.error);
