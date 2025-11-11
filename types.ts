
export interface Car {
  id?: string;
  dealerCode: string;
  dealerName: string;
  model: string;
  vin: string;
  frontMotorNo: string;
  rearMotorNo: string;
  batteryNo: string;
  engineNo: string;
  color: string;
  carType: string;
  allocationDate: string;
  poType: string;
  price: number;
  status: CarStatus;
  stockInDate?: string;
  stockLocation?: 'มหาสารคาม' | 'กาฬสินธุ์';
}

export enum CarStatus {
  WAITING_FOR_TRAILER = 'รอขึ้นเทรลเลอร์',
  ON_TRAILER = 'ขึ้นเทรลเลอร์',
  UNLOADED = 'รถลงแล้ว',
  IN_STOCK = 'In Stock',
  RESERVED = 'Reserved',
  SOLD = 'Sold',
}

export enum MatchStatus {
  WAITING_FOR_CONTRACT = 'รอทำสัญญา',
  WAITING_FOR_PO = 'รอ PO',
  POSTPONED = 'เลื่อนรับรถ',
  DELIVERED = 'รับรถแล้ว',
}

export interface Match {
  id?: string;
  carId: string;
  customerName: string;
  salesperson: string;
  saleDate?: string;
  status: MatchStatus;
  licensePlate?: string;
  notes?: string;
}

export type UserRole = 'executive' | 'admin' | 'user';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
}

export type SalespersonStatus = 'active' | 'inactive';

export interface Salesperson {
  id: string;
  name: string;
  status: SalespersonStatus;
}