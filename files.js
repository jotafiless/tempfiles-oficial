// Módulo de Gestión de Archivos para "Temp Files"
import { supabase } from "./supabase.js";
import { obtenerPerfilActivo } from "./auth.js";

const LIMITE_TAMANO_BYTES = 50 * 1024 * 1024; // 50MB

// Formatear tamaño de bytes a formato legible
function formatearTamano(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Obtener los archivos propios del perfil activo
async function obtenerMisArchivos() {
    const perfil = obtenerPerfilActivo();
    if (!perfil) return [];

    try {
        const { data, error } = await supabase
            .from("archivos")
            .select("*")
            .eq("perfil_id", perfil.id)
            .order("fecha_subida", { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error al obtener mis archivos:", e);
        return [];
    }
}

// Obtener estadísticas de almacenamiento de un perfil (número de archivos y espacio total usado)
async function obtenerEstadisticasAlmacenamiento(perfilId) {
    try {
        const { data, error } = await supabase
            .from("archivos")
            .select("tamano")
            .eq("perfil_id", perfilId);

        if (error) throw error;

        const conteo = data.length;
        const totalEspacio = data.reduce((acc, current) => acc + Number(current.tamano), 0);

        return {
            conteo,
            totalEspacio,
            porcentajeUsado: Math.min((totalEspacio / LIMITE_TAMANO_BYTES) * 100, 100)
        };
    } catch (e) {
        console.error("Error al obtener estadísticas de almacenamiento:", e);
        return { conteo: 0, totalEspacio: 0, porcentajeUsado: 0 };
    }
}

// Subir un archivo al Storage de Supabase y registrarlo en la base de datos
async function subirArchivo(file, alProgresar = () => {}) {
    const perfil = obtenerPerfilActivo();
    if (!perfil) {
        return { success: false, error: "Debes iniciar sesión con un perfil." };
    }

    // Validar el límite de tamaño
    if (file.size > LIMITE_TAMANO_BYTES) {
        return { success: false, error: "El archivo supera el límite permitido de 50 MB." };
    }

    try {
        const ext = file.name.split(".").pop().toLowerCase();
        // Generar un nombre único de almacenamiento para evitar colisiones
        const nombreUnico = `${perfil.id}/${Date.now()}_${file.name}`;

        // Al progress feedback (estimado o nativo)
        alProgresar(10);

        // 1. Subir al Bucket 'temp-files' en Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
            .from("temp-files")
            .upload(nombreUnico, file, {
                cacheControl: "3600",
                upsert: true
            });

        if (storageError) throw storageError;
        alProgresar(60);

        // 2. Obtener la URL pública del archivo
        const { data: urlData } = supabase.storage
            .from("temp-files")
            .getPublicUrl(nombreUnico);

        if (!urlData || !urlData.publicUrl) {
            throw new Error("No se pudo obtener la URL pública del archivo subido.");
        }

        const urlPublica = urlData.publicUrl;
        alProgresar(80);

        // 3. Registrar los metadatos del archivo en la tabla 'archivos'
        const { data: dbData, error: dbError } = await supabase
            .from("archivos")
            .insert([{
                perfil_id: perfil.id,
                nombre: file.name,
                tipo: file.type || "application/octet-stream",
                ext: ext || "dat",
                tamano: file.size,
                url: urlPublica,
                ruta_storage: nombreUnico,
                es_publico: false, // Por defecto privado
                es_destacado: false // Por defecto no destacado
            }])
            .select()
            .single();

        if (dbError) {
            // Si falla la inserción en la base de datos, limpiamos el archivo del storage para evitar basura
            await supabase.storage.from("temp-files").remove([nombreUnico]);
            throw dbError;
        }

        alProgresar(100);
        return { success: true, archivo: dbData };
    } catch (e) {
        console.error("Error en la subida y registro de archivo:", e);
        return { success: false, error: e.message || "Error al subir el archivo." };
    }
}

// Renombrar un archivo en la base de datos
async function renombrarArchivo(archivoId, nuevoNombre) {
    try {
        if (!nuevoNombre || nuevoNombre.trim() === "") {
            throw new Error("El nombre no puede estar vacío.");
        }

        const { data, error } = await supabase
            .from("archivos")
            .update({ nombre: nuevoNombre.trim() })
            .eq("id", archivoId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, archivo: data };
    } catch (e) {
        console.error("Error al renombrar archivo:", e);
        return { success: false, error: e.message };
    }
}

// Eliminar un archivo del Storage y de la base de datos
async function eliminarArchivo(archivoId, rutaStorage) {
    try {
        // 1. Eliminar de Supabase Storage
        const { error: storageError } = await supabase.storage
            .from("temp-files")
            .remove([rutaStorage]);

        if (storageError) {
            console.warn("No se pudo eliminar el archivo físico del storage (puede que ya no exista):", storageError);
        }

        // 2. Eliminar de la base de datos (con ON DELETE CASCADE se limpiarían relaciones, pero aquí lo borramos explícitamente)
        const { error: dbError } = await supabase
            .from("archivos")
            .delete()
            .eq("id", archivoId);

        if (dbError) throw dbError;

        return { success: true };
    } catch (e) {
        console.error("Error al eliminar archivo:", e);
        return { success: false, error: e.message };
    }
}

// Cambiar estado público/conpartido del archivo
async function cambiarCompartido(archivoId, esPublico) {
    try {
        const { data, error } = await supabase
            .from("archivos")
            .update({ es_publico: esPublico })
            .eq("id", archivoId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, archivo: data };
    } catch (e) {
        console.error("Error al actualizar estado compartido:", e);
        return { success: false, error: e.message };
    }
}

// Cambiar estado destacado del archivo
async function cambiarDestacado(archivoId, esDestacado) {
    try {
        const { data, error } = await supabase
            .from("archivos")
            .update({ es_destacado: esDestacado })
            .eq("id", archivoId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, archivo: data };
    } catch (e) {
        console.error("Error al actualizar destacado:", e);
        return { success: false, error: e.message };
    }
}

export {
    LIMITE_TAMANO_BYTES,
    formatearTamano,
    obtenerMisArchivos,
    obtenerEstadisticasAlmacenamiento,
    subirArchivo,
    renombrarArchivo,
    eliminarArchivo,
    cambiarCompartido,
    cambiarDestacado
};
