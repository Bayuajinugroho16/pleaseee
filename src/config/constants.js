// src/config/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'https://beckendflyio.vercel.app/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://beckendflyio.vercel.app/ws';
export const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://beckendflyio.vercel.app';