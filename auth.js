// Módulo de Autenticación de Perfiles para "Temp Files"
import { supabase, initSupabase } from "./supabase.js";

// Lista de Avatares predefinidos (Gradientes modernos con emojis o ilustraciones)
const AVATARES_PREDEFINIDOS = [
    { id: "avatar1", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Felix&backgroundColor=b6e3f4" },
    { id: "avatar2", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Aneka&backgroundColor=c0aede" },
    { id: "avatar3", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Boots&backgroundColor=d1c4e9" },
    { id: "avatar4", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Harley&backgroundColor=ffccbc" },
    { id: "avatar5", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Luna&backgroundColor=c8e6c9" },
    { id: "avatar6", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Oliver&backgroundColor=f0f4c3" }
];

let perfilActivo = null;

// Obtener todos los perfiles de la base de datos
async function obtenerPerfiles() {
    try {
        const { data, error } = await supabase
            .from("perfiles")
            .select("*")
            .order("fecha_creacion", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error al obtener perfiles:", e);
        return [];
    }
}

// Crear un nuevo perfil (máximo 6)
async function crearPerfil(nombre, foto, pin) {
    try {
        // Validación frontend del PIN
        if (!/^\d{4}$/.test(pin)) {
            throw new Error("El PIN debe ser exactamente de 4 dígitos numéricos.");
        }

        // Insertar perfil en Supabase
        const { data, error } = await supabase
            .from("perfiles")
            .insert([{ nombre, foto, pin }])
            .select()
            .single();

        if (error) {
            if (error.message.includes("limite_perfiles")) {
                throw new Error("Límite de 6 perfiles alcanzado.");
            }
            if (error.code === "23505") { // Unique restriction code
                throw new Error("Ya existe un perfil con ese nombre.");
            }
            throw error;
        }
        return { success: true, data };
    } catch (e) {
        console.error("Error al crear perfil:", e);
        return { success: false, error: e.message };
    }
}

// Validar el PIN del perfil seleccionado
async function validarPin(perfilId, pinIntroducido) {
    try {
        const { data, error } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", perfilId)
            .single();

        if (error) throw error;

        if (data.pin === pinIntroducido) {
            // Guardar en localStorage
            localStorage.setItem("temp_files_perfil_id", perfilId);
            // Re-inicializar Supabase con x-profile-id para RLS
            initSupabase(perfilId);
            perfilActivo = data;
            return { success: true, perfil: data };
        } else {
            return { success: false, error: "El PIN introducido es incorrecto." };
        }
    } catch (e) {
        console.error("Error al validar PIN:", e);
        return { success: false, error: "No se pudo validar el PIN." };
    }
}

// Recuperar sesión activa de localStorage
async function obtenerSesionActiva() {
    const perfilId = localStorage.getItem("temp_files_perfil_id");
    if (!perfilId) return null;

    try {
        // Re-inicializar Supabase con el profile_id respectivo
        initSupabase(perfilId);

        const { data, error } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", perfilId)
            .single();

        if (error) {
            // Perfil eliminado o inválido, limpiar sesión
            cerrarSesion();
            return null;
        }

        perfilActivo = data;
        return data;
    } catch (e) {
        console.error("Error al recuperar sesión:", e);
        return null;
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("temp_files_perfil_id");
    perfilActivo = null;
    initSupabase(); // Reset sin cabecera de perfil
}

// Obtener perfil activo en memoria
function obtenerPerfilActivo() {
    return perfilActivo;
}

export {
    AVATARES_PREDEFINIDOS,
    obtenerPerfiles,
    crearPerfil,
    validarPin,
    obtenerSesionActiva,
    cerrarSesion,
    obtenerPerfilActivo
};
