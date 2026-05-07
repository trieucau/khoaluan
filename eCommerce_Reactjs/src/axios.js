import axios from 'axios';
import _ from 'lodash';

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,

  //  withCredentials: true
});
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.authorization = 'Bearer ' + token.replaceAll('"', '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use((response) => {
  // Thrown error for request with OK status code
  const { data } = response;
  return response.data;
});

export default instance;
