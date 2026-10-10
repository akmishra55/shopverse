
/**
 * Seed script — creates demo admin/user accounts and a product catalog.
 * Idempotent: safe to run on every boot (checks by email/slug).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const IMG = (id) => `https://images.unsplash.com/${id}?w=600&q=80`;

const products = [
  { name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones', brand: 'Sony', category: 'Electronics', price: 29990, mrp: 34990, countInStock: 25, isFeatured: true, images: [IMG('photo-1505740420928-5e560c06d30e')], description: 'Industry-leading noise cancellation, 30-hour battery life and crystal-clear calls.' },
  { name: 'Apple MacBook Air 15" M3 Chip 16GB/512GB', brand: 'Apple', category: 'Electronics', price: 134900, mrp: 144900, countInStock: 8, isFeatured: true, images: [IMG('photo-1517336714731-489689fd1ca8')], description: 'Supercharged by the M3 chip with a stunning 15.3-inch Liquid Retina display.' },
  { name: 'Nike Air Max Pulse Sneakers', brand: 'Nike', category: 'Fashion', price: 9495, mrp: 12795, countInStock: 40, isFeatured: true, images: [IMG('photo-1542291026-7eec264c27ff')], description: 'Plush Air cushioning with a rugged, futuristic design for everyday comfort.' },
  { name: 'Samsung Galaxy S25 Ultra 5G (512GB)', brand: 'Samsung', category: 'Electronics', price: 129999, mrp: 141999, countInStock: 15, images: [IMG('photo-1610945265064-0e34e5519bbf')], description: '200MP camera, built-in S Pen and a 6.9-inch QHD+ 120Hz AMOLED display.' },
  { name: "Levi's 511 Slim Fit Stretch Jeans", brand: "Levi's", category: 'Fashion', price: 2799, mrp: 3999, countInStock: 60, images: [IMG('photo-1542272604-787c3835535d')], description: 'A modern slim with advanced stretch fabric that keeps its shape all day.' },
  { name: 'Casio G-Shock GA-2100 Sports Watch', brand: 'Casio', category: 'Fashion', price: 7995, mrp: 9495, countInStock: 30, images: [IMG('photo-1523275335684-37898b6baf30')], description: 'Legendary toughness in a slim octagonal case. Shock-resistant, 200M water-resistant.' },
  { name: 'Instant Pot Duo 7-in-1 Pressure Cooker 6Qt', brand: 'Instant Pot', category: 'Home & Living', price: 8999, mrp: 12999, countInStock: 20, images: [IMG('photo-1584990347449-a2d4c2c9b0a8')], description: 'Pressure cooker, slow cooker, rice cooker, steamer and more — all in one.' },
  { name: 'Dyson V15 Detect Cordless Vacuum', brand: 'Dyson', category: 'Home & Living', price: 62900, mrp: 69900, countInStock: 6, isFeatured: true, images: [IMG('photo-1558317374-067fb5f30001')], description: 'Laser reveals microscopic dust. Up to 60 minutes of fade-free power.' },
  { name: 'Philips Hue Smart Bulb Starter Kit', brand: 'Philips', category: 'Home & Living', price: 11499, mrp: 14999, countInStock: 18, images: [IMG('photo-1558002038-1055907df827')], description: '16 million colors with voice control and music sync. Bridge included.' },
  { name: 'The North Face Borealis Backpack 28L', brand: 'TNF', category: 'Accessories', price: 8499, mrp: 10999, countInStock: 35, images: [IMG('photo-1491637639811-60e2756cc1c7')], description: 'Iconic 28L daypack with FlexVent suspension and padded laptop sleeve.' },
  { name: 'Sony PlayStation 5 Console — Disc Edition', brand: 'Sony', category: 'Electronics', price: 54990, mrp: 59990, countInStock: 10, isFeatured: true, images: [IMG('photo-1606813907291-d86efa9b94db')], description: 'Lightning-fast SSD, haptic feedback and stunning 4K ray-traced gaming.' },
  { name: 'Kindle Paperwhite 16GB — 6.8" Display', brand: 'Amazon', category: 'Electronics', price: 16999, mrp: 18999, countInStock: 22, images: [IMG('photo-1592496431122-2349e0fbc666')], description: 'Waterproof e-reader with adjustable warm light and weeks of battery.' },
  { name: 'Bose SoundLink Flex Portable Speaker', brand: 'Bose', category: 'Electronics', price: 12900, mrp: 15900, countInStock: 14, images: [IMG('photo-1608043152269-423dbba4e7e1')], description: 'Big sound in a rugged, waterproof speaker with 12-hour battery.' },
  { name: 'Ray-Ban Wayfarer Classic RB2140', brand: 'Ray-Ban', category: 'Accessories', price: 8890, mrp: 10990, countInStock: 28, images: [IMG('photo-1572635196237-14b3f281503f')], description: 'The most recognizable style in eyewear. 100% UV protection.' },
  { name: 'Puma Essentials Oversized Hoodie', brand: 'Puma', category: 'Fashion', price: 2299, mrp: 3299, countInStock: 50, images: [IMG('photo-1556821840-3a63f95609a7')], description: 'Street-ready oversized hoodie in brushed fleece with embroidered logo.' },
  { name: 'GoPro HERO12 Black 5.3K Action Camera', brand: 'GoPro', category: 'Electronics', price: 34900, mrp: 39900, countInStock: 12, images: [IMG('photo-1564466809058-bf4114d55352')], description: 'HyperSmooth 6.0 stabilization and 5.3K video. Waterproof to 10m.' },
  { name: 'IKEA POÄNG Bentwood Armchair', brand: 'IKEA', category: 'Home & Living', price: 13990, mrp: 16990, countInStock: 9, images: [IMG('photo-1586023492125-27b2c045efd7')], description: 'A design classic that gently rocks and supports your every move.' },
  { name: 'Adidas Adicolor Classics Backpack', brand: 'Adidas', category: 'Accessories', price: 1999, mrp: 2799, countInStock: 45, images: [IMG('photo-1553062407-98eeb64c6a62')], description: 'Durable everyday backpack with padded laptop sleeve and 3-Stripes style.' },
];

async function seed() {
  const adminEmail = 'admin@shopverse.dev';
  const userEmail = 'user@shopverse.dev';

  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: 'Admin User', email: adminEmail, role: 'admin',
      password: process.env.ADMIN_PASSWORD,
    });
    console.log('  • seeded admin →', adminEmail);
  }
  if (!(await User.findOne({ email: userEmail }))) {
    await User.create({
      name: 'Demo Shopper', email: userEmail, role: 'user',
      password: 'User@123',
    });
    console.log('  • seeded user  →', userEmail);
  }

  let added = 0;
  for (const p of products) {
    const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Buffer.from(p.name).length.toString(16)}`;
    if (!(await Product.findOne({ name: p.name }))) {
      await Product.create(p);
      added++;
    }
  }
  console.log(`  • seeded ${added} new products (${await Product.countDocuments()} total)`);
}

// Run standalone: `npm run seed`  —  or imported from server.js
if (require.main === module) {
  (async () => {
    await connectDB();
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = seed;
