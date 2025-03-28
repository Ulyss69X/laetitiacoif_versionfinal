export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  gender: 'homme' | 'femme' | 'enfant';
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerNote = {
  id: string;
  customer_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CustomerFormData = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;