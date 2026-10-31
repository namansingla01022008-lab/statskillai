import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import {
  Users,
  Search,
  Filter,
  Download,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Building2,
  Sparkles,
  Radio,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminMembersPage: React.FC = () => {
  const { allUsers } = useApp();
  const [members, setMembers] = useState<User[]>(allUsers);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'learner' | 'mentor' | 'admin'>('All');
  const [selectedProfileType, setSelectedProfileType] = useState<string>('All');
  const [newlyRegisteredId, setNewlyRegisteredId] = useState<string | null>(null);

  // Sync with context allUsers
  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      setMembers(allUsers);
    }
  }, [allUsers]);

  // Load latest users from database on mount
  useEffect(() => {
    setIsLoading(true);
    ApiService.getAllUsers()
      .then((users) => {
        if (users && users.length > 0) {
          setMembers(users);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch registered members from API:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Real-time listener for instant live update when anyone registers
  useEffect(() => {
    const socket = ApiService.getSocket();

    const handleUserRegistered = (payload: any) => {
      const newUser: User | undefined = payload?.user || payload;
      if (!newUser || !newUser.id) return;

      console.log('[AdminMembersPage] Live registered member received:', newUser.name);

      setMembers((prev) => {
        const exists = prev.some(
          (u) => u.id === newUser.id || (u.email && newUser.email && u.email.toLowerCase() === newUser.email.toLowerCase())
        );
        if (exists) {
          return prev.map((u) =>
            u.id === newUser.id || (u.email && newUser.email && u.email.toLowerCase() === newUser.email.toLowerCase())
              ? newUser
              : u
          );
        }
        return [newUser, ...prev];
      });

      // Highlight new member
      setNewlyRegisteredId(newUser.id);
      setTimeout(() => {
        setNewlyRegisteredId(null);
      }, 8000);
    };

    socket.on('user_registered', handleUserRegistered);

    return () => {
      socket.off('user_registered', handleUserRegistered);
    };
  }, []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.department && m.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.designation && m.designation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = selectedRole === 'All' || m.role === selectedRole;
      const matchesProfileType = selectedProfileType === 'All' || m.profileType === selectedProfileType;

      return matchesSearch && matchesRole && matchesProfileType;
    });
  }, [members, searchTerm, selectedRole, selectedProfileType]);

  // Metrics
  const totalCount = members.length;
  const learnersCount = members.filter((m) => m.role === 'learner').length;
  const mentorsCount = members.filter((m) => m.role === 'mentor').length;
  const adminsCount = members.filter((m) => m.role === 'admin').length;

  // Export CSV
  const handleExportCSV = () => {
    let csv = `ID,Name,Email,Role,Profile Type,Department,Designation\n`;
    filteredMembers.forEach((m) => {
      csv += `"${m.id}","${m.name}","${m.email}","${m.role}","${m.profileType || ''}","${m.department || ''}","${m.designation || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StatSkillAI_Registered_Members_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Registered Platform Members
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Real-Time Sync Active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete institutional directory of authenticated learners, mentors, and administrators. Updates instantly upon registration.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Roster (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Members</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">All registered accounts</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Learners</span>
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700">{learnersCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Active skilling participants</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Mentors</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700">{mentorsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Domain & advisory specialists</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Administrators</span>
            <UserCheck className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{adminsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Institutional overseers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search members by name, email, department, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
            />
          </div>

          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'learner', 'mentor', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedRole === role
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role === 'All' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* Profile Type Select */}
          <select
            value={selectedProfileType}
            onChange={(e) => setSelectedProfileType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 bg-white"
          >
            <option value="All">All Profile Types</option>
            <option value="Student">Student</option>
            <option value="Government Employee">Government Employee</option>
            <option value="Private-Sector Professional">Private-Sector Professional</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-sm text-slate-900">
              Active Member Registry ({filteredMembers.length} shown)
            </h2>
          </div>
          {isLoading && (
            <span className="text-xs text-slate-400 animate-pulse">Syncing latest database records...</span>
          )}
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No registered members found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No members matched your search or filters. New user registrations will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Profile Type</th>
                  <th className="py-3 px-4">Department / Institution</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const isNew = m.id === newlyRegisteredId;
                  const initials = m.name
                    ? m.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U';

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isNew ? 'bg-emerald-50/80 animate-pulse' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            m.role === 'admin'
                              ? 'bg-slate-800 text-amber-300'
                              : m.role === 'mentor'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{m.name}</span>
                              {isNew && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                  Just Registered!
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] block">{m.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            m.role === 'admin'
                              ? 'bg-slate-900 text-white'
                              : m.role === 'mentor'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {m.role === 'admin' && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                          {m.role === 'mentor' && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                          {m.role === 'learner' && <GraduationCap className="w-3 h-3 text-teal-700" />}
                          <span>{m.role}</span>
                        </span>
                      </td>

                      {/* Profile Type */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.profileType || 'Student'}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        <span title={m.department || 'General Administration'}>
                          {m.department || 'General Administration'}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        <span title={m.designation || 'Participant'}>
                          {m.designation || 'Participant'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
