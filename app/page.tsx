import Script from 'next/script';
import Head from 'next/head';
import AuthUI from '@/components/AuthUI';

export default function Home() {
  return (
    <>
      <Head>
        <title>PriceWise - Smart Price Tracking</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="container">
        <nav className="navbar">
          <div className="nav-content">
            <a href="/" className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#FF7559" fillOpacity="0.1"/>
                <path d="M8 12L10.5 14.5L16 9" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="logo-text">Price<span>Wise</span></span>
            </a>
            
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#faq" className="nav-link">FAQ</a>
            </div>
            
            <AuthUI />
          </div>
        </nav>

        <main className="main-content">
          <div className="hero-content">
            <p className="hero-description">
              Track product prices across all major online retailers. Get notified when prices drop
              and save money on your favorite products with our powerful price tracking tool.
            </p>

            <a href="/products" className="btn btn-get-started">Get Started</a>
          </div>

          <section className="features-section" id="features">
            <h2 className="features-title">Why Choose <span>PriceWise</span></h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V18M12 6L7 11M12 6L17 11" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Real-time Price Alerts</h3>
                <p className="feature-description">
                  Get instant notifications when prices drop on the products you're tracking, so you never miss a deal.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H16M8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12M8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Price History Charts</h3>
                <p className="feature-description">
                  View detailed price history charts to identify patterns and determine the best time to buy.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8V16M12 11V16M8 14V16M4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20Z" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Product Comparison</h3>
                <p className="feature-description">
                  Compare prices and features across multiple products to make informed purchase decisions.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" strategy="beforeInteractive" />
      <Script id="gsap-animations">
        {`
          document.addEventListener('DOMContentLoaded', () => {
            // Navbar scroll effect
            window.addEventListener('scroll', () => {
              const navbar = document.querySelector('.navbar');
              if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
              } else {
                navbar.classList.remove('scrolled');
              }
            });
          });
        `}
      </Script>
    </>
  );
}