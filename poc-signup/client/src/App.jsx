import { useState } from 'react';

const DEFAULT_FLOW_ID = import.meta.env.VITE_USER_FLOW_ID ?? '';

const styles = {
  page: { maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' },
  h1: { fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' },
  section: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  h2: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' },
  btn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '0.5rem 1.25rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '0.4rem 0.6rem',
    marginBottom: '0.6rem',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: '0.9rem',
  },
  label: { fontSize: '0.85rem', color: '#374151', marginBottom: 2, display: 'block' },
  pre: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '0.75rem',
    marginTop: '0.75rem',
    fontSize: '0.8rem',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  error: { color: '#dc2626', marginTop: '0.5rem', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem', fontSize: '0.9rem' },
  th: { textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '0.4rem 0.5rem', background: '#f3f4f6' },
  td: { padding: '0.4rem 0.5rem', borderBottom: '1px solid #f0f0f0' },
};

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </div>
  );
}

function ErrorMsg({ msg }) {
  return msg ? <p style={styles.error}>{msg}</p> : null;
}

function TokenPanel() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/token');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Access Token">
      <button style={styles.btn} onClick={fetch_} disabled={loading}>
        {loading ? 'Fetching…' : 'Get Token'}
      </button>
      <ErrorMsg msg={error} />
      {token && <pre style={styles.pre}>{token}</pre>}
    </Section>
  );
}

function ListIdpsPanel() {
  const [idps, setIdps] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/idps');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdps(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Identity Providers">
      <button style={styles.btn} onClick={fetch_} disabled={loading}>
        {loading ? 'Loading…' : 'List IDPs'}
      </button>
      <ErrorMsg msg={error} />
      {idps && (
        idps.length === 0 ? (
          <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>No identity providers found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Display Name</th>
                <th style={styles.th}>ID</th>
              </tr>
            </thead>
            <tbody>
              {idps.map((idp) => (
                <tr key={idp.id}>
                  <td style={styles.td}>{idp.displayName}</td>
                  <td style={styles.td}>{idp.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </Section>
  );
}

function CreateIdpPanel() {
  const [form, setForm] = useState({
    displayName: '',
    issuer: '',
    wellKnownEndpoint: '',
    clientId: '',
    clientSecret: '',
    scope: 'openid profile email',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/idps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    ['displayName', 'Display Name'],
    ['issuer', 'Issuer URL'],
    ['wellKnownEndpoint', 'Well-Known Endpoint'],
    ['clientId', 'Client ID'],
    ['clientSecret', 'Client Secret'],
    ['scope', 'Scope'],
  ];

  return (
    <Section title="Create OIDC Identity Provider">
      <form onSubmit={submit}>
        {fields.map(([key, label]) => (
          <div key={key}>
            <label style={styles.label}>{label}</label>
            <input
              style={styles.input}
              type={key === 'clientSecret' ? 'password' : 'text'}
              value={form[key]}
              onChange={set(key)}
              required
            />
          </div>
        ))}
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create IDP'}
        </button>
      </form>
      <ErrorMsg msg={error} />
      {result && <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>}
    </Section>
  );
}

function AttachIdpPanel() {
  const [flowId, setFlowId] = useState(DEFAULT_FLOW_ID);
  const [idpId, setIdpId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(
        `/api/userflows/${encodeURIComponent(flowId)}/idps/${encodeURIComponent(idpId)}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Attach IDP to User Flow">
      <form onSubmit={submit}>
        <label style={styles.label}>User Flow ID</label>
        <input
          style={styles.input}
          type="text"
          value={flowId}
          onChange={(e) => setFlowId(e.target.value)}
          required
        />
        <label style={styles.label}>Identity Provider ID</label>
        <input
          style={styles.input}
          type="text"
          value={idpId}
          onChange={(e) => setIdpId(e.target.value)}
          required
        />
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Attaching…' : 'Attach IDP'}
        </button>
      </form>
      <ErrorMsg msg={error} />
      {result && <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>}
    </Section>
  );
}

export default function App() {
  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Graph API Manager</h1>
      <TokenPanel />
      <ListIdpsPanel />
      <CreateIdpPanel />
      <AttachIdpPanel />
    </div>
  );
}
