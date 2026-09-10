/**
 * API Service for SIH 2026 Agricultural Marketplace.
 * Communicates with FastAPI backend on http://127.0.0.1:8000
 */

const API_BASE = 'http://127.0.0.1:8000';

export async function loginApi(phoneNumber, password) {
  // Use standard application/x-www-form-urlencoded for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', phoneNumber);
  formData.append('password', password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail || `Login error (${response.status})`);
  }

  return response.json();
}

export async function registerApi(payload) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(errorData.detail || `Registration error (${response.status})`);
  }

  return response.json();
}

export async function getMeApi(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Authentication validation failed (${response.status})`);
  }

  return response.json();
}

// Admin Endpoints
export async function getAdminStatsApi(token) {
  const response = await fetch(`${API_BASE}/auth/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch admin statistics');
  return response.json();
}

export async function getAdminUsersApi(token) {
  const response = await fetch(`${API_BASE}/auth/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch platform users');
  return response.json();
}

export async function toggleFarmerKycApi(profileId, token) {
  const response = await fetch(`${API_BASE}/auth/admin/farmers/${profileId}/verify-kyc`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to update KYC status');
  return response.json();
}

export async function toggleUserStatusApi(userId, token) {
  const response = await fetch(`${API_BASE}/auth/admin/users/${userId}/toggle-status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to toggle user status');
  return response.json();
}

// Role Protected Endpoints for Testing
export async function getFarmerDashboardApi(token) {
  const response = await fetch(`${API_BASE}/auth/farmer/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function getLogisticsOverviewApi(token) {
  const response = await fetch(`${API_BASE}/auth/logistics/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// Farmer KYC & Crop Listing
export async function submitFarmerKycApi(payload, token) {
  const response = await fetch(`${API_BASE}/auth/farmer/kyc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit KYC documents');
  }
  return response.json();
}

export async function createCropListingApi(payload, token) {
  const response = await fetch(`${API_BASE}/auth/farmer/crops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to publish crop consignment');
  }
  return response.json();
}
