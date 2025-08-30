const stripe = require('stripe');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');

class StripeAPI {
    constructor() {
        // Only initialize Stripe if keys are provided
        if (config.stripe && config.stripe.secretKey && config.stripe.secretKey !== 'sk_test_your_secret_key_here') {
            this.stripe = stripe(config.stripe.secretKey);
        } else {
            this.stripe = null;
            console.log('⚠️  Stripe not initialized - add your Stripe keys to .env file');
        }
        
        // Initialize Supabase if available
        if (config.supabase && config.supabase.url && config.supabase.anonKey) {
            this.supabase = createClient(config.supabase.url, config.supabase.anonKey);
        } else {
            this.supabase = null;
            console.log('⚠️  Supabase not initialized - add your Supabase credentials to .env file');
        }
    }

    // Create a new pledge with pre-authorization
    async createPledge(pledgeData) {
        try {
            if (!this.stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured. Please add your Stripe keys to .env file',
                };
            }
            
            const { email, monthlyLimit, perPostAmount, paymentMethodId } = pledgeData;
            
            // Create a customer
            const customer = await this.stripe.customers.create({
                email: email,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            // Create a PaymentIntent for the monthly limit (pre-authorization)
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: monthlyLimit * 100, // Convert to pence
                currency: 'gbp',
                customer: customer.id,
                payment_method: paymentMethodId,
                confirm: true,
                capture_method: 'manual', // Don't capture immediately
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                },
                metadata: {
                    pledge_type: 'monthly_limit',
                    per_post_amount: perPostAmount,
                },
            });

            // Store pledge in database
            let pledgeId = null;
            if (this.supabase) {
                try {
                    const { data, error } = await this.supabase
                        .from('pledges')
                        .insert({
                            customer_id: customer.id,
                            payment_intent_id: paymentIntent.id,
                            payment_method_id: paymentMethodId,
                            email: email,
                            monthly_limit: monthlyLimit,
                            per_post_amount: perPostAmount,
                            organization: 'split', // Default to split between all organisations
                            current_month_charged: 0,
                            status: 'active',
                            created_at: new Date().toISOString(),
                        })
                        .select(); // Add .select() to return the inserted data

                    if (error) {
                        console.error('Database insert error:', error);
                        throw error;
                    }
                    
                    if (data && data.length > 0) {
                        pledgeId = data[0].id;
                        console.log('Pledge created with ID:', pledgeId);
                    } else {
                        console.error('No data returned from database insert');
                        throw new Error('Failed to create pledge in database');
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    throw dbError;
                }
            } else {
                console.log('Supabase not available, skipping database insert');
            }

            return {
                success: true,
                pledgeId: pledgeId,
                customerId: customer.id,
                paymentIntentId: paymentIntent.id,
            };

        } catch (error) {
            console.error('Error creating pledge:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Process a charge for transphobic content
    async processTransphobicCharge(pledgeId, tweetId) {
        try {
            if (!this.stripe) {
                return {
                    success: false,
                    error: 'Stripe not configured. Please add your Stripe keys to .env file',
                };
            }
            
            // Get pledge details
            const { data: pledge, error } = await this.supabase
                .from('pledges')
                .select('*')
                .eq('id', pledgeId)
                .single();

            if (error || !pledge) {
                throw new Error('Pledge not found');
            }

            // Check if monthly limit reached
            if (pledge.current_month_charged >= pledge.monthly_limit) {
                return {
                    success: false,
                    error: 'Monthly limit reached',
                };
            }

            // Calculate charge amount
            const chargeAmount = Math.min(
                pledge.per_post_amount,
                pledge.monthly_limit - pledge.current_month_charged
            );

            // Create a PaymentIntent for the charge
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: chargeAmount * 100, // Convert to pence
                currency: 'gbp',
                customer: pledge.customer_id,
                payment_method: pledge.payment_method_id,
                confirm: true,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                },
                description: `Transphobic content charge - Tweet ${tweetId}`,
                metadata: {
                    pledge_id: pledgeId,
                    tweet_id: tweetId,
                    charge_type: 'transphobic_content',
                },
            });

            // Update pledge with new charge
            await this.supabase
                .from('pledges')
                .update({
                    current_month_charged: pledge.current_month_charged + chargeAmount,
                    last_charge_date: new Date().toISOString(),
                })
                .eq('id', pledgeId);

            // Store charge record
            await this.supabase
                .from('pledge_charges')
                .insert({
                    pledge_id: pledgeId,
                    charge_id: paymentIntent.id,
                    amount: chargeAmount,
                    tweet_id: tweetId,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                });

            return {
                success: true,
                chargeId: paymentIntent.id,
                amount: chargeAmount,
            };

        } catch (error) {
            console.error('Error processing charge:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Reset monthly limits (run monthly)
    async resetMonthlyLimits() {
        try {
            const { data: pledges, error } = await this.supabase
                .from('pledges')
                .select('*')
                .eq('status', 'active');

            if (error) throw error;

            for (const pledge of pledges) {
                await this.supabase
                    .from('pledges')
                    .update({
                        current_month_charged: 0,
                        last_reset_date: new Date().toISOString(),
                    })
                    .eq('id', pledge.id);
            }

            return {
                success: true,
                resetCount: pledges.length,
            };

        } catch (error) {
            console.error('Error resetting monthly limits:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Get pledge statistics
    async getPledgeStats() {
        try {
            if (!this.supabase) {
                return {
                    totalPledges: 0,
                    totalMonthlyLimit: 0,
                    totalCharged: 0,
                    availableForCharging: 0,
                };
            }

            const { data: pledges, error } = await this.supabase
                .from('pledges')
                .select('*')
                .eq('status', 'active');

            if (error) throw error;

            const totalPledges = pledges.length;
            const totalMonthlyLimit = pledges.reduce((sum, p) => sum + p.monthly_limit, 0);
            const totalCharged = pledges.reduce((sum, p) => sum + p.current_month_charged, 0);

            return {
                totalPledges,
                totalMonthlyLimit,
                totalCharged,
                availableForCharging: totalMonthlyLimit - totalCharged,
            };

        } catch (error) {
            console.error('Error getting pledge stats:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Cancel a pledge
    async cancelPledge(pledgeId) {
        try {
            const { data: pledge, error } = await this.supabase
                .from('pledges')
                .select('*')
                .eq('id', pledgeId)
                .single();

            if (error || !pledge) {
                throw new Error('Pledge not found');
            }

            // Cancel the payment intent
            await this.stripe.paymentIntents.cancel(pledge.payment_intent_id);

            // Update pledge status
            await this.supabase
                .from('pledges')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .eq('id', pledgeId);

            return {
                success: true,
                message: 'Pledge cancelled successfully',
            };

        } catch (error) {
            console.error('Error cancelling pledge:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = StripeAPI;
