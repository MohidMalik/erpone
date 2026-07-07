// src/components/EmployeesView.tsx
import React, { useState } from 'react';
import { CompanyData, Employee, UserRole } from '../types.ts';
import { auth } from '../lib/firebase.ts';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Award,
  Clock,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  Calendar,
  CreditCard,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface EmployeesViewProps {
  data: CompanyData;
  onRefresh: () => void;
}

export default function EmployeesView({ data, onRefresh }: EmployeesViewProps) {
  const { company, employees, projects } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [cnic, setCnic] = useState('');
  const [salary, setSalary] = useState('');
  const [avatar, setAvatar] = useState('');
  const [performance, setPerformance] = useState('Satisfactory');

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('Employee');
    setCnic('');
    setSalary('');
    setAvatar('');
    setPerformance('Satisfactory');
    setIsFormOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setRole(emp.role);
    setCnic(emp.cnic || '');
    setSalary(emp.salary || '');
    setAvatar(emp.avatar || '');
    setPerformance(emp.performance);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await auth.currentUser?.getIdToken();
    const method = editingEmployee ? 'PUT' : 'POST';
    const endpoint = editingEmployee 
      ? `/api/companies/${company.id}/employees/${editingEmployee.id}`
      : `/api/companies/${company.id}/employees`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          cnic,
          salary,
          avatar,
          performance
        })
      });

      if (!res.ok) throw new Error('Failed to save employee record');
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error updating employee directory');
    }
  };

  const handleDelete = async (empId: number) => {
    if (!confirm('Are you sure you want to remove this employee from the system? This action is permanent.')) return;
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/employees/${empId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedEmployee(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Error deleting employee');
    }
  };

  // Clock Today's Attendance
  const handleClockAttendance = async (emp: Employee) => {
    const today = new Date().toISOString().split('T')[0];
    let attendanceList: string[] = [];
    try {
      attendanceList = JSON.parse(emp.attendance || '[]');
    } catch {
      attendanceList = [];
    }

    if (attendanceList.includes(today)) {
      alert('Employee has already been clocked in for today.');
      return;
    }

    const updatedAttendance = [...attendanceList, today];
    const token = await auth.currentUser?.getIdToken();
    try {
      const res = await fetch(`/api/companies/${company.id}/employees/${emp.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...emp,
          attendance: updatedAttendance
        })
      });
      if (!res.ok) throw new Error('Failed to clock attendance');
      const updatedEmp = await res.json();
      setSelectedEmployee(updatedEmp);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to log attendance');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Name,Email,Phone,Role,CNIC/ID,Salary,Performance,Attendance Days'];
    const rows = employees.map(emp => {
      let days = 0;
      try { days = JSON.parse(emp.attendance || '[]').length; } catch { days = 0; }
      return `"${emp.id}","${emp.name}","${emp.email || ''}","${emp.phone || ''}","${emp.role}","${emp.cnic || ''}","${emp.salary || ''}","${emp.performance}","${days}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.replace(/\s+/g, '_')}_employees_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Register
  const handlePrint = () => {
    window.print();
  };

  // Filter & Search
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (emp.phone && emp.phone.includes(searchQuery));
    const matchesRole = selectedRole === 'All' || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6" id="employees-view-root">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm" id="employee-toolbar">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> Employees Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage, verify credentials, log attendance and track active developer/contractor performance.</p>
        </div>
        
        <div className="flex items-center gap-2 self-stretch sm:self-auto" id="toolbar-actions">
          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Export CSV"
            id="btn-export-csv"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel/CSV
          </button>
          
          <button
            onClick={handlePrint}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Print"
            id="btn-print"
          >
            <Printer className="w-4 h-4 text-blue-500" /> Print Register
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            id="btn-add-employee"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Directory Filter / Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="directory-filter-bar">
        <div className="md:col-span-8 relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none self-center h-full flex items-center justify-center" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, email, or contact number..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="md:col-span-4 flex gap-2">
          {['All', 'Super Admin', 'Manager', 'Employee', 'Accountant'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-2 text-[10px] uppercase font-extrabold tracking-wider rounded-lg transition-all shrink-0 cursor-pointer border ${
                selectedRole === r
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {r.replace('Super ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Directory Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="directory-content">
        
        {/* Employees Grid List */}
        <div className={`lg:col-span-${selectedEmployee ? '7' : '12'} grid grid-cols-1 md:grid-cols-2 gap-4`} id="employees-grid">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between group ${
                selectedEmployee?.id === emp.id ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5' : 'border-slate-200 dark:border-slate-800'
              }`}
              id={`emp-card-${emp.id}`}
            >
              <div className="flex items-center gap-3.5" id={`emp-avatar-meta-${emp.id}`}>
                {emp.avatar ? (
                  <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 dark:border-emerald-950">
                    {emp.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{emp.name}</h3>
                  <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800/80 inline-block mt-1 font-semibold">{emp.role}</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all" />
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400" id="empty-directory">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs">No employees found matching the filter criteria.</p>
            </div>
          )}
        </div>

        {/* Detailed Profile Drawer Column */}
        {selectedEmployee && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md relative h-fit" id="profile-drawer">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              id="profile-close-btn"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Meta Hero */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800" id="profile-hero">
              {selectedEmployee.avatar ? (
                <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-500 p-1 bg-white mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center font-bold text-3xl border-2 border-emerald-100 dark:border-emerald-950/40 mb-3">
                  {selectedEmployee.name.charAt(0)}
                </div>
              )}
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 justify-center">
                {selectedEmployee.name} <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{selectedEmployee.role}</p>
            </div>

            {/* Profile specifications */}
            <div className="py-6 space-y-4 text-xs" id="profile-specs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-email">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Email:</span>
                <span>{selectedEmployee.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-phone">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Phone:</span>
                <span>{selectedEmployee.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-id">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">ID/CNIC:</span>
                <span>{selectedEmployee.cnic || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-salary">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Salary:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedEmployee.salary || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-perf">
                <Award className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Performance:</span>
                <span className={`px-2 py-0.5 rounded-lg font-bold ${
                  selectedEmployee.performance === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500' :
                  selectedEmployee.performance === 'Good' ? 'bg-blue-500/10 text-blue-500' :
                  selectedEmployee.performance === 'Satisfactory' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                }`}>{selectedEmployee.performance}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" id="prof-spec-projects">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="font-bold w-16">Assigned:</span>
                <span>{
                  projects.filter(p => p.assignedEmployeeIds.includes(selectedEmployee.id)).map(p => p.name).join(', ') || 'None'
                }</span>
              </div>
            </div>

            {/* Attendance tracking core */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800" id="attendance-section">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-emerald-500" /> Attendance Ledger
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                This month total attendance logged: 
                <span className="text-emerald-500 font-bold ml-1">
                  {JSON.parse(selectedEmployee.attendance || '[]').length} days
                </span>
              </p>
              
              <button
                onClick={() => handleClockAttendance(selectedEmployee)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/15 cursor-pointer"
                id="btn-clock-attendance"
              >
                Clock Daily Attendance
              </button>
            </div>

            {/* Edit / Delete Row */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" id="profile-controls">
              <button
                onClick={() => openEditModal(selectedEmployee)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-profile-edit"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>

              <button
                onClick={() => handleDelete(selectedEmployee.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-profile-delete"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="employee-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg p-6 md:p-8 space-y-6" id="employee-form-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{editingEmployee ? 'Edit Employee Profile' : 'Onboard New Employee'}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Configure profile, CNIC, and billing salary information.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" id="emp-form">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohid Ahmed"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" id="form-grid-email-phone">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4" id="form-grid-role-salary">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee">Employee</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Salary ID Info</label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. $4,500/mo"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4" id="form-grid-cnic-perf">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CNIC / ID Card</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="e.g. 42101-1234567-1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Performance Track</label>
                  <select
                    value={performance}
                    onChange={(e) => setPerformance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Avatar / Image URL (optional)</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4" id="form-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-cancel-form"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                  id="btn-save-form"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
