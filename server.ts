import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

dotenv.config();

// --- Web Push Configuration ---
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

const setupWebPush = () => {
  try {
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      throw new Error("VAPID keys missing");
    }
    webpush.setVapidDetails(
      "mailto:yallamha86@gmail.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (e) {
    console.log("VAPID keys missing or invalid. Generating new ones...");
    const generatedKeys = webpush.generateVAPIDKeys();
    vapidKeys.publicKey = generatedKeys.publicKey;
    vapidKeys.privateKey = generatedKeys.privateKey;
    console.log("Generated new VAPID keys. Add these to your .env file:");
    console.log("VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
    console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
    
    webpush.setVapidDetails(
      "mailto:yallamha86@gmail.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
};

setupWebPush();

const sendPushNotification = async (userId: number | null, title: string, body: string, url: string = "/") => {
  const query = userId 
    ? db.prepare("SELECT subscription FROM push_subscriptions WHERE user_id = ?").all(userId)
    : db.prepare("SELECT subscription FROM push_subscriptions").all();
  
  const subscriptions = query as { subscription: string }[];
  
  subscriptions.forEach(sub => {
    try {
      const subscription = JSON.parse(sub.subscription);
      webpush.sendNotification(subscription, JSON.stringify({ title, body, url }))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or no longer valid
            db.prepare("DELETE FROM push_subscriptions WHERE subscription = ?").run(sub.subscription);
          }
        });
    } catch (e) {
      console.error("Push error", e);
    }
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Supabase Configuration ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase integration enabled.");
}

const db = new Database("database.db");
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    role TEXT DEFAULT 'user',
    personal_number TEXT UNIQUE, -- 7 digit random
    avatar_url TEXT,
    is_vip BOOLEAN DEFAULT 0,
    is_banned BOOLEAN DEFAULT 0,
    chat_blocked BOOLEAN DEFAULT 0,
    blocked_until DATETIME, -- Temporary block
    telegram_chat_id INTEGER UNIQUE,
    referred_by_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS voucher_uses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voucher_id INTEGER,
    user_id INTEGER,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL for all users
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, success
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT,
    special_id INTEGER, -- رقم القسم الخاص
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    image_url TEXT,
    special_id INTEGER, -- رقم القسم الفرعي الخاص
    parent_subcategory_id INTEGER,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS sub_sub_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subcategory_id INTEGER,
    name TEXT NOT NULL,
    image_url TEXT,
    special_id INTEGER,
    order_index INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subcategory_id INTEGER,
    sub_sub_category_id INTEGER,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    requires_input BOOLEAN DEFAULT 0,
    store_type TEXT DEFAULT 'normal', -- normal, quick, quantities, numbers
    min_quantity INTEGER DEFAULT 1,
    price_per_unit DECIMAL(10, 4),
    external_id TEXT,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (sub_sub_category_id) REFERENCES sub_sub_categories(id)
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT,
    wallet_address TEXT,
    instructions TEXT,
    min_amount DECIMAL(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    payment_method_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    receipt_image_url TEXT,
    note TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'new',
    meta TEXT, -- JSON string for game_id, etc.
    admin_response TEXT, -- الرد من الإدارة (كود التفعيل مثلاً)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    extra_data TEXT, -- JSON string
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS telegram_linking_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL for guests
    guest_id TEXT, -- For guest identification
    sender_role TEXT NOT NULL, -- 'user' or 'admin'
    content TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_message_counts (
    user_id INTEGER,
    guest_id TEXT,
    date DATE DEFAULT (DATE('now')),
    count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guest_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_orders_count INTEGER DEFAULT 0,
    referral_count INTEGER DEFAULT 0,
    login_days_count INTEGER DEFAULT 0,
    last_login_date DATE,
    vouchers_redeemed_count INTEGER DEFAULT 0,
    total_recharge_sum DECIMAL(10, 2) DEFAULT 0,
    active_discount DECIMAL(10, 2) DEFAULT 0,
    has_flaming_theme BOOLEAN DEFAULT 0,
    claimed_reward_index INTEGER DEFAULT -1,
    discount_expires_at DATETIME,
    one_product_discount_percent DECIMAL(10, 2) DEFAULT 0,
    profile_badge TEXT,
    custom_theme_color TEXT,
    has_special_support BOOLEAN DEFAULT 0,
    has_priority_orders BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('privacy_policy', 'سياسة الخصوصية الخاصة بنا...');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('support_whatsapp', '+963982559890');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', '12321');
`);

// --- Migrations for existing databases ---
const migrate = (table: string, column: string, type: string) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (!info.find(col => col.name === column)) {
    console.log(`Migrating: Adding ${column} to ${table}`);
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
};

migrate("users", "personal_number", "TEXT");
migrate("users", "telegram_chat_id", "INTEGER");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_personal_number ON users(personal_number)");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id)");
migrate("categories", "special_id", "INTEGER");
migrate("categories", "active", "BOOLEAN DEFAULT 1");
migrate("subcategories", "special_id", "INTEGER");
migrate("subcategories", "active", "BOOLEAN DEFAULT 1");
migrate("products", "store_type", "TEXT DEFAULT 'normal'");
migrate("payment_methods", "min_amount", "DECIMAL(10, 2) DEFAULT 0");
migrate("users", "referred_by_id", "INTEGER");
migrate("users", "phone", "TEXT");
migrate("users", "is_banned", "BOOLEAN DEFAULT 0");
migrate("users", "chat_blocked", "BOOLEAN DEFAULT 0");
migrate("users", "blocked_until", "DATETIME");
migrate("products", "sub_sub_category_id", "INTEGER");
migrate("products", "min_quantity", "INTEGER DEFAULT 1");
migrate("products", "price_per_unit", "DECIMAL(10, 4)");
migrate("products", "external_id", "TEXT");
migrate("orders", "admin_response", "TEXT");
migrate("user_stats", "has_flaming_theme", "BOOLEAN DEFAULT 0");
migrate("user_stats", "claimed_reward_index", "INTEGER DEFAULT -1");
migrate("user_stats", "total_recharge_sum", "DECIMAL(10, 2) DEFAULT 0");
migrate("user_stats", "active_discount", "DECIMAL(10, 2) DEFAULT 0");
migrate("user_stats", "discount_expires_at", "DATETIME");
migrate("user_stats", "one_product_discount_percent", "DECIMAL(10, 2) DEFAULT 0");
migrate("user_stats", "profile_badge", "TEXT");
migrate("user_stats", "custom_theme_color", "TEXT");
migrate("user_stats", "has_special_support", "BOOLEAN DEFAULT 0");
migrate("user_stats", "has_priority_orders", "BOOLEAN DEFAULT 0");
migrate("user_stats", "total_orders_count", "INTEGER DEFAULT 0");
migrate("user_stats", "referral_count", "INTEGER DEFAULT 0");
migrate("user_stats", "login_days_count", "INTEGER DEFAULT 0");
migrate("user_stats", "last_login_date", "DATE");
migrate("user_stats", "vouchers_redeemed_count", "INTEGER DEFAULT 0");

// Initialize user_stats for existing users
db.exec("INSERT OR IGNORE INTO user_stats (user_id) SELECT id FROM users");

// Backfill personal_number for existing users
const usersWithoutPN = db.prepare("SELECT id FROM users WHERE personal_number IS NULL").all() as any[];
for (const user of usersWithoutPN) {
  let personalNumber = "";
  while (true) {
    personalNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
    const existing = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(personalNumber);
    if (!existing) break;
  }
  db.prepare("UPDATE users SET personal_number = ? WHERE id = ?").run(personalNumber, user.id);
}
// -----------------------------------------

// Seed initial data if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  // Initial seed if needed
}

// User request: Delete specific categories
db.prepare("DELETE FROM categories WHERE name IN ('ألعاب', 'تطبيقات')").run();

const userStates = new Map<number, { step: string; data: any }>();
let adminBot: any = null;
let userBot: any = null;

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Pull data from cloud on startup
  await pullAllFromCloud();

  // Periodic sync from cloud every 10 minutes
  setInterval(pullAllFromCloud, 10 * 60 * 1000);

  // Helper for Telegram
  const sendTelegramMessage = async (text: string) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (e) {
      console.error("Telegram error", e);
    }
  };

  const sendTelegramToUser = async (userId: number, text: string) => {
    const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(userId) as any;
    if (!user?.telegram_chat_id) return;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: user.telegram_chat_id, text }),
      });
    } catch (e) {
      console.error("Telegram user notify error", e);
    }
  };

  // Admin Bot Logic
  const adminBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (adminBotToken) {
    // Add a small delay to avoid 409 conflict during rapid restarts
    setTimeout(() => {
      adminBot = new TelegramBot(adminBotToken, { polling: true });
      const adminChatId = process.env.TELEGRAM_CHAT_ID;

      adminBot.on("polling_error", (error: any) => {
        if (error.message.includes("409 Conflict")) {
          console.log("Admin Telegram bot conflict: Another instance is running.");
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('ECONNRESET') || error.message.includes('EFATAL')) {
          // These are common network issues or fatal polling errors that usually auto-recover or need a quiet log
          console.log(`Admin Telegram bot network/polling issue (${error.code || 'EFATAL'}). Reconnecting...`);
        } else {
          console.error("Admin Telegram polling error:", error);
        }
      });

    adminBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMsg = `أهلاً بك في بوت الإدارة 🛠️\n\nيرجى اختيار أحد الأوامر التالية:\n\n` +
        `📢 الإشعارات:\n/nall - إشعار للجميع\n/nhe - إشعار لمستخدم محدد\n\n` +
        `👤 المستخدمين:\n/topup - شحن رصيد يدوي\n/block - حظر مؤقت\n/deli - حذف مستخدم\n/vip - ترقية لـ VIP\n\n` +
        `🛠️ المتجر:\n/cat - إضافة قسم\n/sub - إضافة قسم فرعي\n/subsub - إضافة قسم فرعي فرعي\n/prod - إضافة منتج\n/editprice - تعديل سعر منتج\n/banner - إضافة بانر\n/offer - إضافة عرض\n/voucher - إضافة قسيمة\n\n` +
        `🗑️ الحذف:\n/delcat - حذف قسم\n/delsub - حذف قسم فرعي\n/delsubsub - حذف قسم فرعي فرعي\n/delprod - حذف منتج\n/delbanner - حذف بانر\n/deloffer - حذف عرض\n/delvoucher - حذف قسيمة`;
      adminBot.sendMessage(chatId, welcomeMsg);
    });

    adminBot.onText(/\/subsub/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_subsub_subid", data: {} });
      adminBot.sendMessage(chatId, "📂 يرجى إدخال ID القسم الفرعي:");
    });

    adminBot.onText(/\/editprice/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_edit_price_id", data: {} });
      adminBot.sendMessage(chatId, "💰 يرجى إدخال ID المنتج لتعديل سعره:");
    });

    adminBot.onText(/\/delsubsub/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_subsub_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID القسم الفرعي الفرعي المراد حذفه:");
    });

    adminBot.onText(/\/nall/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_broadcast_msg", data: {} });
      adminBot.sendMessage(chatId, "📢 يرجى إدخال نص الإشعار العام:");
    });

    adminBot.onText(/\/nhe/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_private_msg_pn", data: {} });
      adminBot.sendMessage(chatId, "👤 يرجى إدخال الرقم الشخصي للمستخدم:");
    });

    adminBot.onText(/\/topup/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_manual_topup_pn", data: {} });
      adminBot.sendMessage(chatId, "💰 يرجى إدخال الرقم الشخصي للمستخدم لشحن رصيده:");
    });

    adminBot.onText(/\/block/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_block_pn", data: {} });
      adminBot.sendMessage(chatId, "🚫 يرجى إدخال الرقم الشخصي للمستخدم لحظره مؤقتاً:");
    });

    adminBot.onText(/\/deli/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_delete_user_pn", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال الرقم الشخصي للمستخدم لحذفه نهائياً:");
    });

    adminBot.onText(/\/vip/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_grant_vip_pn", data: {} });
      adminBot.sendMessage(chatId, "💎 يرجى إدخال الرقم الشخصي للمستخدم لترقيته لـ VIP:");
    });

    adminBot.onText(/\/cat/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_cat_name", data: {} });
      adminBot.sendMessage(chatId, "📁 يرجى إدخال اسم القسم الجديد:");
    });

    adminBot.onText(/\/sub/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_sub_catid", data: {} });
      adminBot.sendMessage(chatId, "📂 يرجى إدخال ID القسم الرئيسي:");
    });

    adminBot.onText(/\/prod/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_prod_subid", data: {} });
      adminBot.sendMessage(chatId, "📦 يرجى إدخال ID القسم الفرعي:");
    });

    adminBot.onText(/\/banner/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_banner_url", data: {} });
      adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة البانر:");
    });

    adminBot.onText(/\/offer/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_offer_title", data: {} });
      adminBot.sendMessage(chatId, "🔥 يرجى إدخال عنوان العرض:");
    });

    adminBot.onText(/\/voucher/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_add_voucher_code", data: {} });
      adminBot.sendMessage(chatId, "🎁 يرجى إدخال كود القسيمة:");
    });

    adminBot.onText(/\/delcat/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_cat_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID القسم المراد حذفه:");
    });

    adminBot.onText(/\/delsub/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_sub_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID القسم الفرعي المراد حذفه:");
    });

    adminBot.onText(/\/delprod/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_prod_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID المنتج المراد حذفه:");
    });

    adminBot.onText(/\/delbanner/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_banner_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID البانر المراد حذفه:");
    });

    adminBot.onText(/\/deloffer/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_offer_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID العرض المراد حذفه:");
    });

    adminBot.onText(/\/delvoucher/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_del_voucher_id", data: {} });
      adminBot.sendMessage(chatId, "🗑️ يرجى إدخال ID القسيمة المراد حذفه:");
    });

    // Unified Admin Bot Message Handler for States
    adminBot.on("message", async (msg: any) => {
      const chatId = msg.chat.id.toString();
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId) return;

      const text = msg.text || "";

      // Handle Replies
      if (msg.reply_to_message) {
        const replyToText = msg.reply_to_message.text || "";
        const txMatch = replyToText.match(/#TX(\d+)/);
        const ordMatch = replyToText.match(/#ORD(\d+)/);

        if (txMatch) {
          const txId = txMatch[1];
          if (text === "تم") {
            // Approve Transaction
            const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as any;
            if (tx && tx.status === 'pending') {
              db.transaction(() => {
                db.prepare("UPDATE transactions SET status = 'approved' WHERE id = ?").run(txId);
                db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(tx.amount, tx.user_id);
              })();
              const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(tx.user_id) as any;
              if (user?.telegram_chat_id) {
                userBot?.sendMessage(user.telegram_chat_id, `✅ تم قبول طلب الشحن الخاص بك! تم إضافة ${tx.amount}$ لرصيدك.`);
              }
              adminBot.sendMessage(chatId, `✅ تم قبول الشحن #TX${txId}`);
            }
          } else if (text === "رفض") {
            // Reject Transaction
            db.prepare("UPDATE transactions SET status = 'rejected' WHERE id = ?").run(txId);
            adminBot.sendMessage(chatId, `❌ تم رفض الشحن #TX${txId}`);
          }
        } else if (ordMatch) {
          const ordId = ordMatch[1];
          const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(ordId) as any;
          if (order) {
            if (text === "تم") {
              db.prepare("UPDATE orders SET status = 'accepted' WHERE id = ?").run(ordId);
              const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(order.user_id) as any;
              if (user?.telegram_chat_id) {
                userBot?.sendMessage(user.telegram_chat_id, `✅ تم قبول طلبك #${ordId}`);
              }
              adminBot.sendMessage(chatId, `✅ تم قبول الطلب #ORD${ordId}`);
            } else if (text === "رفض") {
              db.prepare("UPDATE orders SET status = 'rejected' WHERE id = ?").run(ordId);
              adminBot.sendMessage(chatId, `❌ تم رفض الطلب #ORD${ordId}`);
            } else {
              // Save as admin response (e.g. activation code)
              db.prepare("UPDATE orders SET admin_response = ? WHERE id = ?").run(text, ordId);
              const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(order.user_id) as any;
              if (user?.telegram_chat_id) {
                userBot?.sendMessage(user.telegram_chat_id, `🔔 وصلك رد جديد على طلبك #${ordId}:\n\n${text}`);
              }
              adminBot.sendMessage(chatId, `✅ تم إرسال الرد للطلب #ORD${ordId}`);
            }
          }
        }
        return;
      }

      if (text.startsWith("/")) return;

      const state = userStates.get(parseInt(chatId));
      if (!state) return;

      if (state.step === "admin_broadcast_msg") {
        const message = text;
        db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run("إعلان جديد", message, "info");
        sendPushNotification(null, "إعلان جديد", message);
        const users = db.prepare("SELECT telegram_chat_id FROM users WHERE telegram_chat_id IS NOT NULL").all() as any[];
        users.forEach(u => {
          userBot?.sendMessage(u.telegram_chat_id, `🔔 إعلان جديد:\n\n${message}`);
        });
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إرسال الإشعار للجميع.");
      } else if (state.step === "admin_private_msg_pn") {
        const user = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(text);
        if (!user) return adminBot.sendMessage(chatId, "❌ المستخدم غير موجود. يرجى إدخال الرقم الشخصي الصحيح:");
        state.data.pn = text;
        state.step = "admin_private_msg_text";
        adminBot.sendMessage(chatId, "✅ تم التحقق من المستخدم. يرجى إدخال نص الرسالة:");
      } else if (state.step === "admin_private_msg_text") {
        const user = db.prepare("SELECT id, telegram_chat_id FROM users WHERE personal_number = ?").get(state.data.pn) as any;
        db.prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)").run(user.id, "تنبيه خاص", text, "warning");
        sendPushNotification(user.id, "تنبيه خاص", text);
        if (user.telegram_chat_id) {
          userBot?.sendMessage(user.telegram_chat_id, `🔔 تنبيه خاص:\n\n${text}`);
        }
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إرسال الإشعار للمستخدم بنجاح.");
      } else if (state.step === "admin_manual_topup_pn") {
        const user = db.prepare("SELECT id, name FROM users WHERE personal_number = ?").get(text) as any;
        if (!user) return adminBot.sendMessage(chatId, "❌ المستخدم غير موجود. يرجى إدخال الرقم الشخصي الصحيح:");
        state.data.pn = text;
        state.data.userName = user.name;
        state.step = "admin_manual_topup_amount";
        adminBot.sendMessage(chatId, `✅ تم التحقق: ${user.name}\nيرجى إدخال مبلغ الشحن ($):`);
      } else if (state.step === "admin_manual_topup_amount") {
        const amount = parseFloat(text);
        if (isNaN(amount)) return adminBot.sendMessage(chatId, "❌ يرجى إدخال مبلغ صحيح:");
        const user = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(state.data.pn) as any;
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, user.id);
        syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, `✅ تم شحن ${amount}$ للمستخدم ${state.data.userName} بنجاح.`);
      } else if (state.step === "admin_block_pn") {
        const user = db.prepare("SELECT id, name FROM users WHERE personal_number = ?").get(text) as any;
        if (!user) return adminBot.sendMessage(chatId, "❌ المستخدم غير موجود. يرجى إدخال الرقم الشخصي الصحيح:");
        state.data.pn = text;
        state.data.userName = user.name;
        state.step = "admin_block_minutes";
        adminBot.sendMessage(chatId, `✅ تم التحقق: ${user.name}\nيرجى إدخال مدة الحظر بالدقائق (مثلاً 60):`);
      } else if (state.step === "admin_block_minutes") {
        const minutes = parseInt(text);
        if (isNaN(minutes)) return adminBot.sendMessage(chatId, "❌ يرجى إدخال رقم صحيح للدقائق:");
        const user = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(state.data.pn) as any;
        const blockedUntil = new Date(Date.now() + minutes * 60000).toISOString();
        db.prepare("UPDATE users SET blocked_until = ? WHERE id = ?").run(blockedUntil, user.id);
        syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, `✅ تم حظر المستخدم ${state.data.userName} لمدة ${minutes} دقيقة.`);
      } else if (state.step === "admin_delete_user_pn") {
        const user = db.prepare("SELECT id, name FROM users WHERE personal_number = ?").get(text) as any;
        if (!user) return adminBot.sendMessage(chatId, "❌ المستخدم غير موجود. يرجى إدخال الرقم الشخصي الصحيح:");
        state.data.pn = text;
        state.data.userId = user.id;
        state.data.userName = user.name;
        state.step = "admin_delete_user_confirm";
        adminBot.sendMessage(chatId, `⚠️ هل أنت متأكد من حذف المستخدم ${user.name} نهائياً؟\nأرسل "نعم" للتأكيد أو أي شيء آخر للإلغاء.`);
      } else if (state.step === "admin_delete_user_confirm") {
        if (text === "نعم") {
          const userId = state.data.userId;
          db.transaction(() => {
            db.prepare("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)").run(userId);
            db.prepare("DELETE FROM orders WHERE user_id = ?").run(userId);
            db.prepare("DELETE FROM transactions WHERE user_id = ?").run(userId);
            db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
            db.prepare("DELETE FROM users WHERE id = ?").run(userId);
          })();
          adminBot.sendMessage(chatId, `✅ تم حذف المستخدم ${state.data.userName} وكافة بياناته نهائياً.`);
        } else {
          adminBot.sendMessage(chatId, "❌ تم إلغاء عملية الحذف.");
        }
        userStates.delete(parseInt(chatId));
      } else if (state.step === "admin_grant_vip_pn") {
        const user = db.prepare("SELECT id, name FROM users WHERE personal_number = ?").get(text) as any;
        if (!user) return adminBot.sendMessage(chatId, "❌ المستخدم غير موجود. يرجى إدخال الرقم الشخصي الصحيح:");
        db.prepare("UPDATE users SET is_vip = 1 WHERE id = ?").run(user.id);
        syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, `✅ تم ترقية المستخدم ${user.name} لـ VIP بنجاح.`);
      } else if (state.step === "admin_add_cat_name") {
        state.data.name = text;
        state.step = "admin_add_cat_url";
        adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة القسم:");
      } else if (state.step === "admin_add_cat_url") {
        const result = db.prepare("INSERT INTO categories (name, image_url) VALUES (?, ?)").run(state.data.name, text);
        syncToCloud("categories", db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة القسم بنجاح!");
      } else if (state.step === "admin_add_sub_catid") {
        state.data.catId = text;
        state.step = "admin_add_sub_name";
        adminBot.sendMessage(chatId, "📂 يرجى إدخال اسم القسم الفرعي:");
      } else if (state.step === "admin_add_sub_name") {
        state.data.name = text;
        state.step = "admin_add_sub_url";
        adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة القسم الفرعي:");
      } else if (state.step === "admin_add_sub_url") {
        const result = db.prepare("INSERT INTO subcategories (category_id, name, image_url) VALUES (?, ?, ?)").run(state.data.catId, state.data.name, text);
        syncToCloud("subcategories", db.prepare("SELECT * FROM subcategories WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة القسم الفرعي بنجاح!");
      } else if (state.step === "admin_add_subsub_subid") {
        state.data.subId = text;
        state.step = "admin_add_subsub_name";
        adminBot.sendMessage(chatId, "📂 يرجى إدخال اسم القسم الفرعي الفرعي:");
      } else if (state.step === "admin_add_subsub_name") {
        state.data.name = text;
        state.step = "admin_add_subsub_url";
        adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة القسم الفرعي الفرعي:");
      } else if (state.step === "admin_add_subsub_url") {
        const result = db.prepare("INSERT INTO sub_sub_categories (subcategory_id, name, image_url) VALUES (?, ?, ?)").run(state.data.subId, state.data.name, text);
        syncToCloud("sub_sub_categories", db.prepare("SELECT * FROM sub_sub_categories WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة القسم الفرعي الفرعي بنجاح!");
      } else if (state.step === "admin_edit_price_id") {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(text) as any;
        if (!product) return adminBot.sendMessage(chatId, "❌ المنتج غير موجود. يرجى إدخال ID صحيح:");
        state.data.prodId = text;
        state.data.oldPrice = product.price;
        state.step = "admin_edit_price_new";
        adminBot.sendMessage(chatId, `💰 المنتج: ${product.name}\nالسعر الحالي: ${product.price}$\n\nيرجى إدخال السعر الجديد:`);
      } else if (state.step === "admin_edit_price_new") {
        const newPrice = parseFloat(text);
        if (isNaN(newPrice)) return adminBot.sendMessage(chatId, "❌ يرجى إدخال سعر صحيح:");
        db.prepare("UPDATE products SET price = ? WHERE id = ?").run(newPrice, state.data.prodId);
        syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(state.data.prodId));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, `✅ تم تحديث السعر بنجاح من ${state.data.oldPrice}$ إلى ${newPrice}$`);
      } else if (state.step === "admin_add_prod_subid") {
        state.data.subId = text;
        state.step = "admin_add_prod_subsubid";
        adminBot.sendMessage(chatId, "📂 يرجى إدخال ID القسم الفرعي الفرعي (أو أرسل 0 إذا لم يوجد):");
      } else if (state.step === "admin_add_prod_subsubid") {
        state.data.subSubId = text === "0" ? null : text;
        state.step = "admin_add_prod_name";
        adminBot.sendMessage(chatId, "📦 يرجى إدخال اسم المنتج:");
      } else if (state.step === "admin_add_prod_name") {
        state.data.name = text;
        state.step = "admin_add_prod_price";
        adminBot.sendMessage(chatId, "💰 يرجى إدخال سعر المنتج:");
      } else if (state.step === "admin_add_prod_price") {
        state.data.price = text;
        state.step = "admin_add_prod_desc";
        adminBot.sendMessage(chatId, "📝 يرجى إدخال وصف المنتج:");
      } else if (state.step === "admin_add_prod_desc") {
        state.data.description = text;
        state.step = "admin_add_prod_url";
        adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة المنتج:");
      } else if (state.step === "admin_add_prod_url") {
        const result = db.prepare("INSERT INTO products (subcategory_id, sub_sub_category_id, name, price, description, image_url) VALUES (?, ?, ?, ?, ?, ?)").run(
          state.data.subId, state.data.subSubId, state.data.name, state.data.price, state.data.description, text
        );
        syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة المنتج بنجاح!");
      } else if (state.step === "admin_del_subsub_id") {
        db.prepare("DELETE FROM sub_sub_categories WHERE id = ?").run(text);
        deleteFromCloud("sub_sub_categories", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف القسم الفرعي الفرعي.");
      } else if (state.step === "admin_add_banner_url") {
        const result = db.prepare("INSERT INTO banners (image_url) VALUES (?)").run(text);
        syncToCloud("banners", db.prepare("SELECT * FROM banners WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة البانر بنجاح!");
      } else if (state.step === "admin_add_offer_title") {
        state.data.title = text;
        state.step = "admin_add_offer_desc";
        adminBot.sendMessage(chatId, "📝 يرجى إدخال وصف العرض:");
      } else if (state.step === "admin_add_offer_desc") {
        state.data.description = text;
        state.step = "admin_add_offer_url";
        adminBot.sendMessage(chatId, "🖼️ يرجى إدخال رابط صورة العرض:");
      } else if (state.step === "admin_add_offer_url") {
        const result = db.prepare("INSERT INTO offers (title, description, image_url) VALUES (?, ?, ?)").run(state.data.title, state.data.description, text);
        syncToCloud("offers", db.prepare("SELECT * FROM offers WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة العرض بنجاح!");
      } else if (state.step === "admin_add_voucher_code") {
        state.data.code = text;
        state.step = "admin_add_voucher_amount";
        adminBot.sendMessage(chatId, "💰 يرجى إدخال مبلغ القسيمة:");
      } else if (state.step === "admin_add_voucher_amount") {
        state.data.amount = text;
        state.step = "admin_add_voucher_uses";
        adminBot.sendMessage(chatId, "🔢 يرجى إدخال أقصى عدد للاستخدامات:");
      } else if (state.step === "admin_add_voucher_uses") {
        const result = db.prepare("INSERT INTO vouchers (code, amount, max_uses) VALUES (?, ?, ?)").run(state.data.code, state.data.amount, text);
        syncToCloud("vouchers", db.prepare("SELECT * FROM vouchers WHERE id = ?").get(result.lastInsertRowid));
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم إضافة القسيمة بنجاح!");
      } else if (state.step === "admin_del_cat_id") {
        db.prepare("DELETE FROM categories WHERE id = ?").run(text);
        deleteFromCloud("categories", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف القسم.");
      } else if (state.step === "admin_del_sub_id") {
        db.prepare("DELETE FROM subcategories WHERE id = ?").run(text);
        deleteFromCloud("subcategories", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف القسم الفرعي.");
      } else if (state.step === "admin_del_prod_id") {
        db.prepare("DELETE FROM products WHERE id = ?").run(text);
        deleteFromCloud("products", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف المنتج.");
      } else if (state.step === "admin_del_banner_id") {
        db.prepare("DELETE FROM banners WHERE id = ?").run(text);
        deleteFromCloud("banners", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف البانر.");
      } else if (state.step === "admin_del_offer_id") {
        db.prepare("DELETE FROM offers WHERE id = ?").run(text);
        deleteFromCloud("offers", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف العرض.");
      } else if (state.step === "admin_del_voucher_id") {
        db.prepare("DELETE FROM vouchers WHERE id = ?").run(text);
        deleteFromCloud("vouchers", text);
        userStates.delete(parseInt(chatId));
        adminBot.sendMessage(chatId, "✅ تم حذف القسيمة.");
      }
    });

    adminBot.on("callback_query", async (query) => {
      const chatId = query.message?.chat.id.toString();
      const adminChatId = process.env.TELEGRAM_CHAT_ID;
      if (chatId !== adminChatId) return;

      const data = query.data;
      if (data?.startsWith("approve_tx_")) {
        const txId = data.split("_")[2];
        const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as any;
        if (tx && tx.status === 'pending') {
          db.transaction(() => {
            db.prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(txId);
            db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(tx.amount, tx.user_id);
          })();
          const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(tx.user_id) as any;
          if (user.telegram_chat_id) {
            userBot?.sendMessage(user.telegram_chat_id, `✅ تم قبول طلب الشحن الخاص بك! تم إضافة ${tx.amount}$ لرصيدك.`);
          }
          syncToCloud("transactions", db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId));
          syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(tx.user_id));
          adminBot.sendMessage(chatId, `✅ تم قبول العملية #${txId} بنجاح.`);
        }
      } else if (data?.startsWith("reject_tx_")) {
        const txId = data.split("_")[2];
        const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId) as any;
        if (tx && tx.status === 'pending') {
          db.prepare("UPDATE transactions SET status = 'rejected' WHERE id = ?").run(txId);
          const user = db.prepare("SELECT telegram_chat_id FROM users WHERE id = ?").get(tx.user_id) as any;
          if (user.telegram_chat_id) {
            userBot?.sendMessage(user.telegram_chat_id, `❌ تم رفض طلب الشحن الخاص بك #${txId}. يرجى التواصل مع الدعم الفني.`);
          }
          syncToCloud("transactions", db.prepare("SELECT * FROM transactions WHERE id = ?").get(txId));
          adminBot.sendMessage(chatId, `❌ تم رفض العملية #${txId}.`);
        }
      }
    });
  }, 2000);
  }

  async function pullAllFromCloud() {
    if (!supabase) return;
    console.log("Pulling all data from Supabase...");
    const tables = [
      "users", "categories", "subcategories", "sub_sub_categories", "products", 
      "payment_methods", "banners", "offers", "vouchers", "voucher_uses", 
      "orders", "order_items", "transactions", "settings", "notifications", 
      "messages", "daily_message_counts", "user_stats", "telegram_linking_codes", "push_subscriptions"
    ];

    try {
      db.exec("PRAGMA foreign_keys = OFF");
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) {
          if (!error.message.includes("does not exist")) {
            console.error(`Error pulling ${table}:`, error.message);
          }
          continue;
        }
        if (data && data.length > 0) {
          db.prepare(`DELETE FROM ${table}`).run();
          const columns = Object.keys(data[0]);
          const placeholders = columns.map(() => "?").join(",");
          const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`);
          db.transaction(() => {
            data.forEach((row: any) => {
              const values = columns.map(col => row[col]);
              stmt.run(...values);
            });
          })();
        }
      }
      db.exec("PRAGMA foreign_keys = ON");
      console.log("Supabase pull complete.");
    } catch (e) {
      db.exec("PRAGMA foreign_keys = ON");
      console.error("Supabase pull failed:", e);
    }
  };

  const syncToCloud = async (table: string, data: any) => {
    if (!supabase) return;
    try {
      const rows = Array.isArray(data) ? data : [data];
      
      // Determine conflict target to avoid unique constraint errors
      let onConflict = 'id';
      if (table === 'settings') onConflict = 'key';
      if (table === 'vouchers') onConflict = 'code';
      if (table === 'user_stats') onConflict = 'user_id';

      // Remove id if it's not the primary key and we are conflicting on something else
      // or if it's null/undefined
      const cleanedRows = rows.map(row => {
        const newRow = { ...row };
        if (table === 'user_stats' && 'id' in newRow) delete newRow.id;
        return newRow;
      });

      const { error } = await supabase.from(table).upsert(cleanedRows, { onConflict });
      if (error) {
        if (error.message.includes("Could not find the") || error.message.includes("relation") || error.message.includes("does not exist")) {
          console.error(`Cloud Sync Schema Error (${table}): Your Supabase database is missing tables or columns. Please run the SQL migration script in your Supabase SQL Editor. Error: ${error.message}`);
        } else {
          console.error(`Cloud Sync Error (${table}):`, error.message, "Data:", JSON.stringify(rows));
        }
      }
    } catch (e) {
      console.error(`Cloud Sync Exception (${table}):`, e);
    }
  };

  const deleteFromCloud = async (table: string, id: any) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.error(`Cloud Delete Error (${table}):`, error.message);
    } catch (e) {
      console.error(`Cloud Delete Exception (${table}):`, e);
    }
  };

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    res.json(settings);
  });

  // --- Error Reporting API ---
  app.post("/api/report-error", async (req, res) => {
    const { error, stack } = req.body;
    db.prepare("INSERT INTO error_logs (error, stack) VALUES (?, ?)").run(error, stack);
    
    const adminChatId = process.env.TELEGRAM_CHAT_ID;
    if (adminBot && adminChatId) {
      const msg = `🚨 *خطأ برمجى جديد* 🚨\n\n*Error:* ${error}\n\n*Stack:* \n\`\`\`\n${stack?.substring(0, 500)}\n\`\`\``;
      adminBot.sendMessage(adminChatId, msg, { parse_mode: "Markdown" });
    }
    res.json({ success: true });
  });

  app.get("/api/chat/messages/:id", (req, res) => {
    const id = req.params.id;
    const isGuest = req.query.guest === 'true';
    
    let msgs;
    if (isGuest) {
      msgs = db.prepare("SELECT * FROM messages WHERE guest_id = ? ORDER BY created_at ASC").all(id);
    } else {
      msgs = db.prepare("SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC").all(id);
    }
    res.json(msgs);
  });

  app.post("/api/chat/send", async (req, res) => {
    const { user_id, guest_id, sender_role, content, image_url } = req.body;
    try {
      if (sender_role === 'user') {
        if (user_id) {
          const user = db.prepare("SELECT chat_blocked FROM users WHERE id = ?").get(user_id) as any;
          if (user?.chat_blocked) {
            return res.status(403).json({ error: "تم حظرك من الدردشة" });
          }
        }

        const today = new Date().toISOString().split('T')[0];
        let dailyCount;
        if (user_id) {
          dailyCount = db.prepare("SELECT count FROM daily_message_counts WHERE user_id = ? AND date = ?").get(user_id, today) as any;
        } else {
          dailyCount = db.prepare("SELECT count FROM daily_message_counts WHERE guest_id = ? AND date = ?").get(guest_id, today) as any;
        }

        if (dailyCount && dailyCount.count >= 10) {
          return res.status(403).json({ error: "انتهت الرسائل المجانية عد غدا" });
        }

        if (!dailyCount) {
          if (user_id) {
            db.prepare("INSERT INTO daily_message_counts (user_id, date, count) VALUES (?, ?, 1)").run(user_id, today);
          } else {
            db.prepare("INSERT INTO daily_message_counts (guest_id, date, count) VALUES (?, ?, 1)").run(guest_id, today);
          }
        } else {
          if (user_id) {
            db.prepare("UPDATE daily_message_counts SET count = count + 1 WHERE user_id = ? AND date = ?").run(user_id, today);
          } else {
            db.prepare("UPDATE daily_message_counts SET count = count + 1 WHERE guest_id = ? AND date = ?").run(guest_id, today);
          }
        }
      }

      const result = db.prepare("INSERT INTO messages (user_id, guest_id, sender_role, content, image_url) VALUES (?, ?, ?, ?, ?)").run(user_id || null, guest_id || null, sender_role, content, image_url);
      
      // Sync message to cloud
      const newMsg = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
      syncToCloud("messages", newMsg);

      // Sync daily count to cloud
      if (sender_role === 'user') {
        const today = new Date().toISOString().split('T')[0];
        let dailyCount;
        if (user_id) {
          dailyCount = db.prepare("SELECT * FROM daily_message_counts WHERE user_id = ? AND date = ?").get(user_id, today);
        } else {
          dailyCount = db.prepare("SELECT * FROM daily_message_counts WHERE guest_id = ? AND date = ?").get(guest_id, today);
        }
        if (dailyCount) syncToCloud("daily_message_counts", dailyCount);
      }
      
      if (sender_role === 'user') {
        const senderName = user_id ? (db.prepare("SELECT name FROM users WHERE id = ?").get(user_id) as any)?.name : "ضيف";
        const msg = `💬 رسالة جديدة من ${senderName}:\n${content || (image_url ? "[صورة]" : "")}`;
        sendTelegramMessage(msg);
      } else {
        if (user_id) {
          sendPushNotification(user_id, "رد من الدعم", "لقد تلقيت رداً جديداً من الدعم الفني.");
          sendTelegramToUser(user_id, `💬 رد جديد من الدعم الفني:\n${content || (image_url ? "[صورة]" : "")}`);
        }
      }

      res.json({ success: true, id: result.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: "فشل إرسال الرسالة" });
    }
  });

  app.get("/api/admin/chat/list", (req, res) => {
    const list = db.prepare(`
      SELECT u.id, u.name, u.personal_number, u.avatar_url, u.chat_blocked, 0 as is_guest,
             (SELECT content FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
             (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND sender_role = 'user' AND is_read = 0) as unread_count
      FROM users u
      WHERE EXISTS (SELECT 1 FROM messages WHERE user_id = u.id)
      UNION ALL
      SELECT guest_id as id, 'ضيف' as name, guest_id as personal_number, NULL as avatar_url, 0 as chat_blocked, 1 as is_guest,
             (SELECT content FROM messages WHERE guest_id = m.guest_id AND user_id IS NULL ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE guest_id = m.guest_id AND user_id IS NULL ORDER BY created_at DESC LIMIT 1) as last_message_at,
             (SELECT COUNT(*) FROM messages WHERE guest_id = m.guest_id AND user_id IS NULL AND sender_role = 'user' AND is_read = 0) as unread_count
      FROM (SELECT DISTINCT guest_id FROM messages WHERE user_id IS NULL AND guest_id IS NOT NULL) m
      ORDER BY last_message_at DESC
    `).all();
    res.json(list);
  });

  app.post("/api/admin/chat/mark-read", (req, res) => {
    const { userId, guestId } = req.body;
    if (userId) {
      db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender_role = 'user'").run(userId);
      const updatedMessages = db.prepare("SELECT * FROM messages WHERE user_id = ? AND sender_role = 'user'").all(userId);
      syncToCloud("messages", updatedMessages);
    } else if (guestId) {
      db.prepare("UPDATE messages SET is_read = 1 WHERE guest_id = ? AND user_id IS NULL AND sender_role = 'user'").run(guestId);
      const updatedMessages = db.prepare("SELECT * FROM messages WHERE guest_id = ? AND user_id IS NULL AND sender_role = 'user'").all(guestId);
      syncToCloud("messages", updatedMessages);
    }
    res.json({ success: true });
  });

  app.post("/api/chat/mark-read", (req, res) => {
    const { userId } = req.body;
    db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender_role = 'admin'").run(userId);
    
    const updatedMessages = db.prepare("SELECT * FROM messages WHERE user_id = ? AND sender_role = 'admin'").all(userId);
    syncToCloud("messages", updatedMessages);
    
    res.json({ success: true });
  });

  app.post("/api/admin/chat/block", (req, res) => {
    const { userId, blocked } = req.body;
    db.prepare("UPDATE users SET chat_blocked = ? WHERE id = ?").run(blocked ? 1 : 0, userId);
    
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    syncToCloud("users", updatedUser);
    
    res.json({ success: true });
  });

  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE (user_id = ? OR user_id IS NULL) 
      ORDER BY created_at DESC
    `).all(req.params.userId);
    res.json(notifications);
  });

  app.post("/api/notifications/mark-read", (req, res) => {
    const { notificationId } = req.body;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(notificationId);
    res.json({ success: true });
  });

  app.get("/api/push/key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post("/api/push/subscribe", (req, res) => {
    const { userId, subscription } = req.body;
    const subStr = JSON.stringify(subscription);
    
    // Check if subscription already exists for this user
    const existing = db.prepare("SELECT id FROM push_subscriptions WHERE user_id = ? AND subscription = ?").get(userId, subStr);
    if (!existing) {
      db.prepare("INSERT INTO push_subscriptions (user_id, subscription) VALUES (?, ?)").run(userId, subStr);
    }
    res.json({ success: true });
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, phone, referralCode } = req.body;
    try {
      // Generate unique 7-digit personal number
      let personalNumber = "";
      while (true) {
        personalNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        const existing = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(personalNumber);
        if (!existing) break;
      }

      let referredById = null;
      if (referralCode) {
        const referrer = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(referralCode) as any;
        if (referrer) {
          referredById = referrer.id;
          db.prepare("UPDATE user_stats SET referral_count = referral_count + 1 WHERE user_id = ?").run(referrer.id);
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = db.prepare("INSERT INTO users (name, email, password_hash, phone, personal_number, referred_by_id) VALUES (?, ?, ?, ?, ?, ?)").run(
        name, email, hashedPassword, phone, personalNumber, referredById
      );
      
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
      
      // Initialize stats for new user
      db.prepare("INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)").run(user.id);
      const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id);

      // Auto Sync to Cloud
      syncToCloud("users", user);
      syncToCloud("user_stats", stats);

      sendTelegramMessage(`👤 مستخدم جديد\nالاسم: ${name}\nالإيميل: ${email}\nالهاتف: ${phone}\nرقم الدخول: ${user.id}\nالرقم الشخصي: ${personalNumber}${referralCode ? `\nتمت الإحالة بواسطة: ${referralCode}` : ''}`);
      res.json({ ...user, stats });
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, password_hash, balance, role, personal_number, phone, is_banned, is_vip, telegram_chat_id FROM users WHERE email = ?").get(email) as any;
    
    if (user) {
      if (user.is_banned) {
        return res.status(403).json({ error: "Your account has been banned." });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        // Update login days
        const stats = db.prepare("SELECT last_login_date, login_days_count FROM user_stats WHERE user_id = ?").get(user.id) as any;
        const today = new Date().toISOString().split('T')[0];
        if (stats && stats.last_login_date !== today) {
          db.prepare("UPDATE user_stats SET last_login_date = ?, login_days_count = login_days_count + 1 WHERE user_id = ?").run(today, user.id);
        }

        const { password_hash, ...userWithoutPass } = user;
        const fullStats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id);
        sendTelegramMessage(`🔑 تسجيل دخول\nالاسم: ${user.name}\nالإيميل: ${user.email}\nالهاتف: ${user.phone}\nرقم الدخول: ${user.id}\nالرقم الشخصي: ${user.personal_number}`);
        res.json({ ...userWithoutPass, stats: fullStats });
        return;
      }
    }
    res.status(401).json({ error: "Invalid credentials" });
  });

  // Data Routes
  app.get("/api/sub-sub-categories", (req, res) => {
    try {
      const subSubs = db.prepare("SELECT * FROM sub_sub_categories WHERE active = 1 ORDER BY order_index ASC").all();
      res.json(subSubs);
    } catch (e: any) {
      console.error("GET /api/sub-sub-categories error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/subcategories/:id/sub-sub-categories", (req, res) => {
    try {
      const subSubs = db.prepare("SELECT * FROM sub_sub_categories WHERE subcategory_id = ? AND active = 1 ORDER BY order_index ASC").all(req.params.id);
      res.json(subSubs);
    } catch (e: any) {
      console.error("GET /api/subcategories/:id/sub-sub-categories error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/sub-sub-categories/:id/products", (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products WHERE sub_sub_category_id = ? AND available = 1").all(req.params.id);
      res.json(products);
    } catch (e: any) {
      console.error("GET /api/sub-sub-categories/:id/products error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/subcategories", (req, res) => {
    const subs = db.prepare("SELECT * FROM subcategories WHERE active = 1 ORDER BY order_index ASC").all();
    res.json(subs);
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories WHERE active = 1 ORDER BY order_index ASC").all();
    res.json(categories);
  });

  app.get("/api/categories/:id/subcategories", (req, res) => {
    const subcategories = db.prepare("SELECT * FROM subcategories WHERE category_id = ? AND active = 1 ORDER BY order_index ASC").all(req.params.id);
    res.json(subcategories);
  });

  app.get("/api/subcategories/:id/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE subcategory_id = ? AND available = 1").all(req.params.id);
    res.json(products);
  });

  app.get("/api/payment-methods", (req, res) => {
    const methods = db.prepare("SELECT * FROM payment_methods WHERE active = 1").all();
    res.json(methods);
  });

  app.get("/api/banners", (req, res) => {
    const banners = db.prepare("SELECT * FROM banners ORDER BY order_index ASC").all();
    res.json(banners);
  });

  app.get("/api/offers", (req, res) => {
    const offers = db.prepare("SELECT * FROM offers WHERE active = 1 ORDER BY created_at DESC").all();
    res.json(offers);
  });

  // User Routes (Protected in a real app, simplified here)
  app.patch("/api/user/:id/avatar", (req, res) => {
    const { avatar_url } = req.body;
    if (!avatar_url) return res.status(400).json({ error: "Missing avatar URL" });
    try {
      db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatar_url, req.params.id);
      syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update avatar" });
    }
  });

  app.patch("/api/admin/products/:id/price", (req, res) => {
    const { price, price_per_unit } = req.body;
    try {
      if (price !== undefined) {
        db.prepare("UPDATE products SET price = ? WHERE id = ?").run(price, req.params.id);
      }
      if (price_per_unit !== undefined) {
        db.prepare("UPDATE products SET price_per_unit = ? WHERE id = ?").run(price_per_unit, req.params.id);
      }
      syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPass = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as any;
    if (password === (adminPass?.value || "12321")) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  });

  app.post("/api/admin/change-password", (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: "New password required" });
    db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password'").run(newPassword);
    res.json({ success: true });
  });

  app.post("/api/user/update-theme", (req, res) => {
    const { userId, color } = req.body;
    const stats = db.prepare("SELECT custom_theme_color FROM user_stats WHERE user_id = ?").get(userId) as any;
    if (!stats || stats.custom_theme_color !== 'any') {
      // Allow if they have 'any' or if we want to allow specific colors. 
      // User said "after goal 7", which sets it to 'any'.
      if (stats?.custom_theme_color !== 'any') {
        return res.status(403).json({ error: "Not authorized for custom theme" });
      }
    }
    db.prepare("UPDATE user_stats SET custom_theme_color = ? WHERE user_id = ?").run(color, userId);
    res.json({ success: true });
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT id, name, email, balance, role, phone, personal_number, is_vip, blocked_until, telegram_chat_id, avatar_url FROM users WHERE id = ?").get(req.params.id) as any;
    if (user && user.blocked_until) {
      const blockedUntil = new Date(user.blocked_until);
      if (blockedUntil > new Date()) {
        user.is_blocked = true;
      }
    }
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(req.params.id);
    const unreadSupportCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND sender_role = 'admin' AND is_read = 0").get(req.params.id) as any;
    res.json(user ? { ...user, stats, unread_support_count: unreadSupportCount.count } : null);
  });

  app.post("/api/rewards/claim", (req, res) => {
    const { userId, goalIndex } = req.body;
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId) as any;
    if (!stats) return res.status(404).json({ error: "User stats not found" });

    if (stats.claimed_reward_index >= goalIndex) {
      return res.status(400).json({ error: "Reward already claimed" });
    }

    // Goals definition (simplified for backend logic)
    const goals = [5, 15, 30, 50, 100, 200, 500];
    if (goalIndex >= goals.length) return res.status(400).json({ error: "Invalid goal index" });

    if (stats.total_recharge_sum < goals[goalIndex]) {
      return res.status(400).json({ error: "Goal not reached yet" });
    }

    // Must claim previous goals first
    if (goalIndex > 0 && stats.claimed_reward_index < goalIndex - 1) {
      return res.status(400).json({ error: "Please claim previous rewards first" });
    }

    try {
      db.transaction(() => {
        db.prepare("UPDATE user_stats SET claimed_reward_index = ? WHERE user_id = ?").run(goalIndex, userId);
        
        const now = new Date();
        const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Apply rewards based on index
        if (goalIndex === 0) { // $5
          db.prepare("UPDATE user_stats SET active_discount = 1, discount_expires_at = ? WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        } else if (goalIndex === 1) { // $15
          db.prepare("UPDATE users SET balance = balance + 1 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 2, discount_expires_at = ? WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        } else if (goalIndex === 2) { // $30
          db.prepare("UPDATE users SET balance = balance + 3 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 4, discount_expires_at = ?, one_product_discount_percent = 10 WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        } else if (goalIndex === 3) { // $50
          db.prepare("UPDATE users SET balance = balance + 5 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 5, discount_expires_at = ? WHERE user_id = ?").run(oneYear.toISOString(), userId);
        } else if (goalIndex === 4) { // $100
          db.prepare("UPDATE users SET balance = balance + 5 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 7, discount_expires_at = ?, one_product_discount_percent = 15, profile_badge = 'silver', custom_theme_color = 'yellow' WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        } else if (goalIndex === 5) { // $200
          db.prepare("UPDATE users SET balance = balance + 10 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 10, discount_expires_at = ?, one_product_discount_percent = 15, profile_badge = 'gold', custom_theme_color = 'red' WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        } else if (goalIndex === 6) { // $500
          db.prepare("UPDATE users SET balance = balance + 20 WHERE id = ?").run(userId);
          db.prepare("UPDATE user_stats SET active_discount = 10, discount_expires_at = ?, one_product_discount_percent = 20, profile_badge = 'gold_legendary', custom_theme_color = 'any', has_special_support = 1, has_priority_orders = 1 WHERE user_id = ?").run(oneMonth.toISOString(), userId);
        }
      })();

      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      const updatedStats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId);
      syncToCloud("users", updatedUser);
      syncToCloud("user_stats", updatedStats);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/user/redeem-voucher", (req, res) => {
    const { userId, code } = req.body;
    const user = db.prepare("SELECT id, balance FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const voucher = db.prepare("SELECT * FROM vouchers WHERE code = ? AND active = 1").get(code) as any;
    if (!voucher) return res.status(404).json({ error: "Voucher not found or inactive" });

    if (voucher.used_count >= voucher.max_uses) {
      return res.status(400).json({ error: "Voucher has reached max uses" });
    }

    const alreadyUsed = db.prepare("SELECT id FROM voucher_uses WHERE voucher_id = ? AND user_id = ?").get(voucher.id, userId);
    if (alreadyUsed) {
      return res.status(400).json({ error: "You have already used this voucher" });
    }

    try {
      db.transaction(() => {
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(voucher.amount, userId);
        db.prepare("UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?").run(voucher.id);
        db.prepare("INSERT INTO voucher_uses (voucher_id, user_id) VALUES (?, ?)").run(voucher.id, userId);
        db.prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)").run(
          userId, "شحن رصيد", `تم شحن رصيدك بمبلغ ${voucher.amount}$ عبر كود هدية.`, "success"
        );
      })();

      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      syncToCloud("users", updatedUser);
      syncToCloud("vouchers", db.prepare("SELECT * FROM vouchers WHERE id = ?").get(voucher.id));

      res.json({ success: true, amount: voucher.amount });
    } catch (e) {
      res.status(500).json({ error: "Redemption failed" });
    }
  });

  app.get("/api/admin/vouchers", (req, res) => {
    const vouchers = db.prepare("SELECT * FROM vouchers ORDER BY created_at DESC").all();
    res.json(vouchers);
  });

  app.post("/api/admin/vouchers", (req, res) => {
    const { code, amount, max_uses } = req.body;
    try {
      const result = db.prepare("INSERT INTO vouchers (code, amount, max_uses) VALUES (?, ?, ?)").run(code, amount, max_uses);
      const voucher = db.prepare("SELECT * FROM vouchers WHERE id = ?").get(result.lastInsertRowid);
      syncToCloud("vouchers", voucher);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Voucher code already exists" });
    }
  });

  app.delete("/api/admin/vouchers/:id", (req, res) => {
    db.prepare("DELETE FROM vouchers WHERE id = ?").run(req.params.id);
    deleteFromCloud("vouchers", req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/block", (req, res) => {
    const { minutes } = req.body;
    const blockedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    db.prepare("UPDATE users SET blocked_until = ? WHERE id = ?").run(blockedUntil, req.params.id);
    
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    syncToCloud("users", updatedUser);
    
    res.json({ success: true, blockedUntil });
  });

  app.post("/api/user/update", async (req, res) => {
    const { id, name, email, phone, password } = req.body;
    try {
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        db.prepare("UPDATE users SET name = ?, email = ?, phone = ?, password_hash = ? WHERE id = ?").run(name, email, phone, hashedPassword, id);
      } else {
        db.prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?").run(name, email, phone, id);
      }
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      
      // Auto Sync to Cloud
      syncToCloud("users", user);

      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Update failed" });
    }
  });

  app.post("/api/user/generate-linking-code", (req, res) => {
    const { userId } = req.body;
    const code = Math.random().toString(36).substring(2, 9).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    
    db.prepare("DELETE FROM telegram_linking_codes WHERE user_id = ?").run(userId);
    db.prepare("INSERT INTO telegram_linking_codes (user_id, code, expires_at) VALUES (?, ?, ?)").run(userId, code, expiresAt);
    
    res.json({ code });
  });

  app.post("/api/user/unlink-telegram", (req, res) => {
    const { userId } = req.body;
    try {
      db.prepare("UPDATE users SET telegram_chat_id = NULL WHERE id = ?").run(userId);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      syncToCloud("users", user);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Unlink failed" });
    }
  });

  app.get("/api/referrals/stats/:userId", (req, res) => {
    const count = db.prepare("SELECT COUNT(*) as count FROM users WHERE referred_by_id = ?").get(req.params.userId) as { count: number };
    res.json({ count: count.count });
  });

  app.get("/api/admin/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    res.json(settings);
  });

  app.post("/api/admin/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
    
    // Auto Sync to Cloud
    syncToCloud("settings", { key, value });

    res.json({ success: true });
  });

  app.post("/api/orders", (req, res) => {
    const { userId, productId, quantity, extraData } = req.body;
    const user = db.prepare("SELECT id, balance, name, email, phone, personal_number, is_vip FROM users WHERE id = ?").get(userId) as any;
    const product = db.prepare("SELECT price, name FROM products WHERE id = ?").get(productId) as any;

    if (!user || !product) return res.status(404).json({ error: "Not found" });

    let total = product.price * quantity;
    
    // Apply user stats discounts
    const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(userId) as any;
    let discountPercent = 0;
    
    if (user.is_vip) {
      discountPercent = 5;
    }

    if (stats) {
      const now = new Date();
      if (stats.discount_expires_at && new Date(stats.discount_expires_at) > now) {
        // Take the higher discount
        discountPercent = Math.max(discountPercent, stats.active_discount || 0);
      }
      
      // One product discount (one-time use)
      if (stats.one_product_discount_percent > 0) {
        // Apply it to this order and consume it
        discountPercent = Math.max(discountPercent, stats.one_product_discount_percent);
        db.prepare("UPDATE user_stats SET one_product_discount_percent = 0 WHERE user_id = ?").run(userId);
      }
    }

    if (discountPercent > 0) {
      total = total * (1 - discountPercent / 100);
    }

    if (user.balance < total) return res.status(400).json({ error: "Insufficient balance" });

    const transaction = db.transaction(() => {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(total, userId);
      const orderResult = db.prepare("INSERT INTO orders (user_id, total_amount, meta) VALUES (?, ?, ?)").run(userId, total, JSON.stringify(extraData));
      db.prepare("INSERT INTO order_items (order_id, product_id, price_at_purchase, quantity, extra_data) VALUES (?, ?, ?, ?, ?)").run(
        orderResult.lastInsertRowid, productId, product.price, quantity, JSON.stringify(extraData)
      );

      // Referral Commission (5%)
      const currentUser = db.prepare("SELECT referred_by_id FROM users WHERE id = ?").get(userId) as any;
      if (currentUser && currentUser.referred_by_id) {
        const commission = total * 0.05;
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(commission, currentUser.referred_by_id);
        sendTelegramMessage(`🎁 عمولة إحالة!\nالمبلغ: ${commission.toFixed(2)} $\nتمت الإضافة للمستخدم ID: ${currentUser.referred_by_id}`);
      }

      return orderResult.lastInsertRowid;
    });

      const orderId = transaction();
      
      // Auto Sync to Cloud
      const newOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      const newOrderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      
      syncToCloud("orders", newOrder);
      syncToCloud("order_items", newOrderItems);
      syncToCloud("users", updatedUser);

      // Notify Admin
      const adminChatId = process.env.ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
      if (adminChatId) {
        const adminMsg = `🔔 طلب جديد #ORD${orderId}\nالاسم: ${user.name}\nالإيميل: ${user.email}\nالهاتف: ${user.phone}\nرقم الدخول: ${user.id}\nالرقم الشخصي: ${user.personal_number}\nProduct: ${product.name}\nTotal: ${total}\nData: ${JSON.stringify(extraData)}`;
        adminBot?.sendMessage(adminChatId, adminMsg);
      }
    res.json({ success: true, orderId });
  });

  app.get("/api/orders/user/:userId", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, p.name as product_name 
      FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      JOIN products p ON oi.product_id = p.id 
      WHERE o.user_id = ? 
      ORDER BY o.created_at DESC
    `).all(req.params.userId);
    res.json(orders);
  });

  app.post("/api/transactions/upload", (req, res) => {
    const { userId, paymentMethodId, amount, note, receiptImageUrl } = req.body;
    const user = db.prepare("SELECT id, name, email, phone, personal_number FROM users WHERE id = ?").get(userId) as any;
    const method = db.prepare("SELECT name FROM payment_methods WHERE id = ?").get(paymentMethodId) as any;

    // Check for pending transactions limit
    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = 'pending'").get(userId) as { count: number };
    if (pendingCount.count >= 2) {
      return res.status(400).json({ error: "لا يمكنك إرسال أكثر من مدفوعتين قيد المراجعة. يرجى الانتظار حتى يتم التحقق من طلباتك السابقة." });
    }

    const result = db.prepare("INSERT INTO transactions (user_id, payment_method_id, amount, note, receipt_image_url) VALUES (?, ?, ?, ?, ?)").run(
      userId, paymentMethodId, amount, note, receiptImageUrl
    );

    // Auto Sync to Cloud
    const newTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("transactions", newTransaction);

    sendTelegramMessage(`💳 شحن رصيد جديد\nالاسم: ${user?.name}\nالإيميل: ${user?.email}\nالهاتف: ${user?.phone}\nرقم الدخول: ${user?.id}\nالرقم الشخصي: ${user?.personal_number}\nAmount: ${amount}\nMethod: ${method?.name}\nNote: ${note}\nReceipt: ${receiptImageUrl}`);
    res.json({ success: true, transactionId: result.lastInsertRowid });
  });

  app.get("/api/transactions/user/:userId", (req, res) => {
    const transactions = db.prepare("SELECT t.*, pm.name as method_name FROM transactions t JOIN payment_methods pm ON t.payment_method_id = pm.id WHERE t.user_id = ? ORDER BY t.created_at DESC").all(req.params.userId);
    res.json(transactions);
  });

  // Admin Routes
  app.get("/api/admin/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email, p.name as product_name 
      FROM orders o 
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id 
      JOIN products p ON oi.product_id = p.id 
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  app.post("/api/admin/orders/:id/status", (req, res) => {
    const { status, admin_response } = req.body;
    if (admin_response !== undefined) {
      db.prepare("UPDATE orders SET status = ?, admin_response = ? WHERE id = ?").run(status, admin_response, req.params.id);
    } else {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as user_name, pm.name as method_name 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      JOIN payment_methods pm ON t.payment_method_id = pm.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.post("/api/admin/transactions/:id/approve", (req, res) => {
    const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id) as any;
    if (transaction && transaction.status === 'pending') {
      db.transaction(() => {
        db.prepare("UPDATE transactions SET status = 'approved' WHERE id = ?").run(req.params.id);
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(transaction.amount, transaction.user_id);
        
        // Update user stats
        db.prepare("INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)").run(transaction.user_id);
        db.prepare("UPDATE user_stats SET total_recharge_sum = total_recharge_sum + ? WHERE user_id = ?").run(transaction.amount, transaction.user_id);
      })();
      
      // Auto Sync to Cloud
      const updatedTransaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(transaction.user_id);
      const updatedStats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(transaction.user_id);
      syncToCloud("transactions", updatedTransaction);
      syncToCloud("users", updatedUser);
      syncToCloud("user_stats", updatedStats);

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid transaction" });
    }
  });

  app.post("/api/admin/transactions/:id/reject", (req, res) => {
    db.prepare("UPDATE transactions SET status = 'rejected' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/manual-topup", (req, res) => {
    const { personalNumber, amount } = req.body;
    const user = db.prepare("SELECT id, name FROM users WHERE personal_number = ?").get(personalNumber) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    db.transaction(() => {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, user.id);
      db.prepare("INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)").run(user.id);
      db.prepare("UPDATE user_stats SET total_recharge_sum = total_recharge_sum + ? WHERE user_id = ?").run(amount, user.id);
    })();
    
    // Auto Sync to Cloud
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    const updatedStats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id);
    syncToCloud("users", updatedUser);
    syncToCloud("user_stats", updatedStats);

    sendTelegramMessage(`💰 شحن يدوي\nالاسم: ${user.name}\nالرقم الشخصي: ${personalNumber}\nالمبلغ: ${amount}`);
    res.json({ success: true });
  });

  // Admin CRUD for Categories/Products
  app.post("/api/admin/categories", (req, res) => {
    const { name, image_url, special_id } = req.body;
    const result = db.prepare("INSERT INTO categories (name, image_url, special_id) VALUES (?, ?, ?)").run(name, image_url, special_id);
    
    // Auto Sync to Cloud
    const newCategory = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("categories", newCategory);

    res.json({ success: true });
  });

  app.post("/api/admin/subcategories", (req, res) => {
    const { category_special_id, name, image_url, special_id } = req.body;
    const category = db.prepare("SELECT id FROM categories WHERE special_id = ?").get(category_special_id) as any;
    if (!category) return res.status(404).json({ error: "Main category not found" });

    const result = db.prepare("INSERT INTO subcategories (category_id, name, image_url, special_id) VALUES (?, ?, ?, ?)").run(
      category.id, name, image_url, special_id
    );

    // Auto Sync to Cloud
    const newSubcategory = db.prepare("SELECT * FROM subcategories WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("subcategories", newSubcategory);

    res.json({ success: true });
  });

    app.post("/api/admin/sub-sub-categories", (req, res) => {
      const { subcategory_special_id, name, image_url, special_id } = req.body;
      if (!subcategory_special_id || !name || !special_id) return res.status(400).json({ error: "Missing fields" });
      try {
        const subcategory = db.prepare("SELECT id FROM subcategories WHERE special_id = ?").get(subcategory_special_id) as any;
        if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

        const result = db.prepare("INSERT INTO sub_sub_categories (subcategory_id, name, image_url, special_id) VALUES (?, ?, ?, ?)").run(subcategory.id, name, image_url, special_id);
        const newSubSub = db.prepare("SELECT * FROM sub_sub_categories WHERE id = ?").get(result.lastInsertRowid);
        syncToCloud("sub_sub_categories", newSubSub);
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    app.post("/api/admin/products", (req, res) => {
      const { category_special_id, subcategory_special_id, sub_sub_category_special_id, name, price, description, image_url, requires_input, store_type, min_quantity, price_per_unit, external_id } = req.body;
      
      const subcategory = db.prepare(`
        SELECT s.id FROM subcategories s 
        JOIN categories c ON s.category_id = c.id 
        WHERE c.special_id = ? AND s.special_id = ?
      `).get(category_special_id, subcategory_special_id) as any;

      if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

      let subSubCategoryId = null;
      if (sub_sub_category_special_id) {
        const subSub = db.prepare("SELECT id FROM sub_sub_categories WHERE special_id = ? AND subcategory_id = ?").get(sub_sub_category_special_id, subcategory.id) as any;
        if (subSub) subSubCategoryId = subSub.id;
      }

      const result = db.prepare(`
        INSERT INTO products (
          subcategory_id, sub_sub_category_id, name, price, description, 
          image_url, requires_input, store_type, min_quantity, 
          price_per_unit, external_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        subcategory.id, subSubCategoryId, name, price, description, 
        image_url, requires_input ? 1 : 0, store_type, min_quantity || null, 
        price_per_unit || null, external_id || null
      );

      // Auto Sync to Cloud
      const newProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
      syncToCloud("products", newProduct);

      res.json({ success: true });
    });

  app.post("/api/admin/payment-methods", (req, res) => {
    const { name, image_url, wallet_address, min_amount, instructions } = req.body;
    const result = db.prepare("INSERT INTO payment_methods (name, image_url, wallet_address, min_amount, instructions) VALUES (?, ?, ?, ?, ?)").run(
      name, image_url, wallet_address, min_amount, instructions || ""
    );

    // Auto Sync to Cloud
    const newMethod = db.prepare("SELECT * FROM payment_methods WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("payment_methods", newMethod);

    res.json({ success: true });
  });

  app.delete("/api/admin/categories/:id", (req, res) => {
    try {
      const itemsToSync: { table: string; data: any }[] = [];
      const itemsToDelete: { table: string; id: any }[] = [];

      db.transaction(() => {
        const subcategories = db.prepare("SELECT id FROM subcategories WHERE category_id = ?").all(req.params.id) as any[];
        for (const sub of subcategories) {
          // Handle sub-sub-categories
          const subSubs = db.prepare("SELECT id FROM sub_sub_categories WHERE subcategory_id = ?").all(sub.id) as any[];
          for (const ss of subSubs) {
            const products = db.prepare("SELECT id FROM products WHERE sub_sub_category_id = ?").all(ss.id) as any[];
            for (const prod of products) {
              const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(prod.id) as { count: number };
              if (orderCount.count > 0) {
                db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(prod.id);
                itemsToSync.push({ table: "products", data: db.prepare("SELECT * FROM products WHERE id = ?").get(prod.id) });
              } else {
                db.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
                itemsToDelete.push({ table: "products", id: prod.id });
              }
            }
            db.prepare("DELETE FROM sub_sub_categories WHERE id = ?").run(ss.id);
            itemsToDelete.push({ table: "sub_sub_categories", id: ss.id });
          }

          const products = db.prepare("SELECT id FROM products WHERE subcategory_id = ?").all(sub.id) as any[];
          for (const prod of products) {
            const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(prod.id) as { count: number };
            if (orderCount.count > 0) {
              db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(prod.id);
              itemsToSync.push({ table: "products", data: db.prepare("SELECT * FROM products WHERE id = ?").get(prod.id) });
            } else {
              db.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
              itemsToDelete.push({ table: "products", id: prod.id });
            }
          }
          
          const prodCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE subcategory_id = ?").get(sub.id) as { count: number };
          const subSubCount = db.prepare("SELECT COUNT(*) as count FROM sub_sub_categories WHERE subcategory_id = ?").get(sub.id) as { count: number };
          
          if (prodCount.count > 0 || subSubCount.count > 0) {
            db.prepare("UPDATE subcategories SET active = 0 WHERE id = ?").run(sub.id);
            itemsToSync.push({ table: "subcategories", data: db.prepare("SELECT * FROM subcategories WHERE id = ?").get(sub.id) });
          } else {
            db.prepare("DELETE FROM subcategories WHERE id = ?").run(sub.id);
            itemsToDelete.push({ table: "subcategories", id: sub.id });
          }
        }
        
        const subCount = db.prepare("SELECT COUNT(*) as count FROM subcategories WHERE category_id = ?").get(req.params.id) as { count: number };
        if (subCount.count > 0) {
          db.prepare("UPDATE categories SET active = 0 WHERE id = ?").run(req.params.id);
          itemsToSync.push({ table: "categories", data: db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id) });
        } else {
          db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
          itemsToDelete.push({ table: "categories", id: req.params.id });
        }
      })();

      // Perform cloud operations outside transaction
      for (const item of itemsToSync) syncToCloud(item.table, item.data);
      for (const item of itemsToDelete) deleteFromCloud(item.table, item.id);

      res.json({ success: true });
    } catch (e) {
      console.error("Delete category error:", e);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.delete("/api/admin/subcategories/:id", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        // Handle sub-sub-categories first
        const subSubs = db.prepare("SELECT id FROM sub_sub_categories WHERE subcategory_id = ?").all(req.params.id) as any[];
        for (const ss of subSubs) {
          const products = db.prepare("SELECT id FROM products WHERE sub_sub_category_id = ?").all(ss.id) as any[];
          for (const prod of products) {
            const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(prod.id) as { count: number };
            if (orderCount.count > 0) {
              db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(prod.id);
              syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(prod.id));
            } else {
              db.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
              deleteFromCloud("products", prod.id);
            }
          }
          db.prepare("DELETE FROM sub_sub_categories WHERE id = ?").run(ss.id);
          deleteFromCloud("sub_sub_categories", ss.id);
        }

        const products = db.prepare("SELECT id FROM products WHERE subcategory_id = ?").all(req.params.id) as any[];
        for (const prod of products) {
          const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(prod.id) as { count: number };
          if (orderCount.count > 0) {
            db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(prod.id);
            syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(prod.id));
          } else {
            db.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
            deleteFromCloud("products", prod.id);
          }
        }
        
        const prodCount = db.prepare("SELECT COUNT(*) as count FROM products WHERE subcategory_id = ?").get(req.params.id) as { count: number };
        const subSubCount = db.prepare("SELECT COUNT(*) as count FROM sub_sub_categories WHERE subcategory_id = ?").get(req.params.id) as { count: number };
        
        if (prodCount.count > 0 || subSubCount.count > 0) {
          db.prepare("UPDATE subcategories SET active = 0 WHERE id = ?").run(req.params.id);
          syncToCloud("subcategories", db.prepare("SELECT * FROM subcategories WHERE id = ?").get(req.params.id));
        } else {
          db.prepare("DELETE FROM subcategories WHERE id = ?").run(req.params.id);
          deleteFromCloud("subcategories", req.params.id);
        }
      });
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete subcategory" });
    }
  });

  app.delete("/api/admin/products/:id", (req, res) => {
    // Check if product has orders
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(req.params.id) as { count: number };
    if (orderCount.count > 0) {
      // If it has orders, just mark as unavailable to preserve history
      db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(req.params.id);
      syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
    } else {
      // If no orders, hard delete
      db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
      deleteFromCloud("products", req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/admin/sub-sub-categories/:id", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        const products = db.prepare("SELECT id FROM products WHERE sub_sub_category_id = ?").all(req.params.id) as any[];
        for (const prod of products) {
          const orderCount = db.prepare("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(prod.id) as { count: number };
          if (orderCount.count > 0) {
            db.prepare("UPDATE products SET available = 0 WHERE id = ?").run(prod.id);
            syncToCloud("products", db.prepare("SELECT * FROM products WHERE id = ?").get(prod.id));
          } else {
            db.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
            deleteFromCloud("products", prod.id);
          }
        }
        db.prepare("DELETE FROM sub_sub_categories WHERE id = ?").run(req.params.id);
        deleteFromCloud("sub_sub_categories", req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete sub-sub-category" });
    }
  });

  app.delete("/api/admin/payment-methods/:id", (req, res) => {
    // Check if payment method has transactions
    const transactionCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE payment_method_id = ?").get(req.params.id) as { count: number };
    if (transactionCount.count > 0) {
      // If it has transactions, just mark as inactive
      db.prepare("UPDATE payment_methods SET active = 0 WHERE id = ?").run(req.params.id);
      syncToCloud("payment_methods", db.prepare("SELECT * FROM payment_methods WHERE id = ?").get(req.params.id));
    } else {
      // If no transactions, hard delete
      db.prepare("DELETE FROM payment_methods WHERE id = ?").run(req.params.id);
      deleteFromCloud("payment_methods", req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/admin/banners/:id", (req, res) => {
    db.prepare("DELETE FROM banners WHERE id = ?").run(req.params.id);
    deleteFromCloud("banners", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/offers/:id", (req, res) => {
    db.prepare("DELETE FROM offers WHERE id = ?").run(req.params.id);
    deleteFromCloud("offers", req.params.id);
    res.json({ success: true });
  });

  app.post("/api/report-error", async (req, res) => {
    const { error, stack, userInfo } = req.body;
    const adminChatId = process.env.TELEGRAM_CHAT_ID;
    if (adminChatId && adminBot) {
      const msg = `🚨 خطأ برمجي جديد:\n\nError: ${error}\nUser: ${JSON.stringify(userInfo)}\n\nStack: ${stack?.substring(0, 500)}`;
      adminBot.sendMessage(adminChatId, msg);
    }
    res.json({ success: true });
  });

  app.post("/api/admin/banners", (req, res) => {
    const { image_url } = req.body;
    const result = db.prepare("INSERT INTO banners (image_url) VALUES (?)").run(image_url);
    
    // Auto Sync to Cloud
    const newBanner = db.prepare("SELECT * FROM banners WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("banners", newBanner);

    res.json({ success: true });
  });

  app.delete("/api/admin/banners/:id", (req, res) => {
    db.prepare("DELETE FROM banners WHERE id = ?").run(req.params.id);
    deleteFromCloud("banners", req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, phone, balance, role, personal_number, is_vip, created_at FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });

  app.post("/api/admin/users/:id/vip", (req, res) => {
    const { isVip } = req.body;
    db.prepare("UPDATE users SET is_vip = ? WHERE id = ?").run(isVip ? 1 : 0, req.params.id);
    
    // Auto Sync to Cloud
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    syncToCloud("users", updatedUser);

    res.json({ success: true });
  });

  app.post("/api/admin/offers", (req, res) => {
    const { title, description, image_url } = req.body;
    const result = db.prepare("INSERT INTO offers (title, description, image_url) VALUES (?, ?, ?)").run(title, description, image_url);
    
    // Auto Sync to Cloud
    const newOffer = db.prepare("SELECT * FROM offers WHERE id = ?").get(result.lastInsertRowid);
    syncToCloud("offers", newOffer);

    res.json({ success: true });
  });

  app.delete("/api/admin/offers/:id", (req, res) => {
    db.prepare("DELETE FROM offers WHERE id = ?").run(req.params.id);
    deleteFromCloud("offers", req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM notifications WHERE user_id = ?").run(req.params.id);
        db.prepare("DELETE FROM voucher_uses WHERE user_id = ?").run(req.params.id);
        db.prepare("DELETE FROM transactions WHERE user_id = ?").run(req.params.id);
        
        const orders = db.prepare("SELECT id FROM orders WHERE user_id = ?").all(req.params.id) as any[];
        for (const order of orders) {
          db.prepare("DELETE FROM order_items WHERE order_id = ?").run(order.id);
          db.prepare("DELETE FROM orders WHERE id = ?").run(order.id);
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
        deleteFromCloud("users", req.params.id);
      })();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/export-db", (req, res) => {
    const tables = ["users", "categories", "subcategories", "products", "orders", "order_items", "transactions", "settings", "banners", "offers"];
    const data: any = {};
    tables.forEach(table => {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    });
    res.json(data);
  });

  app.post("/api/admin/import-db", express.json({ limit: '50mb' }), (req, res) => {
    const data = req.body;
    const tables = [
      "users", "categories", "subcategories", "sub_sub_categories", "products", 
      "payment_methods", "banners", "offers", "vouchers", "voucher_uses", 
      "orders", "order_items", "transactions", "settings", "notifications", 
      "messages", "daily_message_counts", "user_stats", "telegram_linking_codes", "push_subscriptions"
    ];
    
    try {
      db.exec("PRAGMA foreign_keys = OFF");
      const importTransaction = db.transaction(() => {
        // Delete in reverse order to respect FKs
        [...tables].reverse().forEach(table => {
          if (data[table]) {
            db.prepare(`DELETE FROM ${table}`).run();
          }
        });

        // Insert in forward order
        tables.forEach(table => {
          if (data[table]) {
            const rows = data[table];
            if (rows.length > 0) {
              const columns = Object.keys(rows[0]);
              const placeholders = columns.map(() => "?").join(",");
              const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`);
              rows.forEach((row: any) => {
                const values = columns.map(col => row[col]);
                stmt.run(...values);
              });
            }
          }
        });
      });
      importTransaction();
      db.exec("PRAGMA foreign_keys = ON");
      res.json({ success: true });
    } catch (e: any) {
      db.exec("PRAGMA foreign_keys = ON");
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/clear-db", (req, res) => {
    const tables = ["users", "categories", "subcategories", "products", "orders", "order_items", "transactions", "settings", "banners", "offers"];
    try {
      const clearTransaction = db.transaction(() => {
        tables.forEach(table => {
          db.prepare(`DELETE FROM ${table}`).run();
        });
        // Re-insert default settings if needed
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('privacy_policy', 'سياسة الخصوصية الافتراضية');
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('support_whatsapp', '9640000000000');
      });
      clearTransaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/sync-to-cloud", async (req, res) => {
    if (!supabase) return res.status(400).json({ error: "Supabase not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to environment variables." });

    try {
      const tables = ["users", "categories", "subcategories", "sub_sub_categories", "products", "orders", "order_items", "transactions", "settings", "banners", "offers", "payment_methods", "vouchers", "voucher_uses", "user_stats"];
      
      const results: any = {};
      for (const table of tables) {
        const rows = db.prepare(`SELECT * FROM ${table}`).all();
        if (rows.length > 0) {
          let onConflict = 'id';
          if (table === 'settings') onConflict = 'key';
          if (table === 'vouchers') onConflict = 'code';
          if (table === 'user_stats') onConflict = 'user_id';

          const { error } = await supabase.from(table).upsert(rows, { onConflict });
          if (error) {
            results[table] = error.message;
          } else {
            results[table] = "success";
          }
        } else {
          results[table] = "empty";
        }
      }
      
      res.json({ success: true, details: results });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/sync-from-cloud", async (req, res) => {
    try {
      await pullAllFromCloud();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/backup-db", (req, res) => {
    const dbPath = path.join(__dirname, "database.db");
    if (fs.existsSync(dbPath)) {
      res.download(dbPath);
    } else {
      res.status(404).json({ error: "Database file not found" });
    }
  });

  // Global error handler for API routes
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- Secondary Telegram Bot for Users ---
  const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!userBotToken) {
    console.warn("TELEGRAM_USER_BOT_TOKEN is not defined. User bot will not start.");
    return;
  }
  
  // Graceful shutdown for Telegram bots and Database
  const shutdown = () => {
    console.log("Shutting down gracefully...");
    if (userBot) {
      console.log("Stopping User Telegram bot polling...");
      userBot.stopPolling();
    }
    if (adminBot) {
      console.log("Stopping Admin Telegram bot polling...");
      adminBot.stopPolling();
    }
    if (db) {
      console.log("Closing SQLite database...");
      db.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // In case of uncaught exception, we might want to shutdown gracefully
    // but be careful not to enter an infinite loop if shutdown itself fails
    // shutdown(); 
  });

  // Add a small delay to avoid 409 conflict during rapid restarts
  setTimeout(() => {
    userBot = new TelegramBot(userBotToken, { 
      polling: {
        autoStart: true,
        params: {
          timeout: 10
        }
      } 
    });

    // Handle polling errors to avoid crashing or flooding logs
    userBot.on("polling_error", (error: any) => {
      if (error.message.includes("409 Conflict")) {
        console.log("Telegram bot conflict: Another instance is running. This is common during rapid restarts.");
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('ECONNRESET') || error.message.includes('EFATAL')) {
        // These are common network issues, log as info instead of error
        console.log(`Telegram bot network issue (${error.code || 'ECONNRESET/EFATAL'}). Reconnecting...`);
      } else {
        console.error("Telegram polling error:", error);
      }
    });

    userBot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const startParam = match?.[1];
      userStates.delete(chatId);
      
      if (startParam) {
        // Check if it's a linking code
        const linkingCode = db.prepare("SELECT * FROM telegram_linking_codes WHERE code = ? AND expires_at > ?").get(startParam, new Date().toISOString()) as any;
        if (linkingCode) {
          db.prepare("UPDATE users SET telegram_chat_id = ? WHERE id = ?").run(chatId, linkingCode.user_id);
          db.prepare("DELETE FROM telegram_linking_codes WHERE id = ?").run(linkingCode.id);
          const user = db.prepare("SELECT * FROM users WHERE id = ?").get(linkingCode.user_id) as any;
          userBot.sendMessage(chatId, "✅ تم ربط حسابك بنجاح!");
          sendMainMenu(chatId, user, userBot);
          return;
        }
        
        // Check if it's a referral code (personal number)
        const referrer = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(startParam) as any;
        if (referrer) {
          userStates.set(chatId, { step: "register_name", data: { referralCode: startParam } });
          userBot.sendMessage(chatId, `مرحباً بك! لقد تمت دعوتك بواسطة المستخدم ${startParam}.\nيرجى إدخال اسمك الكامل لإنشاء حساب:`);
          return;
        }
      }

      const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
      
      if (user) {
        sendMainMenu(chatId, user, userBot);
      } else {
        userBot.sendMessage(chatId, "يرجى تسجيل الدخول أو إنشاء حساب للمتابعة:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "تسجيل الدخول", callback_data: "login" }],
              [{ text: "إنشاء حساب جديد", callback_data: "register" }],
              [{ text: "تسجيل عبر كود الربط", callback_data: "login_with_code" }]
            ]
          }
        });
      }
    });

    userBot.on("callback_query", async (query) => {
      const chatId = query.message?.chat.id;
      if (!chatId) return;
      const data = query.data;

      if (data === "login") {
        userStates.set(chatId, { step: "login_email", data: {} });
        userBot.sendMessage(chatId, "يرجى إدخال البريد الإلكتروني:");
      } else if (data === "register") {
        userStates.set(chatId, { step: "register_name", data: {} });
        userBot.sendMessage(chatId, "يرجى إدخال اسمك الكامل:");
      } else if (data === "redeem_voucher") {
        userStates.set(chatId, { step: "redeem_voucher_code", data: {} });
        userBot.sendMessage(chatId, "يرجى إدخال كود القسيمة:");
      } else if (data === "privacy_policy") {
        const settings = db.prepare("SELECT value FROM settings WHERE key = 'privacy_policy'").get() as { value: string };
        userBot.sendMessage(chatId, `📄 سياسة الخصوصية:\n\n${settings?.value || "لا توجد سياسة حالياً."}`);
      } else if (data === "offers") {
        const offers = db.prepare("SELECT * FROM offers").all() as any[];
        if (offers.length === 0) return userBot.sendMessage(chatId, "لا توجد عروض حالياً.");
        offers.forEach(o => {
          userBot.sendMessage(chatId, `🔥 ${o.title}\n${o.description}`, {
            reply_markup: { inline_keyboard: [[{ text: "عرض الصورة", url: o.image_url }]] }
          });
        });
      } else if (data === "logout_bot") {
        db.prepare("UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = ?").run(chatId);
        userBot.sendMessage(chatId, "👋 تم تسجيل الخروج بنجاح. يمكنك العودة في أي وقت!");
      } else if (data === "main_menu") {
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        if (user) sendMainMenu(chatId, user, userBot);
      } else if (data === "my_balance") {
        const user = db.prepare("SELECT balance FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        userBot.sendMessage(chatId, `💰 رصيدك الحالي هو: ${user.balance.toFixed(2)} $`);
      } else if (data === "my_info") {
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        userBot.sendMessage(chatId, `👤 معلوماتي:\nالاسم: ${user.name}\nالإيميل: ${user.email}\nرقم الدخول: ${user.id}\nالرقم الشخصي: ${user.personal_number}\nالحالة: ${user.is_vip ? 'VIP 💎' : 'عادي'}`);
      } else if (data === "my_orders") {
        const orders = db.prepare(`
          SELECT o.id, p.name, o.total_amount, o.status 
          FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN products p ON oi.product_id = p.id 
          WHERE o.user_id = (SELECT id FROM users WHERE telegram_chat_id = ?) 
          ORDER BY o.created_at DESC LIMIT 5
        `).all(chatId) as any[];
        if (orders.length === 0) return userBot.sendMessage(chatId, "ليس لديك طلبات سابقة.");
        let text = "📦 آخر 5 طلبات لك:\n\n";
        orders.forEach(o => {
          text += `🔹 طلب #${o.id}\nالمنتج: ${o.name}\nالمبلغ: ${o.total_amount}$\nالحالة: ${o.status}\n\n`;
        });
        userBot.sendMessage(chatId, text);
      } else if (data === "my_payments") {
        const txs = db.prepare(`
          SELECT t.id, t.amount, t.status, pm.name as method 
          FROM transactions t 
          JOIN payment_methods pm ON t.payment_method_id = pm.id 
          WHERE t.user_id = (SELECT id FROM users WHERE telegram_chat_id = ?) 
          ORDER BY t.created_at DESC LIMIT 5
        `).all(chatId) as any[];
        if (txs.length === 0) return userBot.sendMessage(chatId, "ليس لديك عمليات شحن سابقة.");
        let text = "💳 آخر 5 عمليات شحن لك:\n\n";
        txs.forEach(t => {
          text += `🔹 شحن #${t.id}\nالمبلغ: ${t.amount}$\nالطريقة: ${t.method}\nالحالة: ${t.status}\n\n`;
        });
        userBot.sendMessage(chatId, text);
      } else if (data === "referral") {
        const user = db.prepare("SELECT personal_number FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        const count = db.prepare("SELECT COUNT(*) as count FROM users WHERE referred_by_id = (SELECT id FROM users WHERE telegram_chat_id = ?)").get(chatId) as { count: number };
        const referralLink = `https://t.me/${(await userBot.getMe()).username}?start=${user.personal_number}`;
        userBot.sendMessage(chatId, `🔗 نظام الإحالة:\n\nرابط الإحالة الخاص بك:\n${referralLink}\n\nعدد المستخدمين المسجلين عبر رابطك: ${count.count}\n\nتحصل على عمولة 5% عن كل عملية شراء يقوم بها أصدقاؤك!`);
      } else if (data === "rewards") {
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id) as any;
        const goals = [5, 15, 30, 50, 100, 200, 500];
        const rewards = [
          "خصم 1% لمدة شهر",
          "1$ رصيد + خصم 2% لمدة شهر",
          "3$ رصيد + خصم 4% لمدة شهر + كوبون 10%",
          "5$ رصيد + خصم 5% لمدة سنة",
          "5$ رصيد + خصم 7% + كوبون 15% + شارة فضية + ثيم أصفر",
          "10$ رصيد + خصم 10% + كوبون 15% + شارة ذهبية + ثيم بنفسجي",
          "20$ رصيد + خصم 10% + كوبون 20% + شارة ذهبية أسطورية + دعم خاص + أولوية"
        ];

        let text = `🎁 نظام المكافآت:\n\nإجمالي شحنك: ${stats.total_recharge_sum.toFixed(2)}$\n\n`;
        const keyboard = [];

        for (let i = 0; i < goals.length; i++) {
          const isClaimed = stats.claimed_reward_index >= i;
          const canClaim = stats.total_recharge_sum >= goals[i] && stats.claimed_reward_index === i - 1;
          const status = isClaimed ? "✅ تم الاستلام" : (stats.total_recharge_sum >= goals[i] ? "🔓 جاهز للاستلام" : `🔒 يتبقى ${(goals[i] - stats.total_recharge_sum).toFixed(2)}$`);
          
          text += `${i + 1}. هدف ${goals[i]}$:\n🎁 ${rewards[i]}\nالحالة: ${status}\n\n`;
          
          if (canClaim) {
            keyboard.push([{ text: `🎁 استلام مكافأة ${goals[i]}$`, callback_data: `claim_reward_${i}` }]);
          }
        }
        
        keyboard.push([{ text: "الرجوع للقائمة الرئيسية", callback_data: "main_menu" }]);
        userBot.sendMessage(chatId, text, { reply_markup: { inline_keyboard: keyboard } });
      } else if (data?.startsWith("claim_reward_")) {
        const goalIndex = parseInt(data.split("_")[2]);
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        
        // Use the existing claim logic by calling the internal function or duplicating logic
        // For simplicity and safety, I'll duplicate the logic here or wrap it in a function
        const stats = db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id) as any;
        const goals = [5, 15, 30, 50, 100, 200, 500];
        
        if (stats.claimed_reward_index >= goalIndex) {
          return userBot.sendMessage(chatId, "❌ لقد استلمت هذه المكافأة مسبقاً.");
        }
        if (stats.total_recharge_sum < goals[goalIndex]) {
          return userBot.sendMessage(chatId, "❌ لم تصل لهذا الهدف بعد.");
        }
        if (goalIndex > 0 && stats.claimed_reward_index < goalIndex - 1) {
          return userBot.sendMessage(chatId, "❌ يرجى استلام المكافآت السابقة أولاً.");
        }

        try {
          db.transaction(() => {
            db.prepare("UPDATE user_stats SET claimed_reward_index = ? WHERE user_id = ?").run(goalIndex, user.id);
            const now = new Date();
            const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

            if (goalIndex === 0) {
              db.prepare("UPDATE user_stats SET active_discount = 1, discount_expires_at = ? WHERE user_id = ?").run(oneMonth, user.id);
            } else if (goalIndex === 1) {
              db.prepare("UPDATE users SET balance = balance + 1 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 2, discount_expires_at = ? WHERE user_id = ?").run(oneMonth, user.id);
            } else if (goalIndex === 2) {
              db.prepare("UPDATE users SET balance = balance + 3 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 4, discount_expires_at = ?, one_product_discount_percent = 10 WHERE user_id = ?").run(oneMonth, user.id);
            } else if (goalIndex === 3) {
              db.prepare("UPDATE users SET balance = balance + 5 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 5, discount_expires_at = ? WHERE user_id = ?").run(oneYear, user.id);
            } else if (goalIndex === 4) {
              db.prepare("UPDATE users SET balance = balance + 5 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 7, discount_expires_at = ?, one_product_discount_percent = 15, profile_badge = 'silver', custom_theme_color = 'yellow' WHERE user_id = ?").run(oneMonth, user.id);
            } else if (goalIndex === 5) {
              db.prepare("UPDATE users SET balance = balance + 10 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 10, discount_expires_at = ?, one_product_discount_percent = 15, profile_badge = 'gold', custom_theme_color = 'red' WHERE user_id = ?").run(oneMonth, user.id);
            } else if (goalIndex === 6) {
              db.prepare("UPDATE users SET balance = balance + 20 WHERE id = ?").run(user.id);
              db.prepare("UPDATE user_stats SET active_discount = 10, discount_expires_at = ?, one_product_discount_percent = 20, profile_badge = 'gold_legendary', custom_theme_color = 'any', has_special_support = 1, has_priority_orders = 1 WHERE user_id = ?").run(oneMonth, user.id);
            }
          })();
          
          syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
          syncToCloud("user_stats", db.prepare("SELECT * FROM user_stats WHERE user_id = ?").get(user.id));
          
          userBot.sendMessage(chatId, `✅ تم استلام مكافأة هدف ${goals[goalIndex]}$ بنجاح!`);
        } catch (e) {
          console.error(e);
          userBot.sendMessage(chatId, "❌ حدث خطأ أثناء استلام المكافأة.");
        }
      } else if (data === "share") {
        const user = db.prepare("SELECT personal_number FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        const referralLink = `https://t.me/${(await userBot.getMe()).username}?start=${user.personal_number}`;
        userBot.sendMessage(chatId, `شارك البوت مع أصدقائك واحصل على عمولات!`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "مشاركة الرابط", url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('اشحن ألعابك وتطبيقاتك المفضلة عبر بوت فيبرو!')}` }]
            ]
          }
        });
      } else if (data === "topup_balance") {
        const user = db.prepare("SELECT id FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        if (!user) return userBot.sendMessage(chatId, "يرجى تسجيل الدخول أولاً.");
        
        const pendingCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = 'pending'").get(user.id) as { count: number };
        if (pendingCount.count >= 2) {
          return userBot.sendMessage(chatId, "⚠️ لا يمكنك إرسال أكثر من مدفوعتين قيد المراجعة. يرجى الانتظار حتى يتم التحقق من طلباتك السابقة.");
        }

        const methods = db.prepare("SELECT * FROM payment_methods WHERE active = 1").all() as any[];
        const keyboard = methods.map(m => [{ text: m.name, callback_data: `topup_method_${m.id}` }]);
        userBot.sendMessage(chatId, "اختر طريقة الدفع:", { reply_markup: { inline_keyboard: keyboard } });
      } else if (data?.startsWith("topup_method_")) {
        const methodId = data.split("_")[2];
        const method = db.prepare("SELECT * FROM payment_methods WHERE id = ?").get(methodId) as any;
        userStates.set(chatId, { step: "topup_amount", data: { methodId } });
        userBot.sendMessage(chatId, `💳 طريقة الدفع: ${method.name}\nالعنوان: ${method.wallet_address}\nالحد الأدنى: ${method.min_amount} $\n\n${method.instructions || ""}\n\nيرجى إدخال المبلغ المراد شحنه ($):`);
      } else if (data === "login_with_code") {
        userStates.set(chatId, { step: "login_with_code", data: {} });
        userBot.sendMessage(chatId, "🆔 يرجى إدخال كود الربط المؤقت من الموقع:");
      } else if (data === "charge_apps") {
        const categories = db.prepare("SELECT * FROM categories WHERE active = 1").all() as any[];
        const keyboard = categories.map(c => [{ text: c.name, callback_data: `cat_${c.id}` }]);
        userBot.sendMessage(chatId, "اختر القسم:", {
          reply_markup: { inline_keyboard: keyboard }
        });
      } else if (data?.startsWith("cat_")) {
        const catId = data.split("_")[1];
        const subs = db.prepare("SELECT * FROM subcategories WHERE category_id = ? AND active = 1").all(catId) as any[];
        const keyboard = subs.map(s => [{ text: s.name, callback_data: `sub_${s.id}` }]);
        userBot.sendMessage(chatId, "اختر القسم الفرعي:", {
          reply_markup: { inline_keyboard: keyboard }
        });
      } else if (data?.startsWith("sub_")) {
        const subId = data.split("_")[1];
        const products = db.prepare("SELECT * FROM products WHERE subcategory_id = ? AND available = 1").all(subId) as any[];
        const keyboard = products.map(p => [{ text: `${p.name} - ${p.price}$`, callback_data: `buy_${p.id}` }]);
        userBot.sendMessage(chatId, "اختر المنتج للشراء:", {
          reply_markup: { inline_keyboard: keyboard }
        });
      } else if (data?.startsWith("buy_")) {
        const prodId = data.split("_")[1];
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(prodId) as any;
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        
        if (!user) return userBot.sendMessage(chatId, "يرجى تسجيل الدخول أولاً.");
        
        const price = user.is_vip ? product.price * 0.95 : product.price;
        
        if (user.balance < price) {
          return userBot.sendMessage(chatId, `❌ رصيدك غير كافٍ. السعر: ${price.toFixed(2)}$ ورصيدك: ${user.balance.toFixed(2)}$`);
        }

        if (product.requires_input || product.store_type === 'quick_order') {
          const prompt = product.store_type === 'quick_order' ? "يرجى إدخال معرف اللاعب (ID):" : "يرجى إدخال البيانات المطلوبة للمنتج:";
          userStates.set(chatId, { step: "purchase_input", data: { productId: prodId, price } });
          userBot.sendMessage(chatId, prompt);
        } else {
          // Direct purchase
          processBotOrder(chatId, user, product, price, {});
        }
      }
    });

    async function processBotOrder(chatId: number, user: any, product: any, price: number, extraData: any) {
      try {
        const transaction = db.transaction(() => {
          db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(price, user.id);
          const orderResult = db.prepare("INSERT INTO orders (user_id, total_amount, meta) VALUES (?, ?, ?)").run(user.id, price, JSON.stringify(extraData));
          db.prepare("INSERT INTO order_items (order_id, product_id, price_at_purchase, quantity, extra_data) VALUES (?, ?, ?, ?, ?)").run(
            orderResult.lastInsertRowid, product.id, product.price, 1, JSON.stringify(extraData)
          );
          return orderResult.lastInsertRowid;
        });

        const orderId = transaction();
        
        // Sync
        syncToCloud("orders", db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId));
        syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));

        userBot.sendMessage(chatId, `✅ تمت عملية الشراء بنجاح!\nرقم الطلب: ${orderId}\nالمنتج: ${product.name}\nالمبلغ المخصوم: ${price.toFixed(2)}$`);
        // Notify Admin
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        if (adminChatId) {
          const adminMsg = `🔔 طلب جديد من البوت #ORD${orderId}\nالاسم: ${user.name}\nProduct: ${product.name}\nTotal: ${price}`;
          adminBot?.sendMessage(adminChatId, adminMsg);
        }
      } catch (e) {
        console.error(e);
        userBot.sendMessage(chatId, "❌ حدث خطأ أثناء معالجة الطلب.");
      }
    }

    adminBot.onText(/\/nall/, (msg) => {
      const chatId = msg.chat.id;
      userStates.set(chatId, { step: "admin_broadcast_msg", data: {} });
      adminBot.sendMessage(chatId, "يرجى إدخال نص الإشعار العام:");
    });

    // User Bot Logic (Handled above in onText(/\/start/))
    userBot.on("message", async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const photo = msg.photo;

      if (text && text.length === 6 && /^[A-Z0-9]+$/.test(text.toUpperCase())) {
        const code = text.toUpperCase();
        const linkingCode = db.prepare("SELECT * FROM telegram_linking_codes WHERE code = ? AND expires_at > CURRENT_TIMESTAMP").get(code) as any;
        if (linkingCode) {
          const user = db.prepare("SELECT * FROM users WHERE id = ?").get(linkingCode.user_id) as any;
          db.prepare("UPDATE users SET telegram_chat_id = ? WHERE id = ?").run(chatId, user.id);
          db.prepare("DELETE FROM telegram_linking_codes WHERE id = ?").run(linkingCode.id);
          userStates.delete(chatId);
          userBot.sendMessage(chatId, "✅ تم تسجيل الدخول بنجاح عبر الكود!");
          sendMainMenu(chatId, user, userBot);
          return;
        }
      }

      if (photo) {
        const state = userStates.get(chatId);
        if (state && state.step === "topup_receipt") {
          const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
          const photoItem = photo[photo.length - 1];
          userBot.sendMessage(chatId, "⏳ جاري معالجة الإيصال، يرجى الانتظار...");

          try {
            const file = await userBot.getFile(photoItem.file_id);
            const userBotToken = process.env.TELEGRAM_USER_BOT_TOKEN;
            const fileUrl = `https://api.telegram.org/file/bot${userBotToken}/${file.file_path}`;
            const fileRes = await fetch(fileUrl);
            const buffer = await fileRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            const imgbbKey = process.env.IMGBB_API_KEY || "5d069b43efb47ed02b0a00a4069f53f9";
            const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
              method: 'POST',
              body: new URLSearchParams({ image: base64 })
            });
            const imgbbData = await imgbbRes.json() as any;

            if (!imgbbData.success) {
              console.error("ImgBB Error:", imgbbData);
              throw new Error(`ImgBB upload failed: ${imgbbData.error?.message || "Unknown error"}`);
            }

            const receiptUrl = imgbbData.data.url;
            const method = db.prepare("SELECT name FROM payment_methods WHERE id = ?").get(state.data.methodId) as any;

            const result = db.prepare("INSERT INTO transactions (user_id, type, amount, status, payment_method_id, receipt_url) VALUES (?, ?, ?, ?, ?, ?)").run(
              user.id, 'deposit', state.data.amount, 'pending', state.data.methodId, receiptUrl
            );

            syncToCloud("transactions", db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid));

            // Notify Admin
            const adminChatId = process.env.TELEGRAM_CHAT_ID;
            if (adminChatId) {
              const adminMsg = `💰 طلب شحن جديد! #TX${result.lastInsertRowid}\n\nالمستخدم: ${user.name}\nالمبلغ: ${state.data.amount}$\nالطريقة: ${method.name}\n\nرابط الإيصال: ${receiptUrl}`;
              adminBot?.sendMessage(adminChatId, adminMsg, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "✅ قبول", callback_data: `approve_tx_${result.lastInsertRowid}` }, { text: "❌ رفض", callback_data: `reject_tx_${result.lastInsertRowid}` }]
                  ]
                }
              });
            }

            userBot.sendMessage(chatId, "✅ تم إرسال طلب الشحن بنجاح! سيتم مراجعته من قبل الإدارة قريباً.");
            userStates.delete(chatId);
          } catch (error) {
            console.error("Receipt upload error:", error);
            userBot.sendMessage(chatId, "❌ حدث خطأ أثناء رفع الإيصال. يرجى المحاولة مرة أخرى.");
          }
          return;
        }
      }

      if (!text || text.startsWith("/")) return;

      // Handle persistent keyboard buttons (Bottom Keyboard)
      if (text === "💬 الدعم الفني") {
        const settings = db.prepare("SELECT value FROM settings WHERE key = 'support_whatsapp'").get() as { value: string };
        const whatsappLink = settings ? `https://wa.me/${settings.value.replace('+', '')}` : "https://t.me/your_support_username";
        return userBot.sendMessage(chatId, `يمكنك التواصل مع الدعم الفني عبر الرابط التالي:\n${whatsappLink}`);
      } else if (text === "📄 سياسة الخصوصية") {
        const settings = db.prepare("SELECT value FROM settings WHERE key = 'privacy_policy'").get() as { value: string };
        return userBot.sendMessage(chatId, `📄 سياسة الخصوصية:\n\n${settings?.value || "لا توجد سياسة حالياً."}`);
      } else if (text === "🚪 تسجيل الخروج") {
        db.prepare("UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = ?").run(chatId);
        return userBot.sendMessage(chatId, "👋 تم تسجيل الخروج بنجاح. يمكنك العودة في أي وقت!");
      }

      const state = userStates.get(chatId);
      if (!state) return;

      if (state.step === "login_with_code") {
        const code = text.toUpperCase();
        const linkingCode = db.prepare("SELECT * FROM telegram_linking_codes WHERE code = ? AND expires_at > CURRENT_TIMESTAMP").get(code) as any;
        if (!linkingCode) {
          userBot.sendMessage(chatId, "❌ الكود غير صحيح أو منتهي الصلاحية.");
          userStates.delete(chatId);
          return;
        }
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(linkingCode.user_id) as any;
        db.prepare("UPDATE users SET telegram_chat_id = ? WHERE id = ?").run(chatId, user.id);
        db.prepare("DELETE FROM telegram_linking_codes WHERE id = ?").run(linkingCode.id);
        userStates.delete(chatId);
        userBot.sendMessage(chatId, "✅ تم تسجيل الدخول بنجاح!");
        sendMainMenu(chatId, user, userBot);
      } else if (state.step === "topup_amount") {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) return userBot.sendMessage(chatId, "❌ يرجى إدخال مبلغ صحيح:");
        state.data.amount = amount;
        state.step = "topup_receipt";
        userBot.sendMessage(chatId, "📸 يرجى رفع صورة إيصال التحويل:");
      } else if (state.step === "redeem_voucher_code") {
        const voucherCode = text;
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        const voucher = db.prepare("SELECT * FROM vouchers WHERE code = ? AND active = 1").get(voucherCode) as any;

        if (!voucher) {
          userBot.sendMessage(chatId, "❌ كود القسيمة غير صحيح أو غير مفعل.");
          userStates.delete(chatId);
          return;
        }

        const usage = db.prepare("SELECT id FROM voucher_uses WHERE voucher_id = ? AND user_id = ?").get(voucher.id, user.id);
        if (usage) {
          userBot.sendMessage(chatId, "❌ لقد استخدمت هذه القسيمة مسبقاً.");
          userStates.delete(chatId);
          return;
        }

        db.transaction(() => {
          db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(voucher.amount, user.id);
          db.prepare("INSERT INTO voucher_uses (voucher_id, user_id) VALUES (?, ?)").run(voucher.id, user.id);
        })();

        syncToCloud("users", db.prepare("SELECT * FROM users WHERE id = ?").get(user.id));
        userBot.sendMessage(chatId, `✅ تم استرداد القسيمة بنجاح! تم إضافة ${voucher.amount}$ لرصيدك.`);
        userStates.delete(chatId);
      } else if (state.step === "purchase_input") {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(state.data.productId) as any;
        const user = db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(chatId) as any;
        const extraData = product.store_type === 'quick_order' ? { playerId: text, storeType: 'quick_order' } : { input: text };
        
        userStates.delete(chatId);
        processBotOrder(chatId, user, product, state.data.price, extraData);
      } else if (state.step === "login_email") {
        state.data.email = text;
        state.step = "login_password";
        userBot.sendMessage(chatId, "يرجى إدخال كلمة المرور:");
      } else if (state.step === "login_password") {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(state.data.email) as any;
        if (user) {
          const isMatch = await bcrypt.compare(text, user.password_hash);
          if (isMatch) {
            db.prepare("UPDATE users SET telegram_chat_id = ? WHERE id = ?").run(chatId, user.id);
            userStates.delete(chatId);
            userBot.sendMessage(chatId, "✅ تم تسجيل الدخول بنجاح!");
            sendMainMenu(chatId, user, userBot);
            return;
          }
        }
        userBot.sendMessage(chatId, "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى /start");
        userStates.delete(chatId);
      } else if (state.step === "register_name") {
        state.data.name = text;
        state.step = "register_email";
        userBot.sendMessage(chatId, "يرجى إدخال البريد الإلكتروني:");
      } else if (state.step === "register_email") {
        state.data.email = text;
        state.step = "register_phone";
        userBot.sendMessage(chatId, "يرجى إدخال رقم الهاتف:");
      } else if (state.step === "register_phone") {
        state.data.phone = text;
        state.step = "register_password";
        userBot.sendMessage(chatId, "يرجى إدخال كلمة المرور:");
      } else if (state.step === "register_password") {
        state.data.password = text;
        try {
          let personalNumber = "";
          while (true) {
            personalNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
            const existing = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(personalNumber);
            if (!existing) break;
          }

          let referredById = null;
          if (state.data.referralCode) {
            const referrer = db.prepare("SELECT id FROM users WHERE personal_number = ?").get(state.data.referralCode) as any;
            if (referrer) referredById = referrer.id;
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(state.data.password, salt);

          const result = db.prepare("INSERT INTO users (name, email, password_hash, phone, personal_number, telegram_chat_id, referred_by_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
            state.data.name, state.data.email, hashedPassword, state.data.phone, personalNumber, chatId, referredById
          );
          const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
          userStates.delete(chatId);
          userBot.sendMessage(chatId, "✅ تم إنشاء الحساب بنجاح!");
          sendMainMenu(chatId, user, userBot);
        } catch (e) {
          console.error(e);
          userBot.sendMessage(chatId, "❌ حدث خطأ (ربما البريد مستخدم مسبقاً). حاول مرة أخرى /start");
          userStates.delete(chatId);
        }
      }
    });
  }, 2000);

  function sendMainMenu(chatId: number, user: any, bot: TelegramBot) {
    const settings = db.prepare("SELECT value FROM settings WHERE key = 'support_whatsapp'").get() as { value: string };
    const whatsappLink = settings ? `https://wa.me/${settings.value.replace('+', '')}` : "https://t.me/your_support_username";

    // Set the bottom keyboard (Reply Keyboard)
    bot.sendMessage(chatId, `أهلاً بك ${user.name} في القائمة الرئيسية:`, {
      reply_markup: {
        keyboard: [
          [{ text: "📄 سياسة الخصوصية" }, { text: "💬 الدعم الفني" }],
          [{ text: "🚪 تسجيل الخروج" }]
        ],
        resize_keyboard: true
      }
    });

    // Send the inline menu (Inline Keyboard)
    bot.sendMessage(chatId, "الخيارات المتاحة:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 معلوماتي", callback_data: "my_info" }, { text: "💰 رصيدي", callback_data: "my_balance" }],
          [{ text: "💳 دفعاتي", callback_data: "my_payments" }, { text: "📦 طلباتي", callback_data: "my_orders" }],
          [{ text: "🚀 شحن التطبيقات", callback_data: "charge_apps" }],
          [{ text: "💳 شحن الرصيد", callback_data: "topup_balance" }],
          [{ text: "🎁 المكافآت", callback_data: "rewards" }],
          [{ text: "🔥 العروض", callback_data: "offers" }, { text: "🎁 استرداد كود", callback_data: "redeem_voucher" }],
          [{ text: "📢 مشاركة البوت", callback_data: "share" }, { text: "🔗 الاحالة", callback_data: "referral" }]
        ]
      }
    });
  }
}

startServer();
