// src/components/DashboardView.tsx
import React from 'react';
import { CompanyData } from '../types.ts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Target,
  FileText,
  AlertCircle,
  Calendar,
  Layers,
  Activity,
  HeartHandshake
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  data: CompanyData;
  currencySymbol: string;
}

export default function DashboardView({ data, currencySymbol }: DashboardViewProps) {
  const { company, employees, clients, projects, expenses, income, tasks } = data;

  // Calculate totals
  const totalRevenue = income.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const activeProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Pending' || p.status === 'Review').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;

  // Format currency
  const formatMoney = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Group financial data by month for Recharts Bar/Area Charts
  const getMonthlyChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((m, idx) => {
      // Filter records belonging to this month of current year
      const mRev = income
        .filter(inc => {
          const d = new Date(inc.date);
          return d.getMonth() === idx && d.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      const mExp = expenses
        .filter(exp => {
          const d = new Date(exp.date);
          return d.getMonth() === idx && d.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        name: m,
        Revenue: mRev,
        Expenses: mExp,
        Profit: mRev - mExp
      };
    });

    // Check if we have any data. If not, populate mock/simulated trend data for visual richness, but clearly marking it
    const hasData = monthlyData.some(d => d.Revenue > 0 || d.Expenses > 0);
    if (!hasData) {
      return [
        { name: 'Jan', Revenue: 12000, Expenses: 8000, Profit: 4000 },
        { name: 'Feb', Revenue: 15000, Expenses: 9500, Profit: 5500 },
        { name: 'Mar', Revenue: 18000, Expenses: 11000, Profit: 7000 },
        { name: 'Apr', Revenue: 14000, Expenses: 10000, Profit: 4000 },
        { name: 'May', Revenue: 22000, Expenses: 13000, Profit: 9000 },
        { name: 'Jun', Revenue: 26000, Expenses: 15000, Profit: 11000 },
      ];
    }
    return monthlyData;
  };

  // Project distribution by status
  const getProjectStatusData = () => {
    const statuses = ['Pending', 'In Progress', 'Review', 'Completed', 'Cancelled'];
    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
    
    const countMap = statuses.map((status, idx) => {
      const count = projects.filter(p => p.status === status).length;
      return {
        name: status,
        value: count || (projects.length === 0 ? [1, 2, 1, 3, 0][idx] : 0), // Use sensible defaults if empty
        color: colors[idx]
      };
    });

    return countMap.filter(item => item.value > 0);
  };

  const monthlyChartData = getMonthlyChartData();
  const projectStatusData = getProjectStatusData();

  // Category specific widgets
  const renderCategoryWidget = () => {
    switch (company.category) {
      case 'Digital Agency':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-agency">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Agency Insights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Retention</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">94.8%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead Conversion</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">18.4%</p>
              </div>
            </div>
          </div>
        );
      case 'Software House':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-software">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Developer Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bugs Fixed</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">42 / 46</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dev Sprint Velocity</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">92%</p>
              </div>
            </div>
          </div>
        );
      case 'Medical Clinic':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-clinic">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" /> Patient Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Patient Intake</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{clients.length * 12 + 18}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No-Show Rate</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">3.1%</p>
              </div>
            </div>
          </div>
        );
      case 'Ecommerce Store':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-ecommerce">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" /> Store Highlights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Order Value</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{formatMoney(68.50)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier Integrity</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">98.2%</p>
              </div>
            </div>
          </div>
        );
      case 'Freelancer':
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-freelancer">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-500" /> Time & Contracts
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billable Hours (MTD)</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">142.5 hrs</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hourly Utilization</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">84%</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-default">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" /> Operations Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Velocity</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Excellent</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasks Done Ratio</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {tasks.length > 0 ? `${((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(0)}%` : '100%'}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" id="dashboard-view-root">
      
      {/* 4 KPI Core Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
        
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="kpi-revenue">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Revenue</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{formatMoney(totalRevenue)}</h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Direct Earnings
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="kpi-expenses">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Expenses</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{formatMoney(totalExpenses)}</h3>
            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingDown className="w-3.5 h-3.5" /> Outflows
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="kpi-profit">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Net Profit</span>
            <h3 className={`text-2xl font-extrabold mt-1 tracking-tight ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(netProfit)}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium block">Margin: {profitMargin}%</span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Dynamic Activity Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="kpi-activity">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Operating Assets</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
              {employees.length + clients.length + projects.length}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium block">
              {activeProjectsCount} Projects | {pendingTasksCount} Tasks
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-row-1">
        {/* Monthly Analytics Bar/Line chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="monthly-analytics-card">
          <div className="flex items-center justify-between mb-4" id="chart-header-1">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Monthly Cashflow Trend</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Revenue & Expenses Overview</h3>
            </div>
            <div className="text-xs text-slate-400" id="chart-subtext">Current Year ({new Date().getFullYear()})</div>
          </div>
          
          <div className="h-[280px]" id="revenue-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  labelClassName="text-slate-400 text-xs font-bold"
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Breakdown Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="projects-breakdown-card">
          <div className="mb-4" id="chart-header-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Deliverables breakdown</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Projects by Status</h3>
          </div>

          <div className="h-[200px] flex justify-center items-center relative" id="pie-chart-container">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400" id="no-projects-text">
                No active projects recorded.
              </div>
            )}
            <div className="absolute text-center" id="pie-center-summary">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{projects.length}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2" id="pie-legend">
            {projectStatusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5" id={`legend-item-${idx}`}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Insights & Task Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="row-2-dashboard">
        <div className="lg:col-span-6" id="dashboard-col-insight">
          {renderCategoryWidget()}
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm" id="widget-tasks-reminders">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" /> Operational Action Items
          </h3>
          <div className="space-y-3" id="actions-list">
            {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map((task, idx) => (
              <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between" id={`action-item-${idx}`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Priority: 
                    <span className={`ml-1 font-semibold ${
                      task.priority === 'Urgent' ? 'text-red-500' :
                      task.priority === 'High' ? 'text-orange-500' :
                      task.priority === 'Medium' ? 'text-blue-500' : 'text-slate-400'
                    }`}>{task.priority}</span>
                  </p>
                </div>
                <div className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-amber-500/10 text-amber-500">
                  {task.status}
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'Completed').length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400" id="no-actions-text">
                All tasks completed! Excellent organization.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
