const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { neon } = require('@neondatabase/serverless');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const realtimeService = require('./services/realtime');
const webpush = require('web-push');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize real-time service
realtimeService.initialize(server);

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@choprice.co.ke',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Push notifications configured');
} else {
  console.log('⚠️  Push notifications disabled - VAPID keys not configured');
}

// Database connection
const sql = process.env.DATABASE_URL ? 
  neon(process.env.DATABASE_URL) : 
  neon('postgresql://placeholder:placeholder@localhost:5432/placeholder');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.RIDER_URL,
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Choprice Backend API! 🍚',
    description: 'Nairobi\'s premier rice delivery service',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      menu: '/api/menu',
      orders: '/api/orders',
      maps: '/api/maps/*',
      support: '/api/support/*',
      admin: '/api/admin/*'
    },
    features: [
      'Real-time order tracking',
      'Multiple payment methods',
      'GPS delivery management',
      'Professional admin tools',
      'Customer support system'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Choprice Backend API'
  });
});

// Debug endpoint to check database connection
app.get('/debug/db', async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const hasDbUrl = !!dbUrl;
    
    if (!hasDbUrl) {
      return res.json({
        success: false,
        message: 'DATABASE_URL not configured',
        hasDbUrl: false
      });
    }
    
    // Test database connection
    const testResult = await sql`SELECT NOW() as current_time`;
    
    // Check menu items table
    const menuCount = await sql`SELECT COUNT(*) as count FROM menu_items`;
    const menuItems = await sql`SELECT * FROM menu_items LIMIT 3`;
    
    res.json({
      success: true,
      message: 'Database connected successfully',
      hasDbUrl: true,
      currentTime: testResult[0]?.current_time,
      menuItemsCount: menuCount[0]?.count,
      sampleMenuItems: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      hasDbUrl: !!process.env.DATABASE_URL
    });
  }
});

// Add Jollof Rice endpoint (temporary)
app.post('/api/add-jollof', async (req, res) => {
  try {
    // Check if Jollof Rice already exists
    const existing = await sql`
      SELECT * FROM menu_items WHERE name = 'Jollof Rice'
    `;
    
    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Jollof Rice already exists',
        data: existing[0]
      });
    }
    
    // Add Jollof Rice
    const newItem = await sql`
      INSERT INTO menu_items (name, description, price, category, is_available)
      VALUES ('Jollof Rice', 'Vibrant West African rice dish with tomatoes, peppers and aromatic spices', 390, 'International Delights', true)
      RETURNING *
    `;
    
    res.json({
      success: true,
      message: 'Jollof Rice added successfully! We now have 12 rice dishes.',
      data: newItem[0]
    });
  } catch (error) {
    console.error('Error adding Jollof Rice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add Jollof Rice'
    });
  }
});

// Menu endpoints
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await sql`
      SELECT * FROM menu_items 
      WHERE is_available = true 
      ORDER BY category, name
    `;
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items'
    });
  }
});

// Protected order endpoints
app.post('/api/orders', async (req, res) => {
  try {
    // Support both authenticated and guest users
    let userId = null;
    let guestInfo = null;
    
    if (req.auth && req.auth.userId) {
      // Authenticated user
      userId = req.auth.userId;
    } else {
      // Guest user - extract guest information
      const { guest_info } = req.body;
      if (!guest_info || !guest_info.name || !guest_info.email || !guest_info.phone) {
        return res.status(400).json({
          success: false,
          message: 'Guest information (name, email, phone) is required for guest checkout'
        });
      }
      guestInfo = guest_info;
      userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const { items, addOns, delivery_address, phone, total_amount } = req.body;

    // Validate minimum order amount for free delivery
    if (total_amount < 390) {
      return res.status(400).json({
        success: false,
        message: 'Minimum order amount is 390 KSh for free delivery'
      });
    }

    // Create order
    const order = await sql`
      INSERT INTO orders (
        user_id, 
        items, 
        delivery_address, 
        phone, 
        total_amount, 
        status,
        guest_info,
        order_type,
        created_at
      ) VALUES (
        ${userId}, 
        ${JSON.stringify({ items, addOns: addOns || [] })}, 
        ${JSON.stringify(delivery_address)}, 
        ${phone}, 
        ${total_amount}, 
        'pending',
        ${guestInfo ? JSON.stringify(guestInfo) : null},
        ${guestInfo ? 'guest' : 'user'},
        NOW()
      ) RETURNING *
    `;

    // Notify admins about new order
    realtimeService.broadcastNewOrder({
      orderId: order[0].id,
      userId,
      items,
      addOns: addOns || [],
      totalAmount: total_amount,
      deliveryAddress: delivery_address,
      phone
    });

    res.status(201).json({
      success: true,
      data: order[0],
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Get user orders
app.get('/api/orders', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    const orders = await sql`
      SELECT * FROM orders 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// M-Pesa STK Push endpoint
app.post('/api/mpesa/stkpush', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { phone, amount, order_id } = req.body;
    
    // Validate input
    if (!phone || !amount || !order_id) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, amount, and order ID are required'
      });
    }

    // Import M-Pesa service
    const mpesaService = require('./services/mpesa');
    
    // Initiate STK Push
    const result = await mpesaService.initiateSTKPush(
      phone, 
      amount, 
      order_id, 
      `Choprice Order #${order_id}`
    );

    if (result.success) {
      // Update order with M-Pesa details
      await sql`
        UPDATE orders 
        SET 
          mpesa_checkout_request_id = ${result.checkoutRequestId},
          payment_status = 'pending'
        WHERE id = ${order_id}
      `;

      res.json({
        success: true,
        message: 'STK Push initiated successfully',
        data: {
          merchant_request_id: result.merchantRequestId,
          checkout_request_id: result.checkoutRequestId,
          response_code: '0',
          response_description: result.responseDescription,
          customer_message: result.customerMessage
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to initiate payment'
      });
    }
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// M-Pesa callback endpoint
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
    
    // Import M-Pesa service
    const mpesaService = require('./services/mpesa');
    
    // Process the callback
    const result = mpesaService.processCallback(req.body);
    
    if (result.success) {
      // Find order by checkout request ID
      const orders = await sql`
        SELECT * FROM orders 
        WHERE mpesa_checkout_request_id = ${result.checkoutRequestId}
      `;

      if (orders.length > 0) {
        const order = orders[0];
        
        // Update order with payment details
        await sql`
          UPDATE orders 
          SET 
            payment_status = 'completed',
            mpesa_receipt_number = ${result.mpesaReceiptNumber},
            status = 'confirmed',
            updated_at = NOW()
          WHERE id = ${order.id}
        `;

        // Log the successful payment
        console.log(`Payment successful for Order #${order.id}:`, {
          amount: result.amount,
          receipt: result.mpesaReceiptNumber,
          phone: result.phoneNumber
        });

        // Send real-time notifications
        realtimeService.sendPaymentConfirmation(order.user_id, {
          orderId: order.id,
          amount: result.amount,
          receipt: result.mpesaReceiptNumber
        });

        realtimeService.notifyAdmins('order_confirmed', {
          orderId: order.id,
          userId: order.user_id,
          amount: result.amount,
          receipt: result.mpesaReceiptNumber
        });
      }
    } else {
      // Payment failed - update order status
      const orders = await sql`
        SELECT * FROM orders 
        WHERE mpesa_checkout_request_id = ${result.checkoutRequestId}
      `;

      if (orders.length > 0) {
        await sql`
          UPDATE orders 
          SET 
            payment_status = 'failed',
            status = 'cancelled',
            updated_at = NOW()
          WHERE id = ${orders[0].id}
        `;

        console.log(`Payment failed for Order #${orders[0].id}: ${result.error}`);
      }
    }
    
    // Always respond with success to M-Pesa
    res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    
    // Still respond with success to avoid M-Pesa retries
    res.json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  }
});

// Add-ons endpoints
app.get('/api/addons', async (req, res) => {
  try {
    const { category } = req.query;

    let addons;
    if (category) {
      addons = await sql`
        SELECT * FROM add_ons 
        WHERE is_available = true AND category = ${category}
        ORDER BY category, name
      `;
    } else {
      addons = await sql`
        SELECT * FROM add_ons 
        WHERE is_available = true
        ORDER BY category, name
      `;
    }
    
    res.json({
      success: true,
      data: addons
    });
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-ons'
    });
  }
});

// Google Maps integration endpoints
app.get('/api/maps/validate-address', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const googleMapsService = require('./services/googleMaps');
    const result = await googleMapsService.validateAddress(address);
    
    res.json(result);
  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address'
    });
  }
});

app.get('/api/maps/address-suggestions', async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const googleMapsService = require('./services/googleMaps');
    const result = await googleMapsService.getAddressSuggestions(input);
    
    res.json(result);
  } catch (error) {
    console.error('Address suggestions error:', error);
    res.status(500).json({
      success: false,
      suggestions: []
    });
  }
});

app.get('/api/maps/place-details', async (req, res) => {
  try {
    const { placeId } = req.query;
    
    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    const googleMapsService = require('./services/googleMaps');
    const result = await googleMapsService.getPlaceDetails(placeId);
    
    res.json(result);
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get place details'
    });
  }
});

app.post('/api/maps/calculate-route', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const googleMapsService = require('./services/googleMaps');
    const result = await googleMapsService.calculateDeliveryRoute(origin, destination);
    
    res.json(result);
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate route'
    });
  }
});

// Admin endpoints (protected)
app.get('/api/admin/orders', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    // TODO: Add admin role check
    const { status } = req.query;
    
    let queryText = 'SELECT * FROM orders';
    let queryParams = [];
    
    if (status) {
      queryText += ' WHERE status = $1';
      queryParams = [status];
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const orders = await sql.unsafe(queryText, queryParams);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Admin analytics endpoint
app.get('/api/admin/analytics', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Get analytics data
    const [todayOrders, totalRevenue, orderStats] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= ${todayStart.toISOString()}`,
      sql`SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = 'completed' AND created_at >= ${todayStart.toISOString()}`,
      sql`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(total_amount) as avg_amount
        FROM orders 
        WHERE created_at >= ${todayStart.toISOString()}
        GROUP BY status
      `
    ]);

    // Get popular dishes
    const popularDishes = await sql`
      SELECT 
        json_array_elements(items)->>'name' as dish_name,
        COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= ${todayStart.toISOString()}
      GROUP BY dish_name
      ORDER BY order_count DESC
      LIMIT 5
    `;

    res.json({
      success: true,
      data: {
        todayOrders: parseInt(todayOrders[0]?.count || 0),
        todayRevenue: parseInt(totalRevenue[0]?.revenue || 0),
        orderStats: orderStats,
        popularDishes: popularDishes,
        averageOrderValue: Math.round(totalRevenue[0]?.revenue / Math.max(todayOrders[0]?.count, 1) || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Admin riders endpoint
app.get('/api/admin/riders', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const riders = await sql`SELECT * FROM riders ORDER BY created_at DESC`;
    
    res.json({
      success: true,
      data: riders
    });
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch riders'
    });
  }
});

// Admin menu management
app.patch('/api/admin/menu/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, name, description, price, category } = req.body;
    
    const updates = {};
    if (is_available !== undefined) updates.is_available = is_available;
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (price) updates.price = price;
    if (category) updates.category = category;
    
    const updatedItem = await sql`
      UPDATE menu_items 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updatedItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedItem[0],
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item'
    });
  }
});

// Admin menu management - create new item
app.post('/api/admin/menu', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { name, description, price, category, is_available = true, image_url } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, and category are required'
      });
    }
    
    const newItem = await sql`
      INSERT INTO menu_items (name, description, price, category, is_available, image_url)
      VALUES (${name}, ${description}, ${price}, ${category}, ${is_available}, ${image_url || null})
      RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      data: newItem[0],
      message: 'Menu item created successfully'
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item'
    });
  }
});

// Assign rider to order
app.patch('/api/admin/orders/:id/assign-rider', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { riderId } = req.body;
    
    const updatedOrder = await sql`
      UPDATE orders 
      SET rider_id = ${riderId}, status = 'out_for_delivery', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (updatedOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Notify rider about assignment
    realtimeService.notifyRider(riderId, 'order_assigned', {
      orderId: id,
      orderData: updatedOrder[0]
    });
    
    res.json({
      success: true,
      data: updatedOrder[0],
      message: 'Rider assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning rider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign rider'
    });
  }
});

// Rider endpoints
app.post('/api/rider/accept-order', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { orderId, riderId } = req.body;
    
    const updatedOrder = await sql`
      UPDATE orders 
      SET rider_id = ${riderId}, status = 'out_for_delivery', updated_at = NOW()
      WHERE id = ${orderId} AND rider_id IS NULL
      RETURNING *
    `;
    
    if (updatedOrder.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order not available or already assigned'
      });
    }

    // Notify customer and admins
    realtimeService.notifyUser(updatedOrder[0].user_id, 'order_status_updated', {
      orderId,
      status: 'out_for_delivery',
      message: 'Your order is now out for delivery!'
    });

    realtimeService.notifyAdmins('order_updated', {
      orderId,
      status: 'out_for_delivery',
      riderId
    });
    
    res.json({
      success: true,
      data: updatedOrder[0],
      message: 'Order accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept order'
    });
  }
});

// Update order status (admin/rider)
app.patch('/api/orders/:id/status', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updatedOrder = await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = NOW() 
      WHERE id = ${id} 
      RETURNING *
    `;
    
    if (updatedOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Send real-time notifications
    realtimeService.notifyUser(updatedOrder[0].user_id, 'order_status_updated', {
      orderId: id,
      status,
      message: getStatusMessage(status)
    });

    realtimeService.notifyAdmins('order_updated', {
      orderId: id,
      status,
      userId: updatedOrder[0].user_id
    });
    
    res.json({
      success: true,
      data: updatedOrder[0],
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
      console.log('⚠️  DATABASE_URL not configured - running in demo mode');
      console.log('📝 To configure database, set DATABASE_URL in .env file');
      return;
    }
    
    // Test database connection first
    await sql`SELECT NOW()`;
    console.log('✅ Database connected successfully');
    
    // Create menu_items table
    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        delivery_address JSONB NOT NULL,
        phone VARCHAR(20) NOT NULL,
        total_amount INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ensure new columns exist for guest checkout
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_info JSONB`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'user'`;

    // Create add_ons table
    await sql`
      CREATE TABLE IF NOT EXISTS add_ons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        category VARCHAR(100),
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed default add-ons
    const addOnsCount = await sql`SELECT COUNT(*) FROM add_ons`;
    if (addOnsCount[0].count === '0') {
      await sql`
        INSERT INTO add_ons (name, description, price, category) VALUES
          ('Kachumbari', 'Fresh tomato and onion salad with cilantro and lime', 100, 'Sides'),
          ('Coleslaw', 'Crunchy cabbage slaw with light dressing', 120, 'Sides'),
          ('Guacamole', 'Fresh avocado guacamole with lime', 150, 'Sides'),
          ('Soda - Coca Cola (500ml)', 'Classic Coca Cola', 120, 'Beverages'),
          ('Soda - Fanta Orange (500ml)', 'Fanta Orange', 120, 'Beverages'),
          ('Soda - Sprite (500ml)', 'Sprite Lemon-Lime', 120, 'Beverages'),
          ('Bottled Water (500ml)', 'Pure bottled water', 50, 'Beverages'),
          ('Fresh Juice (300ml)', 'Freshly squeezed tropical juice', 150, 'Beverages'),
          ('Extra Meat Portion', 'Additional serving of protein', 150, 'Extras'),
          ('Extra Rice Portion', 'Additional serving of rice', 100, 'Extras')
      `;
    }

    // Cleanup and ensure correct add-ons
    await sql`DELETE FROM add_ons WHERE name IN ('Ugali', 'Chapati', 'Sukuma Wiki')`;
    await sql`
      INSERT INTO add_ons (name, description, price, category)
      SELECT 'Coleslaw', 'Crunchy cabbage slaw with light dressing', 120, 'Sides'
      WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Coleslaw')
    `;
    await sql`
      INSERT INTO add_ons (name, description, price, category)
      SELECT 'Guacamole', 'Fresh avocado guacamole with lime', 150, 'Sides'
      WHERE NOT EXISTS (SELECT 1 FROM add_ons WHERE name = 'Guacamole')
    `;

    // Corporate tables
    await sql`
      CREATE TABLE IF NOT EXISTS corporate_accounts (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) NOT NULL,
        address JSONB NOT NULL,
        subscription_type VARCHAR(50) DEFAULT 'basic',
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        monthly_credit_limit INTEGER DEFAULT 50000,
        current_month_spent INTEGER DEFAULT 0,
        employee_count INTEGER,
        delivery_locations JSONB,
        payment_terms VARCHAR(50) DEFAULT 'net_30',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS corporate_employees (
        id SERIAL PRIMARY KEY,
        corporate_account_id INTEGER REFERENCES corporate_accounts(id),
        employee_id VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        daily_allowance INTEGER DEFAULT 500,
        monthly_allowance INTEGER DEFAULT 10000,
        current_month_spent INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bulk_orders (
        id SERIAL PRIMARY KEY,
        corporate_account_id INTEGER REFERENCES corporate_accounts(id),
        order_date DATE NOT NULL,
        delivery_time TIME NOT NULL,
        delivery_address JSONB NOT NULL,
        items JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        employee_count INTEGER NOT NULL,
        special_instructions TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS corporate_invoices (
        id SERIAL PRIMARY KEY,
        corporate_account_id INTEGER REFERENCES corporate_accounts(id),
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        billing_period_start DATE NOT NULL,
        billing_period_end DATE NOT NULL,
        subtotal INTEGER NOT NULL,
        tax_amount INTEGER DEFAULT 0,
        total_amount INTEGER NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_date DATE,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default menu items
    const menuCount = await sql`SELECT COUNT(*) FROM menu_items`;
    if (menuCount[0].count === '0') {
      await sql`
        INSERT INTO menu_items (name, description, price, category) VALUES
        ('Pilau', 'Fragrant spiced rice with aromatic herbs and spices', 390, 'Local Favorites'),
        ('Biryani Rice', 'Traditional Indian-style layered rice with spices', 390, 'International Delights'),
        ('Coconut Rice', 'Creamy rice cooked in coconut milk', 390, 'Local Favorites'),
        ('Cashewnut Rice', 'Rich rice dish with roasted cashew nuts', 390, 'International Delights'),
        ('Rice Peas', 'Caribbean-style rice and peas with coconut', 390, 'International Delights'),
        ('Chinese Rice', 'Stir-fried rice with vegetables and soy sauce', 390, 'International Delights'),
        ('Egg Fry Rice', 'Classic fried rice with scrambled eggs', 390, 'International Delights'),
        ('Risotto', 'Creamy Italian rice dish with herbs', 390, 'International Delights'),
        ('Rice and Chicken', 'Tender chicken served with seasoned rice', 390, 'Complete Meals'),
        ('Rice and Fish', 'Fresh fish fillet with aromatic rice', 390, 'Complete Meals'),
        ('Rice and Beef', 'Succulent beef served with spiced rice', 390, 'Complete Meals'),
        ('Jollof Rice', 'Vibrant West African rice dish with tomatoes, peppers and aromatic spices', 390, 'International Delights')
      `;
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️  Server will continue in demo mode without database connection');
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Choprice Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Real-time service enabled`);
  
  // Initialize database
  initializeDatabase();
});

// User profile endpoints
app.get('/api/user/profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    const profile = await sql`SELECT * FROM users WHERE id = ${userId}`;
    
    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

app.post('/api/user/profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { email, phone, firstName, lastName, preferences } = req.body;
    
    const profile = await sql`
      INSERT INTO users (id, email, phone, first_name, last_name, preferences, created_at)
      VALUES (${userId}, ${email}, ${phone}, ${firstName}, ${lastName}, ${JSON.stringify(preferences)}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        preferences = EXCLUDED.preferences,
        updated_at = NOW()
      RETURNING *
    `;
    
    res.json({
      success: true,
      data: profile[0],
      message: 'Profile created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update profile'
    });
  }
});

app.patch('/api/user/profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const updates = req.body;
    
    const profile = await sql`
      UPDATE users 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    
    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: profile[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// User favorites endpoints
app.get('/api/user/favorites', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    const favorites = await sql`
      SELECT uf.*, mi.name, mi.description, mi.price, mi.category, mi.image_url
      FROM user_favorites uf
      JOIN menu_items mi ON uf.menu_item_id = mi.id
      WHERE uf.user_id = ${userId}
      ORDER BY uf.created_at DESC
    `;
    
    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
});

app.post('/api/user/favorites', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { menuItemId } = req.body;
    
    const favorite = await sql`
      INSERT INTO user_favorites (user_id, menu_item_id, created_at)
      VALUES (${userId}, ${menuItemId}, NOW())
      ON CONFLICT (user_id, menu_item_id) DO NOTHING
      RETURNING *
    `;
    
    res.json({
      success: true,
      data: favorite[0] || { message: 'Already in favorites' },
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
});

app.delete('/api/user/favorites/:menuItemId', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { menuItemId } = req.params;
    
    const deleted = await sql`
      DELETE FROM user_favorites 
      WHERE user_id = ${userId} AND menu_item_id = ${menuItemId}
      RETURNING *
    `;
    
    res.json({
      success: true,
      data: deleted[0],
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

// User addresses endpoints
app.get('/api/user/addresses', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    const addresses = await sql`
      SELECT * FROM user_addresses 
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
});

app.post('/api/user/addresses', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const addressData = req.body;
    
    const address = await sql`
      INSERT INTO user_addresses (user_id, ${sql(addressData)}, created_at)
      VALUES (${userId}, ${sql.values(addressData)}, NOW())
      RETURNING *
    `;
    
    res.json({
      success: true,
      data: address[0],
      message: 'Address saved successfully'
    });
  } catch (error) {
    console.error('Error saving address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save address'
    });
  }
});

// Order rating endpoint
app.post('/api/orders/:id/rate', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const { rating, review } = req.body;
    
    // Verify order belongs to user
    const order = await sql`
      SELECT * FROM orders 
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const ratedOrder = await sql`
      UPDATE orders 
      SET rating = ${rating}, review = ${review}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    res.json({
      success: true,
      data: ratedOrder[0],
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

// Push notification endpoints
app.post('/api/push/subscribe', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const subscription = req.body;
    
    // Store subscription in database
    await sql`
      INSERT INTO push_subscriptions (user_id, subscription, created_at)
      VALUES (${userId}, ${JSON.stringify(subscription)}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        subscription = EXCLUDED.subscription,
        updated_at = NOW()
    `;
    
    res.json({
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save subscription'
    });
  }
});

app.post('/api/push/unsubscribe', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    await sql`
      DELETE FROM push_subscriptions 
      WHERE user_id = ${userId}
    `;
    
    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    });
  }
});

app.post('/api/push/send', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    // Get user's subscription
    const subscriptions = await sql`
      SELECT subscription FROM push_subscriptions 
      WHERE user_id = ${userId}
    `;
    
    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for user'
      });
    }
    
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data || {}
    });
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          await sql`
            DELETE FROM push_subscriptions 
            WHERE user_id = ${userId} AND subscription = ${JSON.stringify(sub.subscription)}
          `;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Push notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notification'
    });
  }
});

// WhatsApp integration endpoint
app.post('/api/support/whatsapp-webhook', async (req, res) => {
  try {
    // Handle WhatsApp webhook for incoming messages
    const { Body, From, To } = req.body;
    
    console.log('WhatsApp message received:', { Body, From, To });
    
    // Here you would integrate with WhatsApp Business API
    // For now, just log the message
    
    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Get WhatsApp support info
app.get('/api/support/whatsapp', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        phone: '+254712345678', // Replace with actual business WhatsApp number
        businessHours: 'Mon-Sun 8:00 AM - 10:00 PM',
        quickLinks: [
          {
            title: 'Order Status',
            message: 'Hi! I need help with my order status. Order ID: '
          },
          {
            title: 'Delivery Issue',
            message: 'Hi! I\'m having an issue with my delivery. Details: '
          },
          {
            title: 'Payment Problem',
            message: 'Hi! I\'m experiencing a payment issue. Please help with: '
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp information'
    });
  }
});

// Corporate subscription endpoints
app.post('/api/corporate/register', async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      employee_count,
      subscription_type = 'basic'
    } = req.body;

    // Validate required fields
    if (!company_name || !contact_person || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create corporate account
    const account = await sql`
      INSERT INTO corporate_accounts (
        company_name, contact_person, email, phone, address, 
        employee_count, subscription_type
      ) VALUES (
        ${company_name}, ${contact_person}, ${email}, ${phone}, 
        ${JSON.stringify(address)}, ${employee_count}, ${subscription_type}
      ) RETURNING *
    `;

    res.status(201).json({
      success: true,
      data: account[0],
      message: 'Corporate account created successfully'
    });
  } catch (error) {
    console.error('Error creating corporate account:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Corporate account with this email already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create corporate account'
      });
    }
  }
});

app.post('/api/corporate/bulk-order', async (req, res) => {
  try {
    const {
      corporate_account_id,
      order_date,
      delivery_time,
      delivery_address,
      items,
      employee_count,
      special_instructions,
      created_by
    } = req.body;

    // Calculate total amount
    const total_amount = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Create bulk order
    const bulkOrder = await sql`
      INSERT INTO bulk_orders (
        corporate_account_id, order_date, delivery_time, delivery_address,
        items, total_amount, employee_count, special_instructions, created_by
      ) VALUES (
        ${corporate_account_id}, ${order_date}, ${delivery_time}, 
        ${JSON.stringify(delivery_address)}, ${JSON.stringify(items)}, 
        ${total_amount}, ${employee_count}, ${special_instructions}, ${created_by}
      ) RETURNING *
    `;

    // Update corporate account spending
    await sql`
      UPDATE corporate_accounts 
      SET current_month_spent = current_month_spent + ${total_amount}
      WHERE id = ${corporate_account_id}
    `;

    res.status(201).json({
      success: true,
      data: bulkOrder[0],
      message: 'Bulk order created successfully'
    });
  } catch (error) {
    console.error('Error creating bulk order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk order'
    });
  }
});

app.get('/api/corporate/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get corporate account details
    const account = await sql`
      SELECT * FROM corporate_accounts WHERE id = ${id}
    `;
    
    if (account.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Corporate account not found'
      });
    }

    // Get recent orders
    const recentOrders = await sql`
      SELECT * FROM bulk_orders 
      WHERE corporate_account_id = ${id}
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    // Get monthly spending
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthlySpending = await sql`
      SELECT SUM(total_amount) as total_spent
      FROM bulk_orders 
      WHERE corporate_account_id = ${id}
      AND created_at >= ${firstDayOfMonth.toISOString()}
    `;

    res.json({
      success: true,
      data: {
        account: account[0],
        recentOrders,
        monthlySpending: monthlySpending[0]?.total_spent || 0
      }
    });
  } catch (error) {
    console.error('Error fetching corporate dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Customer support endpoints
app.get('/api/support/faq', async (req, res) => {
  try {
    const faq = await sql`
      SELECT * FROM faq_items 
      WHERE is_active = true 
      ORDER BY display_order, created_at
    `;
    
    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ'
    });
  }
});

app.post('/api/support/ticket', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { subject, message, category, priority } = req.body;
    
    const ticket = await sql`
      INSERT INTO support_tickets (user_id, subject, message, category, priority, status, created_at)
      VALUES (${userId}, ${subject}, ${message}, ${category || 'general'}, ${priority || 'medium'}, 'open', NOW())
      RETURNING *
    `;
    
    // Notify support team
    realtimeService.notifyAdmins('new_support_ticket', {
      ticketId: ticket[0].id,
      userId,
      subject,
      category,
      priority
    });
    
    res.json({
      success: true,
      data: ticket[0],
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

app.get('/api/support/tickets', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    
    const tickets = await sql`
      SELECT * FROM support_tickets 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

// Helper function to get user-friendly status messages
function getStatusMessage(status) {
  const messages = {
    'pending': 'Your order is being processed',
    'confirmed': 'Your order has been confirmed and is being prepared',
    'preparing': 'Your delicious meal is being prepared',
    'ready': 'Your order is ready and will be picked up shortly',
    'out_for_delivery': 'Your order is on the way!',
    'delivered': 'Your order has been delivered. Enjoy your meal!',
    'cancelled': 'Your order has been cancelled'
  };
  return messages[status] || `Order status: ${status}`;
}

// Error handling middleware (end)
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler (end)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

module.exports = app;