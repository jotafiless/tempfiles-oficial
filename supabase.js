// Inicialización del Cliente de Supabase para "Temp Files"

const SUPABASE_URL = "https://deegzgbeephyrgulirjj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWd6Z2JlZXBoeXJndWxpcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTI3MzMsImV4cCI6MjA5NjE4ODczM30.6QXJMMU8iTC7komea40K50zCK8hg25M7JpG2X_ky_D0";

let supabase = null;

// Inicializa o recrea el cliente de Supabase agregando de forma dinámica la cabecera x-profile-id para políticas RLS
function initSupabase(profileId = "") {
    if (window.supabase) {
        const options = {
            auth: {
                persistSession: false
            }
        };

        if (profileId) {
            options.global = {
                headers: {
                    "x-profile-id": profileId
                }
            };
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
    } else {
        console.error("El SDK de Supabase no está cargado en el navegador.");
    }
    return supabase;
}

// Inicializar por defecto
initSupabase();

export { supabase, initSupabase };
