import React from 'react';
import { Member, Task } from '../types';
import { ProgressBar } from './ProgressBar';

interface TeamStatusProps {
  members: Member[];
  tasks: Task[];
}

export const TeamStatus: React.FC<TeamStatusProps> = ({ members, tasks }) => {
  return (
    <div className="mb-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">团队综合进度</h2>
        <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">
            {members.length} 位成员
        </span>
      </div>
      
      {members.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
             当前筛选条件下无成员信息
          </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {members.map(member => {
          const memberTasks = tasks.filter(t => t.assignedTo === member.id);
          const totalTasks = memberTasks.length;
          const completedTasks = memberTasks.filter(t => t.progress === 100).length;
          
          let overallProgress = 0;
          if (totalTasks > 0) {
            const sumProgress = memberTasks.reduce((acc, t) => acc + t.progress, 0);
            overallProgress = Math.round(sumProgress / totalTasks);
          }

          // Calculate Member Status based on their tasks
          let status: 'normal' | 'risk' | 'delayed' | 'completed' = 'normal';
          const today = new Date();
          
          let hasDelayed = false;
          let hasRisk = false;

          memberTasks.forEach(t => {
            if (t.progress === 100) return;
            const dueDate = new Date(t.dueDate);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysLeft < 0) hasDelayed = true;
            else if (daysLeft <= 3 && t.progress < 80) hasRisk = true;
          });

          if (hasDelayed) status = 'delayed';
          else if (hasRisk) status = 'risk';
          else if (totalTasks > 0 && overallProgress === 100) status = 'completed';

          return (
            <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                        {status === 'delayed' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full ring-1 ring-red-100"></span>}
                        {status === 'risk' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full ring-1 ring-yellow-100"></span>}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm leading-tight">{member.name}</div>
                      <div className="text-xs text-slate-500 leading-tight">{member.role}</div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-slate-400">交付率</div>
                    <div className="font-mono font-bold text-slate-700">{completedTasks}/{totalTasks}</div>
                 </div>
              </div>
              
              <div className="mt-2">
                <ProgressBar progress={overallProgress} status={status} height="h-2" showLabel={false} />
                <div className="flex justify-between mt-1 items-center">
                   <span className="text-xs text-slate-400 font-medium">{overallProgress}% 完成</span>
                   {status === 'delayed' && <span className="text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">已延期</span>}
                   {status === 'risk' && <span className="text-xs text-yellow-600 font-bold bg-yellow-50 px-1.5 py-0.5 rounded">有风险</span>}
                   {status === 'completed' && <span className="text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">完成</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};