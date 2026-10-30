import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Certificate } from '../../types';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Send,
  HelpCircle,
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const { currentUser } = useApp();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courseName, setCourseName] = useState('');
  const [provider, setProvider] = useState('NPTEL');
  const [certId, setCertId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const list = await ApiService.getMyCertificates();
      setCertificates(list);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!courseName.trim() || !certId.trim() || !verificationUrl.trim()) {
      setMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }

    if (!verificationUrl.startsWith('https://')) {
      setMessage({ type: 'error', text: 'Verification URL must begin with secure https://' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiService.submitCertificate({
        courseName: courseName.trim(),
        provider,
        certId: certId.trim(),
        verificationUrl: verificationUrl.trim(),
      });

      setMessage({ type: 'success', text: res.message });
      setCourseName('');
      setCertId('');
      setVerificationUrl('');
      await loadCertificates();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Submission failed. Please check your details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, xpAwarded: boolean) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified (+200 XP)</span>
          </span>
        );
      case 'PENDING':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            <span>In Review</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Credential Registry</span>
          </div>
          <h1 className="text-2xl font-extrabold">Certificate Verification Portal</h1>
          <p className="text-slate-300 text-xs max-w-2xl mt-1">
            Submit your completed courses from NPTEL, SWAYAM, Coursera, or iGOT Karmayogi. Once verified by our institutional reviewers, you receive <strong>+200 XP</strong> directly into your reward ledger.
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-xl border border-white/10 shrink-0 text-center">
          <span className="text-[10px] uppercase font-bold text-teal-300 block">Reward Bounty</span>
          <span className="text-3xl font-black text-white">+200</span>
          <span className="text-xs text-slate-300 block">XP per Verified Cert</span>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 2-Column Layout: Submit Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-teal-600" />
            <span>Submit New Certificate</span>
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Enter the exact course and credential verification details
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Provider */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issuing Provider *</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white"
              >
                <option value="NPTEL">NPTEL (National Programme on Technology Enhanced Learning)</option>
                <option value="SWAYAM">SWAYAM Portal</option>
                <option value="Coursera">Coursera</option>
                <option value="iGOT">iGOT Karmayogi (Government of India)</option>
                <option value="Other">Other Recognized Provider</option>
              </select>
            </div>

            {/* Course Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Title *</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Data Science for Engineers"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                required
              />
            </div>

            {/* Certificate ID */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Certificate ID *</label>
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder={provider === 'NPTEL' ? 'e.g. NPTEL24CS101S123456' : 'e.g. CRT-98234-X'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Found on your certificate document or completion transcript.
              </span>
            </div>

            {/* Verification URL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verification URL *</label>
              <input
                type="url"
                value={verificationUrl}
                onChange={(e) => setVerificationUrl(e.target.value)}
                placeholder={
                  provider === 'NPTEL'
                    ? 'https://nptel.ac.in/noc/Ecertificate/?q=...'
                    : provider === 'Coursera'
                    ? 'https://www.coursera.org/verify/...'
                    : 'https://swayam.gov.in/...'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Publicly accessible verification link provided by the issuer.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Validating...' : 'Submit for Review (+200 XP)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Submitted Certificates Roster (2 spans) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Submitted Credentials</h2>
              <p className="text-xs text-slate-500">Live audit status of your submitted certificates</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {certificates.length} Total
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No certificates submitted yet</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Submit your certified training completions using the form on the left to earn recognition and reward points.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-1">
                        {cert.provider}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900">{cert.courseName}</h3>
                    </div>
                    {getStatusBadge(cert.status, cert.xpAwarded)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div>
                      Cert ID: <code className="font-mono text-slate-700 font-semibold">{cert.certId}</code>
                    </div>
                    <div>
                      Submitted: {new Date(cert.submittedAt).toLocaleDateString()}
                    </div>
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Verify Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {cert.rejectionReason && (
                    <div className="bg-rose-50 text-rose-700 p-2 rounded-lg text-[11px]">
                      <strong>Rejection Note:</strong> {cert.rejectionReason}
                    </div>
                  )}

                  {cert.adminNote && !cert.rejectionReason && (
                    <div className="bg-slate-100 text-slate-600 p-2 rounded-lg text-[11px]">
                      <strong>Reviewer Note:</strong> {cert.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
