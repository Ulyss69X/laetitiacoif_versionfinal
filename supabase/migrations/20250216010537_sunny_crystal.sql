/*
  # Add indexes for activities tables

  1. New Indexes
    - Index on activities(customer_id) for faster customer lookups
    - Index on activities(date) for date-based queries
    - Index on activity_services(activity_id, service_id) for service lookups
    - Index on activity_products(activity_id, product_id) for product lookups

  2. Performance
    - Improves query performance for activity filtering and reporting
    - Optimizes customer activity history lookups
*/

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_activity_services_ids ON activity_services(activity_id, service_id);
CREATE INDEX IF NOT EXISTS idx_activity_products_ids ON activity_products(activity_id, product_id);