import React, { useState } from 'react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';
import logoImg from '../../assets/logo.png';

const About = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    navigate('/signup?role=client');
  };

  const handleJoinMentor = () => {
    navigate('/signup?role=mentor');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  useEffect(() => {
    document.title = "About Us | MindComfort";
}, []);

  return (
    <div className="about-page">
      <nav className="mc-navbar fixed-top">
        <div className="container mc-nav-container">
          <a className="mc-logo d-flex align-items-center gap-2" href="/">
            <img src={logoImg} alt="MindComfort Logo" className="mc-logo-img" />
            <span className="mc-brand-text">MindComfort</span>
          </a>

          <div className="mc-nav-menu-wrapper">
            <ul className="mc-nav-links">
              <li>
                <a href="/">Home</a>
              </li>
            </ul>

            <div className="mc-nav-actions">
              <button className="btn btn-outline-secondary" onClick={handleLogin}>
                Login
              </button>
              <button className="btn btn-mc-primary d-none d-lg-block" onClick={handleGetStarted}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="container text-center">
          <h1 className="about-hero-title">A Safe Space for Healing and Growth</h1>
          <p className="about-hero-subtitle">
            Breaking barriers, building connections, and promoting mental well-being and catharsis
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="section-title mb-4">Our Mission</h2>
              <p className="mission-text">
                MindComfort was created to address a critical gap in Pakistan's mental health landscape. 
                Here, we provide a judgment-free environment 
                where you can express your feelings anonymously.
              </p>
              <p className="mission-text">
                Whether you're a student dealing with academic pressure, a young professional facing 
                workplace stress, or anyone navigating emotional burdens, our platform offers culturally 
                adaptable support that understands your unique context.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="mission-card mc-card p-4">
                <div className="text-center mb-3">
                  <i className="bi bi-heart-pulse-fill" style={{ fontSize: '3rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h4 className="text-center mb-3">Why MindComfort?</h4>
                <ul className="mission-list">
                  <li><i className="bi bi-check-circle-fill me-2"></i>100% Anonymous & Secure</li>
                  <li><i className="bi bi-check-circle-fill me-2"></i>Culturally Relevant Support</li>
                  <li><i className="bi bi-check-circle-fill me-2"></i>Affordable Plans in PKR</li>
                  <li><i className="bi bi-check-circle-fill me-2"></i>Expert-Led Podcasts</li>
                  <li><i className="bi bi-check-circle-fill me-2"></i>Safe Community Environment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Clients Section */}
      <section className="for-clients-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">For Those Seeking Support</h2>
            <div className="section-divider mx-auto"></div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="mc-card text-center p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h4 className="mb-3">Complete Privacy</h4>
                <p className="text-muted">
                  Your identity is protected with dynamic temporary IDs in every chatroom session. 
                  Share your feelings without fear of judgment.
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="mc-card text-center p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-people-fill" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h4 className="mb-3">Community Support</h4>
                <p className="text-muted">
                  Join topic-based chatrooms and connect with peers who understand your struggles. 
                  You're never alone on this journey.
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="mc-card text-center p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-mic-fill" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h4 className="mb-3">Live Podcasts</h4>
                <p className="text-muted">
                  Attend live audio sessions hosted by expert mentors to learn coping strategies, 
                  gain insights, and normalize mental health discussions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Mentors Section */}
      <section className="for-mentors-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">For Mental Health Professionals</h2>
            <div className="section-divider mx-auto"></div>
          </div>
          
          <div className="row align-items-center">
            <div className="col-lg-6 order-lg-2 mb-4 mb-lg-0">
              <div className="mentor-content">
                <h3 className="mb-4">Make a Meaningful Impact</h3>
                <p className="mission-text">
                  MindComfort empowers qualified mentors to make a meaningful impact in their communities. 
                  Our platform provides you with the tools to host live audio podcasts, facilitate community 
                  discussions, and offer guidance in a structured, supportive environment.
                </p>
                <p className="mission-text">
                  By joining MindComfort, you become part of a movement to normalize mental health 
                  conversations and make well-being accessible to all Pakistanis.
                </p>
                
                <div className="mentor-benefits mt-4">
                  <h5 className="mb-3">What You'll Do:</h5>
                  <ul className="mentor-list">
                    <li><i className="bi bi-arrow-right-circle me-2"></i>Host live audio podcasts for mental health awareness</li>
                    <li><i className="bi bi-arrow-right-circle me-2"></i>Participate in community chatrooms</li>
                    <li><i className="bi bi-arrow-right-circle me-2"></i>Provide culturally relevant guidance</li>
                    <li><i className="bi bi-arrow-right-circle me-2"></i>Set your own schedule preferences</li>
                    <li><i className="bi bi-arrow-right-circle me-2"></i>Build your professional profile</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 order-lg-1">
              <div className="mc-card p-4">
                <div className="text-center mb-3">
                  <i className="bi bi-briefcase-fill" style={{ fontSize: '3rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h4 className="text-center mb-4">Mentor Requirements</h4>
                <ul className="requirements-list">
                  <li><strong>Qualification:</strong> Master's in Psychology OR ADCP (Associate Diploma in Clinical Psychology)</li>
                  <li><strong>Verification:</strong> Application review and interview process</li>
                  <li><strong>Commitment:</strong> Dedication to ethical mental health support</li>
                  <li><strong>Cultural Awareness:</strong> Understanding of Pakistani society and values</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="core-values-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">Our Core Values</h2>
            <div className="section-divider mx-auto"></div>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="value-card mc-card text-center p-4 h-100">
                <div className="value-icon mb-3">
                  <i className="bi bi-shield-fill-check" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h5 className="mb-3">Complete Anonymity</h5>
                <p className="text-muted small">
                  Your identity is protected with dynamic temporary IDs in every chatroom session
                </p>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="value-card mc-card text-center p-4 h-100">
                <div className="value-icon mb-3">
                  <i className="bi bi-globe-asia-australia" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h5 className="mb-3">Cultural Adaptability</h5>
                <p className="text-muted small">
                  Mentors who understand your world, your background, and your unique perspective.
                </p>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="value-card mc-card text-center p-4 h-100">
                <div className="value-icon mb-3">
                  <i className="bi bi-wallet2" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h5 className="mb-3">Affordability</h5>
                <p className="text-muted small">
                  Low-cost subscription plans in PKR designed for students and young professionals
                </p>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-3">
              <div className="value-card mc-card text-center p-4 h-100">
                <div className="value-icon mb-3">
                  <i className="bi bi-eye-fill" style={{ fontSize: '2.5rem', color: 'var(--mc-primary)' }}></i>
                </div>
                <h5 className="mb-3">Safety</h5>
                <p className="text-muted small">
                  Moderated conversations ensuring a respectful and supportive community
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section py-5">
        <div className="container">
          <div className="mc-cta-box mx-auto text-center p-5">
            <h2 className="mb-4" style={{ color: 'var(--mc-primary)', fontSize: '2.5rem', fontWeight: '600' }}>
              Ready to Begin Your Journey?
            </h2>
            <p className="mb-4 text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Whether you're seeking support or want to make a difference, MindComfort welcomes you to our community.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button className="btn btn-mc-primary btn-lg" onClick={handleGetStarted}>
                <i className="bi bi-person-plus-fill me-2"></i>Get Started as Client
              </button>
              <button className="btn btn-mc-outline btn-lg" onClick={handleJoinMentor}>
                <i className="bi bi-briefcase-fill me-2"></i>Become a Mentor
              </button>
            </div>
          </div>
        </div>
      </section>
        {/* Footer */}
      <footer className="mc-footer">
        <div className="container">
          <h4 className="fw-bold mb-3" style={{ color: 'var(--mc-primary)' }}>MindComfort</h4>
          <p className="small mb-4">© 2026 MindComfort. A safe space for everyone.</p>
          <div className="d-flex flex-wrap justify-content-center gap-2 small">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;