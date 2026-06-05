-- Schema para la Base de Datos "Temp Files"

-- Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    foto TEXT NOT NULL, -- URL de la foto o identificador del avatar
    pin VARCHAR(4) NOT NULL, -- PIN de 4 dígitos
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Archivos
CREATE TABLE IF NOT EXISTS public.archivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    archivo_url TEXT NOT NULL, -- URL pública para descarga
    archivo_path TEXT NOT NULL, -- Ruta dentro del bucket de Supabase Storage
    tipo VARCHAR(100) NOT NULL, -- MIME type o descripción simple
    tamano BIGINT NOT NULL, -- Tamaño en bytes
    compartido BOOLEAN DEFAULT false NOT NULL, -- Indica si está compartido con todos
    destacado BOOLEAN DEFAULT false NOT NULL, -- Indica si aparece en destacados
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para limitar a un máximo de 6 perfiles
CREATE OR REPLACE FUNCTION check_limite_perfiles()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.perfiles) >= 6 THEN
        RAISE EXCEPTION 'Se ha alcanzado el límite máximo de 6 perfiles registrados.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limite_perfiles ON public.perfiles;
CREATE TRIGGER trigger_limite_perfiles
BEFORE INSERT ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION check_limite_perfiles();
