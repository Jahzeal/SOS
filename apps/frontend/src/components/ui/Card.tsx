'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';
import { Button } from './Button';

// Base Container Card
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

export function Card({ children, interactive = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`vf-card ${interactive ? 'vf-card-interactive cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 1. Statistics / Metric Card
export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  timeframe?: string;
  icon?: React.ReactNode;
  badgeText?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'up',
  timeframe = 'vs last month',
  icon,
  badgeText,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {badgeText && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
            {badgeText}
          </span>
        )}
      </div>

      {change && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
            {change}
          </span>
          <span className="text-slate-400 font-medium">{timeframe}</span>
        </div>
      )}
    </Card>
  );
}

// 2. Activity Feed Card Item
export interface ActivityItemProps {
  title: string;
  subtitle: string;
  timestamp: string;
  icon: React.ReactNode;
  iconBg?: string;
}

export function ActivityItem({
  title,
  subtitle,
  timestamp,
  icon,
  iconBg = 'bg-slate-100 text-slate-600',
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3.5 p-3.5 hover:bg-slate-50/80 rounded-xl transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/60 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{title}</h4>
          <span className="text-[11px] text-slate-400 shrink-0">{timestamp}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

// 3. Feature Card
export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export function FeatureCard({ title, description, icon, badge }: FeatureCardProps) {
  return (
    <Card interactive className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
    </Card>
  );
}

// 4. Pricing Card
export interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText?: string;
  onSelect?: () => void;
}

export function PricingCard({
  name,
  price,
  period = '/month',
  description,
  features,
  isPopular = false,
  buttonText = 'Get Started',
  onSelect,
}: PricingCardProps) {
  return (
    <Card
      className={`p-6 flex flex-col justify-between relative ${
        isPopular ? 'border-2 border-blue-600 shadow-card-hover' : ''
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-600 text-white shadow-sm">
          Most Popular
        </span>
      )}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{name}</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-900">{price}</span>
          <span className="text-xs text-slate-500">{period}</span>
        </div>

        <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-600">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Button
          fullWidth
          variant={isPopular ? 'primary' : 'secondary'}
          onClick={onSelect}
        >
          {buttonText}
        </Button>
      </div>
    </Card>
  );
}
