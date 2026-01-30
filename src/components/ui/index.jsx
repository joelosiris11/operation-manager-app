import React from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';

// --- Card ---
export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 ${onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// --- Button ---
export function Button({ children, variant = 'primary', size = 'md', icon: Icon, loading, disabled, className = '', ...props }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-none',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    ghost: 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
    outline: 'border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-[11px] sm:px-4 sm:text-xs',
    md: 'px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm',
    lg: 'px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-base',
    xl: 'px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg',
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        font-bold uppercase tracking-wider rounded-xl sm:rounded-2xl
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-1.5 sm:gap-2
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : Icon && <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />}
      {children}
    </button>
  );
}

// --- Input ---
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
      <input
        className={`
          w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800
          border-2 border-transparent font-medium text-sm sm:text-base
          outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition-all
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-red-500 text-xs font-medium ml-1">{error}</p>}
    </div>
  );
}

// --- Select ---
export function Select({ label, options = [], error, className = '', ...props }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
      <div className="relative">
        <select
          className={`
            w-full p-4 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800
            border-2 border-transparent font-medium appearance-none
            outline-none focus:ring-2 focus:ring-indigo-500
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-500 text-xs font-medium ml-1">{error}</p>}
    </div>
  );
}

// --- Toggle ---
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
      {label && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
    </label>
  );
}

// --- Badge ---
export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-700',
    critical: 'bg-red-600 text-white',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// --- Modal ---
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={`relative z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full ${sizes[size]} max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-slate-800 shrink-0">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Empty State ---
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
      {Icon && (
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300">
          <Icon size={40} />
        </div>
      )}
      <h3 className="font-black uppercase text-sm tracking-widest text-slate-400">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// --- Section Header ---
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
      <div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-none">{title}</h2>
        {subtitle && <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 sm:mt-3 opacity-60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// --- Tab Navigation ---
export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-2xl w-fit">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
            ${activeTab === tab.id
              ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md'
              : 'text-slate-400 hover:text-slate-600'}`}
        >
          {tab.icon && <tab.icon size={14} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// --- Status Indicator ---
export function StatusIndicator({ status, pulse = false }) {
  const colors = {
    pending: 'bg-slate-400',
    active: 'bg-emerald-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    completed: 'bg-indigo-500',
  };

  return (
    <div className={`w-3 h-3 rounded-full ${colors[status] || colors.pending} ${pulse ? 'animate-pulse' : ''}`} />
  );
}
