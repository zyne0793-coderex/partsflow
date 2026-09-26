export type Part = {
  id: string;
  part_number: string;
  name: string;
  category: string;
  manufacturer: string;
  storage_location: string;
  unit: string;
  description: string;
  created_at: string;
  updated_at: string;
  minimum_stock: number;
  archived: boolean;
  quantity: number;
  low_stock: boolean;
};
