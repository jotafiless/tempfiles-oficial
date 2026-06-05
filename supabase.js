// Inicialización del Cliente de Supabase para "Temp Files"

const SUPABASE_URL = "https://deegzgbeephyrgulirjj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWd6Z2JlZXBoeXJndWxpcmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTI3MzMsImV4cCI6MjA5NjE4ODczM30.6QXJMMU8iTC7komea40K50zCK8hg25M7JpG2X_ky_D0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false
    }
});

// Función para actualizar las cabeceras REST y Storage para RLS de forma dinámica en la única instancia
function initSupabase(profileId = "") {
    if (profileId) {
        if (supabase.rest) {
            supabase.rest.headers = {
                ...supabase.rest.headers,
                "x-profile-id": profileId
            };
        }
        if (supabase.storage) {
            supabase.storage.headers = {
                ...supabase.storage.headers,
                "x-profile-id": profileId
            };
        }
    } else {
        if (supabase.rest) {
            delete supabase.rest.headers["x-profile-id"];
        }
        if (supabase.storage) {
            delete supabase.storage.headers["x-profile-id"];
        }
    }
    return supabase;
}

export { supabase, initSupabase };
