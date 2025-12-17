import axios from "axios";
import { store } from "../redux/store";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8008/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add token to every request from Redux store
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from Redux store
    const state = store.getState();
    const token = state.auth.token;
    // console.log("TOKEN SENT TO BACKEND:", token);

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // console.log("Request config:", {
    //   url: config.url,
    //   hasToken: !!token,
    // }); // Debug log

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // console.log("Response received:", response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log("Unauthorized - token may be invalid or expired");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
