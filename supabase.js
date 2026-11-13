/* Pidemás · Administrador · supabase.js
   Conexión con Supabase. Se carga primero: crea «db», que usan los demás archivos. */

/* ===== conexion ===== */
const SUPABASE_URL = "https://escxesvzndmyfuteawey.supabase.co";
const SUPABASE_KEY = "sb_publishable_pCP210JJcN3NP3a6Y2c--w_c7C0PjaU";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db;

