'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Truck, 
  Store, 
  CheckCircle2, 
  CreditCard,
  Sparkles,
  Phone,
  User,
  MapPin,
  Clock,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { CartItem, Tenant, StoreOrder } from '@/lib/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  tenant: Tenant;
  initialPromoterId?: string;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: StoreOrder) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  tenant,
  initialPromoterId,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [orderType, setOrderType] = useState<'送装到家' | '门店自提'>('送装到家');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('今天 15:00 - 18:00 到店体验');
  const [remarks, setRemarks] = useState('');
  const [paymentTiming, setPaymentTiming] = useState<'线上付款' | '送装验收合格后付款' | '到店核销付款'>('线上付款');
  
  // 会员积分抵扣
  const [usePoints, setUsePoints] = useState(false);
  const [memberPoints, setMemberPoints] = useState<number | null>(null);
  const [memberCommissionPoints, setMemberCommissionPoints] = useState<number | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [queryingMember, setQueryingMember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 推广合伙人推荐码绑定
  const [promoterId, setPromoterId] = useState(initialPromoterId || '');
  const [prevInitialId, setPrevInitialId] = useState(initialPromoterId);
  if (initialPromoterId !== prevInitialId) {
    setPrevInitialId(initialPromoterId);
    setPromoterId(initialPromoterId || '');
  }

  const [promoterInfo, setPromoterInfo] = useState<{ name: string; role?: string } | null>(null);
  const [verifyingPromoter, setVerifyingPromoter] = useState(false);

  // 自动根据 initialPromoterId 校验合伙人
  React.useEffect(() => {
    if (!initialPromoterId) return;
    let active = true;
    fetch(`/api/users?phone=${encodeURIComponent(initialPromoterId.trim())}&tenant=${tenant.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.user) {
          setPromoterInfo({
            name: data.user.name,
            role: data.user.role === 'gold_promoter' ? '金牌推广员' : data.user.role === 'promoter' ? '推广合伙人' : '会员',
          });
        }
      })
      .catch(() => {
        // 静默处理自动加载推荐人异常
      });
    return () => {
      active = false;
    };
  }, [initialPromoterId, tenant.id]);

  const verifyPromoter = async (code: string) => {
    if (!code || !code.trim()) return;
    setVerifyingPromoter(true);
    try {
      const res = await fetch(`/api/users?phone=${encodeURIComponent(code.trim())}&tenant=${tenant.id}`);
      const data = await res.json();
      if (data.user) {
        setPromoterInfo({
          name: data.user.name,
          role: data.user.role === 'gold_promoter' ? '金牌推广员' : data.user.role === 'promoter' ? '推广合伙人' : '会员',
        });
      } else {
        alert('未找到该推荐人信息，请核对手机号或邀请码');
      }
    } catch {
      console.warn('校验推荐人失败');
    } finally {
      setVerifyingPromoter(false);
    }
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawTotalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 预估产生推广佣金积分
  const estimatedCommissionPoints = items.reduce((sum, item) => {
    const rate = typeof item.commission_rate === 'number' ? item.commission_rate : 1.0;
    return sum + Math.round(item.price * item.quantity * (rate / 100));
  }, 0);

  // 积分换算规则：100积分抵扣1元
  const maxDiscountFromPoints = memberPoints ? Math.min(Math.floor(memberPoints / 100), Math.floor(rawTotalPrice * 0.1)) : 0;
  const pointsUsed = usePoints ? maxDiscountFromPoints * 100 : 0;
  const discountAmount = usePoints ? maxDiscountFromPoints : 0;
  const finalPrice = Math.max(0, rawTotalPrice - discountAmount);

  // 查询会员积分
  const handleQueryMember = async () => {
    if (!contactPhone || contactPhone.length < 11) {
      alert('请输入正确的11位手机号码');
      return;
    }
    setQueryingMember(true);
    try {
      const res = await fetch(`/api/users?phone=${contactPhone}&tenant=${tenant.id}`);
      const data = await res.json();
      if (data.user) {
        setMemberPoints(Number(data.user.points) || 0);
        setMemberCommissionPoints(Number(data.user.commission_points) || 0);
        setMemberRole(data.user.role || 'member');
        if (!contactName && data.user.name) setContactName(data.user.name);
        if (!deliveryAddress && data.user.delivery_address) setDeliveryAddress(data.user.delivery_address);
        setUsePoints(true);
      }
    } catch {
      alert('查询会员失败');
    } finally {
      setQueryingMember(false);
    }
  };

  // 提交订单
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      alert('请填写联系人姓名');
      return;
    }
    if (!contactPhone.trim() || contactPhone.length < 8) {
      alert('请填写正确的联系手机号');
      return;
    }
    if (orderType === '送装到家' && !deliveryAddress.trim()) {
      alert('请填写详细的送装收货地址（含小区/门牌号）');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        tenant_id: tenant.id,
        order_type: orderType,
        delivery_contact: contactName,
        delivery_phone: contactPhone,
        delivery_address: orderType === '送装到家' ? deliveryAddress : `${tenant.name} (${tenant.address})`,
        pickup_time: orderType === '门店自提' ? pickupTime : '',
        total_price: finalPrice,
        payment_status: paymentTiming === '线上付款' ? '已付款' : '待支付',
        payment_timing: paymentTiming,
        points_used: pointsUsed,
        discount_amount: discountAmount,
        promoter_id: promoterId.trim(),
        promoter_name: promoterInfo?.name || '',
        items: items,
        remarks: remarks,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const resData = await res.json();
      if (resData.success && resData.order) {
        onClearCart();
        onOrderSuccess(resData.order);
        onClose();
      } else {
        alert(resData.error || '下单失败，请重试');
      }
    } catch {
      alert('网络异常，下单失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* 遮罩背景 */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* 侧边滑出/抽屉面板 */}
      <div 
        id="cart-drawer-panel"
        className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* 顶部标题栏 */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {step === 'cart' ? '已选家电清单' : '确认订单与配送安装'}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[240px]">
                {tenant.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-200 cursor-pointer"
              >
                返回清单
              </button>
            )}
            <button
              id="btn-close-cart-drawer"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="text-base font-semibold text-slate-800">购物车空空如也</div>
              <p className="text-xs text-slate-500 max-w-xs">
                去挑选心仪的节能家电，享实体门店送装同步与专属补贴！
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                去逛逛家电
              </button>
            </div>
          ) : step === 'cart' ? (
            /* 步骤 1：清单模式 */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>共 {totalItemsCount} 件家电商品</span>
                <button
                  onClick={onClearCart}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空购物车</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded inline-block mt-1 font-medium">
                          {item.specName}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-sm font-bold text-rose-600">
                          ¥{item.price.toLocaleString()}
                        </div>

                        {/* 数量步进器 */}
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden scale-90 origin-right">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-300 hover:text-rose-500 self-start p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 门店推广优势说明 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>实体门店线上直供四大保障</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 pl-1">
                  <li>品牌官方正品机源，机身带官方防伪溯源码</li>
                  <li>同城送货入户、专业工程师上门无尘安装</li>
                  <li>全国联保售后，支持7天无理由退换、30天保价</li>
                  <li>可在线预约到店真机通电试用、对比体验</li>
                </ul>
              </div>
            </div>
          ) : (
            /* 步骤 2：填写订单与配送安装表单 */
            <form id="form-checkout-order" onSubmit={handleSubmitOrder} className="space-y-4">
              {/* 配送提货方式选择 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900">选择配送安装方式</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('送装到家')}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      orderType === '送装到家'
                        ? 'border-rose-600 bg-rose-50/60 text-rose-900 ring-1 ring-rose-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-rose-600" />
                    <span>同城送装到家</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('门店自提')}
                    className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      orderType === '门店自提'
                        ? 'border-rose-600 bg-rose-50/60 text-rose-900 ring-1 ring-rose-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>到店体验自提</span>
                  </button>
                </div>
              </div>

              {/* 门店信息卡片 */}
              {orderType === '门店自提' && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-1">
                  <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-600" />
                    <span>提货门店：{tenant.name}</span>
                  </div>
                  <div className="text-[11px] text-blue-800 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                    <span>{tenant.address}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>营业时间：{tenant.business_hours}</span>
                  </div>
                </div>
              )}

              {/* 联系人信息 */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>联系人姓名 *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如: 陈女士"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>手机号(用于收货/积分) *</span>
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="11位手机号"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                      />
                      <button
                        type="button"
                        onClick={handleQueryMember}
                        disabled={queryingMember}
                        className="shrink-0 text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded-lg cursor-pointer"
                      >
                        {queryingMember ? '...' : '识别'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 顾客会员身份及积分概览 */}
                {memberPoints !== null && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        身份：
                        <strong className="text-slate-900">
                          {memberRole === 'gold_promoter' ? '👑 金牌合伙人' : memberRole === 'promoter' ? '⭐ 推广合伙人' : '普通会员'}
                        </strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span>消费积分: <strong className="text-amber-600">{memberPoints}</strong></span>
                      {memberCommissionPoints !== null && memberCommissionPoints > 0 && (
                        <span className="text-purple-700 font-medium">
                          佣金积分: <strong>{memberCommissionPoints}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 地址或提货时间 */}
                {orderType === '送装到家' ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>详细收货与安装地址 *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例: 南山区科技园南路XX小区3栋1202室 (师傅入户安装)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>预计到店自提时间</span>
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                    />
                  </div>
                )}

                {/* 备注 */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    安装特殊需求或备注（选填）
                  </label>
                  <input
                    type="text"
                    placeholder="如: 需要带高空作业绳 / 橱柜已开孔 / 旧空调拆机等"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-rose-600"
                  />
                </div>
              </div>

              {/* 会员积分抵扣区域 */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>会员积分抵扣</span>
                  </div>
                  {memberPoints !== null && (
                    <span className="text-xs text-amber-800">
                      当前可用积分: <strong className="font-bold">{memberPoints}</strong>
                    </span>
                  )}
                </div>

                {memberPoints !== null ? (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span className="text-amber-900">
                        使用积分抵扣 (100积分抵1元，已减 ¥{discountAmount})
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700">
                    输入手机号后点击“识别”，即可查询历史积分并用于本次立减，下单完成后将赠送等额消费积分！
                  </div>
                )}
              </div>

              {/* 推广合伙人专属推荐（选填） */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>推荐合伙人（选填）</span>
                  </div>
                  {promoterInfo && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                      已锁定: {promoterInfo.name} ({promoterInfo.role})
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="输入合伙人手机号或专属邀请码"
                    value={promoterId}
                    onChange={(e) => setPromoterId(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-2 border border-purple-200 rounded-lg bg-white focus:outline-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => verifyPromoter(promoterId)}
                    disabled={verifyingPromoter || !promoterId.trim()}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {verifyingPromoter ? '核验中...' : '绑定合伙人'}
                  </button>
                </div>

                {promoterInfo ? (
                  <div className="text-[11px] text-purple-800 bg-white/80 p-2 rounded-lg border border-purple-100 space-y-0.5">
                    <div className="font-semibold text-purple-900">
                      ✓ 本单已关联推荐合伙人：{promoterInfo.name}
                    </div>
                    <div className="text-[10px] text-purple-600">
                      订单完成后，合伙人将获得约 <strong className="text-purple-700">{estimatedCommissionPoints}</strong> 佣金积分奖励！
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-purple-600">
                    若有门店专员或合伙人向您推荐选型，填写其手机号可将此订单业绩归属合伙人并返佣积分。
                  </div>
                )}
              </div>

              {/* 付款方式 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>付款与结算方式</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentTiming('线上付款')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      paymentTiming === '线上付款'
                        ? 'border-rose-600 bg-rose-50/60 text-rose-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">微信/在线支付</div>
                    <div className="text-[10px] text-slate-500">线上担保交易</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTiming(orderType === '送装到家' ? '送装验收合格后付款' : '到店核销付款')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                      paymentTiming !== '线上付款'
                        ? 'border-rose-600 bg-rose-50/60 text-rose-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{orderType === '送装到家' ? '送装验收后付款' : '到店核销付款'}</div>
                    <div className="text-[10px] text-slate-500">验机通电满意再付</div>
                  </button>
                </div>

                {/* 本店专属收款二维码展示区 */}
                {paymentTiming === '线上付款' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-700" />
                        <span>本店微信/手机扫码收款码</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                        实时到账
                      </span>
                    </div>

                    {(tenant.payment_qrcode || tenant.qrcode_image) ? (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tenant.payment_qrcode || tenant.qrcode_image}
                          alt="门店收款码"
                          className="w-24 h-24 rounded-lg object-contain bg-slate-50 border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1 min-w-0 text-slate-600">
                          <div className="font-bold text-slate-800 truncate">{tenant.name}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            待付金额：¥{finalPrice.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            使用微信或支付宝扫描左侧二维码完成付款，或点击下方提交订单后完成验机支付。
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center text-slate-500">
                        <div className="text-emerald-800 font-medium">官方担保在线支付已就绪</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          门店店长支持微信及银行卡收款，点击下方提交即可锁定优惠与安装档期。
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* 底部结算操作条 */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">商品总额</span>
              <span className="font-medium text-slate-900">¥{rawTotalPrice.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-700">
                <span>积分抵扣</span>
                <span>-¥{discountAmount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-900">实付总额</span>
              <div className="text-right">
                <span className="text-xl font-bold text-rose-600">
                  ¥{finalPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">包送装入户 · 官方联保</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                id="btn-go-to-checkout"
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>下一步：确认送装信息</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-submit-order"
                type="submit"
                form="form-checkout-order"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? '正在提交订单...' : `立即提交订单 (¥${finalPrice.toLocaleString()})`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
