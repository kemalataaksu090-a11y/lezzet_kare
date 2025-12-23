

export enum Category {
  KEBAB = 'Kebaplar',
  BURGER = 'Burgerler',
  DRINK = 'İçecekler',
  DESSERT = 'Tatlılar'
}

export interface DiscountRule {
  itemId: string;
  discountPercent: number;
  days: number[]; // 0: Pazar, 1: Pazartesi...
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number; // Ürünün birim maliyeti
  category: Category;
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RequestType {
  WAITER = 'GARSON ÇAĞIR',
  BILL = 'HESAP İSTE'
}

export interface TableRequest {
  id: string;
  tableId: string;
  type: RequestType;
  timestamp: number;
  isResolved: boolean;
}

export interface Order {
  id: string;
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: number;
  aiNote?: string;
}

export interface User {
  username: string;
  password?: string;
  email?: string;
  phone?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Adana Kebap',
    description: 'Zırh kıyma, özel baharatlar, közlenmiş domates ve biber ile.',
    price: 320,
    cost: 140,
    category: Category.KEBAB,
    image: 'https://images.unsplash.com/photo-1644704170910-a0cdf183649b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '2',
    name: 'Urfa Kebap',
    description: 'Acısız zırh kıyma, yanında pilav ve salata.',
    price: 310,
    cost: 135,
    category: Category.KEBAB,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '3',
    name: 'Cheeseburger',
    description: '180gr dana eti, cheddar peyniri, karamelize soğan.',
    price: 280,
    cost: 110,
    category: Category.BURGER,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: '4',
    name: 'Yayık Ayran',
    description: 'Bol köpüklü, taze taze.',
    price: 45,
    cost: 12,
    category: Category.DRINK,
    image: 'https://images.unsplash.com/photo-1626432204561-39656a84c810?auto=format&fit=crop&w=400&q=80'
  }
];
