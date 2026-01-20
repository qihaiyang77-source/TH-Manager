import React, { useState, useEffect } from 'react';
import { Task, Member } from '../types';

interface TaskFormModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  members: Member[];
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  members 
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    outcome: '',
    assignedTo: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    progress: 0,
    logs: [],
    milestones: []
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        id: Date.now().toString(),
        title: '',
        outcome: '',
        assignedTo: members[0]?.id || '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        progress: 0,
        logs: [],
        milestones: []
      });
    }
  }, [task, isOpen, members]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 m-4 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{task ? '编辑任务' : '创建新任务'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="简短的任务标题"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">交付目标 (Result/Outcome)</label>
            <textarea 
              value={formData.outcome}
              onChange={e => setFormData({...formData, outcome: e.target.value})}
              placeholder="清晰描述该任务最终交付的成果..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-24 resize-none"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
            <select 
              value={formData.assignedTo}
              onChange={e => setFormData({...formData, assignedTo: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              required
            >
              <option value="" disabled>选择负责人</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
              <input 
                type="date" 
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              {task ? '保存修改' : '立即创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};