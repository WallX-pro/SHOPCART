// test-cart.js — Milestone 5 cart smoke tests
require("dotenv").config();
const http     = require("http");
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
      let d = ""; res.on("data", c => d += c);
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
  await mongoose.connect(process.env.MONGO_URI);
  const jwt     = require("jsonwebtoken");
  const User    = require("./models/user.model");
  const Product = require("./models/product.model");

  const user        = await User.findOne({ email: "shopkart@demo.com" });
  const inStockProd = await Product.findOne({ stock: { $gt: 2 } });
  const outOfStock  = await Product.findOne({ stock: 0 });

  // Clear cart before tests
  await User.findByIdAndUpdate(user._id, { $set: { cart: [] } });
  await mongoose.disconnect();

  const token = require("jsonwebtoken").sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const auth  = { Authorization: `Bearer ${token}` };
  const pid   = inStockProd._id.toString();
  const oos   = outOfStock?._id.toString();

  console.log("\n🧪 Milestone 5 — Cart Tests\n");

  // 1. No auth → 401
  console.log("1. GET /cart (no auth) → 401");
  const r1 = await req("GET", "/cart");
  assert("Status 401", r1.status === 401);

  // 2. Empty cart
  console.log("2. GET /cart (empty) → 200 []");
  const r2 = await req("GET", "/cart", null, auth);
  assert("Status 200", r2.status === 200);
  assert("Empty array", Array.isArray(r2.body.cart) && r2.body.cart.length === 0);

  // 3. Add to cart → qty 1
  console.log("3. POST /cart/:productId → new item qty 1");
  const r3 = await req("POST", `/cart/${pid}`, null, auth);
  assert("Status 200", r3.status === 200, `got ${r3.status}`);
  assert("Cart has 1 item", r3.body.cart?.length === 1);
  assert("Quantity is 1", r3.body.cart[0]?.quantity === 1);
  assert("Product name populated", !!r3.body.cart[0]?.product?.name);
  assert("Product price populated", typeof r3.body.cart[0]?.product?.price === "number");

  // 4. Add same product again → qty increments to 2
  console.log("4. POST same product again → qty 2 (no duplicate row)");
  const r4 = await req("POST", `/cart/${pid}`, null, auth);
  assert("Status 200", r4.status === 200, `got ${r4.status}`);
  assert("Still 1 row", r4.body.cart?.length === 1);
  assert("Quantity is 2", r4.body.cart[0]?.quantity === 2);

  // 5. Out of stock product → 400
  if (oos) {
    console.log("5. Add out-of-stock product → 400");
    const r5 = await req("POST", `/cart/${oos}`, null, auth);
    assert("Status 400", r5.status === 400, `got ${r5.status}`);
    assert("Error message present", !!r5.body.message);
  } else {
    console.log("5. (skip — no out-of-stock product in DB)");
    passed++;
  }

  // 6. Invalid product id → 400
  console.log("6. POST /cart/badid → 400");
  const r6 = await req("POST", "/cart/badid", null, auth);
  assert("Status 400", r6.status === 400);

  // 7. Non-existent product → 404
  console.log("7. POST /cart/000…001 → 404");
  const r7 = await req("POST", "/cart/000000000000000000000001", null, auth);
  assert("Status 404", r7.status === 404);

  // 8. PATCH quantity → 3
  console.log("8. PATCH /cart/:productId { quantity: 3 }");
  const r8 = await req("PATCH", `/cart/${pid}`, { quantity: 3 }, auth);
  assert("Status 200", r8.status === 200, `got ${r8.status}`);
  assert("Quantity updated to 3", r8.body.cart[0]?.quantity === 3);

  // 9. PATCH quantity = 0 → 400
  console.log("9. PATCH quantity 0 → 400");
  const r9 = await req("PATCH", `/cart/${pid}`, { quantity: 0 }, auth);
  assert("Status 400", r9.status === 400);

  // 10. PATCH quantity > stock → 400
  console.log("10. PATCH quantity > stock → 400");
  const r10 = await req("PATCH", `/cart/${pid}`, { quantity: 99999 }, auth);
  assert("Status 400", r10.status === 400);

  // 11. PATCH non-integer quantity → 400
  console.log("11. PATCH quantity=1.5 → 400");
  const r11 = await req("PATCH", `/cart/${pid}`, { quantity: 1.5 }, auth);
  assert("Status 400", r11.status === 400);

  // 12. GET cart → still 1 item with qty 3
  console.log("12. GET /cart → 1 item qty 3");
  const r12 = await req("GET", "/cart", null, auth);
  assert("Status 200", r12.status === 200);
  assert("1 item", r12.body.cart?.length === 1);
  assert("Qty still 3", r12.body.cart[0]?.quantity === 3);

  // 13. DELETE from cart
  console.log("13. DELETE /cart/:productId → removed");
  const r13 = await req("DELETE", `/cart/${pid}`, null, auth);
  assert("Status 200", r13.status === 200);
  assert("Cart empty", r13.body.cart?.length === 0);

  // 14. DELETE already removed → 404
  console.log("14. DELETE again → 404");
  const r14 = await req("DELETE", `/cart/${pid}`, null, auth);
  assert("Status 404", r14.status === 404);

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log("🎉 ALL TESTS PASSED");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
