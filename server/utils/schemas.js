
/** Central Zod schemas — single source of truth for API input validation. */
const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    email: z.string().email().toLowerCase(),
    password: z.string().min(6).max(72),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

exports.addressSchema = z.object({
  label: z.string().max(30).default('Home'),
  line: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

exports.createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product: objectId,
      qty: z.number().int().min(1).max(10),
    })).min(1).max(50),
    shippingAddress: exports.addressSchema,
    paymentMethod: z.enum(['card', 'cod']),
  }),
});

exports.reviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(500),
  }),
  params: z.object({ id: objectId }),
});

exports.productSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(140),
    brand: z.string().max(60).optional(),
    category: z.string().min(2).max(40),
    description: z.string().min(10).max(2000),
    price: z.number().positive(),
    mrp: z.number().positive().optional(),
    countInStock: z.number().int().min(0),
    images: z.array(z.string().url()).max(6).optional(),
    isFeatured: z.boolean().optional(),
  }),
});

exports.orderStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
  }),
});
