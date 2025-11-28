export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  location: string;
  seller: {
    id: string;
    name: string;
  };
  image: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}
