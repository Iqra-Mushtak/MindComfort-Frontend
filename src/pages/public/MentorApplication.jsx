import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useDialog } from '../../components/ToastModalContext';
import logoImg from '../../assets/logo.png';
import './Auth.css';
import './MentorApplication.css';

const MAX_COVER_LETTER_WORDS = 4000;

const getWordCount = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

const QUALIFICATION_OPTIONS = ['Masters in Psychology', 'ADCP'];

const STEPS = [
  { key: 'profile', title: 'About You', desc: 'Background & expertise' },
  { key: 'documents', title: 'Documents', desc: 'Proof & cover letter' },
  { key: 'preview', title: 'Review & Submit', desc: 'Confirm your details' },
];

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIconFor = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'bi-file-earmark-pdf-fill';
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'bi-file-earmark-image-fill';
  if (['doc', 'docx'].includes(ext)) return 'bi-file-earmark-word-fill';
  return 'bi-file-earmark-fill';
};

const MentorApplication = () => {
  const { toastSuccess, toastError } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const token = location.state?.token;
  const userId = location.state?.userId;
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    qualification: [],
    qualificationOther: '',
    experience: '',
    expertise: '',
    documents: {
      mentorDocument: null,
      coverLetterText: '',
    },
    declaration: false
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Mentor Application | MindComfort";
    const hasStateData = email && token && userId;
    const loggedInUser = storedUser ? (() => {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    })() : null;
    const isLoggedInMentor = storedToken && loggedInUser?.role === 'mentor';

    if (!hasStateData && !isLoggedInMentor) {
      navigate('/signup?role=mentor');
    }
  }, [email, token, userId, storedToken, storedUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const toggleQualification = (value) => {
    setFormData(prev => {
      const has = prev.qualification.includes(value);
      return {
        ...prev,
        qualification: has
          ? prev.qualification.filter(q => q !== value)
          : [...prev.qualification, value]
      };
    });
    setError('');
  };

  const setDocumentFile = (file) => {
    if (!file) return;
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, mentorDocument: file }
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setDocumentFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    setDocumentFile(file);
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, mentorDocument: null }
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocumentTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [name]: value }
    }));
    setError('');
  };

  const coverLetterWordCount = getWordCount(formData.documents.coverLetterText);
  const coverLetterPct = Math.min(100, (coverLetterWordCount / MAX_COVER_LETTER_WORDS) * 100);
  const coverLetterState = coverLetterWordCount > MAX_COVER_LETTER_WORDS
    ? 'danger'
    : coverLetterPct > 85 ? 'warn' : '';

  const validateStep = (targetStep) => {
    if (targetStep === 0) {
      if (!formData.fullName.trim()) {
        return 'Please enter your full name.';
      }
      if (formData.qualification.length === 0 && !formData.qualificationOther.trim()) {
        return 'Please select or specify at least one qualification.';
      }
      if (!formData.experience.trim()) {
        return 'Please describe your relevant experience.';
      }
      if (!formData.expertise.trim()) {
        return 'Please list your areas of expertise.';
      }
    }
    if (targetStep === 1) {
      if (!formData.documents.mentorDocument) {
        return 'Please upload the required document file before proceeding.';
      }
      if (coverLetterWordCount > MAX_COVER_LETTER_WORDS) {
        return `Cover letter should not exceed ${MAX_COVER_LETTER_WORDS} words.`;
      }
      if (!formData.declaration) {
        return 'You must agree to the declaration to proceed.';
      }
    }
    return '';
  };

  const goNext = () => {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      toastError(msg);
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = (targetStep) => {
    setError('');
    setStep(typeof targetStep === 'number' ? targetStep : (s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitForm = async () => {
    setLoading(true);
    setError('');
    try {
      const authToken = token || storedToken;
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const form = new FormData();
      form.append('fullName', formData.fullName);
      form.append('qualification', JSON.stringify(formData.qualification));
      form.append('qualificationOther', formData.qualificationOther);
      form.append('experience', formData.experience);
      form.append('expertise', formData.expertise);
      form.append('declaration', formData.declaration);
      if (formData.documents.mentorDocument) {
        form.append('mentorDocument', formData.documents.mentorDocument);
      }
      form.append('coverLetterText', formData.documents.coverLetterText || '');

      const response = await api.post('/auth/submit-application', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg(response.data.message);
      toastSuccess('Application submitted successfully!');
      setIsSubmitted(true);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Application error:', err.response?.data);
      const errMsg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      setError(errMsg);
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const expertiseList = formData.expertise
    ? formData.expertise.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mapp-wrapper">
      <aside className="mapp-hero">
        <div>
          <div className="mapp-brand" onClick={() => navigate('/')}>
            <img src={logoImg} alt="MindComfort Logo" />
            <span>MindComfort</span>
          </div>
          <div className="mapp-hero-copy">
            <h1>Become a MindComfort mentor.</h1>
            <p>
              Tell us about your background so our team can verify your credentials
              and welcome you into a safe, professional support community.
            </p>
          </div>

          {!isSubmitted && (
            <ul className="mapp-steps">
              {STEPS.map((s, idx) => (
                <li key={s.key} className={`mapp-step ${idx === step ? 'active' : ''} ${idx < step ? 'done' : ''}`}>
                  <div className="mapp-step-badge">
                    {idx < step ? <i className="bi bi-check-lg"></i> : idx + 1}
                  </div>
                  <div className="mapp-step-text">
                    <div className="mapp-step-title">{s.title}</div>
                    <div className="mapp-step-desc">{s.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mapp-hero-footer">
          &copy; 2026 MindComfort. All rights reserved.
        </div>
      </aside>

      <main className="mapp-form-panel">
        <div className="mapp-form-container">
          <div className="mapp-topbar">
            <button onClick={() => navigate('/')} className="btn-back-home">
              Back to Home
            </button>
          </div>

          {!isSubmitted && (
            <div className="mapp-mobile-steps">
              {STEPS.map((s, idx) => (
                <div key={s.key} className={`dot ${idx === step ? 'active' : ''} ${idx < step ? 'done' : ''}`}></div>
              ))}
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '12px' }}>
              <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
          )}

          <div className="mapp-card">
            {isSubmitted ? (
              <div className="mapp-success">
                <div className="mapp-success-icon">
                  <i className="bi bi-check-lg"></i>
                </div>
                <h4>Application Submitted Successfully</h4>
                <p>
                  {successMsg || 'Your application has been received and is now pending admin review. You will receive an email once it\'s processed.'}
                </p>
                <button className="btn btn-mc-primary" onClick={() => navigate('/login')}>
                  Go to Login
                </button>
              </div>
            ) : step === 0 ? (
              <>
                <div className="mapp-card-head">
                  <span className="mapp-card-eyebrow">Step 1 of 3</span>
                  <h2>Tell us about yourself</h2>
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control mc-input"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label">Qualification</label>
                  <div className="mapp-chip-grid">
                    {QUALIFICATION_OPTIONS.map(opt => {
                      const selected = formData.qualification.includes(opt);
                      return (
                        <div
                          key={opt}
                          className={`mapp-chip ${selected ? 'selected' : ''}`}
                          onClick={() => toggleQualification(opt)}
                          role="checkbox"
                          aria-checked={selected}
                        >
                          <span className="mapp-chip-check"><i className="bi bi-check-lg"></i></span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    className="form-control mc-input mt-2"
                    name="qualificationOther"
                    value={formData.qualificationOther}
                    onChange={handleChange}
                    placeholder="Other qualification (optional)"
                  />
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label">Experience</label>
                  <textarea
                    className="form-control mc-input"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your relevant experience in mental health support"
                  />
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label">Areas of Expertise</label>
                  <input
                    type="text"
                    className="form-control mc-input"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="e.g., Anxiety, Depression, Trauma, Relationships"
                  />
                  <div className="mapp-hint">Separate multiple areas with commas.</div>
                  {expertiseList.length > 0 && (
                    <div className="mapp-preview-tags mt-2">
                      {expertiseList.map((tag, idx) => (
                        <span className="mapp-tag" key={`${tag}-${idx}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mapp-nav-row">
                  <button className="btn btn-mc-primary w-100" onClick={goNext}>
                    Continue
                  </button>
                </div>
              </>
            ) : step === 1 ? (
              <>
                <div className="mapp-card-head">
                  <span className="mapp-card-eyebrow">Step 2 of 3</span>
                  <h2>Documents & cover letter</h2>
                  <p>Upload your verification documents and share why you'd like to mentor.</p>
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label"><i className="bi bi-paperclip"></i> Required Documents</label>
                  <div className="mapp-hint mb-2" style={{ marginTop: '-4px' }}>
                    CNIC, attested education, experience, and photo - combined into a single PDF preferred.
                  </div>

                  {formData.documents.mentorDocument ? (
                    <div className="mapp-file-chip">
                      <div className="file-ic">
                        <i className={`bi ${fileIconFor(formData.documents.mentorDocument.name)}`}></i>
                      </div>
                      <div className="file-meta">
                        <div className="file-name">{formData.documents.mentorDocument.name}</div>
                        <div className="file-size">{formatFileSize(formData.documents.mentorDocument.size)}</div>
                      </div>
                      <button type="button" className="file-remove" onClick={removeFile} title="Remove file">
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`mapp-dropzone ${dragOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        name="mentorDocument"
                        onChange={handleFileChange}
                      />
                      <div className="mapp-dropzone-icon">
                        <i className="bi bi-cloud-arrow-up-fill"></i>
                      </div>
                      <div className="mapp-dropzone-title">Click to upload or drag & drop</div>
                      <div className="mapp-dropzone-sub">PDF, PNG, JPG, DOC or DOCX</div>
                    </div>
                  )}
                </div>

                <div className="mapp-field-group">
                  <label className="mapp-label">Cover Letter <span className="mapp-hint" style={{ marginTop: 0 }}>&nbsp;(optional)</span></label>
                  <textarea
                    className="form-control mc-input"
                    name="coverLetterText"
                    value={formData.documents.coverLetterText}
                    onChange={handleDocumentTextChange}
                    rows="7"
                    placeholder="Write your cover letter here — tell us why you'd like to mentor on MindComfort."
                  />
                  <div className="mapp-counter-row">
                    <div className="mapp-counter-bar">
                      <div className={`mapp-counter-fill ${coverLetterState}`} style={{ width: `${coverLetterPct}%` }}></div>
                    </div>
                    <div className="mapp-counter-text">{coverLetterWordCount.toLocaleString()} / {MAX_COVER_LETTER_WORDS.toLocaleString()} words</div>
                  </div>
                </div>

                <div className="mapp-field-group mb-0">
                  <div className="mapp-declaration">
                    <input
                      type="checkbox"
                      name="declaration"
                      id="declaration"
                      checked={formData.declaration}
                      onChange={handleChange}
                    />
                    <label htmlFor="declaration">
                      I declare that all information provided is accurate.
                    </label>
                  </div>
                </div>

                <div className="mapp-nav-row">
                  <button className="mapp-btn-outline" onClick={() => goBack(0)}>
                    Back
                  </button>
                  <button className="btn btn-mc-primary flex-fill" onClick={goNext}>
                    Review Application
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mapp-card-head">
                  <span className="mapp-card-eyebrow">Step 3 of 3</span>
                  <h2>Review your application</h2>
                  <p>Take a moment to confirm everything looks right before submitting.</p>
                </div>

                <div className="mapp-preview-section">
                  <div className="mapp-preview-head">
                    <div className="head-left">
                      <div className="head-icon"><i className="bi bi-person-fill"></i></div>
                      <h5>Personal Information</h5>
                    </div>
                    <button className="mapp-edit-btn" onClick={() => goBack(0)}>
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                  </div>
                  <div className="mapp-preview-row">
                    <span className="k">Full Name</span>
                    <span>{formData.fullName || <span className="mapp-preview-empty">Not provided</span>}</span>
                  </div>
                </div>

                <div className="mapp-preview-section">
                  <div className="mapp-preview-head">
                    <div className="head-left">
                      <div className="head-icon"><i className="bi bi-mortarboard-fill"></i></div>
                      <h5>Professional Background</h5>
                    </div>
                    <button className="mapp-edit-btn" onClick={() => goBack(0)}>
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                  </div>
                  <div className="mapp-preview-row">
                    <span className="k">Qualification</span>
                    {[...formData.qualification, formData.qualificationOther].filter(Boolean).length > 0 ? (
                      <div className="mapp-preview-tags">
                        {[...formData.qualification, formData.qualificationOther].filter(Boolean).map((q, idx) => (
                          <span className="mapp-tag" key={`${q}-${idx}`}>{q}</span>
                        ))}
                      </div>
                    ) : <span className="mapp-preview-empty">Not provided</span>}
                  </div>
                  <div className="mapp-preview-row">
                    <span className="k">Experience</span>
                    <span>{formData.experience || <span className="mapp-preview-empty">Not provided</span>}</span>
                  </div>
                  <div className="mapp-preview-row">
                    <span className="k">Expertise</span>
                    {expertiseList.length > 0 ? (
                      <div className="mapp-preview-tags">
                        {expertiseList.map((tag, idx) => (
                          <span className="mapp-tag" key={`${tag}-${idx}`}>{tag}</span>
                        ))}
                      </div>
                    ) : <span className="mapp-preview-empty">Not provided</span>}
                  </div>
                </div>

                <div className="mapp-preview-section">
                  <div className="mapp-preview-head">
                    <div className="head-left">
                      <div className="head-icon"><i className="bi bi-file-earmark-text-fill"></i></div>
                      <h5>Documents & Cover Letter</h5>
                    </div>
                    <button className="mapp-edit-btn" onClick={() => goBack(1)}>
                      <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                  </div>
                  {formData.documents.mentorDocument ? (
                    <div className="mapp-file-chip" style={{ marginBottom: formData.documents.coverLetterText ? '14px' : 0 }}>
                      <div className="file-ic">
                        <i className={`bi ${fileIconFor(formData.documents.mentorDocument.name)}`}></i>
                      </div>
                      <div className="file-meta">
                        <div className="file-name">{formData.documents.mentorDocument.name}</div>
                        <div className="file-size">{formatFileSize(formData.documents.mentorDocument.size)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mapp-preview-row"><span className="mapp-preview-empty">No document uploaded</span></div>
                  )}
                  {formData.documents.coverLetterText && (
                    <div className="mapp-cover-preview">{formData.documents.coverLetterText}</div>
                  )}
                </div>

                <div className="mapp-nav-row">
                  <button className="mapp-btn-outline" onClick={() => goBack(1)} disabled={loading}>
                    Back
                  </button>
                  <button className="btn btn-mc-primary flex-fill" onClick={submitForm} disabled={loading}>
                    {loading ? 'Submitting...' : <>Confirm & Submit</>}
                  </button>
                </div>
              </>
            )}
          </div>

          {!isSubmitted && (
            <p className="small text-muted text-center mt-3 mb-0">
              Your application will be reviewed by our admin team. You will receive an email once it's processed.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default MentorApplication;