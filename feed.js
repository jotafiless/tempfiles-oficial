// Módulo de Muro de Inicio y Feed de Archivos Compartidos y Destacados
import { supabase } from "./supabase.js";

// Obtener feed de archivos compartidos recientemente (públicos)
// Con un select que incluya los datos de los perfiles asociados (Join)
async function obtenerFeedCompartido() {
    try {
        const { data, error } = await supabase
            .from("archivos")
            .select(`
                *,
                perfiles (
                    id,
                    nombre,
                    foto
                )
            `)
            .eq("compartido", true)
            .order("fecha_subida", { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error al obtener feed compartido:", e);
        return [];
    }
}

// Obtener todos los archivos marcados como destacados que son públicos o pertenecen al usuario
async function obtenerArchivosDestacados() {
    try {
        const { data, error } = await supabase
            .from("archivos")
            .select(`
                *,
                perfiles (
                    id,
                    nombre,
                    foto
                )
            `)
            .eq("destacado", true)
            .order("fecha_subida", { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error al obtener archivos destacados:", e);
        return [];
    }
}

export {
    obtenerFeedCompartido,
    obtenerArchivosDestacados
};
