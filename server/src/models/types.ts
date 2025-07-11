import { Types } from 'mongoose';

// User interface
export interface IUser {
  _id?: Types.ObjectId;
  token: string;
  email: string;
  name: string;
  picture?: string;
  roles: ('user' | 'rider' | 'vendor' | 'admin')[];
  location?: [number, number];
  address?: string;
  payment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Service interface
export interface IService {
  _id?: Types.ObjectId;
  name: string;
  price: number;
  description: string;
  category: string[];
  turnaround?: string;
  icon?: string;
  banner?: string;
  thumbnail?: string;
  popular?: boolean;
  tags?: string[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vendor interface
export interface IVendor {
  _id?: Types.ObjectId;
  status?: boolean;
  rating?: number;
  location: [number, number];
  services: {
    service: Types.ObjectId;
    reviews: string[];
  }[];
  owner: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Rider interface
export interface IRider {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  payouts: {
    status: 'pending' | 'done';
    amount: number;
    date: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Order interface
export interface IOrder {
  _id?: Types.ObjectId;
  price: number;
  status:
    | 'pending'
    | 'accepted'
    | 'completed'
    | 'canceled'
    | 'processing'
    | 'refunded'
    | 'to_client'
    | 'to_vendor';
  service: Types.ObjectId;
  type: string;
  user: Types.ObjectId;
  rider?: Types.ObjectId;
  otp: string;
  pick_time: Date;
  drop_time: Date;
  pickup_location: [number, number];
  drop_location: [number, number];
  vendor: Types.ObjectId;
  completed_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
