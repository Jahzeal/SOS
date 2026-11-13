'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
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
  CreditCard,
  Palette,
  LogOut,
  X,
  FileSpreadsheet,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import { PwaInstallButton } from './PwaInstallButton';

interface MenuItem {
  name: string;
  icon: any;
  href?: string;
  children?: { name: string; href: string; icon: any }[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    name: 'Register Phone / Item',
    icon: PlusCircle,
    href: '/dashboard/register',
  },
  {
    name: 'Verify IMEI & QR',
    icon: ShieldCheck,
    href: '/dashboard/verify',
  },
  {
    name: 'Phone & Item Records',
    icon: List,
    href: '/dashboard/records',
  },
  {
    name: 'Inventory',
    icon: Package,
    href: '/dashboard/inventory',
  },
  {
    name: 'Sales & Invoices',
    icon: ShoppingCart,
    children: [
      { name: 'Checkout (POS)', href: '/dashboard/checkout', icon: PlusCircle },
      { name: 'Quotations / Estimates', href: '/dashboard/quotes', icon: FileSpreadsheet },
      { name: 'Invoices Registry', href: '/dashboard/invoices', icon: FileText },
      { name: 'Receipts Archive', href: '/dashboard/receipts', icon: Receipt },
    ],
  },
  {
    name: 'Customers',
    icon: Users,
    href: '/dashboard/customers',
  },
  {
    name: 'Repairs',
    icon: Wrench,
    href: '/dashboard/repairs',
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/reports',
  },
  {
    name: 'Templates',
    icon: Palette,
    href: '/dashboard/templates',
  },
  {
    name: 'Subscription & Plans',
    icon: CreditCard,
    href: '/dashboard/subscription',
  },
  {
    name: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const COLLAPSED_STORAGE_KEY = 'noxguarda_sidebar_collapsed';

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const currentPlan = user?.business?.plan || 'Active';

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'Sales & Invoices': true,
    Verification: true,
  });

  // Desktop only: the sidebar can shrink to a narrow strip of icons. The choice is remembered.
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1');
    } catch {}
  }, []);

  const setCollapsed = (next: boolean) => {
    setIsCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
    } catch {}
  };

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

  const navRow = 'flex items-center rounded-control text-xs font-semibold transition-colors';
  const navIdle = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
  const navActive = 'bg-accent-600 text-white shadow-md shadow-accent-600/20 font-bold';

  // `collapsed` is only ever true for the desktop sidebar; the mobile drawer is always full width.
  const renderContent = (collapsed: boolean) => (
    <div
      className={`${
        collapsed ? 'w-[68px]' : 'w-64'
      } bg-white border-r border-slate-200 text-slate-700 flex flex-col h-full shrink-0 shadow-subtle transition-[width] duration-200`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 shrink-0 border-b border-slate-100 flex items-center ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!collapsed && (
          <div onClick={onClose}>
            <Logo size="md" href="/dashboard" />
          </div>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            title="Close menu"
            aria-label="Close menu"
            leftIcon={<X className="w-4 h-4" />}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:inline-flex"
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-expanded={!collapsed}
          leftIcon={collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        />
      </div>

      {/* Store Plan Badge */}
      {!collapsed && (
        <div className="mx-3.5 my-3 p-3 rounded-control bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate">{user?.business?.name || 'Store Account'}</span>
            <span className="text-xs text-slate-500 font-medium">Main Branch</span>
          </div>
          <Badge variant="business" size="sm" showDot={false}>
            {currentPlan}
          </Badge>
        </div>
      )}

      {/* Navigation List */}
      <nav
        aria-label="Main menu"
        className={`flex-1 py-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${collapsed ? 'px-2 pt-3' : 'px-3'}`}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children;
          const isSubmenuOpen = openSubmenus[item.name];
          const isActive = item.href ? pathname === item.href : false;
          const hasActiveChild = !!item.children?.some((child) => pathname === child.href);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        // Open the sidebar so the sub-links are visible.
                        setCollapsed(false);
                        setOpenSubmenus((prev) => ({ ...prev, [item.name]: true }));
                      } else {
                        toggleSubmenu(item.name);
                      }
                    }}
                    title={collapsed ? item.name : undefined}
                    aria-label={collapsed ? item.name : undefined}
                    aria-expanded={collapsed ? false : !!isSubmenuOpen}
                    className={`w-full cursor-pointer ${navRow} ${
                      collapsed
                        ? `justify-center h-10 ${hasActiveChild ? 'bg-accent-50 text-accent-700' : navIdle}`
                        : `justify-between px-3 py-2 ${navIdle}`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${collapsed ? '' : 'text-slate-500'}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed &&
                      (isSubmenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      ))}
                  </button>

                  {isSubmenuOpen && !collapsed && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-2">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={onClose}
                            aria-current={isChildActive ? 'page' : undefined}
                            className={`gap-2 px-3 py-1.5 font-medium ${navRow} ${
                              isChildActive
                                ? 'bg-accent-50 text-accent-700 font-semibold border border-accent-200 shadow-subtle'
                                : navIdle
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
                  title={collapsed ? item.name : undefined}
                  aria-label={collapsed ? item.name : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`${navRow} ${collapsed ? 'justify-center h-10' : 'gap-2.5 px-3 py-2'} ${
                    isActive ? navActive : navIdle
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                  {!collapsed && item.name === 'Templates' && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded bg-accent-100 text-accent-700">
                      NEW
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* PWA Download / Native App Launcher Card */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <PwaInstallButton variant="sidebar" />
        </div>
      )}

      {/* User Footer with Log Out */}
      <div
        className={`border-t border-slate-100 flex items-center text-xs bg-slate-50 ${
          collapsed ? 'flex-col gap-2 py-3' : 'justify-between p-3.5'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-accent-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
            title={collapsed ? user?.firstName || 'Store Owner' : undefined}
          >
            {user?.firstName?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate max-w-[110px]">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Store Owner'}
              </div>
              <div className="text-xs text-slate-500 font-medium truncate">{user?.role || 'OWNER'}</div>
            </div>
          )}
        </div>

        <Button
          variant="ghostDanger"
          size={collapsed ? 'icon' : 'sm'}
          onClick={handleLogout}
          title="Sign out of store session"
          aria-label={collapsed ? 'Sign Out' : undefined}
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          {collapsed ? null : 'Sign Out'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed in place, collapsible) */}
      <aside className="hidden lg:flex h-full shrink-0 z-30">{renderContent(isCollapsed)}</aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
