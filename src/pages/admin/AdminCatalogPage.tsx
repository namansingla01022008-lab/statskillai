import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Course, Opportunity, DomainType, OpportunityType, ProficiencyLevel } from '../../types';
import { DOMAINS } from '../../constants/competency';
import {
  BookOpen,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdminCatalogPage: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<'courses' | 'opportunities'>('courses');
  const [courses, setCourses] = useState<Course[]>(() => StorageService.getCourses());
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => StorageService.getOpportunities());

  const [notice, setNotice] = useState<string | null>(null);

  // New Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState<Course>({
    id: '',
    title: '',
    domain: 'Statistical',
    provider: '',
    source: 'SWAYAM',
    duration: '6 Weeks',
    level: 'Intermediate',
    description: '',
    portalUrl: 'https://swayam.gov.in',
    sourceUrl: 'https://swayam.gov.in',
    sourceName: 'SWAYAM',
    status: 'verified',
    topic: 'Statistical Inference',
    skillsCovered: [],
  });
  const [courseSkillsInput, setCourseSkillsInput] = useState('');

  // New Opportunity Modal
  const [showOppModal, setShowOppModal] = useState(false);
  const [oppForm, setOppForm] = useState<Opportunity>({
    id: '',
    title: '',
    organisation: '',
    orgId: 'org-custom',
    sector: 'Public Sector',
    location: 'New Delhi / Remote',
    type: 'Job',
    requiredSkills: [],
    minDomainLevels: { Technical: 60, Statistical: 60, Digital: 60, Behavioural: 60 },
    description: '',
    deadline: '2026-12-31',
    stipendOrSalary: 'Standard Scale',
  });
  const [oppSkillsInput, setOppSkillsInput] = useState('');

  // Course Actions
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = courseSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const item: Course = {
      ...courseForm,
      id: courseForm.id || `course-custom-${Date.now()}`,
      skillsCovered: skills.length > 0 ? skills : ['General Competency'],
    };

    StorageService.saveCourse(item);
    setCourses(StorageService.getCourses());
    setShowCourseModal(false);
    setNotice(`Course "${item.title}" saved successfully.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteCourse = (id: string) => {
    StorageService.deleteCourse(id);
    setCourses(StorageService.getCourses());
    setNotice('Course deleted.');
    setTimeout(() => setNotice(null), 3000);
  };

  // Opportunity Actions
  const handleSaveOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = oppSkillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const item: Opportunity = {
      ...oppForm,
      id: oppForm.id || `opp-custom-${Date.now()}`,
      requiredSkills: skills.length > 0 ? skills : ['General Competency'],
    };

    StorageService.saveOpportunity(item);
    setOpportunities(StorageService.getOpportunities());
    setShowOppModal(false);
    setNotice(`Opportunity "${item.title}" saved successfully.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteOpportunity = (id: string) => {
    StorageService.deleteOpportunity(id);
    setOpportunities(StorageService.getOpportunities());
    setNotice('Opportunity deleted.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!isOnline && (
        <NoticeBanner type="warning" title="Catalog Modification Disabled Offline">
          You are viewing cached catalog entries. Creating, editing, or deleting courses and opportunities requires an active network connection.
        </NoticeBanner>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Curriculum & Opportunity Catalogue Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain curated courses from SWAYAM/iGOT and sovereign career openings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'courses' ? (
            <button
              disabled={!isOnline}
              onClick={() => {
                setCourseForm({
                  id: '',
                  title: '',
                  domain: 'Statistical',
                  provider: 'SWAYAM / IIT',
                  source: 'SWAYAM',
                  duration: '8 Weeks',
                  level: 'Intermediate',
                  description: '',
                  portalUrl: 'https://swayam.gov.in',
                  sourceUrl: 'https://swayam.gov.in',
                  sourceName: 'SWAYAM',
                  status: 'verified',
                  topic: 'Statistical Inference',
                  skillsCovered: [],
                });
                setCourseSkillsInput('');
                setShowCourseModal(true);
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          ) : (
            <button
              disabled={!isOnline}
              onClick={() => {
                setOppForm({
                  id: '',
                  title: '',
                  organisation: '',
                  orgId: 'org-custom',
                  sector: 'Public Sector',
                  location: 'New Delhi',
                  type: 'Job',
                  requiredSkills: [],
                  minDomainLevels: { Technical: 60, Statistical: 60, Digital: 60, Behavioural: 60 },
                  description: '',
                  deadline: '2026-12-31',
                  stipendOrSalary: 'Standard Scale',
                });
                setOppSkillsInput('');
                setShowOppModal(true);
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Opportunity</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <NoticeBanner type="success" title="Catalogue Updated">
          {notice}
        </NoticeBanner>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curated Courses Catalogue ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'opportunities'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Career Opportunities ({opportunities.length})</span>
        </button>
      </div>

      {/* COURSES TABLE */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3">Title & Domain</th>
                <th className="p-3">Source & Provider</th>
                <th className="p-3">Status & Verification</th>
                <th className="p-3">Official URL</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{c.title}</p>
                    <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                      {c.domain}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">
                    <p className="font-semibold">{c.source}</p>
                    <p className="text-[11px] text-slate-500">{c.provider}</p>
                  </td>
                  <td className="p-3 text-slate-600">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        c.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : c.status === 'broken'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {c.status || 'unverified'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {c.lastVerifiedAt ? `Verified: ${new Date(c.lastVerifiedAt).toISOString().split('T')[0]}` : 'Unverified'}
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <a
                      href={c.sourceUrl || c.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>{(c.sourceUrl || c.portalUrl || '').replace('https://', '').slice(0, 30)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                      aria-label="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* OPPORTUNITIES TABLE */}
      {activeTab === 'opportunities' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3">Opening Title</th>
                <th className="p-3">Organisation & Sector</th>
                <th className="p-3">Type & Location</th>
                <th className="p-3">Deadline</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{opp.title}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{opp.description}</p>
                  </td>
                  <td className="p-3 text-slate-700">
                    <p className="font-semibold">{opp.organisation}</p>
                    <p className="text-[11px] text-teal-800">{opp.sector}</p>
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="font-bold uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                      {opp.type}
                    </span>
                    {opp.location}
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    {opp.deadline}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                      aria-label="Delete opportunity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">Add Verified Course Module</h3>
            <form onSubmit={handleSaveCourse} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Domain</label>
                  <select
                    value={courseForm.domain}
                    onChange={(e) => setCourseForm({ ...courseForm, domain: e.target.value as DomainType })}
                    className="w-full px-2 py-1.5 border rounded-md"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Source Platform</label>
                  <select
                    value={courseForm.source}
                    onChange={(e) => setCourseForm({ ...courseForm, source: e.target.value as any })}
                    className="w-full px-2 py-1.5 border rounded-md"
                  >
                    <option value="SWAYAM">SWAYAM</option>
                    <option value="NPTEL">NPTEL</option>
                    <option value="iGOT Karmayogi">iGOT Karmayogi</option>
                    <option value="NCS">NCS</option>
                    <option value="Company Training">Company Training</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Provider Institution</label>
                <input
                  type="text"
                  required
                  value={courseForm.provider}
                  onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. IIT Kanpur / MoSPI Academy"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Course Description</label>
                <textarea
                  rows={2}
                  required
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Skills Covered (comma-separated)</label>
                <input
                  type="text"
                  value={courseSkillsInput}
                  onChange={(e) => setCourseSkillsInput(e.target.value)}
                  placeholder="Sampling, Inference, Variance Estimation"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 text-white rounded-md font-bold"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPPORTUNITY MODAL */}
      {showOppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">Add Career / Skilling Opening</h3>
            <form onSubmit={handleSaveOpportunity} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Position / Fellowship Title</label>
                <input
                  type="text"
                  required
                  value={oppForm.title}
                  onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Organisation</label>
                  <input
                    type="text"
                    required
                    value={oppForm.organisation}
                    onChange={(e) => setOppForm({ ...oppForm, organisation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Type</label>
                  <select
                    value={oppForm.type}
                    onChange={(e) => setOppForm({ ...oppForm, type: e.target.value as OpportunityType })}
                    className="w-full px-2 py-1.5 border rounded-md"
                  >
                    <option value="Job">Job</option>
                    <option value="Internship">Internship</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                    <option value="Training Programme">Training Programme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Required Skills (comma-separated)</label>
                <input
                  type="text"
                  value={oppSkillsInput}
                  onChange={(e) => setOppSkillsInput(e.target.value)}
                  placeholder="Python, Sampling Theory, SQL"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={oppForm.description}
                  onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOppModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 text-white rounded-md font-bold"
                >
                  Save Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
