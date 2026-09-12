'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Share2, 
  Send, 
  Award, 
  Check, 
  Copy, 
  Coins, 
  ShoppingBag, 
  UserCheck, 
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { UserMember, Tenant } from '@/lib/types';

interface PromoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onApplyPromoterCode?: (code: string) => void;
}

export default function PromoterModal({
  isOpen,
  onClose,
  tenant,
  onApplyPromoterCode,
}: PromoterModalProps) {
  const [phone, setPhone] = useState('13800138000');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserMember | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'transfer'>('profile');

  // 转赠积分状态
  const [transferToPhone, setTransferToPhone] = useState('');
  const [transferPoints, setTransferPoints] = useState(50);
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuery = async (targetPhone = phone) => {
    if (!targetPhone.trim() || targetPhone.length < 11) {
      alert('请输入正确的11位手机号码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users?phone=${encodeURIComponent(targetPhone.trim())}&tenant=${tenant.id}`);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        alert('未找到该手机号关联的会员信息');
      }
    } catch {
      alert('查询合伙人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!transferToPhone.trim() || transferToPhone.length < 11) {
      alert('请输入接收人的11位手机号码');
      return;
    }
    if (transferPoints <= 0) {
      alert('转赠积分数必须大于0');
      return;
    }
    if (transferPoints > (user.commission_points || 0)) {
      alert(`转赠积分超出当前可用佣金积分余额 (${user.commission_points || 0})`);
      return;
    }

    setTransferLoading(true);
    setTransferSuccessMsg('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_points',
          fromPhone: user.phone,
          toPhone: transferToPhone.trim(),
          points: transferPoints,
          note: transferNote.trim() || '合伙人转赠消费抵扣积分',
          tenantId: tenant.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransferSuccessMsg(data.message || '转赠成功！');
        setTransferPoints(10);
        setTransferNote('');
        // 重新刷新本人信息
        handleQuery(user.phone);
      } else {
        alert(data.error || '转赠失败');
      }
    } catch {
      alert('转赠网络请求异常');
    } finally {
      setTransferLoading(false);
    }
  };

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?tenant=${tenant.id}&ref=${user?.referral_code || user?.phone || ''}`
    : '';

  const handleCopyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/80 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">合伙人推广与会员权益中心</h2>
              <p className="text-[11px] text-purple-200">
                专属邀请推广 · 佣金积分赚取 · 积分转赠亲友立减
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 手机号查询栏 */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            请输入您的手机号验证合伙人/会员身份
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 13800138000"
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-purple-600"
            />
            <button
              type="button"
              onClick={() => handleQuery()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              {loading ? '查询中...' : '立即查询'}
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-2">
            <span>推荐预设合伙人测试账号：</span>
            <button
              type="button"
              onClick={() => {
                setPhone('13800138000');
                handleQuery('13800138000');
              }}
              className="text-purple-600 font-medium hover:underline cursor-pointer"
            >
              13800138000 (金牌合伙人)
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => {
                setPhone('13800138001');
                handleQuery('13800138001');
              }}
              className="text-purple-600 font-medium hover:underline cursor-pointer"
            >
              13800138001 (推广合伙人)
            </button>
          </div>
        </div>

        {/* 主体信息区 */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {user ? (
            <div className="space-y-4">
              {/* 会员身份名片 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                    {user.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.role === 'gold_promoter'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : user.role === 'promoter'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'gold_promoter' ? '👑 金牌推广员' : user.role === 'promoter' ? '⭐ 推广合伙人' : '普通会员'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</div>
                  </div>
                </div>

                {user.referral_code && (
                  <div className="text-right">
                    <span className="text-[10px] text-purple-700 block">专属推广邀请码</span>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-md border border-purple-200 text-purple-900">
                      {user.referral_code}
                    </span>
                  </div>
                )}
              </div>

              {/* 核心权益积分看板 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] text-amber-800 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>推广佣金积分</span>
                  </div>
                  <div className="text-lg font-black text-amber-600 mt-1">
                    {user.commission_points || 0}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">可消费或转赠</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-600">常规消费积分</div>
                  <div className="text-lg font-black text-slate-800 mt-1">
                    {user.points || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">购物立减抵扣</div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[11px] text-purple-800 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                    <span>推广成单量</span>
                  </div>
                  <div className="text-lg font-black text-purple-700 mt-1">
                    {user.promoted_orders_count || 0} <span className="text-xs font-normal">单</span>
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">已计入业绩</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>推广销售额</span>
                  </div>
                  <div className="text-lg font-black text-emerald-700 mt-1">
                    ¥{user.promoted_total_sales || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">累计带货业绩</div>
                </div>
              </div>

              {/* 选项卡切换 */}
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`pb-2 px-3 font-bold border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'profile'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  专属推广链接与海报
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className={`pb-2 px-3 font-bold border-b-2 cursor-pointer transition-colors ${
                    activeTab === 'transfer'
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  向亲友转赠佣金积分
                </button>
              </div>

              {activeTab === 'profile' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>您的专属带货推广链接</span>
                      </span>
                      {onApplyPromoterCode && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyPromoterCode(user.referral_code || user.phone);
                            alert(`已将推荐人设定为：${user.name} (${user.phone})`);
                            onClose();
                          }}
                          className="text-[11px] text-purple-700 hover:underline font-bold cursor-pointer"
                        >
                          应用到当前购物车
                        </button>
                      )}
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-purple-100 font-mono text-[11px] text-slate-700 break-all select-all">
                      {referralUrl}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? '已复制到剪贴板' : '一键复制推广链接'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>合伙人推广奖励机制说明</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      1. 顾客通过您的推广链接进店，或在结算时输入您的手机号/邀请码，订单将与您自动绑定。<br />
                      2. 订单交易完成，系统根据各家电设定的返佣比例（默认 1.0%~5.0%）自动将佣金积分发放到您的合伙人账户。<br />
                      3. 佣金积分可转赠给任意顾客/亲友，亲友在购机时可按 100积分抵1元 享受立减优惠！
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'transfer' && (
                <form onSubmit={handleTransfer} className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                    您当前拥有 <strong>{user.commission_points || 0}</strong> 佣金积分可供转赠。转赠后接收人可在门店购物时按 100积分抵扣1元 直接抵减现金！
                  </div>

                  {transferSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{transferSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      接收人手机号 *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      placeholder="输入接收人11位手机号 (如 13911223344)"
                      value={transferToPhone}
                      onChange={(e) => setTransferToPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      转赠积分数额 * (不超过 {user.commission_points || 0})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={user.commission_points || 0}
                        required
                        value={transferPoints}
                        onChange={(e) => setTransferPoints(Number(e.target.value))}
                        className="w-32 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-purple-600"
                      />
                      <span className="text-xs text-slate-500">
                        相当于为对方补贴 <strong>¥{(transferPoints / 100).toFixed(2)}</strong> 购机抵扣
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      转赠留言附言（选填）
                    </label>
                    <input
                      type="text"
                      placeholder="例: 合伙人专属优惠，送您积分补贴购买智能空调！"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-purple-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={transferLoading || (user.commission_points || 0) <= 0}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{transferLoading ? '正在转赠...' : '立即确认转赠积分'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">
                请在上方输入手机号并点击“立即查询”，即可查看专属推广链接、佣金积分及转赠亲友
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
