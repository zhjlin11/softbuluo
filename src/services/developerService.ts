const API_BASE = '/api/v1';

export async function getDeveloperProfile() {
  const res = await fetch(`${API_BASE}/developer/profile`);
  return res.json();
}

export async function registerDeveloper(data: {
  displayName: string;
  organizationName?: string;
  website?: string;
  githubUsername?: string;
  bio?: string;
}) {
  const res = await fetch(`${API_BASE}/developer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getDeveloperSubmissions() {
  const res = await fetch(`${API_BASE}/developer/submissions`);
  return res.json();
}

export async function submitDeveloperSoftware(data: any) {
  const res = await fetch(`${API_BASE}/developer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getDeveloperClaims() {
  const res = await fetch(`${API_BASE}/developer/claims`);
  return res.json();
}

export async function createDeveloperClaim(softwareId: string, claimMethod?: string) {
  const res = await fetch(`${API_BASE}/developer/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ softwareId, claimMethod }),
  });
  return res.json();
}

export async function verifyDeveloperClaim(id: string, evidenceUrl?: string) {
  const res = await fetch(`${API_BASE}/developer/claims/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidenceUrl }),
  });
  return res.json();
}

export async function getDeveloperApiKeys() {
  const res = await fetch(`${API_BASE}/developer/api-keys`);
  return res.json();
}

export async function createDeveloperApiKey(name: string) {
  const res = await fetch(`${API_BASE}/developer/api-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function revokeDeveloperApiKey(id: string) {
  const res = await fetch(`${API_BASE}/developer/api-keys/${id}/revoke`, {
    method: 'POST',
  });
  return res.json();
}

export async function getPublicDeveloperProfile(slug: string) {
  const res = await fetch(`/api/public/v1/developers/${slug}`);
  return res.json();
}
