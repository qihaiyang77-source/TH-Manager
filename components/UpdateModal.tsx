import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface UpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, newProgress: number, note: string) => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (task) {
      setProgress(task.progress);
      setNote('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, progress, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 animate-[fadeIn_0.2s_ease-out]">
        <h2 className="text-xl font-bold text-slate-800 mb-1">更新进度</h2>
        <p className="text-sm text-slate-500 mb-6">{task.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              当前进度: <span className="text-primary font-bold text-lg">{progress}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              日报简述 (关键成果)
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：完成了后端 API 接口对接，等待联调..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-24 resize-none text-sm"
              required
            ></textarea>
          </div>

          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium shadow-md hover:shadow-lg transition-all"
            >
              提交更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};