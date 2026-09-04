import axios from "axios";

const api1Skore = axios.create({
  baseURL: '/php',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
  withCredentials: true,

});
export default api1Skore;