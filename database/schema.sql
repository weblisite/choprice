-- Choprice Database Schema
-- PostgreSQL Schema for Neon Database

-- Create menu_items table
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
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    phone VARCHAR(20) NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_receipt_number VARCHAR(255),
    rider_id VARCHAR(255),
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    guest_info JSONB, -- For guest orders: name, email, etc.
    order_type VARCHAR(20) DEFAULT 'user', -- 'user' or 'guest'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create add_ons table
CREATE TABLE IF NOT EXISTS add_ons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (supplementary to Clerk)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
    phone VARCHAR(20),
    email VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    preferred_delivery_address JSONB,
    preferences JSONB,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);

-- Create user addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255), -- e.g., 'Home', 'Office'
    address TEXT NOT NULL,
    building VARCHAR(255),
    floor VARCHAR(255),
    office VARCHAR(255),
    landmark VARCHAR(255),
    location JSONB, -- lat/lng coordinates
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order ratings table
CREATE TABLE IF NOT EXISTS order_ratings (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, user_id)
);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to VARCHAR(255),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'mpesa', 'card', 'bank'
    details JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create riders table
CREATE TABLE IF NOT EXISTS riders (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    current_location JSONB,
    total_deliveries INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_status_history table for tracking
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255), -- Clerk user ID
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Insert default menu items
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
    ('Rice and Beef', 'Succulent beef served with spiced rice', 390, 'Complete Meals')
ON CONFLICT DO NOTHING;

-- Insert default add-ons
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
ON CONFLICT DO NOTHING;

-- Insert default FAQ items
INSERT INTO faq_items (question, answer, category, display_order) VALUES
    ('What areas do you deliver to?', 'We deliver to Kilimani, Kileleshwa, Lavington, Hurlingham, Upper Hill, Westlands, and Parklands.', 'delivery', 1),
    ('How long does delivery take?', 'Our standard delivery time is 30-45 minutes from order confirmation.', 'delivery', 2),
    ('Is delivery free?', 'Yes! We offer free delivery on all orders above 390 KSh.', 'delivery', 3),
    ('What payment methods do you accept?', 'We currently accept M-Pesa payments via STK Push for secure and convenient transactions.', 'payment', 4),
    ('Can I track my order?', 'Yes! You can track your order in real-time through our app. You''ll receive notifications at each stage.', 'orders', 5),
    ('How do I cancel an order?', 'You can cancel your order within 5 minutes of placing it. Contact support for assistance.', 'orders', 6),
    ('What if my order is late?', 'If your order is delayed beyond our estimated time, please contact our support team for assistance.', 'support', 7),
    ('How can I rate my order?', 'After your order is delivered, you can rate it in the app under "My Orders" section.', 'orders', 8)
ON CONFLICT DO NOTHING;

-- Create corporate_accounts table
CREATE TABLE IF NOT EXISTS corporate_accounts (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address JSONB NOT NULL,
    subscription_type VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annual
    monthly_credit_limit INTEGER DEFAULT 50000, -- in KSh
    current_month_spent INTEGER DEFAULT 0,
    employee_count INTEGER,
    delivery_locations JSONB, -- Array of office locations
    payment_terms VARCHAR(50) DEFAULT 'net_30', -- net_30, net_15, prepaid
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create corporate_employees table
CREATE TABLE IF NOT EXISTS corporate_employees (
    id SERIAL PRIMARY KEY,
    corporate_account_id INTEGER REFERENCES corporate_accounts(id),
    employee_id VARCHAR(255), -- Can be employee number or email
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    daily_allowance INTEGER DEFAULT 500, -- in KSh
    monthly_allowance INTEGER DEFAULT 10000, -- in KSh
    current_month_spent INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bulk_orders table
CREATE TABLE IF NOT EXISTS bulk_orders (
    id SERIAL PRIMARY KEY,
    corporate_account_id INTEGER REFERENCES corporate_accounts(id),
    order_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    delivery_address JSONB NOT NULL,
    items JSONB NOT NULL, -- Array of menu items with quantities
    total_amount INTEGER NOT NULL,
    employee_count INTEGER NOT NULL,
    special_instructions TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, delivered, cancelled
    created_by VARCHAR(255), -- Employee who placed the order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create corporate_invoices table
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
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    payment_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_order_id ON order_ratings(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();