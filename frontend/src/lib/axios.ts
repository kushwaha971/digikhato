import axios from "axios";

export const axiosClient = axios.create({
  // Requests go to Next.js /api/* which is proxied to Django.
  // Same-origin means the browser automatically sends httpOnly cookies.
  baseURL: "/api",
  timeout: 15000,
  withCredentials: true, // send cookies on every request
});
