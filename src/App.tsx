import React, { useState, useEffect } from 'react';
import { Tracker } from './components/Tracker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Mail, ArrowRight, Copy, Check, LogOut } from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [copiedGeneric, setCopiedGeneric] = useState(false);

  useEffect(() => {
    // Check URL first
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    
    if (urlEmail) {
      setEmail(urlEmail);
      try {
        localStorage.setItem('notion_heatmap_email', urlEmail);
      } catch (e) {
        console.warn('Local storage is not available in this context');
      }
    } else {
      // Check local storage
      try {
        const storedEmail = localStorage.getItem('notion_heatmap_email');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (e) {
        console.warn('Local storage is not available in this context');
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim() || !inputEmail.includes('@')) return;
    
    const cleanEmail = inputEmail.trim().toLowerCase();
    setEmail(cleanEmail);
    try {
      localStorage.setItem('notion_heatmap_email', cleanEmail);
    } catch (e) {
      console.warn('Local storage is not available in this context');
    }
    
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('email', cleanEmail);
    window.history.replaceState({}, '', url.toString());
  };

  const getGenericEmbedUrl = () => {
    const url = new URL(window.location.href);
    if (url.hostname.startsWith('ais-dev-')) {
      url.hostname = url.hostname.replace('ais-dev-', 'ais-pre-');
    }
    url.searchParams.delete('email');
    url.searchParams.set('embed', 'true');
    return url.toString();
  };

  const handleCopyGenericLink = () => {
    navigator.clipboard.writeText(getGenericEmbedUrl());
    setCopiedGeneric(true);
    setTimeout(() => setCopiedGeneric(false), 2000);
  };

  const handleLogout = () => {
    setEmail(null);
    try {
      localStorage.removeItem('notion_heatmap_email');
    } catch (e) {
      console.warn('Local storage is not available in this context');
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('email');
    url.searchParams.delete('embed');
    window.history.replaceState({}, '', url.toString());
  };

  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true';

  if (!email) {
    if (isEmbed) {
      return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4 font-sans">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 max-w-sm w-full">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3">
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">学习打卡记录</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                输入邮箱查看你的专属进度
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="你的邮箱@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                进入 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6">
            <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Notion 学习热力图组件</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            输入邮箱，一键生成你的专属 Notion 嵌入链接。数据云端同步，永不丢失。
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="你的邮箱@example.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              生成专属组件链接 <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isEmbed) {
    return (
      <ErrorBoundary>
        <div className="w-full min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-5xl">
            <Tracker email={email} />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 font-sans flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">配置你的 Notion 组件</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出 / 切换账号
              </button>
            </div>
          </header>

          <main className="w-full space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-2">复制通用组件链接</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                请复制下方的<strong className="text-emerald-600 dark:text-emerald-400">通用链接</strong>，并将其嵌入到你要售卖或分享的 Notion 模板中。每个用户访问时，会在组件内看到一个登录框，输入自己的邮箱后即可查看自己的数据。
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getGenericEmbedUrl()} 
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-300 outline-none"
                />
                <button
                  onClick={handleCopyGenericLink}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedGeneric ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedGeneric ? '已复制！' : '复制通用链接'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                预览效果（在 Notion 中将自动隐藏背景和边框）：
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <Tracker email={email} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
