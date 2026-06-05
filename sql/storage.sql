-- Configuración de Storage para "Temp Files"

-- 1. Crear el bucket 'temp-files' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp-files', 
    'temp-files', 
    true, 
    52428800, -- 50 MB en bytes (50 * 1024 * 1024)
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'video/mp4',
        'audio/mpeg',
        'audio/mp3'
    ]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800;

-- 2. Políticas RLS de Storage para el bucket 'temp-files'

-- Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Permitir lectura de archivos de almacenamiento" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de archivos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de archivos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de archivos" ON storage.objects;

-- Permitir descargar cualquier archivo público del bucket 'temp-files'
CREATE POLICY "Permitir lectura de archivos de almacenamiento" ON storage.objects
    FOR SELECT USING (bucket_id = 'temp-files');

-- Permitir subir archivos al bucket 'temp-files'
CREATE POLICY "Permitir subida de archivos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'temp-files');

-- Permitir actualización
CREATE POLICY "Permitir actualización de archivos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'temp-files');

-- Permitir eliminación de archivos
CREATE POLICY "Permitir eliminación de archivos" ON storage.objects
    FOR DELETE USING (bucket_id = 'temp-files');
