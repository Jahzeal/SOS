'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, PlanType } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  BarChart3,
  Settings,
  UserCircle,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  Search,
  ArrowDownToLine,
  FileText,
  Receipt,
  Sparkles,
  Palette,
  LogOut,
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface MenuItem {
  name: string;
  icon: any;
  href?: string;
  minPlan: PlanType;
  children?: { name: string; href: string; icon: any }[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    minPlan: 'STARTER',
  },
  {
    name: 'Register Phone',
    icon: PlusCircle,
    href: '/dashboard/register',
    minPlan: 'STARTER',
  },
  {
    name: 'Verify IMEI & QR',
    icon: ShieldCheck,
    href: '/dashboard/verify',
    minPlan: 'STARTER',
  },
  {
    name: 'Phone Records',
    icon: List,
    href: '/dashboard/records',
    minPlan: 'STARTER',
  },
  {
    name: 'Inventory',
    icon: Package,
    href: '/dashboard/inventory',
    minPlan: 'ENTERPRISE',
  },
  {
    name: 'Sales & Invoices',
    icon: ShoppingCart,
    minPlan: 'ENTERPRISE',
    children: [
      { name: 'New Checkout (POS)', href: '/dashboard/sales/new', icon: PlusCircle },
      { name: 'Create Invoice', href: '/dashboard/sales/invoices/new', icon: FileText },
      { name: 'Invoices Registry', href: '/dashboard/sales/invoices', icon: FileText },
      { name: 'Receipts Archive', href: '/dashboard/sales/receipts', icon: Receipt },
    ],
  },
  {
    name: 'Customers',
    icon: Users,
    href: '/dashboard/customers',
    minPlan: 'ENTERPRISE',
  },
  {
    name: 'Repairs',
    icon: Wrench,
    href: '/dashboard/repairs',
    minPlan: 'ENTERPRISE',
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/reports',
    minPlan: 'BUSINESS',
  },
  {
    name: 'Templates',
    icon: Palette,
    href: '/dashboard/templates',
    minPlan: 'STARTER',
  },
  {
    name: 'Pricing & Plans',
    icon: Sparkles,
    href: '/pricing',
    minPlan: 'STARTER',
  },
  {
    name: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    minPlan: 'STARTER',
  },
];

const PLAN_LEVELS: Record<PlanType, number> = {
  STARTER: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setPlan } = useAuthStore();
  const currentPlan = user?.business?.plan || 'STARTER';
  const currentLevel = PLAN_LEVELS[currentPlan];

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Verification: true,
  });

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_access_token');
      localStorage.removeItem('vf_user');
    }
    logout();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col h-full shrink-0 shadow-subtle">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-md">
            VF
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-base leading-tight">VerifyFlow</h1>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Enterprise OS</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Store Plan Badge */}
      <div className="mx-3.5 my-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-900 truncate">{user?.business?.name || 'PhoneWorks Retail'}</span>
          <span className="text-[10px] text-slate-500 font-medium">Main Branch</span>
        </div>
        <Badge
          variant={
            currentPlan === 'ENTERPRISE'
              ? 'enterprise'
              : currentPlan === 'BUSINESS'
              ? 'business'
              : 'starter'
          }
          size="sm"
          showDot={false}
        >
          {currentPlan}
        </Badge>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isVisible = currentLevel >= PLAN_LEVELS[item.minPlan];
          if (!isVisible) return null;

          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isOpen = openSubmenus[item.name];
          const isActive = item.href ? pathname === item.href : false;

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-2">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={onClose}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-subtle'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.name === 'Templates' && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      NEW
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer with Log Out */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate max-w-[100px]">
              {user?.firstName || 'User'} {user?.lastName || ''}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">{user?.role || 'OWNER'}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 font-bold text-[11px]"
          title="Sign out of store session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
