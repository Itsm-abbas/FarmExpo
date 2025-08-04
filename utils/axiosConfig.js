import axios from "axios";
import { getCookie } from "cookies-next";
import Swal from "sweetalert2";

const token = getCookie("token");

const axiosInstance = axios.create({
  baseURL: "/api",
  // timeout: 10000, // Request timeout
});

// Add request interceptors
axiosInstance.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has expired. Please log in again.",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/auth/login"; // Redirect after user acknowledges alert
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
