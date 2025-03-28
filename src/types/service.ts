export type Service = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceFormData = Omit<Service, 'id' | 'created_at' | 'updated_at'>;