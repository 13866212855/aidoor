'use client';

import React from 'react';
import { X, MapPin, Phone, MessageSquare, Clock, Check, Share2, Sparkles, Store } from 'lucide-react';
import { Tenant } from '@/lib/types';

interface StorePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
}

export default function StorePickerModal({
  isOpen,
  onClose,
  currentTenant,
  tenants,
  onSelectTenant,
}: StorePickerModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleShareStore = () => {
    const url = `${window.location.origin}/?tenant=${currentTenant.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div 
        id="store-picker-dialog"
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 顶部 */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-base font-bold">实体门店线上推广主页</div>
              <div className="text-xs text-slate-300">切换就近分店，享受真机体验与同城送装</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 当前门店推广卡片 */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold">
                  当前服务门店
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                  {currentTenant.name}
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  {currentTenant.slogan}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-rose-200/60">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>地址：{currentTenant.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>联系电话：<a href={`tel:${currentTenant.phone}`} className="underline font-medium text-slate-800">{currentTenant.phone}</a></span>
              </div>
              {currentTenant.wechat && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>微信专属客服：<strong className="text-slate-800">{currentTenant.wechat}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>营业时间：{currentTenant.business_hours}</span>
              </div>
            </div>

            {currentTenant.notice && (
              <div className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{currentTenant.notice}</span>
              </div>
            )}

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={handleShareStore}
                className="flex-1 py-2 px-3 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? '已复制本门店推广直达链接！' : '复制本门店线上推广链接'}</span>
              </button>
            </div>
          </div>

          {/* 切换其他实体分店 */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900">
              其他实体连锁分店 ({tenants.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {tenants.map((tenant) => {
                const isCurrent = tenant.id === currentTenant.id;
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => {
                      onSelectTenant(tenant);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {tenant.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {tenant.address}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="shrink-0 text-xs font-bold text-rose-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>当前</span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        切换至该店
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
