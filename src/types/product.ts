export type Product = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;