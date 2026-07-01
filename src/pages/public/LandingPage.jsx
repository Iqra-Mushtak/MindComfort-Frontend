import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logoImg from '../../assets/logo.png'; 

const LandingPage = () => {
  const navigate = useNavigate();

  const handleJoinClient = () => {
    navigate('/auth?role=client');
  };

  const handleJoinMentor = () => {
    navigate('/auth?role=mentor');
  };

  return (
    <div>
      {/* --- Navbar --- */}
      <nav className="navbar navbar-expand-lg fixed-top mc-navbar">
        <div className="container">
            <a className="navbar-brand d-flex align-items-center gap-2 mc-logo" href="/">
            <img src={logoImg} alt="MindComfort Logo" className="mc-logo-img" />
            MindComfort
            </a>

            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>
            
          <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
            <ul className="navbar-nav gap-4">
              <li className="nav-item">
                <a className="nav-link" href="/about">About</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#how-it-works">How it Works</a>
              </li>
            </ul>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-none d-lg-block" onClick={() => navigate('/auth?mode=login')}>
            Login
          </button>
          <button className="btn btn-mc-primary d-none d-lg-block" onClick={handleJoinClient}>
            Get Started
          </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="about" className="mc-hero">
        <div className="container">
          <h1 className="mc-hero-title">We listen, you heal.</h1>
          <p className="mc-hero-subtitle">
            A safe, anonymous, and affordable space to find catharsis through mentor-guided support. 
            Designed for those who need a catharsis for their thoughts.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <button className="btn btn-mc-primary btn-lg" onClick={handleJoinClient}>
              Join the Community
            </button>
            <button className="btn btn-mc-outline btn-lg" onClick={handleJoinMentor}>
              Join as Mentor
            </button>
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="mc-how-it-works">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-semibold" style={{ color: 'var(--mc-primary)' }}>How It Works</h2>
            <div className="mx-auto mt-2" style={{ width: '60px', height: '4px', backgroundColor: 'var(--mc-secondary)', borderRadius: '2px' }}></div>
          </div>

          <div className="row text-center g-4">
            <div className="col-md-4">
              <div className="mc-step-circle">1</div>
              <h4 className="fw-semibold mb-3">Create Profile</h4>
              <p className="text-muted px-3">Create your private space. Get your anonymous identity and set your boundaries.</p>
            </div>
            <div className="col-md-4">
              <div className="mc-step-circle">2</div>
              <h4 className="fw-semibold mb-3">Connect in Rooms</h4>
              <p className="text-muted px-3">Release the weight, reflect on your journey, and heal in a judgement-free zone.</p>
            </div>
            <div className="col-md-4">
              <div className="mc-step-circle">3</div>
              <h4 className="fw-semibold mb-3">Join Live Podcasts</h4>
              <p className="text-muted px-3">Tune into live audio podcasts hosted by expert mentors for guided healing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-5">
        <div className="container py-5">
          <div className="mc-cta-box mx-auto" style={{ maxWidth: '800px' }}>
            <h2 className="fw-semibold mb-3" style={{ color: 'var(--mc-primary)', fontSize: '2.5rem' }}>Ready to feel lighter?</h2>
            <p className="mb-4 text-muted" style={{ fontSize: '1.1rem' }}>
              Your journey to stillness and mental clarity begins with a single, anonymous step.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button className="btn btn-mc-primary btn-lg" onClick={handleJoinClient}>
                Start Your Journey Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
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

export default LandingPage;