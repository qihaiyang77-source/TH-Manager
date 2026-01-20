import React, { useState } from 'react';
import { Member, Group } from '../types';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  groups: Group[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  isOpen,
  onClose,
  members,
  groups,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members');

  // --- Member State ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<Member>>({});
  const [isAddingMember, setIsAddingMember] = useState(false);

  // --- Group State ---
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState<Partial<Group>>({});
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  if (!isOpen) return null;

  // --- Member Functions ---
  const resetMemberForm = () => {
    setEditingMemberId(null);
    setIsAddingMember(false);
    setMemberFormData({});
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberFormData(member);
    setIsAddingMember(false);
  };

  const startAddMember = () => {
    setIsAddingMember(true);
    setEditingMemberId(null);
    setMemberFormData({
      id: Date.now().toString(),
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      groupId: groups.length > 0 ? groups[0].id : ''
    });
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormData.name || !memberFormData.role || !memberFormData.groupId) {
       // Ensure groupId is selected. If groups are empty, this might be tricky, handled by validation or UI logic.
       if (!memberFormData.groupId && groups.length > 0) {
          alert("请选择一个所属组");
          return;
       } else if (groups.length === 0) {
          alert("请先创建分组");
          return;
       }
       return;
    }

    const memberData = memberFormData as Member;
    
    if (isAddingMember) {
      onAddMember(memberData);
    } else {
      onUpdateMember(memberData);
    }
    resetMemberForm();
  };

  // --- Group Functions ---
  const resetGroupForm = () => {
    setEditingGroupId(null);
    setIsAddingGroup(false);
    setGroupFormData({});
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupFormData(group);
    setIsAddingGroup(false);
  };

  const startAddGroup = () => {
    setIsAddingGroup(true);
    setEditingGroupId(null);
    setGroupFormData({
      id: `g-${Date.now()}`,
      name: ''
    });
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name) return;

    const groupData = groupFormData as Group;
    if (isAddingGroup) {
      onAddGroup(groupData);
    } else {
      onUpdateGroup(groupData);
    }
    resetGroupForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-0 m-4 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header with Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-5 pb-0 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">团队管理</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'members' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              成员列表
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'groups' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              分组设置
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ================= MEMBERS TAB ================= */}
          {activeTab === 'members' && (
            <>
              {/* Member List View */}
              {!isAddingMember && !editingMemberId && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-slate-500">共 {members.length} 位成员</p>
                    <button 
                      onClick={startAddMember}
                      className="flex items-center space-x-1 bg-primary text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>添加成员</span>
                    </button>
                  </div>
                  
                  {members.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl text-slate-400">
                      暂无成员，请点击右上角添加
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map(member => {
                        const groupName = groups.find(g => g.id === member.groupId)?.name || <span className="text-red-400">未指定分组</span>;
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                            <div className="flex items-center space-x-3">
                              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full bg-slate-200" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="font-medium text-slate-800">{member.name}</div>
                                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">{groupName}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{member.role}</div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => startEditMember(member)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('确定要删除该成员吗?')) onDeleteMember(member.id);
                                }} 
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Member Form */}
              {(isAddingMember || editingMemberId) && (
                <form onSubmit={handleMemberSubmit} className="animate-[fadeIn_0.2s_ease-out]">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">{isAddingMember ? '添加新成员' : '编辑成员信息'}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                      <input 
                        type="text" 
                        value={memberFormData.name || ''} 
                        onChange={e => setMemberFormData({...memberFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">所属组</label>
                      <select
                        value={memberFormData.groupId || ''}
                        onChange={e => setMemberFormData({...memberFormData, groupId: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                        required
                      >
                        <option value="" disabled>选择所属组...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      {groups.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">请先在“分组设置”中添加组</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">职位/角色</label>
                      <input 
                        type="text" 
                        value={memberFormData.role || ''} 
                        onChange={e => setMemberFormData({...memberFormData, role: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">头像 URL (可选)</label>
                      <input 
                        type="text" 
                        value={memberFormData.avatar || ''} 
                        onChange={e => setMemberFormData({...memberFormData, avatar: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-mono text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button 
                      type="button" 
                      onClick={resetMemberForm}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                    >
                      取消
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ================= GROUPS TAB ================= */}
          {activeTab === 'groups' && (
            <>
              {/* Group List View */}
              {!isAddingGroup && !editingGroupId && (
                 <div>
                    <div className="mb-4 flex justify-between items-center">
                      <p className="text-sm text-slate-500">共 {groups.length} 个分组</p>
                      <button 
                        onClick={startAddGroup}
                        className="flex items-center space-x-1 bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>新建分组</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {groups.map(group => {
                        const memberCount = members.filter(m => m.groupId === group.id).length;
                        return (
                          <div key={group.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                             <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg">
                                  {group.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">{group.name}</div>
                                  <div className="text-xs text-slate-500">{memberCount} 位成员</div>
                                </div>
                             </div>
                             <div className="flex space-x-2">
                                <button onClick={() => startEditGroup(group)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => {
                                     if(window.confirm('确定要删除该分组吗？')) onDeleteGroup(group.id);
                                  }} 
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
              )}

              {/* Group Form */}
              {(isAddingGroup || editingGroupId) && (
                <form onSubmit={handleGroupSubmit} className="animate-[fadeIn_0.2s_ease-out]">
                   <h3 className="text-lg font-semibold text-slate-700 mb-4">{isAddingGroup ? '新建分组' : '重命名分组'}</h3>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">分组名称</label>
                        <input 
                          type="text" 
                          value={groupFormData.name || ''} 
                          onChange={e => setGroupFormData({...groupFormData, name: e.target.value})}
                          placeholder="例如：市场部、技术中台..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          required
                        />
                      </div>
                   </div>
                   <div className="flex space-x-3 mt-6">
                    <button 
                      type="button" 
                      onClick={resetGroupForm}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                    >
                      取消
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};