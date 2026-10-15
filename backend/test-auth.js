// test-auth.js — Quick smoke tests for Milestone 1 (Backend Auth)
// Run: node test-auth.js (while server is running)

const http = require("http");

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: 8000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: JSON.parse(data || "{}"),
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ": " + detail : ""}`);
    failed++;
  }
}

async function run() {
  console.log("\n🧪 ShopKart - Milestone 1 Auth Tests\n");

  // ── 1. Register ─────────────────────────────────────────────────────────────
  console.log("1. POST /customers/register");
  const r1 = await request("POST", "/customers/register", {
    fullName: "Jane Doe",
    email: "jane@shopkart.com",
    password: "secret123",
    phone: "9876543210",
  });
  assert("Status 201", r1.status === 201, `got ${r1.status}`);
  assert("success: true", r1.body.success === true);
  assert("has _id", !!r1.body.customer?._id);
  assert("no password in response", !r1.body.customer?.password);

  // ── 2. Duplicate email ────────────────────────────────────────────────────
  console.log("2. Duplicate email → 409");
  const r2 = await request("POST", "/customers/register", {
    fullName: "Jane Doe",
    email: "jane@shopkart.com",
    password: "secret123",
    phone: "9876543210",
  });
  assert("Status 409", r2.status === 409, `got ${r2.status}`);
  assert("success: false", r2.body.success === false);

  // ── 3. Short password ─────────────────────────────────────────────────────
  console.log("3. Short password → 400");
  const r3 = await request("POST", "/customers/register", {
    fullName: "Bob",
    email: "bob@shopkart.com",
    password: "abc",
    phone: "9876543210",
  });
  assert("Status 400", r3.status === 400, `got ${r3.status}`);
  assert("has errors array", Array.isArray(r3.body.errors));

  // ── 4. Invalid phone ───────────────────────────────────────────────────────
  console.log("4. Invalid phone → 400");
  const r4 = await request("POST", "/customers/register", {
    fullName: "Bob",
    email: "bob2@shopkart.com",
    password: "secret123",
    phone: "12345",
  });
  assert("Status 400", r4.status === 400, `got ${r4.status}`);

  // ── 5. Login success ───────────────────────────────────────────────────────
  console.log("5. POST /customers/login - success → 200");
  const r5 = await request("POST", "/customers/login", {
    email: "jane@shopkart.com",
    password: "secret123",
  });
  assert("Status 200", r5.status === 200, `got ${r5.status}`);
  assert("success: true", r5.body.success === true);
  assert("message: Login successful", r5.body.message === "Login successful");
  assert("no password in response", !r5.body.customer?.password);
  const cookieHeader = r5.headers["set-cookie"]?.[0] || "";
  assert("HttpOnly cookie set", cookieHeader.includes("HttpOnly"));
  assert("cookie has token", cookieHeader.includes("token="));
  const token = cookieHeader.split("token=")[1]?.split(";")[0];

  // ── 6. Wrong password → 401 ───────────────────────────────────────────────
  console.log("6. Wrong password → 401");
  const r6 = await request("POST", "/customers/login", {
    email: "jane@shopkart.com",
    password: "wrongpassword",
  });
  assert("Status 401", r6.status === 401, `got ${r6.status}`);
  assert("Generic message (no field hint)", r6.body.message === "Invalid credentials");

  // ── 7. Unknown email → 401 (same message) ────────────────────────────────
  console.log("7. Unknown email → 401 (generic, no field hint)");
  const r7 = await request("POST", "/customers/login", {
    email: "nobody@example.com",
    password: "secret123",
  });
  assert("Status 401", r7.status === 401, `got ${r7.status}`);
  assert("Same message as wrong password", r7.body.message === r6.body.message);

  // ── 8. GET /customers/me with Bearer ─────────────────────────────────────
  console.log("8. GET /customers/me (authenticated via Bearer)");
  const r8 = await request("GET", "/customers/me", null, {
    Authorization: `Bearer ${token}`,
  });
  assert("Status 200", r8.status === 200, `got ${r8.status}`);
  assert("has customer", !!r8.body.customer);
  assert("email matches", r8.body.customer?.email === "jane@shopkart.com");
  assert("no password field", !r8.body.customer?.password);

  // ── 9. GET /customers/me without auth → 401 ───────────────────────────────
  console.log("9. GET /customers/me (no auth) → 401");
  const r9 = await request("GET", "/customers/me");
  assert("Status 401", r9.status === 401, `got ${r9.status}`);
  assert("message: Not authenticated", r9.body.message === "Not authenticated");

  // ── 10. Logout ────────────────────────────────────────────────────────────
  console.log("10. POST /customers/logout");
  const r10 = await request("POST", "/customers/logout", null, {
    Authorization: `Bearer ${token}`,
  });
  assert("Status 200", r10.status === 200, `got ${r10.status}`);
  assert("cookie cleared (expires=0 or empty)", 
    r10.headers["set-cookie"]?.[0]?.includes("Expires") || 
    r10.headers["set-cookie"]?.[0]?.includes("token=;"));

  // ── 11. Protected route without auth ─────────────────────────────────────
  console.log("11. POST /customers/logout without auth → 401");
  const r11 = await request("POST", "/customers/logout");
  assert("Status 401", r11.status === 401, `got ${r11.status}`);

  // ── 12. Change password ───────────────────────────────────────────────────
  console.log("12. PATCH /customers/change-password");
  // Re-login to get fresh token
  const relogin = await request("POST", "/customers/login", {
    email: "jane@shopkart.com",
    password: "secret123",
  });
  const token2 = relogin.headers["set-cookie"]?.[0]?.split("token=")[1]?.split(";")[0];
  const r12 = await request(
    "PATCH",
    "/customers/change-password",
    { oldPassword: "secret123", newPassword: "newpass456" },
    { Authorization: `Bearer ${token2}` }
  );
  assert("Status 200", r12.status === 200, `got ${r12.status}`);

  console.log("12b. Change password - wrong old password → 400");
  const r12b = await request(
    "PATCH",
    "/customers/change-password",
    { oldPassword: "wrongold", newPassword: "newpass456" },
    { Authorization: `Bearer ${token2}` }
  );
  assert("Status 400", r12b.status === 400, `got ${r12b.status}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log("🎉 ALL TESTS PASSED");
  else console.log("⚠️  Some tests failed — see above");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
