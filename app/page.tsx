'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Store, 
  MapPin, 
  Phone, 
  Search, 
  ShoppingBag, 
  Zap, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpDown,
  Lock,
  ChevronDown,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Tenant, ApplianceProduct, CartItem, StoreOrder } from '@/lib/types';
import ApplianceModal from '@/components/ApplianceModal';
import CartDrawer from '@/components/CartDrawer';
import StorePickerModal from '@/components/StorePickerModal';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import PromoterModal from '@/components/PromoterModal';
import OptimizedImage from '@/components/OptimizedImage';
import Link from 'next/link';

const CATEGORIES = ['全部', '空调制冷', '冰洗大电', '智慧影音', '厨卫电器', '智能生活'];

const FALLBACK_DEFAULT_TENANT: Tenant = {
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
};

async function fetchWithRetry(url: string, retries = 2, delay = 800): Promise<Response> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

function StorePageContent() {
  const searchParams = useSearchParams();
  const urlTenant = searchParams.get('tenant') || searchParams.get('t');
  const urlPromoter = searchParams.get('ref') || searchParams.get('promoter') || '';

  // 状态管理
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<ApplianceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // 交互弹窗状态
  const [selectedProduct, setSelectedProduct] = useState<ApplianceProduct | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<StoreOrder | null>(null);
  const [promoterCode, setPromoterCode] = useState(urlPromoter);
  const [isPromoterModalOpen, setIsPromoterModalOpen] = useState(false);

  // 1. 初始化门店数据（具备网络波动自动重试与兜底机制）
  useEffect(() => {
    let active = true;
    async function initTenants() {
      try {
        const apiUrl = urlTenant ? `/api/tenants?tenant=${encodeURIComponent(urlTenant)}` : '/api/tenants';
        const res = await fetchWithRetry(apiUrl);
        const data = await res.json();
        if (active && data.tenants && data.tenants.length > 0) {
          setTenants(data.tenants);
          const matched = urlTenant
            ? data.tenants.find((t: Tenant) => t.id === urlTenant)
            : data.tenants[0];
          setCurrentTenant(matched || data.tenants[0]);
        }
      } catch (e) {
        console.warn('获取门店列表已切换为本地配置:', e);
        if (active) {
          setTenants([FALLBACK_DEFAULT_TENANT]);
          setCurrentTenant(FALLBACK_DEFAULT_TENANT);
        }
      }
    }
    initTenants();
    return () => {
      active = false;
    };
  }, [urlTenant]);

  // 2. 加载当前门店的家电商品（具备重试与防抖保护）
  useEffect(() => {
    if (!currentTenant) return;
    const tenantId = currentTenant.id;
    let active = true;
    async function loadProducts() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetchWithRetry(`/api/products?tenant=${tenantId}`);
        const data = await res.json();
        if (active && data.products) {
          setProducts(data.products);
          setLoading(false);
        }
      } catch (e) {
        console.warn('获取商品遇到网络延迟，正在捕获:', e);
        if (active) {
          setFetchError(e instanceof Error ? e.message : '连接错误');
          setLoading(false);
        }
      }
    }
    loadProducts();
    return () => {
      active = false;
    };
  }, [currentTenant, reloadKey]);

  // 添加到购物车
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  // 更新购物车数量
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // 移除单项
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  // 筛选与排序商品
  const filteredProducts = products
    .filter((p) => {
      if (p.status === 0) return false; // 已下架不展示
      const matchCategory = activeCategory === '全部' || p.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });

  const isChildTenant = !!urlTenant && urlTenant !== 'default';

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28">
      {/* 顶部主导航 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* 左侧：实体门店标识 / 门店切换器 */}
          {isChildTenant ? (
            <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 border border-slate-200 max-w-[260px] sm:max-w-md">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {currentTenant?.name || '官方授权专卖店'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    官方直营
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium truncate block">
                  实体展厅直发 · 全国联保 · 免费送装入户
                </span>
              </div>
            </div>
          ) : (
            <button
              id="btn-open-store-picker"
              onClick={() => setIsStorePickerOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer max-w-[210px] sm:max-w-md"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {currentTenant?.name || '正在加载门店...'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
                <span className="text-[10px] sm:text-[11px] text-rose-600 truncate block">
                  点击切换实体分店 · 享到店好礼
                </span>
              </div>
            </button>
          )}

          {/* 右侧：操作区 */}
          <div className="flex items-center gap-2">
            {/* 子租户专属官方服务保障与到店咨询：不展示“合伙人中心”和“子租户后台”，更显品牌官方权威 */}
            {isChildTenant ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>正品全国联保</span>
                </div>
                {currentTenant?.phone && (
                  <a
                    id="link-tenant-phone"
                    href={`tel:${currentTenant.phone}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                    title="拨打门店服务热线"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">门店咨询</span>
                    <span className="sm:hidden">咨询</span>
                  </a>
                )}
              </div>
            ) : (
              /* 仅在超级主平台展示管理入口与合伙人中心 */
              <>
                <button
                  id="btn-promoter-center"
                  type="button"
                  onClick={() => setIsPromoterModalOpen(true)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="查看专属推广码、佣金积分与转赠亲友"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">合伙人中心</span>
                  <span className="sm:hidden">合伙人</span>
                </button>

                <Link
                  id="link-to-admin"
                  href="/admin"
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">超级管理后台</span>
                  <span className="sm:hidden">管理</span>
                </Link>
              </>
            )}

            <button
              id="btn-header-cart"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-3.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">购物车</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-rose-600 font-bold text-[11px] flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 实体门店宣传展板与推广横幅 */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg p-4 sm:p-7">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-xs font-semibold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>实体门店线上推广 · 官方直营保真 · 节能补贴立省15%</span>
                </div>
                {promoterCode && !isChildTenant && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>合伙人专属推荐 · 推荐码: {promoterCode}</span>
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {currentTenant?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentTenant?.slogan}
              </p>
              
              {/* 门店地址与联系方式直达 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{currentTenant?.address}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>电话：<a href={`tel:${currentTenant?.phone}`} className="underline text-white font-medium">{currentTenant?.phone}</a></span>
                </span>
              </div>
            </div>

            {/* 实体门店特色四大保障徽章 */}
            <div className="grid grid-cols-2 gap-2 shrink-0 md:max-w-xs text-xs">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">官方正品溯源</div>
                  <div className="text-[10px] text-slate-300">假一赔十 全国联保</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">送装一体入户</div>
                  <div className="text-[10px] text-slate-300">送货+专业师傅安装</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">一级节能认证</div>
                  <div className="text-[10px] text-slate-300">超低能耗 省电静音</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
                <Store className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">实体真机体验</div>
                  <div className="text-[10px] text-slate-300">支持线上预约到店</div>
                </div>
              </div>
            </div>
          </div>

          {/* 进店有礼横幅 */}
          {currentTenant?.notice && (
            <div className="mt-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shrink-0">进店专享</span>
              <span className="truncate">{currentTenant.notice}</span>
            </div>
          )}
        </div>
      </div>

      {/* 搜索与分类控制栏 */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-appliances"
                type="text"
                placeholder="搜索新风空调、十字门冰箱、洗烘机、电视、净水器..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-rose-600 focus:bg-white transition-all"
              />
            </div>

            {/* 排序按钮 */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSortBy('default')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  sortBy === 'default' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                推荐排序
              </button>
              <button
                type="button"
                onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors ${
                  sortBy.startsWith('price') ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>价格 {sortBy === 'price-asc' ? '↑' : sortBy === 'price-desc' ? '↓' : ''}</span>
              </button>
            </div>
          </div>

          {/* 分类标签横滑列表 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 家电商品瀑布流展示 */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse p-4 space-y-3">
                <div className="bg-slate-200 h-44 rounded-xl"></div>
                <div className="bg-slate-200 h-4 rounded w-3/4"></div>
                <div className="bg-slate-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : fetchError && products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="text-base font-bold text-slate-800">商品数据获取遇到短暂波动</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">云端服务连接可能正在唤醒，系统支持一键重新加载获取最新家电展品</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新加载商品列表</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <div className="text-base font-bold text-slate-800">未找到匹配的家电商品</div>
            <p className="text-xs text-slate-500">试着更换搜索关键词或选择其他品类</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                id={`card-product-${product.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* 封面图片：极速渐进式渲染与 WebP 适屏加速 */}
                <div 
                  className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    category={product.category}
                    priority={index < 2}
                    width={450}
                    quality={65}
                    className="group-hover:scale-103 transition-transform duration-300"
                  />
                  {/* 能效角标 */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                      {product.energy_grade}
                    </span>
                    {product.is_featured && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                        店长力荐
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px]">
                    已销 {product.sales_count || 10}+ 台
                  </div>
                </div>

                {/* 商品详情区 */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      {product.category}
                    </span>
                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 hover:text-rose-600 cursor-pointer transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* 服务标签 */}
                  {product.services && product.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.services.slice(0, 2).map((srv, idx) => (
                        <span key={idx} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Truck className="w-2.5 h-2.5 text-blue-500" />
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 价格与操作栏 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-extrabold text-rose-600">
                          ¥{product.price.toLocaleString()}
                        </span>
                        {product.original_price > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ¥{product.original_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        线下真机验机 · 送装同步
                      </span>
                    </div>

                    <button
                      id={`btn-select-spec-${product.id}`}
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>选规格</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 官方商城底部服务保障与门店资质信息 */}
      <footer className="mt-14 bg-white border-t border-slate-200 pt-10 pb-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 四大服务保障 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">100% 正品行货</div>
                <div className="text-[11px] text-slate-500">原厂品质 全国联保</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">专业送装同步</div>
                <div className="text-[11px] text-slate-500">实体仓直发 送货+安装</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">实体展厅验机</div>
                <div className="text-[11px] text-slate-500">真机体验 线上线下同权</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">节能补贴直减</div>
                <div className="text-[11px] text-slate-500">国家一级能效 享高额补贴</div>
              </div>
            </div>
          </div>

          {/* 门店官方信息与联系方式 */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="text-sm font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <span>{currentTenant?.name || '品牌授权官方专卖店'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  官方正品授权店
                </span>
              </div>
              <p>门店展厅地址：{currentTenant?.address || '官方实体直营展厅'}</p>
              <p>门店服务时间：{currentTenant?.business_hours || '周一至周日 09:00 - 21:00（节假日无休）'}</p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
              {currentTenant?.phone && (
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Phone className="w-4 h-4 text-rose-600" />
                  <a href={`tel:${currentTenant.phone}`} className="hover:text-rose-600 transition-colors">
                    {currentTenant.phone}
                  </a>
                </div>
              )}
              <div className="text-[11px] text-slate-400">
                全国联保服务专线 · 7×24小时实体专席导购
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} {currentTenant?.name || '家电官方体验店'} 官方版权所有 · 实体门店线上专属展厅
          </div>
        </div>
      </footer>

      {/* 底部悬浮购物车栏（在有商品时吸底呈现） */}
      {totalCartCount > 0 && (
        <aside 
          aria-label="购物车结算工具栏"
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 cursor-pointer text-left flex-1 min-w-0"
            >
              <div className="relative w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">
                  ¥{totalCartPrice.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  已选 {totalCartCount} 件家电 · 送装入户
                </div>
              </div>
            </button>

            <button
              id="btn-open-cart-checkout"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              去结算
            </button>
          </div>
        </aside>
      )}

      {/* 商品规格详情弹窗 */}
      <ApplianceModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 抽屉购物车与结算 */}
      {currentTenant && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          tenant={currentTenant}
          initialPromoterId={promoterCode}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={() => setCartItems([])}
          onOrderSuccess={(order) => setCompletedOrder(order)}
        />
      )}

      {/* 合伙人与会员推广权益中心弹窗 */}
      {currentTenant && (
        <PromoterModal
          isOpen={isPromoterModalOpen}
          onClose={() => setIsPromoterModalOpen(false)}
          tenant={currentTenant}
          onApplyPromoterCode={(code) => {
            setPromoterCode(code);
            setIsCartOpen(true);
          }}
        />
      )}

      {/* 实体门店切换与信息展示 */}
      {currentTenant && (
        <StorePickerModal
          isOpen={isStorePickerOpen}
          onClose={() => setIsStorePickerOpen(false)}
          currentTenant={currentTenant}
          tenants={tenants}
          onSelectTenant={(t) => setCurrentTenant(t)}
        />
      )}

      {/* 订单成功完成弹窗 */}
      {currentTenant && (
        <OrderSuccessModal
          order={completedOrder}
          tenant={currentTenant}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}

export default function StoreHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500">正在加载门店系统...</div>}>
      <StorePageContent />
    </Suspense>
  );
}
