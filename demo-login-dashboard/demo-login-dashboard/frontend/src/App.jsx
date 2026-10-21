import { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Demo@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || 'Unable to sign in. Check your credentials.');
        return;
      }
      onLogin(result.user);
    } catch {
      setError('Cannot connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="decor decor-one" /><div className="decor decor-two" />
      <section className="login-card">
        <div className="logo">D<span>.</span></div>
        <div className="overline">YOUR WORKSPACE, SIMPLIFIED</div>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue to your workspace.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="username" required />
          <div className="password-label"><label htmlFor="password">Password</label></div>
          <div className="password-wrap">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="button" className="show-password" onClick={() => setShowPassword(v => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="sign-in" disabled={loading}>{loading ? <><span className="spinner" /> Signing in...</> : 'Sign in'} <span>→</span></button>
        </form>
        <div className="demo-box"><div className="demo-icon">i</div><div><strong>Demo access</strong><p>Email: demo@example.com</p><p>Password: Demo@123</p></div></div>
        <div className="login-footer">DEMO SPACE <span>•</span> FOR LEARNING ONLY</div>
      </section>
    </main>
  );
}

const navItems = [
  { label: 'Overview', icon: '◫' }, { label: 'Projects', icon: '▦' },
  { label: 'Tasks', icon: '✓' }, { label: 'Team', icon: '♧' },
  { label: 'Settings', icon: '⚙' }
];

function Dashboard({ user, onLogout }) {
  const [active, setActive] = useState('Overview');
  const cards = [
    { title: 'Total projects', value: '12', note: '↑ 2 added this month', icon: '▦', color: 'violet' },
    { title: 'Tasks completed', value: '84', note: '↑ 12% this week', icon: '✓', color: 'green' },
    { title: 'Team members', value: '08', note: 'All members active', icon: '♧', color: 'orange' }
  ];
  const activity = [
    { initials: 'WD', color: 'purple', title: 'Website redesign', desc: 'Design review completed', time: '10:42 AM', status: 'Completed' },
    { initials: 'MA', color: 'blue', title: 'Mobile application', desc: 'Project status updated', time: 'Yesterday', status: 'In progress' },
    { initials: 'TW', color: 'peach', title: 'Team workspace', desc: 'A new member was added', time: 'Yesterday', status: 'Updated' }
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand"><span className="brand-symbol">D<span>.</span></span><span>DemoSpace</span></div>
        <div className="nav-heading">WORKSPACE</div>
        <nav>{navItems.map(item => <button key={item.label} onClick={() => setActive(item.label)}
          className={`nav-link ${active === item.label ? 'active' : ''}`}><span className="nav-icon">{item.icon}</span>{item.label}
          {item.label === 'Tasks' && <span className="nav-count">4</span>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-info"><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="logout-button" onClick={onLogout} title="Log out" aria-label="Log out">↪</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<i /></button><div className="top-divider" /><div className="top-user"><div className="user-avatar small">{user.name.charAt(0)}</div><span>{user.name}</span><span className="chevron">⌄</span></div></div>
        </header>
        <div className="page-content">
          <section className="welcome-banner"><div><div className="overline">YOUR WORKSPACE AT A GLANCE</div><h1>{active === 'Overview' ? `Good morning, ${user.name.split(' ')[0]}!` : active}</h1><p>{active === 'Overview' ? "Here's what's happening with your projects today." : `Welcome to your ${active.toLowerCase()} section. Explore your workspace below.`}</p></div><div className="welcome-art"><span className="art-circle circle-a" /><span className="art-circle circle-b" /><span className="art-spark">✦</span><span className="art-card">✓ &nbsp; You're on track</span></div></section>
          <div className="section-title"><div><h2>Overview</h2><p>Your workspace performance</p></div><button className="date-pill">◷ &nbsp; This week &nbsp;⌄</button></div>
          <section className="stats-grid">{cards.map(card => <article className="stat-card" key={card.title}><div className="stat-card-top"><span>{card.title}</span><span className={`stat-icon ${card.color}`}>{card.icon}</span></div><div className="stat-value">{card.value}</div><div className="stat-note">{card.note}</div><div className={`mini-chart ${card.color}`}><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></article>)}</section>
          <div className="content-grid">
            <section className="panel activity-panel"><div className="panel-header"><div><h2>Recent activity</h2><p>Keep up with your team's latest updates</p></div><button className="view-all" onClick={() => setActive('Tasks')}>View all <span>→</span></button></div>
              <div className="activity-table"><div className="table-head"><span>ACTIVITY</span><span>STATUS</span><span>TIME</span></div>{activity.map(item => <div className="activity-row" key={item.title}><div className="activity-person"><span className={`activity-avatar ${item.color}`}>{item.initials}</span><span><strong>{item.title}</strong><small>{item.desc}</small></span></div><span className={`status ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span><time>{item.time}</time></div>)}</div>
            </section>
            <section className="panel progress-panel"><div className="panel-header"><div><h2>Weekly progress</h2><p>Your goals this week</p></div><span className="target-icon">◎</span></div><div className="progress-ring"><div className="ring-inner"><strong>78<span>%</span></strong><small>COMPLETED</small></div></div><div className="progress-legend"><span><i className="legend-done" />Completed <strong>14</strong></span><span><i className="legend-left" />Remaining <strong>4</strong></span></div><div className="tip-box"><span>✦</span><p><strong>You're doing great!</strong><br />Just a few more tasks to reach your weekly goal.</p></div></section>
          </div>
          <footer>© 2026 DemoSpace <span>Made for learning and experimentation</span></footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
}
