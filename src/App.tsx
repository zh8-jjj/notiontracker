import React, { useState, useEffect } from 'react';
import { Tracker } from './components/Tracker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Mail, ArrowRight, Copy, Check, LogOut } from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [copied, setCopied] = useState(false);

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

  const getEmbedUrl = () => {
    const url = new URL(window.location.href);
    if (url.hostname.startsWith('ais-dev-')) {
      url.hostname = url.hostname.replace('ais-dev-', 'ais-pre-');
    }
    url.searchParams.set('email', email!);
    url.searchParams.set('embed', 'true');
    return url.toString();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getEmbedUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <h2 className="text-lg font-semibold mb-2">第一步：复制专属链接</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                点击下方按钮复制链接。这个链接包含了你的身份信息，<strong className="text-emerald-600 dark:text-emerald-400">确保你在 Notion 中永远不需要重复登录</strong>。
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getEmbedUrl()} 
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-300 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制！' : '复制链接'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                第二步：在 Notion 中粘贴并选择「Create embed」
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
