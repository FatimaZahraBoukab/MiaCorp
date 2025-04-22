import api from './api';

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  try {
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      
      // Récupérer les infos de l'utilisateur
      const userInfo = await getCurrentUser();
      return userInfo;
    }
    throw new Error('Authentification échouée');
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    throw error;
  }
};

export const registerClient = async (clientData) => {
  try {
    const response = await api.post('/users/clients/', clientData);
    return response.data;
  } catch (error) {
    console.error('Erreur d\'inscription client:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Erreur de récupération du profil:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};