import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  User,
  ArrowRight
} from 'lucide-react';
import { HouseholdCase } from '../../types/survey';
import { CMRGStorage } from '../../lib/storage';
import { INITIAL_ENUMERATORS } from '../../data/mockData';

interface CaseManagerProps {
  onStartCaseVisit?: (caseId: string) => void;
}

export const CaseManager: React.FC<CaseManagerProps> = ({ onStartCaseVisit }) => {
  const [cases, setCases] = useState<HouseholdCase[]>(() => CMRGStorage.getCases());
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<HouseholdCase | null>(null);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.head_of_household.toLowerCase().includes(search.toLowerCase()) ||
      c.village.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignEnumerator = (caseId: string, enumId: string) => {
    const enumProfile = INITIAL_ENUMERATORS.find(e => e.id === enumId);
    if (!enumProfile) return;

    CMRGStorage.assignCase(caseId, enumId, enumProfile.name);
    setCases(CMRGStorage.getCases());
  };

  const getStatusBadge = (status: HouseholdCase['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'verified':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#111111] text-white">Verified</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">In Progress</span>;
      case 'follow_up_needed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">Follow-up</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Unvisited</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Longitudinal Case Management</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 font-mono text-xs rounded-full font-bold">
              {cases.length} Households
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign enumerators, track panel survey visits, and enforce repeat visit protocols in remote clusters
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, or village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unvisited">Unvisited</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="follow_up_needed">Follow-up Needed</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Head of Household</th>
                <th className="py-3 px-4">Village / District</th>
                <th className="py-3 px-4">Assigned Enumerator</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-red-600">
                    {c.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{c.head_of_household}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{c.contact_phone}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-medium text-slate-800">{c.village}</span>
                    <span className="text-[11px] text-slate-500 block">{c.district}</span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={c.assigned_enumerator_id}
                      onChange={(e) => handleAssignEnumerator(c.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded px-2 py-1 font-medium focus:outline-none"
                    >
                      {INITIAL_ENUMERATORS.map((en) => (
                        <option key={en.id} value={en.id}>{en.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {c.target_visit_date}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onStartCaseVisit?.(c.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors"
                    >
                      <span>Collect Data</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
