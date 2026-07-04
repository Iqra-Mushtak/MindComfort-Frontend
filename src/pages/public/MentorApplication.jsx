import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

const MAX_COVER_LETTER_WORDS = 4000;

const getWordCount = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

const MentorApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;
  const token = location.state?.token;
  const userId = location.state?.userId;

  const [formData, setFormData] = useState({
    fullName: '',
    qualification: [],
    qualificationOther: '',
    experience: '',
    expertise: '',
    documents: {
      cnicDocument: null,
      educationDocument: null,
      coverLetterText: '',
    },
    declaration: false
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!email || !token || !userId) {
      navigate('/signup?role=mentor');
    }
  }, [email, token, userId, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [name]: files[0] }
    }));
    setError('');
  };

  const handleDocumentTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [name]: value }
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.declaration) {
      setError('You must agree to the declaration to proceed.');
      return;
    }

    const coverLetterWordCount = getWordCount(formData.documents.coverLetterText);
    if (coverLetterWordCount > MAX_COVER_LETTER_WORDS) {
      setError(`Cover letter should not exceed ${MAX_COVER_LETTER_WORDS} words.`);
      return;
    }

    setShowPreview(true);
  };

  const submitForm = async () => {
    setShowPreview(false);
    setLoading(true);
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const form = new FormData();
      form.append('email', email);
      form.append('mentorId', userId);
      form.append('fullName', formData.fullName);
      form.append('qualification', JSON.stringify(formData.qualification));
      form.append('qualificationOther', formData.qualificationOther);
      form.append('experience', formData.experience);
      form.append('expertise', formData.expertise);
      form.append('declaration', formData.declaration);
      if (formData.documents.cnicDocument) form.append('cnicDocument', formData.documents.cnicDocument);
      if (formData.documents.educationDocument) form.append('educationDocument', formData.documents.educationDocument);
      form.append('coverLetterText', formData.documents.coverLetterText || '');

      const response = await api.post('/auth/submit-application', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg(response.data.message);
      setShowPreview(false);
      setIsSubmitted(true);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Application error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderedContent = isSubmitted ? (
    <div className="text-center py-4">
      <div className="mb-3 text-success">
        <i className="bi bi-check-circle-fill fs-1"></i>
      </div>
      <h4 className="fw-bold mb-2" style={{ color: 'var(--mc-primary)' }}>
        Application Submitted Successfully
      </h4>
      <p className="text-muted mb-4">
        {successMsg || 'Your application has been received and is now pending admin review.'}
      </p>
      <button className="btn btn-mc-primary" onClick={() => navigate('/login')}>
        Go to Login
      </button>
    </div>
  ) : showPreview ? (
    <div>
      <h4 className="mb-3">Preview Application</h4>
      <div className="border rounded-4 p-3 mb-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Full Name</strong>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPreview(false)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </button>
        </div>
        <div>{formData.fullName || 'Not provided'}</div>
      </div>
      <div className="border rounded-4 p-3 mb-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Qualifications</strong>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPreview(false)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </button>
        </div>
        <div>{[formData.qualification.join(', '), formData.qualificationOther].filter(Boolean).join(', ') || 'Not provided'}</div>
      </div>
      <div className="border rounded-4 p-3 mb-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Experience</strong>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPreview(false)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </button>
        </div>
        <div>{formData.experience || 'Not provided'}</div>
      </div>
      <div className="border rounded-4 p-3 mb-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Expertise</strong>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPreview(false)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </button>
        </div>
        <div>{formData.expertise || 'Not provided'}</div>
      </div>
      <div className="border rounded-4 p-3 mb-3 bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Documents & Cover Letter</strong>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPreview(false)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </button>
        </div>
        <ul className="mb-0 ps-3">
          <li>CNIC: {formData.documents.cnicDocument?.name || 'Not provided'}</li>
          <li>Education: {formData.documents.educationDocument?.name || 'Not provided'}</li>
          <li>Cover Letter: {formData.documents.coverLetterText ? `${formData.documents.coverLetterText.slice(0, 120)}${formData.documents.coverLetterText.length > 120 ? '...' : ''}` : 'Not provided'}</li>
        </ul>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-outline-secondary" onClick={() => setShowPreview(false)}>
          Back to Edit
        </button>
        <button className="btn btn-mc-primary" onClick={submitForm} disabled={loading}>
          {loading ? 'Submitting...' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  ) : (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Full Name</label>
        <input
          type="text"
          className="form-control mc-input"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Enter your full name"
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Qualification</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            value="Masters in Psychology"
            id="q1"
            checked={formData.qualification.includes('Masters in Psychology')}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData((prev) => ({
                ...prev,
                qualification: checked
                  ? [...prev.qualification, e.target.value]
                  : prev.qualification.filter((q) => q !== e.target.value),
              }));
            }}
          />
          <label className="form-check-label small" htmlFor="q1">
            Masters in Psychology
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            value="ADCP"
            id="q2"
            checked={formData.qualification.includes('ADCP')}
            onChange={(e) => {
              const checked = e.target.checked;
              setFormData((prev) => ({
                ...prev,
                qualification: checked
                  ? [...prev.qualification, e.target.value]
                  : prev.qualification.filter((q) => q !== e.target.value),
              }));
            }}
          />
          <label className="form-check-label small" htmlFor="q2">
            ADCP
          </label>
        </div>
        <label className="form-label small mt-2">Other qualifications</label>
        <input
          type="text"
          className="form-control mc-input"
          name="qualificationOther"
          value={formData.qualificationOther}
          onChange={handleChange}
          placeholder="Enter another qualification"
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Experience</label>
        <textarea
          className="form-control mc-input"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
          rows="3"
          placeholder="Describe your relevant experience in mental health support"
        />
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Areas of Expertise</label>
        <input
          type="text"
          className="form-control mc-input"
          name="expertise"
          value={formData.expertise}
          onChange={handleChange}
          required
          placeholder="e.g., Anxiety, Depression, Trauma, Relationships"
        />
        <div className="form-text small text-muted">Separate multiple areas with commas</div>
      </div>

      <div className="mb-3">
        <label className="form-label small fw-semibold">Documents (CNIC and Attested Education - PDF preferred)</label>
        <div className="mb-2">
          <label className="form-label small">CNIC Document (required)</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" name="cnicDocument" onChange={handleFileChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label small">Education Document (required)</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" name="educationDocument" onChange={handleFileChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label small">Cover Letter (optional)</label>
          <textarea
            className="form-control mc-input"
            name="coverLetterText"
            value={formData.documents.coverLetterText}
            onChange={handleDocumentTextChange}
            rows="8"
            placeholder="Write your cover letter here. Maximum 4000 words."
          />
          <div className="form-text small text-muted">
            Maximum {MAX_COVER_LETTER_WORDS} words.
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            name="declaration"
            id="declaration"
            checked={formData.declaration}
            onChange={handleChange}
            required
          />
          <label className="form-check-label small" htmlFor="declaration">
            I declare that all information provided is accurate and I agree to the MindComfort mentor code of conduct and ethical guidelines.
          </label>
        </div>
      </div>

      <button type="submit" className="btn btn-mc-primary w-100 mb-3" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="mc-card p-4 p-md-5 auth-card" style={{ maxWidth: '700px' }}>
              <div className="text-start mb-3">
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-link text-decoration-none p-0"
                  style={{ color: 'var(--mc-primary)' }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back to Home
                </button>
              </div>

              <h2 className="fw-bold mb-2 text-center" style={{ color: 'var(--mc-primary)' }}>
                Mentor Application
              </h2>

              {error && (
                <div className="alert alert-danger py-2 small mb-3" style={{ borderRadius: '12px' }}>
                  {error}
                </div>
              )}

              {renderedContent}

              <p className="small text-muted text-center mb-0">
                Your application will be reviewed by our admin team. You will receive an email once it's processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorApplication;