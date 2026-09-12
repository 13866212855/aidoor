export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  slogan: string;
  address: string;
  phone: string;
  wechat?: string;
  business_hours: string;
  notice?: string;
  qrcode_image?: string;
  payment_qrcode?: string;
  enable_delivery: boolean;
  enable_pickup: boolean;
  status: 'active' | 'closed';
  created_at?: string;
}

export interface ApplianceSpec {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ApplianceProduct {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  original_price: number;
  category: string;
  description: string;
  image: string;
  status: number; // 1 上架, 0 下架
  energy_grade: string; // "一级能效" | "二级能效" 等
  specs: ApplianceSpec[];
  services: string[]; // 例如: ["免费上门送装", "整机保修6年", "以旧换新补贴200元"]
  stock: number;
  commission_rate?: number; // 推广佣金比率 (%)，如 1 代表 1%
  is_featured?: boolean;
  sales_count?: number;
  created_at?: string;
}

export interface CartItem {
  id: string; // 组合唯一 ID: productId + specId
  productId: string;
  name: string;
  price: number;
  commission_rate?: number; // 单品佣金比率
  image: string;
  category: string;
  specName: string;
  services: string[];
  quantity: number;
}

export interface UserMember {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  role?: 'member' | 'promoter' | 'gold_promoter'; // 普通会员 | 推广合伙人 | 金牌推广员
  points: number; // 消费常规积分
  commission_points: number; // 推广佣金积分（可用于消费或转赠）
  balance: number;
  total_spent: number;
  promoted_orders_count?: number; // 成功推广订单数
  promoted_total_sales?: number; // 推广总销售额
  referral_code?: string; // 专属邀请推广码
  delivery_address: string;
  delivery_contact: string;
  delivery_phone: string;
  created_at?: string;
}

export interface PointsTransferRecord {
  id: string;
  tenant_id: string;
  from_phone: string;
  from_name: string;
  to_phone: string;
  to_name: string;
  points: number;
  created_at: string;
  note?: string;
}

export interface StoreOrder {
  id: string;
  tenant_id: string;
  order_no: string;
  order_type: '送装到家' | '门店自提';
  delivery_address: string;
  delivery_contact: string;
  delivery_phone: string;
  pickup_time?: string;
  total_price: number;
  status: '待处理' | '配货中' | '送装中' | '已完成' | '已取消';
  payment_status: '待支付' | '已付款' | '货到付款';
  payment_timing: string;
  payment_proof_url?: string;
  points_used: number;
  discount_amount: number;
  promoter_id?: string; // 推广人手机号或ID
  promoter_name?: string; // 推广人姓名
  commission_points_rewarded?: number; // 该订单已产生或预计产生的佣金积分
  user_id?: string;
  items: CartItem[];
  remarks?: string;
  created_at: string;
}
