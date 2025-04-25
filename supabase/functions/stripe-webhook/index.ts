import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.21.0";
import Stripe from "npm:stripe@12.4.0";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stripe webhook secret for verifying signatures
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe signature" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get the request body as text
    const body = await req.text();
    
    // Verify the signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Get the userId from the checkout session metadata
        const userId = session.metadata?.userId || session.client_reference_id;
        
        if (!userId) {
          console.error("No user ID found in checkout session");
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update the user's subscription in the database
        await supabase
          .from("users")
          .update({
            plan: "pro",
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: session.customer,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              priceId: subscription.items.data[0].price.id,
              productId: subscription.items.data[0].price.product,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        
        // Save the Stripe customer record if it doesn't exist
        const { data: existingCustomer } = await supabase
          .from("stripe_customers")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        if (!existingCustomer) {
          await supabase
            .from("stripe_customers")
            .insert({
              user_id: userId,
              customer_id: session.customer,
              created_at: new Date().toISOString(),
            });
        }
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        // Find the user by customer ID
        const { data: customer } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", subscription.customer)
          .single();
        
        if (!customer) {
          console.error(`No customer found for Stripe customer ID: ${subscription.customer}`);
          break;
        }
        
        // Update the user's subscription status
        await supabase
          .from("users")
          .update({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: subscription.customer,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              priceId: subscription.items.data[0].price.id,
              productId: subscription.items.data[0].price.product,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.user_id);
        
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Find the user by customer ID
        const { data: customer } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", subscription.customer)
          .single();
        
        if (!customer) {
          console.error(`No customer found for Stripe customer ID: ${subscription.customer}`);
          break;
        }
        
        // Update the user's subscription status
        await supabase
          .from("users")
          .update({
            plan: "free",
            subscription: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customer.user_id);
        
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});