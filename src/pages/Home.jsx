import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  ShoppingCart, 
  Layers, 
  ShieldCheck, 
  Globe2, 
  FileCheck2, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Settings2,
  Box,
  Truck
} from 'lucide-react';

export const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '5rem 0 4rem',
          borderBottom: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            <div
              className="badge badge-amber animate-glow"
              style={{ marginBottom: '1.25rem', padding: '0.35rem 0.85rem' }}
            >
              <Sparkles size={14} />
              <span>H.A. OVERSEAS — DIRECT EXPORT MANUFACTURING</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                lineHeight: 1.15,
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '1.5rem',
                letterSpacing: '-0.03em',
              }}
            >
              Precision Hand Tools & Grease Guns{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #EF4444 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Custom Order Creator
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '720px',
                margin: '0 auto 2.5rem',
              }}
            >
              Configure bulk manufacturing orders in real-time. Select sizes, electro-plated finishes, custom brand coatings, packaging cartons, and generate instant export proforma quotes.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/order-creator" className="btn btn-primary btn-lg">
                <ShoppingCart size={20} />
                <span>Launch Order Creator</span>
              </Link>
              <Link to="/catalog" className="btn btn-secondary btn-lg">
                <Layers size={20} />
                <span>Explore Catalog</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Customization Pillars */}
      <section style={{ padding: '4rem 0', backgroundColor: '#090D16' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Factory-Grade Customization Controls</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Configure your exact distributor requirements with dynamic attributes
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Card 1 */}
            <div className="glass-card">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Settings2 size={24} color="#F59E0B" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Finishes & Coatings</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Choose between Mirror Chrome Plated, Black Manganese Phosphate, Satin Anti-Slip Matte, Powder Coated, and Yellow/Clear Zinc Plating.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <Zap size={24} color="#38BDF8" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Colorway & Branding</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Standard Industrial Red, Cobalt Blue, Safety Yellow, Tactical Black, or your custom buyer private label laser engraved on tools.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card">
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <FileCheck2 size={24} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Instant Export Proforma & PDF</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Live calculation of estimated gross weights, master carton counts, FOB values, and downloadable purchase orders with shipping marks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Banner */}
      <section style={{ padding: '3.5rem 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.75rem' }}>Premier Manufacturing Categories</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Engineered to exceed DIN, ISO, and ANSI industrial standards
              </p>
            </div>
            <Link to="/catalog" className="btn btn-outline btn-sm">
              <span>View Full Catalog</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[
              {
                title: 'Heavy-Duty Grease Guns',
                tag: '10,000 PSI Peak',
                desc: 'Lever & Pistol Grip guns, flexible hoses & 4-jaw couplers',
                image: 'https://haoverseas.com/img-products/122.jpg',
              },
              {
                title: 'Spanners & Wrenches',
                tag: 'DIN 3113 Standard',
                desc: 'Drop forged Chrome Vanadium (Cr-V) combination spanner sets',
                image: 'https://haoverseas.com/img-products/com-span.jpg',
              },
              {
                title: 'Pipe Tools & Bench Vices',
                tag: 'Ductile Cast Iron',
                desc: 'Stillson wrenches, heavy bench vices with 360° swivel base',
                image: 'https://haoverseas.com/img-products/118.jpg',
              },
              {
                title: 'High Leverage Pliers',
                tag: 'Induction Hardened',
                desc: 'Combination pliers, long nose, water pump & side cutters',
                image: 'https://haoverseas.com/img-products/130.jpg',
              },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '180px', overflow: 'hidden', position: 'relative', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                  <img
                    src={cat.image}
                    alt={cat.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <span
                    className="badge badge-amber"
                    style={{ position: 'absolute', top: '12px', right: '12px' }}
                  >
                    {cat.tag}
                  </span>
                </div>
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{cat.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, marginBottom: '1rem' }}>
                    {cat.desc}
                  </p>
                  <Link to="/order-creator" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    Configure Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div
            className="glass-card highlight"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(25, 34, 51, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
            }}
          >
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: '#FFFFFF' }}>
              Ready to create your custom tool order?
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                maxWidth: '650px',
                margin: '0 auto 2rem',
              }}
            >
              Sign in with your business account to access wholesale factory prices, custom packaging markings, and submit production orders directly to H.A. Overseas.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/order-creator" className="btn btn-primary btn-lg">
                <Wrench size={20} />
                <span>Open Order Creator</span>
              </Link>
              <Link to="/signup" className="btn btn-secondary btn-lg">
                <span>Create Buyer Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
