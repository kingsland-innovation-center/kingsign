import axios from 'axios';
import client from './FeathersClient';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

if(typeof window !== 'undefined') {

axiosClient.interceptors.request.use(
  async (config) => {
    try {

      const token = window.localStorage.getItem('feathers-jwt');

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      // Return the default config if there is an error
      return config;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
}

export default axiosClient;