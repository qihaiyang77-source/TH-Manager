import React from 'react';
import { Task, Member, TaskStatus } from '../types';
import { ProgressBar } from './ProgressBar';

interface TaskCardProps {
  task: Task;
  assignee?: Member;
  onUpdateClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDetailClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  assignee, 
  onUpdateClick,
  onEditTask,
  onDeleteTask,
  onDetailClick
}) => {
  // Calculate dynamic status logic
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let computedStatus: 'normal' | 'risk' | 'delayed' | 'completed' = 'normal';
  let statusLabel = TaskStatus.ON_TRACK;
  
  if (task.progress === 100) {
    computedStatus = 'completed';
    statusLabel = TaskStatus.COMPLETED;
  } else if (daysLeft < 0) {
    computedStatus = 'delayed';
    statusLabel = TaskStatus.DELAYED;
  } else if (daysLeft <= 3 && task.progress < 80) {
    computedStatus = 'risk';
    statusLabel = TaskStatus.AT_RISK;
  }

  const milestonesTotal = task.milestones?.length || 0;
  const milestonesCompleted = task.milestones?.filter(m => m.isCompleted).length || 0;

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
      onClick={() => onDetailClick(task)}
    >
      {/* Status Stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full 
        ${computedStatus === 'normal' ? 'bg-primary' : ''}
        ${computedStatus === 'risk' ? 'bg-warning' : ''}
        ${computedStatus === 'delayed' ? 'bg-danger' : ''}
        ${computedStatus === 'completed' ? 'bg-success' : ''}
      `} />

      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex-1 pr-2">
          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
          <p className="text-xs text-slate-500 font-mono">截止: {task.dueDate} ({daysLeft >= 0 ? `剩 ${daysLeft} 天` : `逾期 ${Math.abs(daysLeft)} 天`})</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
           <span className={`px-2 py-1 text-xs rounded-md font-medium whitespace-nowrap
            ${computedStatus === 'normal' ? 'bg-blue-50 text-blue-700' : ''}
            ${computedStatus === 'risk' ? 'bg-yellow-50 text-yellow-700' : ''}
            ${computedStatus === 'delayed' ? 'bg-red-50 text-red-700' : ''}
            ${computedStatus === 'completed' ? 'bg-green-50 text-green-700' : ''}
           `}>
             {statusLabel}
           </span>
           
           {/* Edit Actions: Visible on Hover or consistent placement */}
           <div className="flex space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-50" 
                title="编辑任务"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if(window.confirm('确定要删除这个任务吗？')) onDeleteTask(task.id); 
                }}
                className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50" 
                title="删除任务"
              >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
           </div>
        </div>
      </div>

      <div className="mb-4 pl-2">
        <p className="text-sm text-slate-600 line-clamp-2" title={task.outcome}>
          <span className="font-semibold text-slate-900">交付目标:</span> {task.outcome}
        </p>
      </div>
      
      {/* Milestones Summary */}
      <div className="pl-2 mb-3 flex items-center space-x-2">
         <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            拆解: {milestonesCompleted}/{milestonesTotal}
         </span>
         {milestonesTotal > 0 && (
           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-400 rounded-full" 
                style={{ width: `${(milestonesCompleted / milestonesTotal) * 100}%` }}
              ></div>
           </div>
         )}
      </div>

      <div className="pl-2 mb-4">
        <ProgressBar progress={task.progress} status={computedStatus} height="h-3" />
      </div>

      <div className="flex justify-between items-center pl-2 pt-2 border-t border-slate-100 mt-auto">
        <div className="flex items-center space-x-2">
          {assignee ? (
            <>
              <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full border border-slate-200" />
              <span className="text-sm font-medium text-slate-700">{assignee.name}</span>
            </>
          ) : (
             <span className="text-sm text-slate-400 italic">未分配</span>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateClick(task); }}
          className="text-sm text-primary hover:text-blue-700 font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
        >
          更新进度
        </button>
      </div>
    </div>
  );
};