import React, { useState } from 'react';
import { Task } from '../types';
import { ProgressBar } from './ProgressBar';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onAddMilestone: (taskId: string, title: string) => void;
  onToggleMilestone: (taskId: string, milestoneId: string) => void;
  onDeleteMilestone: (taskId: string, milestoneId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone
}) => {
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'plan' | 'logs'>('plan');

  if (!isOpen || !task) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    onAddMilestone(task.id, newMilestoneTitle);
    setNewMilestoneTitle('');
  };

  const completedCount = task.milestones.filter(m => m.isCompleted).length;
  const totalCount = task.milestones.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 m-4 animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{task.title}</h2>
            <div className="flex items-center space-x-4 mt-2">
               <button 
                 onClick={() => setActiveTab('plan')}
                 className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'plan' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                 执行规划
               </button>
               <button 
                 onClick={() => setActiveTab('logs')}
                 className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                 日报记录 ({task.logs.length})
               </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">交付目标</h3>
          <p className="text-slate-700 text-sm leading-relaxed">{task.outcome}</p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
           
           {activeTab === 'plan' && (
             <>
               <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-slate-800">执行里程碑 ({completedCount}/{totalCount})</h3>
                 {totalCount > 0 && (
                   <div className="w-32">
                     <ProgressBar progress={percentage} height="h-2" showLabel={false} status={percentage === 100 ? 'completed' : 'normal'} />
                   </div>
                 )}
               </div>

               {/* Milestone List */}
               <div className="space-y-2 mb-4">
                 {task.milestones.map(ms => (
                   <div key={ms.id} className="group flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <button 
                          onClick={() => onToggleMilestone(task.id, ms.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                            ${ms.isCompleted 
                              ? 'bg-success border-success text-white' 
                              : 'bg-white border-slate-300 text-transparent hover:border-primary'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <span className={`text-sm ${ms.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {ms.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => onDeleteMilestone(task.id, ms.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                   </div>
                 ))}
                 
                 {task.milestones.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                      暂无拆解计划，添加第一个里程碑吧
                    </div>
                 )}
               </div>
             </>
           )}

           {activeTab === 'logs' && (
             <div className="space-y-4">
                {[...task.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                  <div key={log.id} className="flex gap-4">
                     <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-2"></div>
                        <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
                     </div>
                     <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-xs text-slate-400 font-mono">{new Date(log.date).toLocaleString()}</span>
                           <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full">进度 {log.progressSnapshot}%</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                           {log.note}
                        </div>
                     </div>
                  </div>
                ))}
                {task.logs.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    暂无日报记录
                  </div>
                )}
             </div>
           )}

        </div>
        
        {/* Add Input - Only visible in Plan tab */}
        {activeTab === 'plan' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
             <form onSubmit={handleAdd} className="flex items-center space-x-2">
               <input 
                 type="text" 
                 value={newMilestoneTitle}
                 onChange={e => setNewMilestoneTitle(e.target.value)}
                 placeholder="输入新的里程碑步骤 (按回车添加)..."
                 className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
               />
               <button 
                  type="submit"
                  disabled={!newMilestoneTitle.trim()}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 添加
               </button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};