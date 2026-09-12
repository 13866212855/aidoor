import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '智慧电商与门店系统',
  description: '实体门店线上推广与家电在线订购商城，支持多门店配置、超级管理后台、推广合伙人佣金积分、积分转赠、送装一体及全流程订单管理',
  openGraph: {
    title: '智慧电商与门店系统',
    description: '实体门店线上推广与家电在线订购商城，支持多门店配置、超级管理后台、推广合伙人佣金积分、积分转赠、送装一体及全流程订单管理',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '智慧电商与门店系统',
    description: '实体门店线上推广与家电在线订购商城，支持多门店配置、超级管理后台、推广合伙人佣金积分、积分转赠、送装一体及全流程订单管理',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-CN">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
