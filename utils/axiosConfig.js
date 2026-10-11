import axios from "axios";
import { deleteCookie, getCookie } from "cookies-next";
import Swal from "sweetalert2";

const axiosInstance = axios.create({
  baseURL: "/api",
  // timeout: 10000, // Request timeout
});

// Add request interceptors
axiosInstance.interceptors.request.use(
  (config) => {
    // Read the token on every request: reading it once at import time kept
    // sending the previous user's token after logging in as someone else.
    const token = getCookie("token");
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
      // Drop the stale cookie, otherwise the middleware sends /auth/login
      // straight back to "/" and the user is stuck in a loop.
      deleteCookie("token");
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has expired. Please log in again.",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/auth/login"; // Redirect after user acknowledges alert
      });
    }
    // Surface the API's own error message (e.g. "Insufficient balance").
    if (error.response?.data?.error && typeof error.response.data.error === "string") {
      error.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
