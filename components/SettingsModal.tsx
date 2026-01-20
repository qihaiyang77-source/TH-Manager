import React, { useState, useEffect } from 'react';
import { getConfig, saveConfig, initDb, checkDbConnection } from '../services/dataService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'taskpulse'
  });
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [initStatus, setInitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await getConfig();
      if (res.config && Object.keys(res.config).length > 0) {
        setConfig(prev => ({ ...prev, ...res.config }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) : value
    }));
  };

  const handleSaveAndConnect = async () => {
    setStatus('checking');
    setStatusMessage('正在保存配置...');
    try {
      // 1. Save Config
      await saveConfig(config);
      
      // 2. Test Connection (by fetching data)
      setStatusMessage('正在测试连接...');
      const isConnected = await checkDbConnection();
      
      if (isConnected) {
        setStatus('success');
        setStatusMessage('连接成功！');
        setTimeout(() => {
          onConfigSaved();
          onClose();
        }, 1500);
      } else {
        throw new Error('连接失败，请检查配置或确保数据库已运行');
      }
    } catch (error: any) {
      setStatus('error');
      setStatusMessage(error.message || '配置无效或无法连接到数据库');
    }
  };

  const handleInitDb = async () => {
    setInitStatus('loading');
    try {
      // Ensure config is saved first
      await saveConfig(config);
      
      await initDb();
      setInitStatus('success');
      // If init is successful, connection is also likely good
      setStatus('success');
      setStatusMessage('初始化完成，连接正常');
    } catch (error: any) {
      setInitStatus('error');
      alert(`初始化失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
               </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">数据库配置</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Host (主机地址)</label>
            <input 
              name="host"
              type="text" 
              value={config.host}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Port (端口)</label>
                <input 
                  name="port"
                  type="number" 
                  value={config.port}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User (用户名)</label>
                <input 
                  name="user"
                  type="text" 
                  value={config.user}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password (密码)</label>
            <input 
              name="password"
              type="password" 
              value={config.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Database Name (数据库名)</label>
            <input 
              name="database"
              type="text" 
              value={config.database}
              onChange={handleChange}
              placeholder="e.g. taskpulse"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">注意：请先确保该数据库已在 MySQL 中创建</p>
          </div>
        </div>

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {statusMessage}
          </div>
        )}
        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             {statusMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col space-y-3">
           <button 
              onClick={handleSaveAndConnect}
              disabled={status === 'checking'}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-md disabled:opacity-70"
           >
              {status === 'checking' ? '正在连接...' : '保存配置并连接'}
           </button>
           
           <div className="flex items-center justify-between pt-2 border-t border-slate-100">
             <span className="text-xs text-slate-400">首次使用？</span>
             <button 
                onClick={handleInitDb}
                disabled={initStatus === 'loading'}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
             >
                {initStatus === 'loading' ? '正在初始化...' : '初始化数据库表结构'}
             </button>
           </div>
           {initStatus === 'success' && <p className="text-center text-xs text-green-600">表结构创建成功！请点击上方“保存并连接”</p>}
        </div>
      </div>
    </div>
  );
};
