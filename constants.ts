import { Member, Task, Group } from './types';

export const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: '前端研发组' },
  { id: 'g2', name: '后端研发组' },
  { id: 'g3', name: '产品设计组' },
  { id: 'g4', name: '测试质量组' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '李明', role: '前端工程师', groupId: 'g1', avatar: 'https://picsum.photos/seed/m1/100/100' },
  { id: 'm2', name: '王强', role: '后端架构师', groupId: 'g2', avatar: 'https://picsum.photos/seed/m2/100/100' },
  { id: 'm3', name: '张薇', role: 'UI 设计师', groupId: 'g3', avatar: 'https://picsum.photos/seed/m3/100/100' },
  { id: 'm4', name: '赵琳', role: '测试工程师', groupId: 'g4', avatar: 'https://picsum.photos/seed/m4/100/100' },
];

const today = new Date();
const formatDate = (daysAdd: number) => {
  const d = new Date();
  d.setDate(today.getDate() + daysAdd);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: '用户中心重构',
    outcome: '完成用户登录、注册、找回密码页面的全新 UI 实现并上线，提升加载速度 30%。',
    assignedTo: 'm1',
    startDate: formatDate(-5),
    dueDate: formatDate(2),
    progress: 85,
    logs: [
      { id: 'l1', date: formatDate(-1), progressSnapshot: 80, note: '完成登录页动画优化' }
    ],
    milestones: [
      { id: 'ms1', title: 'UI组件库选型', isCompleted: true },
      { id: 'ms2', title: '登录页面开发', isCompleted: true },
      { id: 'ms3', title: '注册流程联调', isCompleted: true },
      { id: 'ms4', title: '性能测试与优化', isCompleted: false }
    ]
  },
  {
    id: 't2',
    title: '支付网关集成',
    outcome: '接入支付宝和微信支付，确保 99.9% 的支付成功率，完成所有异常场景测试。',
    assignedTo: 'm2',
    startDate: formatDate(-10),
    dueDate: formatDate(-1), // Already delayed
    progress: 60,
    logs: [
      { id: 'l2', date: formatDate(-2), progressSnapshot: 60, note: '微信支付签名问题卡顿，正在排查' }
    ],
    milestones: [
      { id: 'ms1', title: '支付宝 SDK 接入', isCompleted: true },
      { id: 'ms2', title: '微信支付 SDK 接入', isCompleted: false },
      { id: 'ms3', title: '退款流程开发', isCompleted: false }
    ]
  },
  {
    id: 't3',
    title: '设计系统规范 v2.0',
    outcome: '输出完整的 Figma 组件库，包含 Token 定义，确保开发设计一致性。',
    assignedTo: 'm3',
    startDate: formatDate(-3),
    dueDate: formatDate(7),
    progress: 30,
    logs: [],
    milestones: []
  },
  {
    id: 't4',
    title: '自动化测试覆盖',
    outcome: '核心交易链路自动化测试覆盖率达到 100%。',
    assignedTo: 'm4',
    startDate: formatDate(-2),
    dueDate: formatDate(5),
    progress: 10,
    logs: [],
    milestones: []
  },
  {
    id: 't5',
    title: '管理后台报表',
    outcome: '实现多维度的销售数据可视化大屏。',
    assignedTo: 'm1',
    startDate: formatDate(-1),
    dueDate: formatDate(3),
    progress: 5,
    logs: [],
    milestones: []
  },
  {
    id: 't6',
    title: '数据库迁移验证',
    outcome: '完成 MySQL 8.0 升级兼容性验证，无数据丢失。',
    assignedTo: 'm2',
    startDate: formatDate(-7),
    dueDate: formatDate(0), // Due today
    progress: 95,
    logs: [],
    milestones: []
  }
];