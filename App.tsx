import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, Member, DashboardStats, Group } from './types';
import { TaskCard } from './components/TaskCard';
import { UpdateModal } from './components/UpdateModal';
import { MemberManager } from './components/MemberManager';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TeamStatus } from './components/TeamStatus';
import { SettingsModal } from './components/SettingsModal';
import { analyzeProjectHealth } from './services/geminiService';
import { fetchData, saveData } from './services/dataService';

const App: React.FC = () => {
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // System State
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'local'>('saved');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const initialLoadComplete = useRef(false);

  // --- Data Persistence Logic ---

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      setTasks(data.tasks);
      setMembers(data.members);
      setGroups(data.groups);
      initialLoadComplete.current = true;
    } catch (err: any) {
      console.error("Initialization failed", err);
      // If DB is not configured, open settings
      if (err.message === 'DB_NOT_CONFIGURED') {
        setIsSettingsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Load Data on Mount
  useEffect(() => {
    loadData();
  }, []);

  // 2. Auto-Save on Change (Debounced)
  useEffect(() => {
    if (!initialLoadComplete.current) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveData({ tasks, members, groups })
        .then((result) => {
           if (result.mode === 'local') {
             setSaveStatus('local');
           } else {
             setSaveStatus('saved');
           }
        })
        .catch(() => setSaveStatus('error'));
    }, 1000); 

    return () => clearTimeout(timer);
  }, [tasks, members, groups]);


  // Modals State
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Filter State
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'risk' | 'delayed' | 'completed'>('all');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to calculate status
  const getTaskStatus = (task: Task): 'normal' | 'risk' | 'delayed' | 'completed' => {
    if (task.progress === 100) return 'completed';
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) return 'delayed';
    if (daysLeft <= 3 && task.progress < 80) return 'risk';
    return 'normal';
  };

  // --- Filter Logic ---
  const filteredMembers = useMemo(() => {
    if (filterGroupId === 'all') return members;
    return members.filter(m => m.groupId === filterGroupId);
  }, [members, filterGroupId]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filterGroupId !== 'all') {
      const memberIdsInGroup = members
        .filter(m => m.groupId === filterGroupId)
        .map(m => m.id);
      result = result.filter(t => memberIdsInGroup.includes(t.assignedTo));
    }
    
    if (filterMemberId !== 'all') {
      result = result.filter(t => t.assignedTo === filterMemberId);
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => getTaskStatus(t) === filterStatus);
    }

    return result.sort((a, b) => {
       const getScore = (t: Task) => {
         if (t.progress === 100) return 1000;
         const due = new Date(t.dueDate).getTime();
         const today = new Date().getTime();
         if (today > due) return -1000;
         return due;
       };
       return getScore(a) - getScore(b);
    });
  }, [tasks, members, filterGroupId, filterMemberId, filterStatus]);

  const stats: DashboardStats = useMemo(() => {
    let completed = 0;
    let delayed = 0;
    let atRisk = 0;

    let scopeTasks = tasks;
    if (filterGroupId !== 'all') {
       const memberIds = members.filter(m => m.groupId === filterGroupId).map(m => m.id);
       scopeTasks = scopeTasks.filter(t => memberIds.includes(t.assignedTo));
    }
    if (filterMemberId !== 'all') {
       scopeTasks = scopeTasks.filter(t => t.assignedTo === filterMemberId);
    }

    scopeTasks.forEach(task => {
      const status = getTaskStatus(task);
      if (status === 'completed') completed++;
      if (status === 'delayed') delayed++;
      if (status === 'risk') atRisk++;
    });

    return {
      total: scopeTasks.length,
      completed,
      delayed,
      atRisk
    };
  }, [tasks, members, filterGroupId, filterMemberId]);

  const handleGroupChange = (groupId: string) => {
    setFilterGroupId(groupId);
    setFilterMemberId('all');
  };

  // --- Handlers ---
  const handleTaskDetailClick = (task: Task) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailOpen(true);
  };

  const handleAddMilestone = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newMilestone = { id: Date.now().toString(), title, isCompleted: false };
        const updatedTask = { ...t, milestones: [...(t.milestones || []), newMilestone] };
        if (selectedTaskForDetail?.id === taskId) setSelectedTaskForDetail(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleToggleMilestone = (taskId: string, milestoneId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedMilestones = t.milestones.map(m => 
          m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
        );
        const updatedTask = { ...t, milestones: updatedMilestones };
        if (selectedTaskForDetail?.id === taskId) setSelectedTaskForDetail(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleDeleteMilestone = (taskId: string, milestoneId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedMilestones = t.milestones.filter(m => m.id !== milestoneId);
        const updatedTask = { ...t, milestones: updatedMilestones };
        if (selectedTaskForDetail?.id === taskId) setSelectedTaskForDetail(updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const handleUpdateProgressClick = (task: Task) => {
    setSelectedTaskForUpdate(task);
    setIsUpdateModalOpen(true);
  };

  const handleSaveProgress = (taskId: string, newProgress: number, note: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          progress: newProgress,
          logs: [...t.logs, {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            progressSnapshot: newProgress,
            note
          }]
        };
      }
      return t;
    }));
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      setTasks(prev => [...prev, taskData as Task]);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addMember = (member: Member) => {
    setMembers(prev => [...prev, member]);
  };

  const updateMember = (member: Member) => {
    setMembers(prev => prev.map(m => m.id === member.id ? member : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
  };

  const updateGroup = (group: Group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };

  const deleteGroup = (groupId: string) => {
    const hasMembers = members.some(m => m.groupId === groupId);
    if (hasMembers) {
      alert("无法删除：该分组下仍有成员，请先移除或转移成员。");
      return;
    }
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (filterGroupId === groupId) {
      setFilterGroupId('all');
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const result = await analyzeProjectHealth(tasks, members);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaskPulse <span className="text-slate-400 font-normal ml-1">团队交付看板</span></h1>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* Save Status Indicator */}
             <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100" onClick={() => setIsSettingsOpen(true)}>
               {saveStatus === 'saving' && (
                 <>
                   <svg className="animate-spin w-3 h-3 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span className="text-xs text-slate-500">保存中...</span>
                 </>
               )}
               {saveStatus === 'saved' && (
                 <>
                   <svg className="w-3 h-3 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   <span className="text-xs text-slate-500">已同步</span>
                 </>
               )}
               {saveStatus === 'local' && (
                 <>
                   <svg className="w-3 h-3 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <span className="text-xs text-orange-500 font-medium" title="无法连接到后端数据库，数据保存在本地">离线模式</span>
                 </>
               )}
               {saveStatus === 'error' && (
                 <>
                   <svg className="w-3 h-3 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                   <span className="text-xs text-red-500">同步失败</span>
                 </>
               )}
             </div>

             <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-70"
             >
                {isAnalyzing ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                <span>AI 风险诊断</span>
             </button>
             
             {/* Settings Button (NEW) */}
             <button
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
               title="数据库配置"
             >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
             </button>

             {/* Manage Team Button */}
             <button 
               onClick={() => setIsMemberManagerOpen(true)}
               className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
               title="管理团队"
             >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </button>

             <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/seed/manager/100/100" alt="Manager" />
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
             onClick={() => setFilterStatus('all')}
             className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md
             ${filterStatus === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100'}`}
          >
            <span className="text-3xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">
               {filterGroupId === 'all' ? '总任务数' : '该组任务数'}
            </span>
          </div>
          <div 
            onClick={() => setFilterStatus('completed')}
            className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center border-b-4 border-b-green-500 cursor-pointer transition-all hover:shadow-md
            ${filterStatus === 'completed' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-100'}`}
          >
            <span className="text-3xl font-bold text-green-600">{stats.completed}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">已交付</span>
          </div>
          <div 
            onClick={() => setFilterStatus('risk')}
            className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center border-b-4 border-b-yellow-400 cursor-pointer transition-all hover:shadow-md
            ${filterStatus === 'risk' ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-slate-100'}`}
          >
            <span className="text-3xl font-bold text-yellow-600">{stats.atRisk}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">有风险</span>
          </div>
          <div 
            onClick={() => setFilterStatus('delayed')}
            className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center border-b-4 border-b-red-500 cursor-pointer transition-all hover:shadow-md
            ${filterStatus === 'delayed' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-100'}`}
          >
            <span className="text-3xl font-bold text-red-600">{stats.delayed}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">已延期</span>
          </div>
        </div>

        {/* AI Report Section */}
        {aiAnalysis && (
          <div className="mb-8 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-indigo-900 mb-2">项目健康诊断报告</h3>
                <div className="prose prose-sm text-indigo-800/80 whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              </div>
              <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Team Status Section - Filtered by Group */}
        <TeamStatus members={filteredMembers} tasks={tasks} />

        {/* Action Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6">
          
          <div className="flex flex-col gap-6 w-full lg:w-auto min-w-0">
             
             {/* Row 1: Group Filters */}
             <div className="flex items-center gap-2 overflow-x-auto py-1 pb-4 w-full lg:max-w-4xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
                 团队视图
               </span>
                <button
                  onClick={() => handleGroupChange('all')}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm
                    ${filterGroupId === 'all' 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  全公司
                </button>
                <div className="w-px h-5 bg-slate-300 mx-1 shrink-0"></div>
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGroupChange(g.id)}
                    className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all shadow-sm
                      ${filterGroupId === g.id 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600 font-medium ring-1 ring-indigo-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="text-sm whitespace-nowrap">{g.name}</span>
                  </button>
                ))}
             </div>

             {/* Row 2: Member Filters (Dynamic based on Group) */}
             <div className="flex items-center gap-2 overflow-x-auto py-1 pb-4 w-full lg:max-w-4xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
                 成员筛选
               </span>
                <button
                  onClick={() => setFilterMemberId('all')}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm
                    ${filterMemberId === 'all' 
                      ? 'bg-slate-600 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {filterGroupId === 'all' ? '所有成员' : '组内全员'}
                </button>
                <div className="w-px h-5 bg-slate-300 mx-1 shrink-0"></div>
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setFilterMemberId(m.id)}
                    className={`shrink-0 flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all shadow-sm
                      ${filterMemberId === m.id 
                        ? 'bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm whitespace-nowrap">{m.name}</span>
                  </button>
                ))}
             </div>

            {/* Row 3: Status Filters */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 pb-4 w-full lg:max-w-4xl">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
                 状态视图
               </span>
               {[
                { id: 'all', label: '全部', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                { id: 'delayed', label: '已延期', color: 'bg-red-50 text-red-600 border-red-200' },
                { id: 'risk', label: '有风险', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { id: 'normal', label: '正常进行', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { id: 'completed', label: '已完成', color: 'bg-green-50 text-green-700 border-green-200' },
              ].map(status => (
                <button
                   key={status.id}
                   onClick={() => setFilterStatus(status.id as any)}
                   className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium flex items-center
                     ${filterStatus === status.id 
                       ? 'ring-2 ring-offset-1 ring-slate-300 ' + status.color
                       : 'hover:brightness-95 ' + status.color}`}
                >
                   {status.id !== 'all' && (
                     <span className={`w-1.5 h-1.5 rounded-full mr-2 
                        ${status.id === 'delayed' ? 'bg-red-500' : ''}
                        ${status.id === 'risk' ? 'bg-yellow-500' : ''}
                        ${status.id === 'normal' ? 'bg-blue-500' : ''}
                        ${status.id === 'completed' ? 'bg-green-500' : ''}
                     `}></span>
                   )}
                   {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* New Task Button */}
          <div className="shrink-0 self-start lg:self-center">
            <button 
              onClick={openCreateTask}
              className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">新建任务</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              assignee={members.find(m => m.id === task.assignedTo)}
              onUpdateClick={handleUpdateProgressClick}
              onEditTask={openEditTask}
              onDeleteTask={deleteTask}
              onDetailClick={handleTaskDetailClick}
            />
          ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">该视图下暂无任务</p>
            <button onClick={() => { setFilterStatus('all'); setFilterGroupId('all'); setFilterMemberId('all'); }} className="mt-2 text-primary text-sm hover:underline">重置筛选</button>
          </div>
        )}
      </main>

      {/* Modals */}
      <UpdateModal 
        task={selectedTaskForUpdate}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSave={handleSaveProgress}
      />

      <MemberManager
        isOpen={isMemberManagerOpen}
        onClose={() => setIsMemberManagerOpen(false)}
        members={members}
        groups={groups}
        onAddMember={addMember}
        onUpdateMember={updateMember}
        onDeleteMember={deleteMember}
        onAddGroup={addGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup}
      />

      <TaskFormModal 
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        task={editingTask}
        members={members}
        onSave={saveTask}
      />

      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        onAddMilestone={handleAddMilestone}
        onToggleMilestone={handleToggleMilestone}
        onDeleteMilestone={handleDeleteMilestone}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => loadData()} // Reload data after config changes
      />
    </div>
  );
};

export default App;