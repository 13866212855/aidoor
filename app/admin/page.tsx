'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Users, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  ExternalLink, 
  Copy, 
  Share2, 
  QrCode, 
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
  Lock,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Play,
  ShieldCheck,
  Building2,
  Award,
  Coins,
  TrendingUp,
  Send,
  History
} from 'lucide-react';
import { Tenant, ApplianceProduct, StoreOrder, UserMember, PointsTransferRecord } from '@/lib/types';
import { playOrderChime, unlockAudio, speakOrderAnnouncement, testVoiceAnnouncement } from '@/lib/sound';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-white">正在加载管理后台...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const queryTenant = searchParams.get('tenant') || searchParams.get('t');
  const isChildTenantMode = Boolean(queryTenant && queryTenant !== 'all');

  // 认证状态 (安全保护：不预填或明文展示密码)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 后台主界面状态
  const [activeTab, setActiveTab] = useState<'stores' | 'products' | 'orders' | 'members'>('stores');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(queryTenant || 'all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [products, setProducts] = useState<ApplianceProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [members, setMembers] = useState<UserMember[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // 新订单语音播报跟踪
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadOrdersRef = useRef<boolean>(true);

  // 门店编辑 / 创建新租户弹窗
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [createdTenantNotice, setCreatedTenantNotice] = useState<{ id: string; name: string } | null>(null);

  // 商品编辑弹窗
  const [editingProduct, setEditingProduct] = useState<ApplianceProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // 推广二维码海报弹窗
  const [promoTenant, setPromoTenant] = useState<Tenant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 会员积分调整弹窗
  const [adjustingMember, setAdjustingMember] = useState<UserMember | null>(null);
  const [adjustPointsValue, setAdjustPointsValue] = useState<number>(100);

  // 推广合伙人与会员管理增强状态
  const [memberFilterRole, setMemberFilterRole] = useState<'all' | 'member' | 'promoter' | 'gold_promoter'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  
  // 会员角色变更弹窗
  const [roleModalMember, setRoleModalMember] = useState<UserMember | null>(null);
  const [targetRole, setTargetRole] = useState<'member' | 'promoter' | 'gold_promoter'>('promoter');
  
  // 佣金积分调整弹窗
  const [adjustCommissionMember, setAdjustCommissionMember] = useState<UserMember | null>(null);
  const [adjustCommissionDelta, setAdjustCommissionDelta] = useState<number>(100);
  const [adjustCommissionNote, setAdjustCommissionNote] = useState('');

  // 管理端代客转赠积分弹窗
  const [adminTransferMember, setAdminTransferMember] = useState<UserMember | null>(null);
  const [adminTransferToPhone, setAdminTransferToPhone] = useState('');
  const [adminTransferPoints, setAdminTransferPoints] = useState<number>(50);
  const [adminTransferNote, setAdminTransferNote] = useState('');
  const [adminTransferLoading, setAdminTransferLoading] = useState(false);

  // 积分转赠记录流水弹窗
  const [transferLogModalOpen, setTransferLogModalOpen] = useState(false);
  const [transferRecords, setTransferRecords] = useState<PointsTransferRecord[]>([]);
  const [loadingTransferRecords, setLoadingTransferRecords] = useState(false);

  // 1. 检查管理员登录态
  useEffect(() => {
    let active = true;
    async function verifySession() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (active) {
          setIsAuthenticated(Boolean(data.authenticated));
        }
      } catch {
        if (active) setIsAuthenticated(false);
      }
    }
    verifySession();
    return () => {
      active = false;
    };
  }, []);

  // 2. 加载数据（针对子租户进行严格的数据范围隔离）
  const loadAllData = useCallback(async () => {
    try {
      const activeTenantScope = isChildTenantMode ? queryTenant : (selectedTenantId === 'all' ? '' : selectedTenantId);
      
      // 门店列表：子租户模式下严格仅请求自身，绝不获取上一级数据
      const tenantQuery = activeTenantScope ? `?tenant=${encodeURIComponent(activeTenantScope)}` : '';
      const tRes = await fetch(`/api/tenants${tenantQuery}`);
      const tData = await tRes.json();
      if (tData.tenants) {
        setTenants(tData.tenants);
      }

      // 商品列表：严格隔离
      const productTenant = activeTenantScope || (selectedTenantId === 'all' ? 'default' : selectedTenantId);
      const pRes = await fetch(`/api/products?tenant=${encodeURIComponent(productTenant)}`);
      const pData = await pRes.json();
      if (pData.products) {
        setProducts(pData.products);
      }

      // 订单列表
      const orderTenantQuery = activeTenantScope ? `?tenant=${encodeURIComponent(activeTenantScope)}` : (selectedTenantId !== 'all' ? `?tenant=${encodeURIComponent(selectedTenantId)}` : '');
      const oRes = await fetch(`/api/orders${orderTenantQuery}`);
      const oData = await oRes.json();
      if (oData.orders) {
        const newOrders: StoreOrder[] = oData.orders;
        setOrders(newOrders);

        // 语音播放检测：若发现有新订单且非初次加载，自动语音朗读订单详情
        if (!isFirstLoadOrdersRef.current && prevOrderIdsRef.current.size > 0) {
          const freshOrders = newOrders.filter(o => !prevOrderIdsRef.current.has(o.id));
          if (freshOrders.length > 0 && soundEnabled) {
            // 播报最新的一笔新订单
            const latest = freshOrders[0];
            speakOrderAnnouncement(latest);
          }
        }

        // 更新已知订单 ID 集合
        const nextIds = new Set<string>(newOrders.map(o => o.id));
        prevOrderIdsRef.current = nextIds;
        isFirstLoadOrdersRef.current = false;
      }

      // 会员列表
      const userTenantQuery = activeTenantScope ? `?tenant=${encodeURIComponent(activeTenantScope)}` : (selectedTenantId !== 'all' ? `?tenant=${encodeURIComponent(selectedTenantId)}` : '');
      const mRes = await fetch(`/api/users${userTenantQuery}`);
      const mData = await mRes.json();
      if (mData.users) {
        setMembers(mData.users);
      }
    } catch (err) {
      console.error('加载后台数据失败:', err);
    }
  }, [isChildTenantMode, queryTenant, selectedTenantId, soundEnabled]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    async function syncAdminData() {
      try {
        await loadAllData();
      } finally {
        if (active) setLoadingData(false);
      }
    }
    syncAdminData();

    // 开启 6 秒定时轮询，客户下单后能第一时间听到语音提示并展示
    const timer = setInterval(() => {
      loadAllData();
    }, 6000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, loadAllData]);

  // 3. 登录动作 (已移除密码明文提示，采用标准安全防护)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        unlockAudio();
      } else {
        setLoginError(data.error || '用户名或密码不正确');
      }
    } catch {
      setLoginError('网络请求失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  // 4. 退出登录动作
  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  // 5. 保存门店资料 / 创建新租户
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const isNew = isCreatingTenant;
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTenant),
      });
      const data = await res.json();
      if (data.success) {
        const savedId = editingTenant.id;
        const savedName = editingTenant.name;
        setIsTenantModalOpen(false);
        setEditingTenant(null);
        setIsCreatingTenant(false);

        await loadAllData();

        if (isNew) {
          setCreatedTenantNotice({
            id: savedId,
            name: savedName,
          });
        }
      } else {
        alert(data.error || '保存失败');
      }
    } catch {
      alert('网络请求失败');
    }
  };

  // 5.1 二维码图片上传处理
  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片格式文件（JPG/PNG/WEBP等）');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64 && editingTenant) {
        setEditingTenant({
          ...editingTenant,
          payment_qrcode: base64,
          qrcode_image: base64
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // 6. 保存商品
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const targetTenant = editingProduct.tenant_id || (selectedTenantId === 'all' ? 'default' : selectedTenantId);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingProduct, tenant_id: targetTenant }),
      });
      const data = await res.json();
      if (data.success) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await loadAllData();
      } else {
        alert(data.error || '保存商品失败');
      }
    } catch {
      alert('网络请求失败');
    }
  };

  // 7. 切换商品上架状态
  const handleToggleProductStatus = async (product: ApplianceProduct) => {
    const nextStatus = product.status === 1 ? 0 : 1;
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, status: nextStatus }),
      });
      loadAllData();
    } catch {
      alert('操作失败');
    }
  };

  // 8. 删除商品
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要从商品库中删除该家电吗？')) return;
    try {
      await fetch(`/api/products?id=${id}&tenant=${selectedTenantId}`, { method: 'DELETE' });
      loadAllData();
    } catch {
      alert('删除失败');
    }
  };

  // 9. 更新订单状态
  const handleUpdateOrderStatus = async (orderId: string, status: StoreOrder['status'], paymentStatus?: StoreOrder['payment_status']) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, paymentStatus }),
      });
      if (soundEnabled) {
        playOrderChime();
      }
      loadAllData();
    } catch {
      alert('更新订单失败');
    }
  };

  // 10. 会员积分调整
  const handleSaveMemberPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingMember) return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: adjustingMember.phone,
          name: adjustingMember.name,
          addPoints: adjustPointsValue,
          tenantId: adjustingMember.tenant_id,
        }),
      });
      setAdjustingMember(null);
      loadAllData();
    } catch {
      alert('积分调整失败');
    }
  };

  // 变更用户角色 (推广合伙人/金牌合伙人/会员)
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalMember) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          phone: roleModalMember.phone,
          role: targetRole,
          tenantId: roleModalMember.tenant_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleModalMember(null);
        await loadAllData();
      } else {
        alert(data.error || '变更角色失败');
      }
    } catch {
      alert('请求失败');
    }
  };

  // 调整佣金积分
  const handleSaveCommissionPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCommissionMember) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_commission',
          phone: adjustCommissionMember.phone,
          delta: adjustCommissionDelta,
          note: adjustCommissionNote.trim() || '后台管理员直接调整',
          tenantId: adjustCommissionMember.tenant_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdjustCommissionMember(null);
        setAdjustCommissionNote('');
        await loadAllData();
      } else {
        alert(data.error || '佣金积分调整失败');
      }
    } catch {
      alert('调整失败');
    }
  };

  // 代客转赠佣金积分
  const handleAdminTransferPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTransferMember) return;
    if (!adminTransferToPhone.trim() || adminTransferToPhone.length < 11) {
      alert('请输入接收人的11位手机号');
      return;
    }
    setAdminTransferLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_points',
          fromPhone: adminTransferMember.phone,
          toPhone: adminTransferToPhone.trim(),
          points: adminTransferPoints,
          note: adminTransferNote.trim() || '后台协助转赠抵扣积分',
          tenantId: adminTransferMember.tenant_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || '转赠成功！');
        setAdminTransferMember(null);
        setAdminTransferToPhone('');
        setAdminTransferNote('');
        await loadAllData();
      } else {
        alert(data.error || '转赠失败');
      }
    } catch {
      alert('请求异常');
    } finally {
      setAdminTransferLoading(false);
    }
  };

  // 查看转赠流水记录
  const handleOpenTransferLogs = async () => {
    setLoadingTransferRecords(true);
    setTransferLogModalOpen(true);
    try {
      const activeTenantScope = isChildTenantMode ? queryTenant : (selectedTenantId === 'all' ? '' : selectedTenantId);
      const url = activeTenantScope ? `/api/users?action=transfers&tenant=${encodeURIComponent(activeTenantScope)}` : '/api/users?action=transfers';
      const res = await fetch(url);
      const data = await res.json();
      setTransferRecords(data.transfers || []);
    } catch {
      alert('获取转赠记录失败');
    } finally {
      setLoadingTransferRecords(false);
    }
  };

  // 复制推广链接
  const handleCopyPromoLink = (tenantId: string) => {
    const url = `${window.location.origin}/?tenant=${tenantId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 登录界面 (已彻底移除明文密码显示，保障账户与多租户权限安全)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {isChildTenantMode ? `子租户管理登录 (${queryTenant})` : '连锁实体门店管理后台'}
            </h1>
            <p className="text-xs text-slate-500">
              {isChildTenantMode 
                ? '您当前正在登录指定子租户专有面板，独立隔离管理' 
                : '用于实体门店线上推广、多租户分权与家电在线订购集中管理'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>多租户安全保护已开启</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              后台登录受商户凭据验证保护。请输入授权管理员账号及密码，登录后将根据租户权限隔离展现数据。
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">管理员账号</label>
              <input
                id="input-admin-username"
                type="text"
                required
                autoComplete="username"
                placeholder="请输入管理员账号"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-rose-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">登录密码</label>
              <input
                id="input-admin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="请输入登录密码"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-rose-600"
              />
            </div>

            {loginError && (
              <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                {loginError}
              </div>
            )}

            <button
              id="btn-admin-login"
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? '正在验证身份...' : '立即登录管理后台'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link 
              href={isChildTenantMode ? `/?tenant=${encodeURIComponent(queryTenant!)}` : '/'} 
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              ← 返回{isChildTenantMode ? '子租户' : '门店'}前台浏览
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">
        正在验证超级管理员会话...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部主导航 */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${isChildTenantMode ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {isChildTenantMode ? <Building2 className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>{isChildTenantMode ? `${tenants[0]?.name || queryTenant} · 子租户后台` : '智慧连锁门店超级管理后台'}</span>
                {isChildTenantMode && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                    tenant={queryTenant}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {isChildTenantMode 
                  ? '子租户隔离运行环境 · 仅限维护本店配置、商品库存与订单流转'
                  : '支持所有实体门店配置、创建新租户、商品库流转与订单实时语音播报'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 试听测试语音 */}
            <button
              id="btn-test-sound"
              type="button"
              onClick={() => {
                unlockAudio();
                testVoiceAnnouncement();
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="点击试听订单播报效果"
            >
              <Play className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">测试播报语音</span>
            </button>

            {/* 声音开关 */}
            <button
              id="btn-toggle-sound"
              type="button"
              onClick={() => {
                unlockAudio();
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}
              title={soundEnabled ? '语音播报已开启' : '语音播报已静音'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? '语音提醒开' : '静音'}</span>
            </button>

            {/* 前台预览 */}
            <Link
              href={isChildTenantMode ? `/?tenant=${encodeURIComponent(queryTenant!)}` : '/'}
              target="_blank"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">打开{isChildTenantMode ? '分店' : ''}前台</span>
            </Link>

            {/* 登出 */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </header>

      {/* 状态栏：门店全局选择器与快捷刷新 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">当前管理范围：</span>
            {isChildTenantMode ? (
              <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>子租户已安全沙箱隔离：{tenants[0]?.name || queryTenant} (ID: {queryTenant})</span>
              </div>
            ) : (
              <select
                id="select-admin-tenant"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 font-bold focus:outline-rose-600"
              >
                <option value="all">全部门店 (超级总览)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (ID: {t.id})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={loadAllData}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="刷新数据"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            {isChildTenantMode ? (
              <span className="text-emerald-700 font-medium">上级(/)数据已被隔离保护 · 当前为子租户专属视图</span>
            ) : (
              <span>系统已连通：Neon PostgreSQL / 内存高可用多租户引擎</span>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"></span>
          </div>
        </div>
      </div>

      {/* 主界面卡片与标签切换 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-1 w-full space-y-4">
        {/* Tab 选项卡 */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
          <button
            id="tab-stores"
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'stores'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>门店管理与全店配置 ({tenants.length})</span>
          </button>

          <button
            id="tab-products"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>家电商品库管理 ({products.length})</span>
          </button>

          <button
            id="tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>订单处理中心 ({orders.length})</span>
            {orders.filter((o) => o.status === '待处理').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {orders.filter((o) => o.status === '待处理').length} 待办
              </span>
            )}
          </button>

          <button
            id="tab-members"
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'members'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>会员与积分管理 ({members.length})</span>
          </button>
        </div>

        {/* Tab 1: 门店管理与配置中心 (多租户架构，支持创建新租户、配置收款码) */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isChildTenantMode ? '本店实体门店信息配置' : '连锁实体门店与多租户管理'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isChildTenantMode 
                    ? '维护本店基础资料、微信客服、同城送装与本店专属收款二维码' 
                    : '支持创建新租户分店、配置各门店收款码、独立域名/参数分发、商品自动初始化'}
                </p>
              </div>

              {!isChildTenantMode && (
                <button
                  id="btn-create-tenant"
                  type="button"
                  onClick={() => {
                    setIsCreatingTenant(true);
                    setEditingTenant({
                      id: 'gcxq',
                      name: '国创智家体验馆',
                      slogan: '正品直供 · 送装同步 · 进店有好礼',
                      address: '广东省深圳市南山区高新南道XX号',
                      phone: '0755-88889999',
                      wechat: 'gcxq_service',
                      business_hours: '09:00 - 21:30',
                      notice: '线上预约到店免费领家电防烫手套与清洁套装！',
                      enable_delivery: true,
                      enable_pickup: true,
                      status: 'active',
                      payment_qrcode: '',
                    });
                    setIsTenantModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 创建新租户/加盟分店</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        租户: {t.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(t.payment_qrcode || t.qrcode_image) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>收款码已配</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            未上传收款码
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {t.status === 'active' ? '营业中' : '已暂停'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {t.name}
                    </h3>
                    <p className="text-xs text-rose-700 font-medium">
                      {t.slogan}
                    </p>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{t.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.business_hours}</span>
                      </div>
                    </div>

                    {/* 专属多租户入口与链接指示 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                      <div className="text-slate-500 font-medium">子租户专属通道：</div>
                      <div className="flex items-center justify-between gap-1 text-slate-700 font-mono text-[10px]">
                        <span>首页: /?tenant={t.id}</span>
                        <Link 
                          href={`/?tenant=${encodeURIComponent(t.id)}`} 
                          target="_blank"
                          className="text-rose-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>打开</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex items-center justify-between gap-1 text-slate-700 font-mono text-[10px]">
                        <span>后台: /admin?tenant={t.id}</span>
                        <Link 
                          href={`/admin?tenant=${encodeURIComponent(t.id)}`} 
                          target="_blank"
                          className="text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>进入</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {t.notice && (
                      <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-800">
                        {t.notice}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮组 */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoTenant(t)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>推广码</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTenant(false);
                        setEditingTenant({ ...t });
                        setIsTenantModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>配置信息/收款码</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: 家电商品库管理 */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">家电商品库管理</h2>
                <p className="text-xs text-slate-500">
                  支持添加各品类家电、配置多匹数/多容量规格、设置能效等级与送装售后保障
                </p>
              </div>

              <button
                id="btn-create-product"
                type="button"
                onClick={() => {
                  setEditingProduct({
                    id: 'prod-' + Date.now(),
                    tenant_id: selectedTenantId === 'all' ? 'default' : selectedTenantId,
                    name: '新上架智能变频节能家电',
                    price: 2999,
                    original_price: 3599,
                    category: '空调制冷',
                    description: '一级能效变频节电，全直流静音电机，智能远程控制，送装同步。',
                    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
                    status: 1,
                    energy_grade: '一级能效',
                    specs: [
                      { id: 'spec-std', name: '标准款', priceDelta: 0 },
                      { id: 'spec-pro', name: '高配尊享款', priceDelta: 500 },
                    ],
                    services: ['送装同步入户', '整机包修6年'],
                    stock: 50,
                    is_featured: false,
                    sales_count: 0,
                  });
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>新增家电商品</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3">商品与规格</th>
                      <th className="p-3">分类/能效</th>
                      <th className="p-3">价格体系</th>
                      <th className="p-3">所属门店</th>
                      <th className="p-3">状态</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{p.name}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                规格: {p.specs?.map((s) => s.name).join(' | ') || '标准款'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {p.category}
                          </span>
                          <span className="block text-[11px] text-emerald-700 font-semibold mt-1">
                            {p.energy_grade}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-rose-600 text-sm">¥{p.price}</div>
                          {p.original_price > p.price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              原价: ¥{p.original_price}
                            </div>
                          )}
                          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                            合伙人佣金: {p.commission_rate ?? 1.0}% (约{Math.round(p.price * ((p.commission_rate ?? 1.0) / 100))}分)
                          </div>
                        </td>

                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {p.tenant_id}
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(p)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              p.status === 1
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {p.status === 1 ? '销售中 (点击下架)' : '已下架 (点击上架)'}
                          </button>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct({ ...p });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                              title="编辑商品"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="删除商品"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 订单处理中心 (流转与语音提示) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">实时订单处理中心</h2>
                <p className="text-xs text-slate-500">
                  跟踪实体门店送装或客户自提进度，支持流转订单状态并触发提示音
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">待处理订单:</span>
                <strong className="text-rose-600 font-bold">
                  {orders.filter((o) => o.status === '待处理').length} 笔
                </strong>
              </div>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  当前暂无订单数据，客户在线上下单后将实时呈现在此。
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {order.order_no}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.order_type === '送装到家' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {order.order_type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.status === '待处理'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : order.status === '配货中'
                            ? 'bg-amber-100 text-amber-800'
                            : order.status === '送装中'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === '已完成'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>

                        <span className="text-xs font-semibold text-slate-700">
                          支付: {order.payment_status}
                        </span>
                      </div>
                    </div>

                    {/* 买家与配送信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">客户联系信息</span>
                        <span className="font-bold text-slate-900">{order.delivery_contact}</span> ({order.delivery_phone})
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-slate-400 block text-[11px]">
                          {order.order_type === '送装到家' ? '上门送装详细地址' : '自提门店与预约时间'}
                        </span>
                        <span className="font-medium text-slate-800">{order.delivery_address}</span>
                        {order.pickup_time && (
                          <span className="block text-[11px] text-purple-700 font-medium">
                            预约时间：{order.pickup_time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 所购商品列表 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="font-medium text-slate-800">
                            {item.name} ({item.specName}) x {item.quantity}
                          </span>
                          <span className="font-bold text-slate-900">
                            ¥{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-amber-700 text-[10px] pt-1 border-t border-slate-200">
                          <span>积分抵扣 (消耗 {order.points_used} 积分)</span>
                          <span>-¥{order.discount_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                        <span>订单实收金额</span>
                        <span className="text-rose-600 font-extrabold text-sm">
                          ¥{order.total_price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {order.remarks && (
                      <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg">
                        <strong>客户安装备注：</strong>{order.remarks}
                      </div>
                    )}

                    {/* 推广合伙人业绩归属 */}
                    {order.promoter_id && (
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>
                            推荐合伙人：<strong>{order.promoter_name || '合伙人'}</strong> ({order.promoter_id})
                          </span>
                        </div>
                        {order.commission_points_rewarded ? (
                          <span className="font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-300">
                            已结算推广佣金: +{order.commission_points_rewarded} 积分
                          </span>
                        ) : (
                          <span className="text-purple-600 text-[11px]">已绑定推荐关系</span>
                        )}
                      </div>
                    )}

                    {/* 状态流转与语音播报操作按钮 */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">操作：</span>
                        {/* 详情语音播放按钮 */}
                        <button
                          type="button"
                          onClick={() => {
                            unlockAudio();
                            speakOrderAnnouncement(order);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="点击以语音播报此订单详情"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>播报该订单详情</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {order.status === '待处理' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, '配货中', '已付款')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                          >
                            接单配货
                          </button>
                        )}
                        {order.status === '配货中' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, '送装中')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                          >
                            出发送装 / 通知提货
                          </button>
                        )}
                        {order.status === '送装中' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, '已完成', '已付款')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            客户验收完成
                          </button>
                        )}
                        {order.status !== '已取消' && order.status !== '已完成' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, '已取消')}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            取消订单
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: 会员与推广合伙人全能管理中心 */}
        {activeTab === 'members' && (() => {
          const totalMembersCount = members.length;
          const promoterCount = members.filter(m => m.role === 'promoter' || m.role === 'gold_promoter').length;
          const totalPromotedOrders = members.reduce((sum, m) => sum + (m.promoted_orders_count || 0), 0);
          const totalPromotedSales = members.reduce((sum, m) => sum + (m.promoted_total_sales || 0), 0);

          const filteredMembers = members.filter(m => {
            if (memberFilterRole !== 'all') {
              if (memberFilterRole === 'gold_promoter' && m.role !== 'gold_promoter') return false;
              if (memberFilterRole === 'promoter' && m.role !== 'promoter') return false;
              if (memberFilterRole === 'member' && (m.role === 'promoter' || m.role === 'gold_promoter')) return false;
            }
            if (memberSearch.trim()) {
              const q = memberSearch.trim().toLowerCase();
              return (
                m.name.toLowerCase().includes(q) ||
                m.phone.includes(q) ||
                (m.referral_code && m.referral_code.toLowerCase().includes(q))
              );
            }
            return true;
          });

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>会员档案与推广合伙人管理中心</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold">
                      分销与佣金体系
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    管理各门店会员客户、推广合伙人身份授权、佣金积分激励及亲友积分转赠流水
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenTransferLogs}
                    className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-xs transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>积分转赠流水明细</span>
                  </button>
                </div>
              </div>

              {/* 核心指标卡片 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>注册会员总数</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {totalMembersCount} <span className="text-xs font-normal text-slate-500">人</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">全域客户档案</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-xs">
                  <div className="text-xs text-purple-800 flex items-center gap-1">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>推广合伙人总数</span>
                  </div>
                  <div className="text-xl font-black text-purple-700 mt-1">
                    {promoterCount} <span className="text-xs font-normal text-purple-600">人</span>
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">金牌/推广员共创</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs">
                  <div className="text-xs text-amber-800 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>累计推广成单</span>
                  </div>
                  <div className="text-xl font-black text-amber-600 mt-1">
                    {totalPromotedOrders} <span className="text-xs font-normal text-amber-700">笔</span>
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">合伙人专属带货</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                  <div className="text-xs text-emerald-800 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>推广累计带货额</span>
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    ¥{totalPromotedSales.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">撬动线下/线上成交</div>
                </div>
              </div>

              {/* 筛选过滤工具条 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium mr-1">角色筛选:</span>
                  <button
                    type="button"
                    onClick={() => setMemberFilterRole('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      memberFilterRole === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    全部会员 ({totalMembersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilterRole('gold_promoter')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      memberFilterRole === 'gold_promoter'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    👑 金牌合伙人 ({members.filter(m => m.role === 'gold_promoter').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilterRole('promoter')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      memberFilterRole === 'promoter'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    ⭐ 推广合伙人 ({members.filter(m => m.role === 'promoter').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberFilterRole('member')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      memberFilterRole === 'member'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    普通会员 ({members.filter(m => !m.role || m.role === 'member').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="按姓名/手机号/邀请码搜索..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-purple-600"
                  />
                </div>
              </div>

              {/* 会员与推广员档案列表 */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3">会员/推广员信息</th>
                        <th className="p-3">手机号码</th>
                        <th className="p-3">身份角色</th>
                        <th className="p-3">消费常规积分</th>
                        <th className="p-3">推广佣金积分</th>
                        <th className="p-3">带货推广业绩</th>
                        <th className="p-3">所属首访门店</th>
                        <th className="p-3 text-right">管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                            未找到符合条件的会员或合伙人记录
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/80">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{m.name}</div>
                              {m.referral_code && (
                                <span className="inline-block font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                                  邀请码: {m.referral_code}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-medium">{m.phone}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                m.role === 'gold_promoter'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : m.role === 'promoter'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {m.role === 'gold_promoter' ? '👑 金牌合伙人' : m.role === 'promoter' ? '⭐ 推广合伙人' : '普通会员'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800">{m.points}</span> 积分
                              <span className="text-[10px] text-slate-400 block">可抵扣 ¥{Math.floor(m.points / 100)}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-amber-600 text-sm">{m.commission_points || 0}</span> 积分
                              <span className="text-[10px] text-amber-700 block">折合 ¥{((m.commission_points || 0) / 100).toFixed(2)}</span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-purple-900">
                                {m.promoted_orders_count || 0} <span className="text-[10px] font-normal text-slate-500">单</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-semibold">
                                带货 ¥{(m.promoted_total_sales || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">{m.tenant_id}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoleModalMember(m);
                                    setTargetRole(m.role || 'promoter');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-[11px] cursor-pointer"
                                  title="调整会员或合伙人身份"
                                >
                                  身份设定
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustingMember(m);
                                    setAdjustPointsValue(200);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                                  title="调整常规消费积分"
                                >
                                  常规积分
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustCommissionMember(m);
                                    setAdjustCommissionDelta(100);
                                    setAdjustCommissionNote('合伙人优秀推广奖金');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] cursor-pointer"
                                  title="奖励或调整推广佣金积分"
                                >
                                  佣金积分
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminTransferMember(m);
                                    setAdminTransferToPhone('');
                                    setAdminTransferPoints(50);
                                    setAdminTransferNote('管理端代转赠购机抵扣');
                                  }}
                                  disabled={(m.commission_points || 0) <= 0}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] cursor-pointer disabled:opacity-40"
                                  title="代客将佣金积分转赠亲友用于下单立减"
                                >
                                  转赠亲友
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 弹窗 1：编辑门店资料模态窗 (配置所有门店信息) */}
      {isTenantModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsTenantModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{isCreatingTenant ? '创建新租户分店 (多租户独立沙箱)' : `配置门店资料与收款码 - ${editingTenant.name}`}</span>
                {isCreatingTenant && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    自动隔离
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                关闭 ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    租户编号 (唯一 Tenant ID) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如: gcxq"
                    value={editingTenant.id}
                    onChange={(e) => setEditingTenant({ ...editingTenant, id: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    子租户首页为: <code className="text-rose-600 font-bold font-mono">/?tenant={editingTenant.id || 'gcxq'}</code>
                    <br />
                    子租户后台为: <code className="text-indigo-600 font-bold font-mono">/admin?tenant={editingTenant.id || 'gcxq'}</code>
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    门店名称 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如: 国创智家体验馆"
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">门店宣传口号 (Slogan)</label>
                <input
                  type="text"
                  value={editingTenant.slogan}
                  onChange={(e) => setEditingTenant({ ...editingTenant, slogan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">实体门店地址</label>
                <input
                  type="text"
                  required
                  value={editingTenant.address}
                  onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">联系电话</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.phone}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">微信客服账号</label>
                  <input
                    type="text"
                    value={editingTenant.wechat || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, wechat: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">营业时间</label>
                  <input
                    type="text"
                    value={editingTenant.business_hours}
                    onChange={(e) => setEditingTenant({ ...editingTenant, business_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">进店专享礼与公告</label>
                <textarea
                  rows={2}
                  value={editingTenant.notice || ''}
                  onChange={(e) => setEditingTenant({ ...editingTenant, notice: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* 核心要求：上传本店收款二维码图片 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-rose-600" />
                      <span>本店专用线上收款二维码 (微信/支付宝)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      前端顾客在线上下单选择“在线支付”时，收银台将直接展示本店此收款码供扫码支付
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* 预览展示 */}
                  <div className="w-24 h-24 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                    {(editingTenant.payment_qrcode || editingTenant.qrcode_image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editingTenant.payment_qrcode || editingTenant.qrcode_image}
                        alt="收款码预览"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <QrCode className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] block">未上传二维码</span>
                      </div>
                    )}
                  </div>

                  {/* 上传操作控件 */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-rose-600" />
                        <span>上传本店收款码图片</span>
                        <input
                          id="input-tenant-qrcode-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQRCodeUpload}
                        />
                      </label>

                      {(editingTenant.payment_qrcode || editingTenant.qrcode_image) && (
                        <button
                          type="button"
                          onClick={() => setEditingTenant({ ...editingTenant, payment_qrcode: '', qrcode_image: '' })}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer border border-rose-200"
                        >
                          移除收款码
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      支持相册/手机扫码上传截图，图片将以高可用转码并同步存储，并在前台订单结算时自动呼出。
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTenant.enable_delivery}
                    onChange={(e) => setEditingTenant({ ...editingTenant, enable_delivery: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>支持同城送装到家</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTenant.enable_pickup}
                    onChange={(e) => setEditingTenant({ ...editingTenant, enable_pickup: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>支持到店真机自提</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {isCreatingTenant ? '确认创建新租户' : '保存门店配置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 2：编辑家电商品模态窗 */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                配置家电商品信息
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                关闭 ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">家电商品名称</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">品类</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="空调制冷">空调制冷</option>
                    <option value="冰洗大电">冰洗大电</option>
                    <option value="智慧影音">智慧影音</option>
                    <option value="厨卫电器">厨卫电器</option>
                    <option value="智能生活">智能生活</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">能效等级标签</label>
                  <input
                    type="text"
                    value={editingProduct.energy_grade}
                    onChange={(e) => setEditingProduct({ ...editingProduct, energy_grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">促销现价 (¥)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">划线原价 (¥)</label>
                  <input
                    type="number"
                    value={editingProduct.original_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, original_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* 推广合伙人返佣设置 */}
              <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-200 space-y-1.5">
                <label className="font-semibold text-purple-950 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-700" />
                    <span>推广合伙人佣金返点比例 (%)</span>
                  </span>
                  <span className="text-purple-700 font-bold">
                    预计奖赏约 {Math.round(editingProduct.price * ((editingProduct.commission_rate ?? 1.0) / 100))} 佣金积分/台
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={editingProduct.commission_rate ?? 1.0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, commission_rate: Number(e.target.value) })}
                    className="w-28 px-3 py-1.5 rounded-lg border border-purple-300 bg-white text-xs font-bold text-purple-900"
                  />
                  <span className="text-[11px] text-purple-700">
                    合伙人专属推广出单后，系统将自动按此比例换算为积分结算至其合伙人账户
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">实物图片链接 (URL)</label>
                <input
                  type="url"
                  required
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">商品描述与核心黑科技</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>标记为店长力荐</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  保存商品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 3：门店专属推广二维码海报与直达链接 */}
      {promoTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setPromoTenant(null)}></div>
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
              <QrCode className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {promoTenant.name}
              </h3>
              <p className="text-xs text-rose-600 font-medium">
                专属线上推广直达码
              </p>
            </div>

            {/* 二维码生成展示区 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${promoTenant.id}` : ''
                )}`}
                alt="门店推广码"
                className="w-44 h-44 mx-auto rounded-lg shadow-xs"
              />
              <div className="text-[11px] text-slate-400 mt-2">
                可打印贴于门店收银台、展厅样机前或宣传单页
              </div>
            </div>

            <div className="text-xs text-slate-600">
              直达链接: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${promoTenant.id}` : ''}</code>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyPromoLink(promoTenant.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLink ? '已成功复制链接！' : '复制专属推广链接'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPromoTenant(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 5：创建新租户成功后的多租户专属入口指引 */}
      {createdTenantNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setCreatedTenantNotice(null)}></div>
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  新租户分店创建成功！
                </h3>
                <p className="text-xs text-slate-500">
                  已完成多租户隔离初始化，已自动为新租户部署专属前台与独立管理后台
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="text-slate-500">租户名称：</span>
                <strong className="text-slate-900 ml-1">{createdTenantNotice.name}</strong>
                <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  tenant={createdTenantNotice.id}
                </span>
              </div>

              {/* 前台地址 */}
              <div className="space-y-1">
                <div className="text-slate-500 font-medium">1. 子租户专属前台首页 (客户浏览与下单)：</div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]">
                  <span className="text-rose-600 truncate mr-2">
                    {typeof window !== 'undefined' ? `${window.location.origin}/?tenant=${createdTenantNotice.id}` : `/?tenant=${createdTenantNotice.id}`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/?tenant=${encodeURIComponent(createdTenantNotice.id)}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold"
                    >
                      前往浏览
                    </Link>
                  </div>
                </div>
              </div>

              {/* 后台地址 */}
              <div className="space-y-1">
                <div className="text-slate-500 font-medium">2. 子租户独立管理后台 (本店运维与订单收银)：</div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px]">
                  <span className="text-indigo-600 truncate mr-2">
                    {typeof window !== 'undefined' ? `${window.location.origin}/admin?tenant=${createdTenantNotice.id}` : `/admin?tenant=${createdTenantNotice.id}`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin?tenant=${encodeURIComponent(createdTenantNotice.id)}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold"
                    >
                      进入后台
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 text-[11px] text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>隔离安全规则生效验证：</span>
                </div>
                <div>
                  子租户 (tenant={createdTenantNotice.id}) 登录自身后台后，系统自动启用沙箱过滤，<strong>无法查看到上一级(/)及其他门店的信息与订单</strong>，确保各加盟分店数据独立安全！
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreatedTenantNotice(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                我知道了，返回管理
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 4：会员积分调整 */}
      {adjustingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setAdjustingMember(null)}></div>
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              调整会员积分 - {adjustingMember.name} ({adjustingMember.phone})
            </h3>
            <form onSubmit={handleSaveMemberPoints} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">调整常规消费积分 (正数为赠送，负数为扣减)</label>
                <input
                  type="number"
                  required
                  value={adjustPointsValue}
                  onChange={(e) => setAdjustPointsValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingMember(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                >
                  确认调整
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 5：会员/合伙人身份角色调整 */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setRoleModalMember(null)}></div>
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">合伙人与会员身份设定</h3>
                <div className="text-[11px] text-slate-500">{roleModalMember.name} ({roleModalMember.phone})</div>
              </div>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-slate-700 font-semibold block">选择授予的角色级别：</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    targetRole === 'gold_promoter' ? 'border-amber-400 bg-amber-50/70' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="gold_promoter"
                      checked={targetRole === 'gold_promoter'}
                      onChange={() => setTargetRole('gold_promoter')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-amber-900 flex items-center gap-1">
                        <span>👑 金牌合伙人</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded">VIP尊享</span>
                      </div>
                      <div className="text-[11px] text-amber-800/80 mt-0.5">
                        优先享有高比例佣金返现，可生成专属带货二维码，支持自主转赠抵扣积分。
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    targetRole === 'promoter' ? 'border-purple-400 bg-purple-50/70' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="promoter"
                      checked={targetRole === 'promoter'}
                      onChange={() => setTargetRole('promoter')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-purple-900">⭐ 推广合伙人</div>
                      <div className="text-[11px] text-purple-800/80 mt-0.5">
                        享有专属带货推广码，订单完成自动累积佣金积分，可转赠亲朋立减下单。
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    targetRole === 'member' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={targetRole === 'member'}
                      onChange={() => setTargetRole('member')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-800">普通会员</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        普通购机顾客，享有常规消费积分与门店自提/到家送装保障。
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalMember(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                >
                  确认保存身份
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 6：佣金积分调整 (针对推广员) */}
      {adjustCommissionMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setAdjustCommissionMember(null)}></div>
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">奖扣推广佣金积分</h3>
                <div className="text-[11px] text-slate-500">{adjustCommissionMember.name} ({adjustCommissionMember.phone})</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-500">当前可用佣金积分:</span>
              <span className="font-bold text-amber-600 text-sm">{adjustCommissionMember.commission_points || 0} 积分</span>
            </div>

            <form onSubmit={handleSaveCommissionPoints} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  增减积分数额 (输入正数增加，负数扣除)：
                </label>
                <input
                  type="number"
                  required
                  value={adjustCommissionDelta}
                  onChange={(e) => setAdjustCommissionDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">调整事由与备注说明：</label>
                <input
                  type="text"
                  value={adjustCommissionNote}
                  onChange={(e) => setAdjustCommissionNote(e.target.value)}
                  placeholder="如：季度推广之星奖金、带货特殊补贴"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustCommissionMember(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  确认调整佣金
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 7：管理端代客转赠积分 */}
      {adminTransferMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setAdminTransferMember(null)}></div>
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">代客转赠佣金积分给亲友</h3>
                <div className="text-[11px] text-slate-500">
                  出资转赠人：{adminTransferMember.name} ({adminTransferMember.phone})
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex justify-between font-medium">
                <span>该合伙人现有可用佣金积分:</span>
                <span className="font-bold text-emerald-700">{adminTransferMember.commission_points || 0} 积分</span>
              </div>
              <div className="text-[11px] text-emerald-700">
                转赠后，接收人手机号账户的常规积分将实时增加，可在选购大家电结算时直接抵现（100积分 = 1元）。
              </div>
            </div>

            <form onSubmit={handleAdminTransferPoints} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  接收亲友手机号码 (11位)：
                </label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  placeholder="例如：13800002222"
                  value={adminTransferToPhone}
                  onChange={(e) => setAdminTransferToPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  转赠积分数量 (不超过现有佣金积分)：
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={adminTransferMember.commission_points || 1}
                  value={adminTransferPoints}
                  onChange={(e) => setAdminTransferPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  折合亲友购机抵扣现金：¥{(adminTransferPoints / 100).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">转赠备注说明：</label>
                <input
                  type="text"
                  value={adminTransferNote}
                  onChange={(e) => setAdminTransferNote(e.target.value)}
                  placeholder="例如：合伙人赠送亲戚买新空调抵扣红包"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminTransferMember(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={adminTransferLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {adminTransferLoading ? '处理中...' : '确认代客转赠'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 弹窗 8：积分转赠流水明细弹窗 */}
      {transferLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="fixed inset-0" onClick={() => setTransferLogModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">合伙人佣金积分转赠明细流水</h3>
                  <p className="text-[11px] text-slate-500">记录合伙人自主转出或后台代客转赠到购机账户的全部明细</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs">
              {loadingTransferRecords ? (
                <div className="py-12 text-center text-slate-400">正在拉取转赠流水...</div>
              ) : transferRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400">暂无任何积分转赠记录</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transferRecords.map((t) => (
                    <div key={t.id} className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{t.from_phone}</span>
                          <span className="text-purple-600 font-semibold">➔ 转赠给</span>
                          <span className="font-bold text-slate-900 font-mono">{t.to_phone}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({t.tenant_id})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.note || '合伙人佣金转赠亲友用于下单抵扣'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(t.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-rose-600 text-sm">
                          {t.points} 积分
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          抵扣 ¥{(t.points / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferLogModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
