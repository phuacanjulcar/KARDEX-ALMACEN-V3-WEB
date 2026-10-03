const API_URL = import.meta.env.VITE_API_URL || 'https://kardex-api-backend.onrender.com';

const handleResponse = async (res) => {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    const error = (data && data.detail) || res.statusText;
    return Promise.reject(error);
  }
  return data;
};

export const apiService = {
  // Public/Shared
  getProducts: () => fetch(`${API_URL}/products`).then(handleResponse),
  getCategories: () => fetch(`${API_URL}/categories`).then(handleResponse),
  getZones: () => fetch(`${API_URL}/zones`).then(handleResponse),
  getDestinations: () => fetch(`${API_URL}/destinations`).then(handleResponse),
  getInventory: () => fetch(`${API_URL}/inventory`).then(handleResponse),
  getDocuments: () => fetch(`${API_URL}/documents`).then(handleResponse),
  getRecipes: () => fetch(`${API_URL}/recipes`).then(handleResponse),
  
  // Inventory operations
  receiveProduct: (data) => fetch(`${API_URL}/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  dispatchProduct: (data) => fetch(`${API_URL}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  transferProduct: (data) => fetch(`${API_URL}/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Admin Data
  getUsers: () => fetch(`${API_URL}/admin/users`).then(handleResponse),
  getAuditHistory: () => fetch(`${API_URL}/admin/history`).then(handleResponse),
  getSystemAudit: () => fetch(`${API_URL}/admin/system_audit`).then(handleResponse),

  // Admin Products
  createProduct: (data) => fetch(`${API_URL}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  updateProduct: (id, data) => fetch(`${API_URL}/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  deleteProduct: (id) => fetch(`${API_URL}/admin/products/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Admin Users
  createUser: (data) => fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  resetUserPassword: (username, new_password) => fetch(`${API_URL}/admin/users/${username}/reset`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password })
  }).then(handleResponse),

  // Admin Audit
  runAudit: () => fetch(`${API_URL}/admin/audit`).then(handleResponse),

  // Recipes
  createRecipe: (data) => fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  
  executeRecipe: (recipeId, data) => fetch(`${API_URL}/recipes/${recipeId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Master Data
  createCategory: (name) => fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse),
  
  createZone: (name, description = '') => fetch(`${API_URL}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  }).then(handleResponse),
  
  createDestination: (name) => fetch(`${API_URL}/admin/destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse),
  
  deleteDestination: (id) => fetch(`${API_URL}/admin/destinations/${id}`, {
    method: 'DELETE'
  }).then(handleResponse)
};
