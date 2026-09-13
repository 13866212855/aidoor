'use client';

import React, { useState } from 'react';
import { X, Check, Shield, Truck, Zap, ShoppingBag, Plus, Minus } from 'lucide-react';
import { ApplianceProduct, ApplianceSpec, CartItem } from '@/lib/types';
import OptimizedImage from './OptimizedImage';

interface ApplianceModalProps {
  product: ApplianceProduct | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ApplianceModal({ product, onClose, onAddToCart }: ApplianceModalProps) {
  const [selectedSpec, setSelectedSpec] = useState<ApplianceSpec | null>(
    product?.specs?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const currentSpec = selectedSpec || product.specs[0] || { id: 'default', name: '标准规格', priceDelta: 0 };
  const currentPrice = Number(product.price) + Number(currentSpec.priceDelta || 0);

  const handleAdd = (openCartImmediately: boolean = false) => {
    const item: CartItem = {
      id: `${product.id}-${currentSpec.id}`,
      productId: product.id,
      name: product.name,
      price: currentPrice,
      commission_rate: product.commission_rate ?? 1.0,
      image: product.image,
      category: product.category,
      specName: currentSpec.name,
      services: product.services || [],
      quantity: quantity,
    };
    onAddToCart(item);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      if (openCartImmediately) {
        onClose();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      {/* 遮罩背景点击关闭 */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* 模态卡片 */}
      <div 
        id="appliance-detail-modal"
        className="relative z-10 w-full max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        {/* 关闭按钮 */}
        <button
          id="btn-close-appliance-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* 商品封面与能效徽章 */}
          <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <OptimizedImage
              src={product.image}
              alt={product.name}
              category={product.category}
              priority={true}
              width={600}
              quality={70}
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {product.energy_grade || '一级能效'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1">
                <Truck className="w-3 h-3" />
                送装一体
              </span>
            </div>
          </div>

          {/* 价格与标题 */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold text-rose-600 tracking-tight">
                ¥{currentPrice.toLocaleString()}
              </span>
              {product.original_price > currentPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ¥{product.original_price.toLocaleString()}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                线下门店体验同价 · 享以旧换新补贴
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 规格选择 */}
          {product.specs && product.specs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                <span>选购规格 / 功率型号</span>
                <span className="text-slate-500 font-normal">已选: {currentSpec.name}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.specs.map((spec) => {
                  const isSelected = (selectedSpec?.id || product.specs[0].id) === spec.id;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => setSelectedSpec(spec)}
                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/50 text-rose-900 font-medium ring-1 ring-rose-500'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate mr-2">{spec.name}</span>
                      {spec.priceDelta !== 0 && (
                        <span className="text-[11px] font-semibold text-rose-600 shrink-0">
                          {spec.priceDelta > 0 ? `+¥${spec.priceDelta}` : `-¥${Math.abs(spec.priceDelta)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 门店保障权益 */}
          {product.services && product.services.length > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>实体门店专享权益与售后保障</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {product.services.map((srv, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-700">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 购买数量选择器 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-800">购买台数</span>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-semibold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            id="btn-add-cart"
            type="button"
            onClick={() => handleAdd(false)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-rose-600 bg-white text-rose-600 font-semibold text-xs sm:text-sm hover:bg-rose-50 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{addedNotice ? '已加入购物车 ✓' : '加入购物车'}</span>
          </button>
          <button
            id="btn-buy-now"
            type="button"
            onClick={() => handleAdd(true)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>立即结算 (¥{(currentPrice * quantity).toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
