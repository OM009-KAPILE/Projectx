import React, { useState } from 'react';
import {
  LifeBuoy,
  Flag,
  AlertTriangle,
  Send,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  ShieldAlert,
  User,
  FolderKanban,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  defaultTargetId?: string;
  defaultSubject?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'TECHNICAL_ISSUE',
  defaultTargetId = '',
  defaultSubject = '',
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState(defaultCategory);
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [subject, setSubject] = useState(defaultSubject);
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { key: 'TECHNICAL_ISSUE', label: 'Technical issue', icon: LifeBuoy, desc: 'Bugs, sync errors, or platform glitches' },
    { key: 'USER_REPORT', label: 'User', icon: User, desc: 'Harassment, impersonation, or fake profiles' },
    { key: 'PROJECT_REPORT', label: 'Project', icon: FolderKanban, desc: 'IP theft, plagiarism, or policy violations' },
    { key: 'PRIVACY_CONCERN', label: 'Privacy concern', icon: ShieldAlert, desc: 'Unauthorized data exposure or FERPA concerns' },
    { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content', icon: AlertTriangle, desc: 'Explicit, abusive, or harmful material' },
    { key: 'OTHER', label: 'Other', icon: HelpCircle, desc: 'General inquiries or account questions' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMessage('Please enter both a subject and detailed description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/support/tickets', {
        category,
        targetId: targetId.trim() || undefined,
        subject: subject.trim(),
        description: description.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
        email: email.trim() || undefined,
      });

      if (res.data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-100">Ticket Submitted Successfully</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Our safety and support staff have been notified. We will review your report within 24 hours.
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
                <Flag className="w-3.5 h-3.5" />
                Support & Safety Dispatch
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
                Submit Support Ticket or Report
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Report technical issues, policy violations, or safety concerns directly to platform administrators.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Report Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-400 shadow-glow ring-1 ring-brand-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1.5" />
                        <div className="text-xs font-bold text-slate-200 leading-tight">{cat.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Build failure in workspace, Impersonation report..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description & Details</label>
                <textarea
                  rows={4}
                  placeholder="Please describe what happened, steps to reproduce, or context of the report..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Optional Screenshot / Attachment URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  Optional Screenshot or File URL
                </label>
                <input
                  type="url"
                  placeholder="https://imgur.com/... or link to screenshot/log"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !description.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 shadow-glow transition-all"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
