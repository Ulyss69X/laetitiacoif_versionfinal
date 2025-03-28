export type PaymentMethod = 'especes' | 'cheque' | 'carte' | 'autres';

export type ActivityService = {
  service_id: string;
  price: number;
};

export type ActivityProduct = {
  product_id: string;
  price: number;
  quantity: number;
};

export type Activity = {
  id: string;
  customer_id: string;
  date: string;
  services: ActivityService[];
  products: ActivityProduct[];
  total_services: number;
  total_products: number;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  customer?: {
    first_name: string;
    last_name: string;
  };
  activity_services?: ActivityService[];
  activity_products?: ActivityProduct[];
};

export type ActivityFormData = Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'total_services' | 'total_products' | 'total_amount' | 'customer' | 'activity_services' | 'activity_products'>;