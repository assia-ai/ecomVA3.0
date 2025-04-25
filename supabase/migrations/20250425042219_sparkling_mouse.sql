/*
  # Create Stripe customers table and add subscription field to users

  1. New Tables
    - `stripe_customers` - Stores Stripe customer IDs for users
      - `customer_id` (text) - Stripe customer ID
      - `user_id` (uuid) - References users.id
  
  2. Changes
    - Adds subscription JSONB field to users table to store subscription details
*/

-- Create stripe_customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe_customers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS stripe_customers_customer_id_key ON stripe_customers(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS stripe_customers_user_id_key ON stripe_customers(user_id);

-- Enable RLS on the stripe_customers table
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view their own customer data (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' 
    AND policyname = 'Users can view their own customer data'
  ) THEN
    CREATE POLICY "Users can view their own customer data" 
      ON stripe_customers 
      FOR SELECT 
      TO authenticated 
      USING ((user_id = auth.uid()) AND (deleted_at IS NULL));
  END IF;
END $$;

-- Make sure the subscription field exists on the users table 
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription JSONB DEFAULT NULL;
  END IF;
END $$;