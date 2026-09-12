'use client';

import React from 'react';
import { CheckCircle, Phone, MapPin, Calendar, Clock, ShoppingBag, X, QrCode } from 'lucide-react';
import { StoreOrder, Tenant } from '@/lib/types';

interface OrderSuccessModalProps {
  order: StoreOrder | null;
  tenant: Tenant;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, tenant, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div 
        id="order-success-dialog"
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-6 bg-emerald-600 text-white text-center space-y-2 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-emerald-200 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">订单提交成功！</h2>
          <p className="text-xs text-emerald-100">
            实体门店已接单，工作人员将尽快与您联系安排送装与核验
          </p>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* 订单核心信息 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">订单编号</span>
              <span className="font-mono font-bold text-slate-900">{order.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">履约方式</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {order.order_type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">实付总额</span>
              <span className="font-bold text-base text-rose-600">¥{order.total_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">支付状态</span>
              <span className="font-medium text-slate-800">{order.payment_status} ({order.payment_timing})</span>
            </div>
          </div>

          {/* 送装/自提详细信息 */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{order.order_type === '送装到家' ? '送装收货地址：' : '自提门店：'}</span>
                <span>{order.delivery_address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>联系人：{order.delivery_contact} ({order.delivery_phone})</span>
            </div>

            {order.pickup_time && (
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>预约时间：{order.pickup_time}</span>
              </div>
            )}
          </div>

          {/* 购买商品简述 */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
              <span>所购家电明细</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 pl-4 text-[11px]">
                <span className="truncate pr-2">{item.name} ({item.specName}) x{item.quantity}</span>
                <span className="font-medium shrink-0">¥{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* 线上付款时展示商户收款二维码 */}
          {(tenant.payment_qrcode || tenant.qrcode_image) && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="font-bold text-emerald-900 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>本店官方收款二维码</span>
                </span>
                <span className="text-emerald-700">扫码直接转账至门店账户</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-emerald-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tenant.payment_qrcode || tenant.qrcode_image}
                  alt="门店专属收款码"
                  className="w-20 h-20 rounded-md object-contain bg-slate-50 border border-slate-200 shrink-0"
                />
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>支持微信/支付宝扫一扫</div>
                  <div className="font-bold text-rose-600">应付金额：¥{order.total_price.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">付款备注：{order.order_no}</div>
                </div>
              </div>
            </div>
          )}

          {/* 门店咨询与服务热线 */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{tenant.name} 服务保障热线</span>
            </div>
            <div className="text-[11px] text-blue-800">
              如有送装改期或安装需求，欢迎致电：<a href={`tel:${tenant.phone}`} className="font-bold underline">{tenant.phone}</a>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer"
          >
            我知道了，继续浏览
          </button>
        </div>
      </div>
    </div>
  );
}
