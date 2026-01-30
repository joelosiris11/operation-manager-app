import React, { useState } from 'react';
import { Briefcase, Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { localDB, SEED_DATA } from '../lib/localDB';

export default function Login({ users, onLogin }) {
  const [resetting, setResetting] = useState(false);

  const handleResetData = () => {
    if (confirm('¿Restaurar datos de ejemplo? Esto borrará los datos actuales.')) {
      setResetting(true);
      localDB.clear();
      localDB.seed(SEED_DATA);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = users.find(
        u => u.email?.toLowerCase() === email.toLowerCase() && u.pin === pin
      );

      if (user) {
        onLogin(user);
      } else {
        setError('Email o PIN incorrecto');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4">
            <Briefcase size={40} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">OpsFlow</h1>
          <p className="text-white/70 text-sm mt-1">Sistema de Gestión de Operaciones</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-center mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                PIN de Acceso
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  maxLength={6}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-sm font-medium tracking-[0.3em]"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Usuarios de prueba */}
          <div className="mt-8 pt-6 border-t dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">
              Acceso rápido
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('admin@empresa.com'); setPin('0000'); }}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:ring-2 ring-indigo-500 transition-all"
              >
                <p className="font-bold text-indigo-600">Admin</p>
                <p className="text-slate-500 truncate">admin@empresa.com</p>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('ana@empresa.com'); setPin('9999'); }}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:ring-2 ring-purple-500 transition-all"
              >
                <p className="font-bold text-purple-600">Manager</p>
                <p className="text-slate-500 truncate">ana@empresa.com</p>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('carlos@empresa.com'); setPin('5678'); }}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:ring-2 ring-blue-500 transition-all"
              >
                <p className="font-bold text-blue-600">Supervisor</p>
                <p className="text-slate-500 truncate">carlos@empresa.com</p>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('juan@empresa.com'); setPin('1234'); }}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 hover:ring-2 ring-slate-400 transition-all"
              >
                <p className="font-bold text-slate-600">Operador</p>
                <p className="text-slate-500 truncate">juan@empresa.com</p>
              </button>
            </div>

            {/* Botón restaurar datos */}
            {users.length === 0 && (
              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting}
                className="w-full mt-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} className={resetting ? 'animate-spin' : ''} />
                {resetting ? 'Restaurando...' : 'Cargar datos de ejemplo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
