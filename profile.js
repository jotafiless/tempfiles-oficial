// Módulo de Gestión del Perfil de Usuario para "Temp Files"
import { supabase } from "./supabase.js";
import { obtenerPerfilActivo, obtenerSesionActiva } from "./auth.js";

// Actualizar la foto del perfil activo
async function actualizarFotoPerfil(nuevaFoto) {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return { success: false, error: "No hay sesión activa." };

    try {
        const { data, error } = await supabase
            .from("perfiles")
            .update({ foto: nuevaFoto })
            .eq("id", perfil.id)
            .select()
            .single();

        if (error) throw error;
        
        // Sincronizar el estado de sesión activa
        await obtenerSesionActiva();
        return { success: true, perfil: data };
    } catch (e) {
        console.error("Error al actualizar la foto de perfil:", e);
        return { success: false, error: e.message };
    }
}

// Actualizar el PIN de seguridad de un perfil (debe ser de 4 dígitos)
async function actualizarPinPerfil(nuevoPin) {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return { success: false, error: "No hay sesión activa." };

    try {
        if (!/^\d{4}$/.test(nuevoPin)) {
            throw new Error("El PIN debe constar de 4 dígitos numéricos.");
        }

        const { data, error } = await supabase
            .from("perfiles")
            .update({ pin: nuevoPin })
            .eq("id", perfil.id)
            .select()
            .single();

        if (error) throw error;
        
        // Sincronizar sesión
        await obtenerSesionActiva();
        return { success: true, perfil: data };
    } catch (e) {
        console.error("Error al actualizar el PIN de perfil:", e);
        return { success: false, error: e.message };
    }
}

// Obtener info detallada del perfil, incluyendo estadísticas de archivos
async function obtenerDetallesPerfil() {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return null;

    try {
        const { data, error } = await supabase
            .from("perfiles")
            .select("*")
            .eq("id", perfil.id)
            .single();

        if (error) throw error;
        return data;
    } catch (e) {
        console.error("Error al obtener detalles del perfil:", e);
        return perfil;
    }
}

export {
    actualizarFotoPerfil,
    actualizarPinPerfil,
    obtenerDetallesPerfil
};
