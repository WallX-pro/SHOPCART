// test-wishlist.js — Milestone 4 smoke tests
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "localhost", port: 8000, path, method,
      headers: { "Content-Type": "application/json", ...headers,
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}) },
    };
    const r = http.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(d || "{}") }));
    });
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

let passed = 0, failed = 0;
const assert = (label, cond, detail = "") => {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else       { console.log(`  ❌ ${label}${detail ? ": " + detail : ""}`); failed++; }
};

async function run() {
  // Get a fresh JWT token by generating one directly
  await mongoose.connect(process.env.MONGO_URI);
  const jwt = require("jsonwebtoken");
  const User = require("./models/user.model");
  const user = await User.findOne({ email: "shopkart@demo.com" });
  const Product = require("./models/product.model");
  const products = await Product.find().limit(2);
  await mongoose.disconnect();

  if (!user) { console.error("Demo user not found — run seed first"); process.exit(1); }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const auth  = { Authorization: `Bearer ${token}` };
  const pid1  = products[0]._id.toString();
  const pid2  = products[1]._id.toString();

  console.log("\n🧪 Milestone 4 — Wishlist Tests\n");

  // 1. Unauthenticated access → 401
  console.log("1. GET /wishlist (no auth) → 401");
  const r1 = await req("GET", "/wishlist");
  assert("Status 401", r1.status === 401, `got ${r1.status}`);

  // 2. Get empty wishlist
  console.log("2. GET /wishlist (authenticated) → empty");
  // Clear wishlist first
  await mongoose.connect(process.env.MONGO_URI);
  const User2 = require("./models/user.model");
  await User2.findByIdAndUpdate(user._id, { $set: { wishlist: [] } });
  await mongoose.disconnect();

  const r2 = await req("GET", "/wishlist", null, auth);
  assert("Status 200", r2.status === 200, `got ${r2.status}`);
  assert("Empty array", Array.isArray(r2.body.wishlist) && r2.body.wishlist.length === 0);

  // 3. Add to wishlist → 200
  console.log("3. POST /wishlist/:productId → 200");
  const r3 = await req("POST", `/wishlist/${pid1}`, null, auth);
  assert("Status 200", r3.status === 200, `got ${r3.status}`);
  assert("Wishlist has 1 item", r3.body.wishlist?.length === 1);
  assert("Item has name", !!r3.body.wishlist[0]?.name);
  assert("Item has price", typeof r3.body.wishlist[0]?.price === "number");
  assert("No password in response", !r3.body.wishlist[0]?.password);

  // 4. Duplicate add → 409
  console.log("4. POST same product again → 409");
  const r4 = await req("POST", `/wishlist/${pid1}`, null, auth);
  assert("Status 409", r4.status === 409, `got ${r4.status}`);
  assert("Returns wishlist on 409", Array.isArray(r4.body.wishlist));

  // 5. Add second product
  console.log("5. Add second product → 200, wishlist length 2");
  const r5 = await req("POST", `/wishlist/${pid2}`, null, auth);
  assert("Status 200", r5.status === 200, `got ${r5.status}`);
  assert("Wishlist has 2 items", r5.body.wishlist?.length === 2);

  // 6. Get populated wishlist
  console.log("6. GET /wishlist → populated");
  const r6 = await req("GET", "/wishlist", null, auth);
  assert("Status 200", r6.status === 200, `got ${r6.status}`);
  assert("Count 2", r6.body.wishlist?.length === 2);
  assert("Has name field", !!r6.body.wishlist[0]?.name);
  assert("Has stock field", typeof r6.body.wishlist[0]?.stock === "number");

  // 7. Invalid product ID → 400
  console.log("7. POST /wishlist/badid → 400");
  const r7 = await req("POST", "/wishlist/badid", null, auth);
  assert("Status 400", r7.status === 400, `got ${r7.status}`);

  // 8. Non-existent product → 404
  console.log("8. POST /wishlist/000…001 → 404");
  const r8 = await req("POST", "/wishlist/000000000000000000000001", null, auth);
  assert("Status 404", r8.status === 404, `got ${r8.status}`);

  // 9. Remove from wishlist → 200
  console.log("9. DELETE /wishlist/:productId → 200");
  const r9 = await req("DELETE", `/wishlist/${pid1}`, null, auth);
  assert("Status 200", r9.status === 200, `got ${r9.status}`);
  assert("Wishlist shrunk to 1", r9.body.wishlist?.length === 1);

  // 10. Remove something not in wishlist → 404
  console.log("10. DELETE non-existent item → 404");
  const r10 = await req("DELETE", `/wishlist/${pid1}`, null, auth);
  assert("Status 404", r10.status === 404, `got ${r10.status}`);

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log("🎉 ALL TESTS PASSED");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error("Fatal:", err.message); process.exit(1); });
