// seed.js — Seeds 20 realistic products across 4 categories.
// Run: node seed.js
//
// Images use picsum.photos which returns stable, real photos for each seed ID.
// Stock intentionally varies: some high, some low, one at 0 (out-of-stock demo).

require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("./models/product.model");

const products = [
  // ── Electronics (6) ────────────────────────────────────────────────────────
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description:
      "Industry-leading noise cancellation with 30-hour battery life. Multipoint connection lets you pair with two devices simultaneously. Crystal-clear hands-free calling with precise voice pickup.",
    price: 24999,
    category: "Electronics",
    image: "https://picsum.photos/seed/headphones1/600/400",
    stock: 25,
  },
  {
    name: "Apple MacBook Air M2",
    description:
      "Supercharged by the Apple M2 chip, the redesigned MacBook Air is thinner and faster than ever. Up to 18 hours of battery life. 13.6-inch Liquid Retina display.",
    price: 114900,
    category: "Electronics",
    image: "https://picsum.photos/seed/macbook2/600/400",
    stock: 10,
  },
  {
    name: "Samsung 65\" 4K QLED Smart TV",
    description:
      "Quantum Dot technology delivers stunning 4K color. Powered by Tizen OS with built-in streaming apps. 120Hz refresh rate for smooth gaming and sports.",
    price: 89999,
    category: "Electronics",
    image: "https://picsum.photos/seed/tv3/600/400",
    stock: 8,
  },
  {
    name: "Canon EOS R50 Mirrorless Camera",
    description:
      "24.2MP APS-C CMOS sensor with DIGIC X image processor. 4K video recording, dual pixel autofocus, and built-in Wi-Fi and Bluetooth for seamless sharing.",
    price: 67490,
    category: "Electronics",
    image: "https://picsum.photos/seed/camera4/600/400",
    stock: 15,
  },
  {
    name: "iPad Pro 12.9\" M2",
    description:
      "The ultimate iPad experience with M2 chip, ProMotion 120Hz display, and Apple Pencil hover. Thunderbolt connectivity and Wi-Fi 6E support.",
    price: 112900,
    category: "Electronics",
    image: "https://picsum.photos/seed/ipad5/600/400",
    stock: 12,
  },
  {
    name: "Realme Buds Air 5 Pro TWS",
    description:
      "50dB active noise cancellation, 10mm driver with Hi-Res Audio Gold certification. 36-hour total playback time with fast charging support.",
    price: 3999,
    category: "Electronics",
    image: "https://picsum.photos/seed/buds6/600/400",
    stock: 0, // intentionally out of stock for demo
  },

  // ── Fashion (5) ────────────────────────────────────────────────────────────
  {
    name: "Levi's 511 Slim Fit Jeans",
    description:
      "Classic slim fit that sits below the waist with a slim leg through the thigh and knee. Made with stretch denim for all-day comfort. Available in multiple washes.",
    price: 3499,
    category: "Fashion",
    image: "https://picsum.photos/seed/jeans7/600/400",
    stock: 50,
  },
  {
    name: "Nike Air Max 270 Running Shoes",
    description:
      "The Nike Air Max 270 delivers a soft, comfortable ride all day long. Features Max Air unit in the heel and breathable mesh upper for lightweight comfort.",
    price: 12995,
    category: "Fashion",
    image: "https://picsum.photos/seed/shoes8/600/400",
    stock: 35,
  },
  {
    name: "H&M Oversized Hoodie",
    description:
      "Relaxed oversized silhouette in soft fleece fabric. Drop shoulders, kangaroo pocket, and ribbed cuffs. Perfect for casual weekends.",
    price: 1999,
    category: "Fashion",
    image: "https://picsum.photos/seed/hoodie9/600/400",
    stock: 60,
  },
  {
    name: "Ray-Ban Wayfarer Classic Sunglasses",
    description:
      "Iconic wayfarer design crafted with acetate frame and glass lenses. UV400 protection. Timeless style that pairs with any outfit.",
    price: 8990,
    category: "Fashion",
    image: "https://picsum.photos/seed/rayban10/600/400",
    stock: 20,
  },
  {
    name: "Zara Leather Crossbody Bag",
    description:
      "Premium genuine leather crossbody bag with adjustable strap. Multiple compartments with zipper closure. Compact yet spacious for everyday essentials.",
    price: 4299,
    category: "Fashion",
    image: "https://picsum.photos/seed/bag11/600/400",
    stock: 30,
  },

  // ── Books (5) ──────────────────────────────────────────────────────────────
  {
    name: "Atomic Habits — James Clear",
    description:
      "The #1 New York Times bestseller on building good habits and breaking bad ones. A proven framework for improving every day through tiny changes that deliver remarkable results.",
    price: 499,
    category: "Books",
    image: "https://picsum.photos/seed/atomichabits12/600/400",
    stock: 100,
  },
  {
    name: "The Psychology of Money — Morgan Housel",
    description:
      "19 short stories exploring the strange ways people think about money. Timeless lessons on wealth, greed, and happiness that will change how you think about finance.",
    price: 399,
    category: "Books",
    image: "https://picsum.photos/seed/psychmoney13/600/400",
    stock: 80,
  },
  {
    name: "Deep Work — Cal Newport",
    description:
      "Rules for focused success in a distracted world. Newport reveals deep work as a superpower that few people cultivate in our increasingly noisy world.",
    price: 449,
    category: "Books",
    image: "https://picsum.photos/seed/deepwork14/600/400",
    stock: 75,
  },
  {
    name: "Clean Code — Robert C. Martin",
    description:
      "A handbook of agile software craftsmanship. Learn to write code that is readable, maintainable, and elegant. Essential reading for every software developer.",
    price: 799,
    category: "Books",
    image: "https://picsum.photos/seed/cleancode15/600/400",
    stock: 45,
  },
  {
    name: "Sapiens — Yuval Noah Harari",
    description:
      "A brief history of humankind from the Stone Age to the Silicon Age. Explores how biology and history have defined us and enhanced our understanding of what it means to be human.",
    price: 549,
    category: "Books",
    image: "https://picsum.photos/seed/sapiens16/600/400",
    stock: 90,
  },

  // ── Home (4) ───────────────────────────────────────────────────────────────
  {
    name: "Dyson V15 Detect Cordless Vacuum",
    description:
      "Laser technology reveals invisible dust on hard floors. HEPA filtration traps 99.99% of particles. Up to 60 minutes of fade-free suction power.",
    price: 49900,
    category: "Home",
    image: "https://picsum.photos/seed/dyson17/600/400",
    stock: 18,
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    description:
      "7-in-1 multi-cooker: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and food warmer. 6-quart capacity feeds 4-6 people.",
    price: 8499,
    category: "Home",
    image: "https://picsum.photos/seed/instapot18/600/400",
    stock: 22,
  },
  {
    name: "IKEA MALM Queen Bed Frame",
    description:
      "Clean-lined design with high gloss finish. Adjustable bed sides that allow mattresses of different thicknesses. 4 storage boxes included for extra space.",
    price: 29999,
    category: "Home",
    image: "https://picsum.photos/seed/bed19/600/400",
    stock: 5,
  },
  {
    name: "Philips Air Purifier AC1215",
    description:
      "Removes 99.97% of particles as small as 0.003 microns including bacteria, viruses, and allergens. Covers rooms up to 333 sq ft. Smart auto mode adjusts to air quality.",
    price: 11995,
    category: "Home",
    image: "https://picsum.photos/seed/airpurifier20/600/400",
    stock: 28,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB");

    // Clear existing products so seeds are idempotent (safe to re-run)
    const deleted = await Product.deleteMany({});
    console.log(`🗑   Cleared ${deleted.deletedCount} existing products`);

    // Insert all 20 products
    const inserted = await Product.insertMany(products);
    console.log(`🌱  Seeded ${inserted.length} products successfully`);

    // Summary by category
    const summary = inserted.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    Object.entries(summary).forEach(([cat, count]) =>
      console.log(`    ${cat}: ${count} products`)
    );
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌  Disconnected");
  }
}

seed();
