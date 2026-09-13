import { Pool } from 'pg';
import { Tenant, ApplianceProduct, StoreOrder, UserMember, PointsTransferRecord } from './types';

let poolInstance: Pool | null = null;

export function getPool(): Pool | null {
  const connStr = process.env.DATABASE_URL;
  if (!connStr || connStr.includes('user:password@endpoint')) {
    return null; // 未配置真实的远程 PostgreSQL 时，使用内存持久化回退
  }
  if (!poolInstance) {
    let cleanConn = connStr;
    if (cleanConn.includes('sslmode=require')) {
      cleanConn = cleanConn.replace('sslmode=require', 'sslmode=verify-full');
    }
    poolInstance = new Pool({
      connectionString: cleanConn,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
  }
  return poolInstance;
}

// 预设默认门店数据（实体门店）
const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'default',
    name: '苏宁易购智慧家电体验馆 (高新科技园旗舰店)',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=150&auto=format&fit=crop&q=80',
    slogan: '官方正品 · 送装一体 · 线下真机深度体验 · 国家补贴立减15%',
    address: '深圳市南山区科技南路88号苏宁易购智慧广场1-2层',
    phone: '0755-88669988',
    wechat: 'SuningTechShop01',
    business_hours: '周一至周日 09:30 - 22:00',
    notice: '【进店有礼】线上预约进店体验，即赠原厂防烫微波手套与家电清洁大礼包！全店支持以旧换新！',
    qrcode_image: '',
    enable_delivery: true,
    enable_pickup: true,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'haier-smart',
    name: '海尔智家·全屋智能场景生活馆 (万象汇专卖店)',
    logo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80',
    slogan: '三翼鸟智慧家庭全场景体验 · 免费上门测绘与家电动线设计',
    address: '深圳市宝安区万象汇B1层海尔智家数字化场景体验区',
    phone: '0755-23458899',
    wechat: 'HaierSmartLiving',
    business_hours: '周一至周日 10:00 - 22:30',
    notice: '【智慧成套】全屋成套购买尊享VIP一对一定制安装服务，核心压缩机十年保修包修。',
    qrcode_image: '',
    enable_delivery: true,
    enable_pickup: true,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'gree-central',
    name: '格力中央空调与健康厨电生活体验店',
    logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80',
    slogan: '好空调格力造 · 核心部件十年免费包修 · 专业工程安装团队',
    address: '深圳市福田区深南中路金茂时代大厦1层格力体验中心',
    phone: '0755-82991122',
    wechat: 'GreeLivingShop',
    business_hours: '周一至周六 09:00 - 21:00',
    notice: '【中央空调特惠】提供上门免费量房、出设计图纸，预约来店可享工程机直批价！',
    qrcode_image: 'https://images.unsplash.com/photo-1595079672139-62573e8a4a58?w=400&auto=format&fit=crop&q=80',
    payment_qrcode: 'https://images.unsplash.com/photo-1595079672139-62573e8a4a58?w=400&auto=format&fit=crop&q=80',
    enable_delivery: true,
    enable_pickup: true,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'gcxq',
    name: '国创智家新生活体验馆 (高新园区特许店)',
    logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&auto=format&fit=crop&q=80',
    slogan: '高新技术园区特许加盟店 · 线下真机体验 · 尊享园区专享满减',
    address: '深圳市高新南九道国创智能产业园大厦B座1层102',
    phone: '0755-86689900',
    wechat: 'GCXQ_SmartHome',
    business_hours: '周一至周日 09:00 - 21:30',
    notice: '【园区特惠】高新园区企业员工凭工卡进店享95折特惠，支持微信扫码付与公对公转账！',
    qrcode_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
    payment_qrcode: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
    enable_delivery: true,
    enable_pickup: true,
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

// 预设默认家电商品数据
const DEFAULT_PRODUCTS: ApplianceProduct[] = [
  {
    id: 'prod-ac-01',
    tenant_id: 'default',
    name: '智能新风变频冷暖无风感壁挂式空调',
    price: 3299,
    original_price: 3899,
    category: '空调制冷',
    description: '40m³/h 微正压独立双向大新风系统，自清洁柔风微孔防直吹，APF 5.30 超一级能效，手机APP远程智控。',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=450&auto=format&fit=crop&q=65&fm=webp',
    status: 1,
    energy_grade: '一级能效',
    specs: [
      { id: 'spec-1.5p', name: '大1.5匹 (适用15-23㎡)', priceDelta: 0 },
      { id: 'spec-2p', name: '大2匹 (适用20-32㎡)', priceDelta: 800 },
      { id: 'spec-3p', name: '大3匹立柜款 (适用30-45㎡)', priceDelta: 2600 },
    ],
    services: ['官方专业送装一体', '整机6年免费包修', '免费拆旧机与打孔'],
    stock: 28,
    commission_rate: 1.5, // 1.5% 佣金
    is_featured: true,
    sales_count: 142,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-fridge-02',
    tenant_id: 'default',
    name: '超薄平嵌风冷无霜双系统十字对开门冰箱 508L',
    price: 4999,
    original_price: 5999,
    category: '冰洗大电',
    description: '60cm 纯平全嵌入设计，底部前置散热无缝贴墙，双系统双循环不串味，全空间保鲜阻氧干湿分储，一级双变频。',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '超一级能效',
    specs: [
      { id: 'spec-508l', name: '508L 冰川白 (岩板面板)', priceDelta: 0 },
      { id: 'spec-606l', name: '606L 星空灰 (大容量尊享版)', priceDelta: 1200 },
    ],
    services: ['免费配送入户并调平', '压缩机十年包修', '以旧换新立减300元'],
    stock: 19,
    commission_rate: 2.0, // 2.0% 佣金
    is_featured: true,
    sales_count: 88,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-washer-03',
    tenant_id: 'default',
    name: '热泵洗烘一体滚筒洗衣机 10kg + 微蒸汽空气洗',
    price: 4299,
    original_price: 5199,
    category: '冰洗大电',
    description: '低温热泵柔烘不伤衣，除菌除螨除异味，智能活水自投放，超薄大筒径，直驱变频电机平稳静音。',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '一级能效',
    specs: [
      { id: 'spec-10kg', name: '10kg 洗脱 + 7kg 烘干 (星缎银)', priceDelta: 0 },
      { id: 'spec-12kg', name: '12kg 大容量洗烘旗舰套组', priceDelta: 1100 },
    ],
    services: ['免费上门安装进排水', '电机10年免费保修', '赠送高档防尘罩'],
    stock: 15,
    commission_rate: 1.8,
    is_featured: true,
    sales_count: 95,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-tv-04',
    tenant_id: 'default',
    name: '4K Mini-LED 144Hz 巨幕防眩高刷智慧屏电视',
    price: 5899,
    original_price: 6999,
    category: '智慧影音',
    description: '1000+ 分区独立控光，2000nits 峰值亮度，低蓝光防眩哑光屏，安桥2.1声道重低音HiFi音响，全通道4K 144Hz。',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '一级能效',
    specs: [
      { id: 'spec-65in', name: '65英寸 (建议观影距离 2.5-3.0米)', priceDelta: 0 },
      { id: 'spec-75in', name: '75英寸 (建议观影距离 3.0-3.5米)', priceDelta: 1600 },
      { id: 'spec-85in', name: '85英寸 巨幕客厅影院版', priceDelta: 3800 },
    ],
    services: ['专业挂墙/座装调试', '整机质保三年', '赠送1年VIP影视会员卡'],
    stock: 22,
    commission_rate: 1.5,
    is_featured: true,
    sales_count: 67,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-steam-05',
    tenant_id: 'default',
    name: '嵌入式家用大容量多功能微蒸烤炸一体机 50L',
    price: 3699,
    original_price: 4399,
    category: '厨卫电器',
    description: '双直喷大蒸汽澎湃锁鲜，360°热风立体烘烤加空气炸，变频微波智能解冻，搪瓷一体无缝内胆易清洁，内置80道米其林智能菜谱。',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '一级能效',
    specs: [
      { id: 'spec-50l-black', name: '50L 曜石黑玻璃面板 (标准橱柜尺寸)', priceDelta: 0 },
      { id: 'spec-50l-white', name: '50L 极地白高配彩屏款', priceDelta: 300 },
    ],
    services: ['免费开孔测量与通电调试', '赠送烘焙器具六件套', '整机保修三年'],
    stock: 16,
    commission_rate: 2.5,
    is_featured: false,
    sales_count: 48,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-robot-06',
    tenant_id: 'default',
    name: '全自动基站上下水智能吸扫拖洗一体机器人',
    price: 2899,
    original_price: 3499,
    category: '智能生活',
    description: '8000Pa 旋风飓风吸力，全能自清洁基站：自动洗拖布、自动集尘60天免倒垃圾、热风烘干、自动添加清洁液，AI毫米波避障。',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '节能认证',
    specs: [
      { id: 'spec-water-tank', name: '水箱版 (自带清水污水箱)', priceDelta: 0 },
      { id: 'spec-auto-water', name: '自动上下水模块高配版 (免人工换水)', priceDelta: 500 },
    ],
    services: ['送配件大礼包(滚刷+滤网+尘袋)', '免费上门安装上下水管路', '2年整机质保'],
    stock: 35,
    commission_rate: 3.0,
    is_featured: true,
    sales_count: 189,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-water-07',
    tenant_id: 'default',
    name: '台下式大通量厨下反渗透RO净水器 1200G',
    price: 1899,
    original_price: 2399,
    category: '厨卫电器',
    description: '3.18L/min 即滤直饮鲜活水，0陈水技术头杯放心喝，5年长效RO膜，双出水龙头（生活净水+直饮纯水），智能数显龙头。',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    status: 1,
    energy_grade: '一级水效',
    specs: [
      { id: 'spec-1200g', name: '1200G 大通量款', priceDelta: 0 },
      { id: 'spec-1600g', name: '1600G 极速秒满款', priceDelta: 400 },
    ],
    services: ['免费上门安装调试', '免人工辅材费', '赠送原厂前置复合滤芯1只'],
    stock: 40,
    commission_rate: 2.0,
    is_featured: false,
    sales_count: 112,
    created_at: new Date().toISOString(),
  },
];

// 预设订单示例（方便后台测试订单流转与语音提醒）
const DEFAULT_ORDERS: StoreOrder[] = [
  {
    id: 'ord-1001',
    tenant_id: 'default',
    order_no: 'JD20260911001',
    order_type: '送装到家',
    delivery_address: '深圳市南山区高新南九道软件产业基地4栋A座1802',
    delivery_contact: '张先生',
    delivery_phone: '13800138001',
    total_price: 3299,
    status: '待处理',
    payment_status: '已付款',
    payment_timing: '线上付款',
    points_used: 0,
    discount_amount: 0,
    user_id: 'user-13800138001',
    items: [
      {
        id: 'prod-ac-01-spec-1.5p',
        productId: 'prod-ac-01',
        name: '智能新风变频冷暖无风感壁挂式空调',
        price: 3299,
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=450&auto=format&fit=crop&q=65&fm=webp',
        category: '空调制冷',
        specName: '大1.5匹 (适用15-23㎡)',
        services: ['官方专业送装一体', '整机6年免费包修'],
        quantity: 1,
      },
    ],
    remarks: '希望师傅周六上午10点前上门送装，请提前电话联系。',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ord-1002',
    tenant_id: 'default',
    order_no: 'JD20260911002',
    order_type: '门店自提',
    delivery_address: '苏宁易购智慧家电体验馆 (到店自提验机)',
    delivery_contact: '李女士',
    delivery_phone: '13911223344',
    pickup_time: '今晚 19:30 前往门店提货',
    total_price: 2899,
    status: '配货中',
    payment_status: '已付款',
    payment_timing: '线上付款',
    points_used: 100,
    discount_amount: 100,
    user_id: 'user-13911223344',
    items: [
      {
        id: 'prod-robot-06-spec-water-tank',
        productId: 'prod-robot-06',
        name: '全自动基站上下水智能吸扫拖洗一体机器人',
        price: 2899,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        category: '智能生活',
        specName: '水箱版 (自带清水污水箱)',
        services: ['送配件大礼包', '2年整机质保'],
        quantity: 1,
      },
    ],
    remarks: '到店需要店员帮忙开箱通电通网演示一下操作。',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

// 会员与推广合伙人数据
const DEFAULT_USERS: UserMember[] = [
  {
    id: 'user-13800138000',
    tenant_id: 'default',
    name: '陈顾问 (金牌合伙人)',
    phone: '13800138000',
    role: 'gold_promoter',
    points: 1200,
    commission_points: 680,
    balance: 0,
    total_spent: 12800,
    promoted_orders_count: 8,
    promoted_total_sales: 42600,
    referral_code: 'GOLD888',
    delivery_address: '深圳市南山区科苑南路华润城大冲都市花园3栋',
    delivery_contact: '陈顾问',
    delivery_phone: '13800138000',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-13800138001',
    tenant_id: 'default',
    name: '张先生',
    phone: '13800138001',
    role: 'promoter',
    points: 350,
    commission_points: 120,
    balance: 0,
    total_spent: 3299,
    promoted_orders_count: 2,
    promoted_total_sales: 7298,
    referral_code: 'REF138001',
    delivery_address: '深圳市南山区高新南九道软件产业基地4栋A座1802',
    delivery_contact: '张先生',
    delivery_phone: '13800138001',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-13911223344',
    tenant_id: 'default',
    name: '李女士',
    phone: '13911223344',
    role: 'member',
    points: 520,
    commission_points: 0,
    balance: 0,
    total_spent: 7898,
    promoted_orders_count: 0,
    promoted_total_sales: 0,
    referral_code: 'REF139112',
    delivery_address: '深圳市南山区蔚蓝海岸三期6栋801',
    delivery_contact: '李女士',
    delivery_phone: '13911223344',
    created_at: new Date().toISOString(),
  },
];

// 内存双模持久化存储引擎（在容器生存周期内始终保持）
class MemoryDatabase {
  public tenants: Tenant[] = [...DEFAULT_TENANTS];
  public products: ApplianceProduct[] = [...DEFAULT_PRODUCTS];
  public orders: StoreOrder[] = [...DEFAULT_ORDERS];
  public users: UserMember[] = [...DEFAULT_USERS];
  public transferRecords: PointsTransferRecord[] = [
    {
      id: 'trans-01',
      tenant_id: 'default',
      from_phone: '13800138000',
      from_name: '陈顾问 (金牌合伙人)',
      to_phone: '13911223344',
      to_name: '李女士',
      points: 80,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      note: '合伙人转赠亲友家电抵扣积分',
    },
  ];
  public settings: Record<string, Record<string, string>> = {
    default: {
      enable_delivery: '1',
      enable_pickup: '1',
      points_ratio: '1', // 1元积1分
      points_discount_rate: '100', // 100积分抵扣1元
    },
  };
  public seeded: boolean = true;
}

// 保证 globalThis 单例，跨热重载或请求持久
const globalDbKey = Symbol.for('mybuysomething_db');
export const globalDb: MemoryDatabase = (globalThis as unknown as { [key: symbol]: MemoryDatabase })[globalDbKey] || new MemoryDatabase();
(globalThis as unknown as { [key: symbol]: MemoryDatabase })[globalDbKey] = globalDb;

let dbInitPromise: Promise<void> | null = null;

/**
 * 确保数据库表和基础种子（单例初始化 + Seed Lock，防止高并发下重复打库）
 */
export async function ensureDatabase() {
  const pool = getPool();
  if (!pool) {
    return; // 使用内存持久态
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      // 1. 租户表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          logo TEXT DEFAULT '',
          slogan VARCHAR(255) DEFAULT '',
          address TEXT DEFAULT '',
          phone VARCHAR(64) DEFAULT '',
          wechat VARCHAR(64) DEFAULT '',
          business_hours VARCHAR(128) DEFAULT '',
          notice TEXT DEFAULT '',
          qrcode_image TEXT DEFAULT '',
          payment_qrcode TEXT DEFAULT '',
          enable_delivery BOOLEAN DEFAULT TRUE,
          enable_pickup BOOLEAN DEFAULT TRUE,
          status VARCHAR(32) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_qrcode TEXT DEFAULT '';
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS qrcode_image TEXT DEFAULT '';
      `);

      // 2. 家电商品表 (包含推广佣金比率 commission_rate)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dishes (
          id VARCHAR(64) PRIMARY KEY,
          tenant_id VARCHAR(64) NOT NULL DEFAULT 'default',
          name VARCHAR(128) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          original_price NUMERIC(10,2) DEFAULT 0,
          category VARCHAR(64) NOT NULL,
          description TEXT DEFAULT '',
          image TEXT DEFAULT '',
          status INT NOT NULL DEFAULT 1,
          energy_grade VARCHAR(64) DEFAULT '一级能效',
          specs JSONB DEFAULT '[]'::jsonb,
          services JSONB DEFAULT '[]'::jsonb,
          stock INT DEFAULT 100,
          commission_rate NUMERIC(5,2) DEFAULT 1.0,
          is_featured BOOLEAN DEFAULT FALSE,
          sales_count INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_dishes_tenant ON dishes(tenant_id);
        ALTER TABLE dishes ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 1.0;
      `);

      // 3. 订单表 (包含推广人与佣金积分奖励)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(64) PRIMARY KEY,
          tenant_id VARCHAR(64) NOT NULL DEFAULT 'default',
          order_no VARCHAR(64) NOT NULL,
          order_type VARCHAR(32) NOT NULL DEFAULT '送装到家',
          delivery_address TEXT DEFAULT '',
          delivery_contact VARCHAR(64) DEFAULT '',
          delivery_phone VARCHAR(32) DEFAULT '',
          pickup_time VARCHAR(128) DEFAULT '',
          total_price NUMERIC(10,2) NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT '待处理',
          payment_status VARCHAR(32) NOT NULL DEFAULT '待支付',
          payment_timing VARCHAR(32) DEFAULT '线上付款',
          payment_proof_url TEXT DEFAULT '',
          points_used NUMERIC(10,2) DEFAULT 0,
          discount_amount NUMERIC(10,2) DEFAULT 0,
          promoter_id VARCHAR(64) DEFAULT '',
          promoter_name VARCHAR(64) DEFAULT '',
          commission_points_rewarded NUMERIC(10,2) DEFAULT 0,
          user_id VARCHAR(128) DEFAULT '',
          items JSONB NOT NULL,
          remarks TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS promoter_id VARCHAR(64) DEFAULT '';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS promoter_name VARCHAR(64) DEFAULT '';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_points_rewarded NUMERIC(10,2) DEFAULT 0;
      `);

      // 4. 会员与推广合伙人表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(128) PRIMARY KEY,
          tenant_id VARCHAR(64) NOT NULL DEFAULT 'default',
          name VARCHAR(64) DEFAULT '顾客',
          phone VARCHAR(32) DEFAULT '',
          role VARCHAR(32) DEFAULT 'member',
          points NUMERIC(10,2) DEFAULT 0,
          commission_points NUMERIC(10,2) DEFAULT 0,
          balance NUMERIC(10,2) DEFAULT 0,
          total_spent NUMERIC(10,2) DEFAULT 0,
          promoted_orders_count INT DEFAULT 0,
          promoted_total_sales NUMERIC(10,2) DEFAULT 0,
          referral_code VARCHAR(32) DEFAULT '',
          delivery_address TEXT DEFAULT '',
          delivery_contact VARCHAR(64) DEFAULT '',
          delivery_phone VARCHAR(32) DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'member';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_points NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS promoted_orders_count INT DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS promoted_total_sales NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32) DEFAULT '';
      `);

      // 5. 积分转赠流转表
      await pool.query(`
        CREATE TABLE IF NOT EXISTS points_transfers (
          id VARCHAR(64) PRIMARY KEY,
          tenant_id VARCHAR(64) NOT NULL DEFAULT 'default',
          from_phone VARCHAR(32) NOT NULL,
          from_name VARCHAR(64) DEFAULT '',
          to_phone VARCHAR(32) NOT NULL,
          to_name VARCHAR(64) DEFAULT '',
          points NUMERIC(10,2) NOT NULL,
          note TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 6. 设置表 (带 Seed Lock)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          tenant_id VARCHAR(64) NOT NULL DEFAULT 'default',
          key VARCHAR(64) NOT NULL,
          value TEXT NOT NULL,
          PRIMARY KEY (tenant_id, key)
        );
      `);

      // 检查是否已播种
      const seedCheck = await pool.query(`SELECT value FROM settings WHERE tenant_id = 'default' AND key = '_seeded'`);
      if (seedCheck.rows.length === 0) {
        // 写入种子数据
        for (const t of DEFAULT_TENANTS) {
          await pool.query(
            `INSERT INTO tenants (id, name, logo, slogan, address, phone, wechat, business_hours, notice, enable_delivery, enable_pickup, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [t.id, t.name, t.logo, t.slogan, t.address, t.phone, t.wechat, t.business_hours, t.notice, t.enable_delivery, t.enable_pickup, t.status]
          );
        }
        for (const p of DEFAULT_PRODUCTS) {
          await pool.query(
            `INSERT INTO dishes (id, tenant_id, name, price, original_price, category, description, image, status, energy_grade, specs, services, stock, is_featured, sales_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.tenant_id, p.name, p.price, p.original_price, p.category, p.description, p.image, p.status, p.energy_grade, JSON.stringify(p.specs), JSON.stringify(p.services), p.stock, p.is_featured, p.sales_count]
          );
        }
        for (const o of DEFAULT_ORDERS) {
          await pool.query(
            `INSERT INTO orders (id, tenant_id, order_no, order_type, delivery_address, delivery_contact, delivery_phone, pickup_time, total_price, status, payment_status, payment_timing, points_used, discount_amount, user_id, items, remarks)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             ON CONFLICT (id) DO NOTHING`,
            [o.id, o.tenant_id, o.order_no, o.order_type, o.delivery_address, o.delivery_contact, o.delivery_phone, o.pickup_time, o.total_price, o.status, o.payment_status, o.payment_timing, o.points_used, o.discount_amount, o.user_id, JSON.stringify(o.items), o.remarks]
          );
        }
        // 写入种子锁
        await pool.query(`INSERT INTO settings (tenant_id, key, value) VALUES ('default', '_seeded', '1') ON CONFLICT DO NOTHING`);
      }
    } catch (err) {
      console.error('Database migration/seed error, falling back to in-memory:', err);
    }
  })();

  return dbInitPromise;
}

// ---------------- 业务接口方法 (支持多租户与超管) ----------------

// 获取所有门店（如果指定了 accessibleTenantId 且不是 all/default，只返回该子门店，禁止越权看到上一级 default）
export async function getAllTenants(accessibleTenantId?: string): Promise<Tenant[]> {
  const pool = getPool();
  let list: Tenant[] = [];
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tenants ORDER BY created_at ASC');
      if (res.rows.length > 0) list = res.rows;
    } catch {
      // fallback
    }
  }
  if (list.length === 0) {
    list = globalDb.tenants;
  }

  // 严格隔离：子租户只能获取本门店信息，无法看到上一级 default
  if (accessibleTenantId && accessibleTenantId !== 'all' && accessibleTenantId !== 'default') {
    const single = list.filter((t) => t.id === accessibleTenantId);
    return single.length > 0 ? single : [];
  }
  return list;
}

// 获取单个门店
export async function getTenantById(id: string): Promise<Tenant | null> {
  const tenants = await getAllTenants();
  return tenants.find((t) => t.id === id) || null;
}

// 保存或更新门店（支持上传的收款二维码 payment_qrcode/qrcode_image）
export async function saveTenant(tenantData: Tenant): Promise<Tenant> {
  const pool = getPool();
  const qrcode = tenantData.payment_qrcode || tenantData.qrcode_image || '';
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO tenants (id, name, logo, slogan, address, phone, wechat, business_hours, notice, qrcode_image, payment_qrcode, enable_delivery, enable_pickup, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          logo = EXCLUDED.logo,
          slogan = EXCLUDED.slogan,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          wechat = EXCLUDED.wechat,
          business_hours = EXCLUDED.business_hours,
          notice = EXCLUDED.notice,
          qrcode_image = EXCLUDED.qrcode_image,
          payment_qrcode = EXCLUDED.payment_qrcode,
          enable_delivery = EXCLUDED.enable_delivery,
          enable_pickup = EXCLUDED.enable_pickup,
          status = EXCLUDED.status`,
        [
          tenantData.id,
          tenantData.name,
          tenantData.logo || '',
          tenantData.slogan || '',
          tenantData.address || '',
          tenantData.phone || '',
          tenantData.wechat || '',
          tenantData.business_hours || '',
          tenantData.notice || '',
          qrcode,
          qrcode,
          tenantData.enable_delivery ?? true,
          tenantData.enable_pickup ?? true,
          tenantData.status || 'active',
        ]
      );
    } catch (e) {
      console.warn('DB saveTenant error, fallback memory:', e);
    }
  }

  const updatedTenant: Tenant = {
    ...tenantData,
    qrcode_image: qrcode,
    payment_qrcode: qrcode,
  };

  const idx = globalDb.tenants.findIndex((t) => t.id === tenantData.id);
  if (idx >= 0) {
    globalDb.tenants[idx] = { ...globalDb.tenants[idx], ...updatedTenant };
  } else {
    globalDb.tenants.push(updatedTenant);
  }

  // 若是新租户且商品库中暂无商品，自动为该新租户初始化独立商品副本
  if (tenantData.id !== 'default') {
    await seedInitialTenantProducts(tenantData.id);
  }

  return updatedTenant;
}

// 为新租户初始化一套独立商品副本（保证子租户开箱即用且与总店完全隔离）
export async function seedInitialTenantProducts(tenantId: string) {
  const pool = getPool();
  if (pool) {
    try {
      const existing = await pool.query('SELECT COUNT(*) FROM dishes WHERE tenant_id = $1', [tenantId]);
      if (parseInt(existing.rows[0].count, 10) === 0) {
        for (const p of DEFAULT_PRODUCTS) {
          const newId = `prod-${tenantId}-${p.id.replace('prod-', '')}`;
          await pool.query(
            `INSERT INTO dishes (id, tenant_id, name, price, original_price, category, description, image, status, energy_grade, specs, services, stock, is_featured, sales_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [
              newId,
              tenantId,
              p.name,
              p.price,
              p.original_price,
              p.category,
              p.description,
              p.image,
              p.status,
              p.energy_grade,
              JSON.stringify(p.specs || []),
              JSON.stringify(p.services || []),
              p.stock,
              p.is_featured,
              p.sales_count || 0,
            ]
          );
        }
      }
    } catch (err) {
      console.warn('seedInitialTenantProducts DB error:', err);
    }
  }

  // 内存中同步初始化副本
  const hasInMemory = globalDb.products.some((p) => p.tenant_id === tenantId);
  if (!hasInMemory) {
    const clones = DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      id: `prod-${tenantId}-${p.id.replace('prod-', '')}`,
      tenant_id: tenantId,
    }));
    globalDb.products.push(...clones);
  }
}

// 删除门店
export async function deleteTenant(id: string): Promise<boolean> {
  if (id === 'default') return false; // 禁止删除默认总店
  const pool = getPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM dishes WHERE tenant_id = $1', [id]);
      await pool.query('DELETE FROM orders WHERE tenant_id = $1', [id]);
      await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
    } catch {
      // fallback
    }
  }
  globalDb.tenants = globalDb.tenants.filter((t) => t.id !== id);
  globalDb.products = globalDb.products.filter((p) => p.tenant_id !== id);
  globalDb.orders = globalDb.orders.filter((o) => o.tenant_id !== id);
  return true;
}

// 查询商品列表（严格多租户隔离：子租户只能看到属于该租户的商品，无法看到上一级 default）
export async function getProducts(tenantId: string, category?: string, search?: string): Promise<ApplianceProduct[]> {
  const targetTenant = tenantId || 'default';
  const pool = getPool();
  if (pool) {
    try {
      let query: string;
      let params: unknown[];
      if (targetTenant === 'all') {
        query = 'SELECT * FROM dishes WHERE 1=1';
        params = [];
      } else {
        // 严格匹配当前租户
        query = 'SELECT * FROM dishes WHERE tenant_id = $1';
        params = [targetTenant];
      }

      if (category && category !== '全部') {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }
      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
      }
      query += ' ORDER BY is_featured DESC, sales_count DESC';
      const res = await pool.query(query, params);
      if (res.rows.length > 0) return res.rows;

      // 如果是新子租户尚无商品，自动初始化后再次查询
      if (targetTenant !== 'default' && targetTenant !== 'all') {
        await seedInitialTenantProducts(targetTenant);
        const retryRes = await pool.query(query, params);
        if (retryRes.rows.length > 0) return retryRes.rows;
      }
    } catch (err) {
      console.warn('DB getProducts error:', err);
    }
  }

  // 内存持久化回退
  let list = globalDb.products;
  if (targetTenant !== 'all') {
    list = list.filter((p) => p.tenant_id === targetTenant);
    if (list.length === 0 && targetTenant !== 'default') {
      const clones = DEFAULT_PRODUCTS.map((p) => ({
        ...p,
        id: `prod-${targetTenant}-${p.id.replace('prod-', '')}`,
        tenant_id: targetTenant,
      }));
      globalDb.products.push(...clones);
      list = clones;
    }
  }

  return list.filter((p) => {
    const matchCategory = !category || category === '全部' || p.category === category;
    const matchSearch = !search || p.name.includes(search) || p.description.includes(search);
    return matchCategory && matchSearch;
  });
}

// 保存商品 (新增或更新，支持 commission_rate 推广佣金比率)
export async function saveProduct(product: ApplianceProduct): Promise<ApplianceProduct> {
  const commRate = typeof product.commission_rate === 'number' ? product.commission_rate : 1.0;
  const productWithComm: ApplianceProduct = {
    ...product,
    commission_rate: commRate,
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO dishes (id, tenant_id, name, price, original_price, category, description, image, status, energy_grade, specs, services, stock, commission_rate, is_featured, sales_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          image = EXCLUDED.image,
          status = EXCLUDED.status,
          energy_grade = EXCLUDED.energy_grade,
          specs = EXCLUDED.specs,
          services = EXCLUDED.services,
          stock = EXCLUDED.stock,
          commission_rate = EXCLUDED.commission_rate,
          is_featured = EXCLUDED.is_featured,
          sales_count = EXCLUDED.sales_count`,
        [
          productWithComm.id,
          productWithComm.tenant_id,
          productWithComm.name,
          productWithComm.price,
          productWithComm.original_price || productWithComm.price,
          productWithComm.category,
          productWithComm.description,
          productWithComm.image,
          productWithComm.status,
          productWithComm.energy_grade,
          JSON.stringify(productWithComm.specs || []),
          JSON.stringify(productWithComm.services || []),
          productWithComm.stock,
          commRate,
          productWithComm.is_featured || false,
          productWithComm.sales_count || 0,
        ]
      );
    } catch (e) {
      console.warn('DB saveProduct error:', e);
    }
  }

  const idx = globalDb.products.findIndex((p) => p.id === productWithComm.id);
  if (idx >= 0) {
    globalDb.products[idx] = productWithComm;
  } else {
    globalDb.products.unshift(productWithComm);
  }
  return productWithComm;
}

// 删除商品
export async function deleteProduct(id: string, tenantId: string): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM dishes WHERE id = $1 AND (tenant_id = $2 OR $2 = \'default\')', [id, tenantId]);
    } catch {
      // fallback
    }
  }
  globalDb.products = globalDb.products.filter((p) => p.id !== id);
  return true;
}

// 查询订单列表
export async function getOrders(tenantId?: string): Promise<StoreOrder[]> {
  const pool = getPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM orders';
      const params: unknown[] = [];
      if (tenantId && tenantId !== 'all') {
        query += ' WHERE tenant_id = $1';
        params.push(tenantId);
      }
      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows.length > 0) return res.rows;
    } catch {
      // fallback
    }
  }

  if (!tenantId || tenantId === 'all') {
    return [...globalDb.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  return globalDb.orders
    .filter((o) => o.tenant_id === tenantId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// 创建新订单 (支持推广人识别、佣金积分自动计算与发放)
export async function createOrder(orderData: Omit<StoreOrder, 'id' | 'created_at'>): Promise<StoreOrder> {
  // 计算推广佣金积分：按每件商品设定的佣金比率(例如 1% = 0.01)精确计算积分
  let calculatedCommissionPoints = 0;
  if (orderData.items && Array.isArray(orderData.items)) {
    calculatedCommissionPoints = Math.round(
      orderData.items.reduce((sum, item) => {
        const rate = typeof item.commission_rate === 'number' ? item.commission_rate : 1.0;
        return sum + item.price * item.quantity * (rate / 100);
      }, 0)
    );
  }

  let promoterName = orderData.promoter_name || '';
  const promoterId = (orderData.promoter_id || '').trim();

  // 如果有推广人标识，匹配推广人并记录姓名与发放佣金
  if (promoterId) {
    const promoter = globalDb.users.find(
      (u) =>
        u.phone === promoterId ||
        u.id === promoterId ||
        (u.referral_code && u.referral_code.toUpperCase() === promoterId.toUpperCase())
    );

    if (promoter) {
      promoterName = promoter.name;
      // 增加推广人佣金积分与累计统计
      promoter.commission_points = (promoter.commission_points || 0) + calculatedCommissionPoints;
      promoter.promoted_orders_count = (promoter.promoted_orders_count || 0) + 1;
      promoter.promoted_total_sales = (promoter.promoted_total_sales || 0) + orderData.total_price;

      // 数据库异步更新
      const pool = getPool();
      if (pool) {
        pool.query(
          `UPDATE users SET
            commission_points = commission_points + $1,
            promoted_orders_count = promoted_orders_count + 1,
            promoted_total_sales = promoted_total_sales + $2
           WHERE phone = $3 OR id = $4`,
          [calculatedCommissionPoints, orderData.total_price, promoter.phone, promoter.id]
        ).catch((e) => console.warn('DB update promoter stats error:', e));
      }
    }
  }

  const newOrder: StoreOrder = {
    ...orderData,
    promoter_id: promoterId,
    promoter_name: promoterName,
    commission_points_rewarded: calculatedCommissionPoints,
    id: 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    created_at: new Date().toISOString(),
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (id, tenant_id, order_no, order_type, delivery_address, delivery_contact, delivery_phone, pickup_time, total_price, status, payment_status, payment_timing, payment_proof_url, points_used, discount_amount, promoter_id, promoter_name, commission_points_rewarded, user_id, items, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          newOrder.id,
          newOrder.tenant_id,
          newOrder.order_no,
          newOrder.order_type,
          newOrder.delivery_address,
          newOrder.delivery_contact,
          newOrder.delivery_phone,
          newOrder.pickup_time || '',
          newOrder.total_price,
          newOrder.status,
          newOrder.payment_status,
          newOrder.payment_timing,
          newOrder.payment_proof_url || '',
          newOrder.points_used,
          newOrder.discount_amount,
          newOrder.promoter_id || '',
          newOrder.promoter_name || '',
          newOrder.commission_points_rewarded || 0,
          newOrder.user_id || '',
          JSON.stringify(newOrder.items),
          newOrder.remarks || '',
          newOrder.created_at,
        ]
      );
    } catch (e) {
      console.warn('DB createOrder error:', e);
    }
  }

  globalDb.orders.unshift(newOrder);

  // 如果使用了顾客手机号，给买家自动累积消费积分并扣减已使用积分
  if (newOrder.delivery_phone) {
    const earnedPoints = Math.floor(newOrder.total_price);
    await updateUserPoints(newOrder.tenant_id, newOrder.delivery_phone, newOrder.delivery_contact, earnedPoints, newOrder.total_price, newOrder.points_used);
  }

  return newOrder;
}

// 更新订单状态
export async function updateOrderStatus(
  orderId: string,
  status: StoreOrder['status'],
  paymentStatus?: StoreOrder['payment_status']
): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      if (paymentStatus) {
        await pool.query('UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3', [status, paymentStatus, orderId]);
      } else {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
      }
    } catch {
      // fallback
    }
  }

  const order = globalDb.orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    if (paymentStatus) order.payment_status = paymentStatus;
    return true;
  }
  return false;
}

// 查询或注册会员
export async function getOrCreateUser(tenantId: string, phone: string, name?: string): Promise<UserMember> {
  const cleanPhone = phone.trim();
  const existing = globalDb.users.find((u) => u.phone === cleanPhone && (u.tenant_id === tenantId || u.tenant_id === 'default'));
  if (existing) {
    return existing;
  }

  const newUser: UserMember = {
    id: 'user-' + cleanPhone,
    tenant_id: tenantId,
    name: name || '顾客' + cleanPhone.slice(-4),
    phone: cleanPhone,
    role: 'member',
    points: 100, // 新入会赠送100积分体验
    commission_points: 0,
    balance: 0,
    total_spent: 0,
    promoted_orders_count: 0,
    promoted_total_sales: 0,
    referral_code: 'REF' + cleanPhone.slice(-6),
    delivery_address: '',
    delivery_contact: name || '',
    delivery_phone: cleanPhone,
    created_at: new Date().toISOString(),
  };

  globalDb.users.push(newUser);
  return newUser;
}

// 会员积分及消费累计更新
export async function updateUserPoints(
  tenantId: string,
  phone: string,
  name: string,
  addPoints: number,
  addSpend: number,
  usedPoints: number = 0
): Promise<UserMember> {
  const user = await getOrCreateUser(tenantId, phone, name);
  user.points = Math.max(0, user.points + addPoints - usedPoints);
  user.total_spent += addSpend;
  if (name) user.name = name;
  return user;
}

// 保存或更新会员完整资料
export async function saveUser(userData: UserMember): Promise<UserMember> {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, tenant_id, name, phone, role, points, commission_points, balance, total_spent, promoted_orders_count, promoted_total_sales, referral_code, delivery_address, delivery_contact, delivery_phone, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          points = EXCLUDED.points,
          commission_points = EXCLUDED.commission_points,
          balance = EXCLUDED.balance,
          total_spent = EXCLUDED.total_spent,
          promoted_orders_count = EXCLUDED.promoted_orders_count,
          promoted_total_sales = EXCLUDED.promoted_total_sales,
          referral_code = EXCLUDED.referral_code,
          delivery_address = EXCLUDED.delivery_address,
          delivery_contact = EXCLUDED.delivery_contact,
          delivery_phone = EXCLUDED.delivery_phone`,
        [
          userData.id,
          userData.tenant_id,
          userData.name,
          userData.phone,
          userData.role || 'member',
          userData.points || 0,
          userData.commission_points || 0,
          userData.balance || 0,
          userData.total_spent || 0,
          userData.promoted_orders_count || 0,
          userData.promoted_total_sales || 0,
          userData.referral_code || '',
          userData.delivery_address || '',
          userData.delivery_contact || '',
          userData.delivery_phone || userData.phone,
          userData.created_at || new Date().toISOString(),
        ]
      );
    } catch (e) {
      console.warn('DB saveUser error:', e);
    }
  }

  const idx = globalDb.users.findIndex((u) => u.phone === userData.phone || u.id === userData.id);
  if (idx >= 0) {
    globalDb.users[idx] = { ...globalDb.users[idx], ...userData };
    return globalDb.users[idx];
  } else {
    globalDb.users.unshift(userData);
    return userData;
  }
}

// 变更会员角色（推广人/金牌合伙人/普通会员）
export async function updateUserRole(tenantId: string, phone: string, role: UserMember['role']): Promise<UserMember | null> {
  const user = await getOrCreateUser(tenantId, phone);
  user.role = role;
  if (!user.referral_code) {
    user.referral_code = 'REF' + phone.slice(-6);
  }
  return saveUser(user);
}

// 手动增减推广佣金积分
export async function adjustUserCommissionPoints(
  tenantId: string,
  phone: string,
  deltaAmount: number,
  note: string = ''
): Promise<UserMember | null> {
  const user = await getOrCreateUser(tenantId, phone);
  user.commission_points = Math.max(0, (user.commission_points || 0) + deltaAmount);
  return saveUser(user);
}

// 佣金积分转赠（支持推广人将佣金积分转认给其他人或消费使用）
export async function transferCommissionPoints(
  tenantId: string,
  fromPhone: string,
  toPhone: string,
  points: number,
  note: string = ''
): Promise<{ success: boolean; message: string; record?: PointsTransferRecord }> {
  if (points <= 0) {
    return { success: false, message: '转赠积分必须大于0' };
  }
  if (fromPhone === toPhone) {
    return { success: false, message: '不能转赠给自己' };
  }

  const fromUser = globalDb.users.find((u) => u.phone === fromPhone);
  if (!fromUser) {
    return { success: false, message: '未找到转出方会员' };
  }
  if ((fromUser.commission_points || 0) < points) {
    return { success: false, message: `转出方佣金积分不足（当前可用: ${fromUser.commission_points || 0}分）` };
  }

  const toUser = await getOrCreateUser(tenantId, toPhone);

  // 扣减转出方佣金积分
  fromUser.commission_points = (fromUser.commission_points || 0) - points;
  // 增加接收方常规积分（可用于在前端抵扣消费）
  toUser.points = (toUser.points || 0) + points;

  await saveUser(fromUser);
  await saveUser(toUser);

  const transferRecord: PointsTransferRecord = {
    id: 'trans-' + Date.now(),
    tenant_id: tenantId,
    from_phone: fromUser.phone,
    from_name: fromUser.name,
    to_phone: toUser.phone,
    to_name: toUser.name,
    points,
    note: note || '推广合伙人积分转赠',
    created_at: new Date().toISOString(),
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO points_transfers (id, tenant_id, from_phone, from_name, to_phone, to_name, points, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          transferRecord.id,
          transferRecord.tenant_id,
          transferRecord.from_phone,
          transferRecord.from_name,
          transferRecord.to_phone,
          transferRecord.to_name,
          transferRecord.points,
          transferRecord.note,
          transferRecord.created_at,
        ]
      );
    } catch (e) {
      console.warn('DB transferCommissionPoints error:', e);
    }
  }

  globalDb.transferRecords.unshift(transferRecord);

  return {
    success: true,
    message: `成功将 ${points} 佣金积分转赠给 ${toUser.name} (${toUser.phone})`,
    record: transferRecord,
  };
}

// 查询转赠记录
export async function getTransferRecords(tenantId?: string): Promise<PointsTransferRecord[]> {
  const pool = getPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM points_transfers';
      const params: unknown[] = [];
      if (tenantId && tenantId !== 'all') {
        query += ' WHERE tenant_id = $1';
        params.push(tenantId);
      }
      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows.length > 0) return res.rows;
    } catch {
      // fallback
    }
  }

  if (!tenantId || tenantId === 'all') {
    return globalDb.transferRecords;
  }
  return globalDb.transferRecords.filter((r) => r.tenant_id === tenantId);
}

// 查询所有会员
export async function getAllUsers(tenantId?: string): Promise<UserMember[]> {
  if (!tenantId || tenantId === 'all') {
    return globalDb.users;
  }
  return globalDb.users.filter((u) => u.tenant_id === tenantId || u.tenant_id === 'default');
}
