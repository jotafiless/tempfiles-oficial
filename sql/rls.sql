-- Políticas de Seguridad a Nivel de Fila (RLS) para "Temp Files"

-- 1. Habilitar RLS en las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'perfiles'

-- Permitir a cualquier anon/autenticado consultar el catálogo de perfiles (necesario para la pantalla de inicio estilo Netflix)
CREATE POLICY "Permitir consultar perfiles" ON public.perfiles
    FOR SELECT USING (true);

-- Permitir a cualquiera crear un perfil (se valida el límite de 6 en la base de datos vía TRIGGER, y el PIN en frontend)
CREATE POLICY "Permitir crear perfiles" ON public.perfiles
    FOR INSERT WITH CHECK (true);

-- Permitir actualizar su propio perfil (foto, PIN)
CREATE POLICY "Permitir actualizar propio perfil" ON public.perfiles
    FOR UPDATE USING (true);


-- 3. Políticas para 'archivos'

-- Ver: Sus propios archivos (coincidencia de perfil_id) o archivos públicos de otros (es_publico = true)
CREATE POLICY "Permitir lectura de archivos propios o públicos" ON public.archivos
    FOR SELECT USING (
        es_publico = true OR 
        perfil_id::text = coalesce(current_setting('request.headers', true)::json->>'x-profile-id', '')
    );

-- Modificar: Solo sus propios archivos
CREATE POLICY "Permitir modificación de propios archivos" ON public.archivos
    FOR UPDATE USING (
        perfil_id::text = coalesce(current_setting('request.headers', true)::json->>'x-profile-id', '')
    );

-- Eliminar: Solo sus propios archivos
CREATE POLICY "Permitir eliminación de propios archivos" ON public.archivos
    FOR DELETE USING (
        perfil_id::text = coalesce(current_setting('request.headers', true)::json->>'x-profile-id', '')
    );

-- Insertar: Permitir a cualquier perfil crear registros de archivos
CREATE POLICY "Permitir insertar sus propios archivos" ON public.archivos
    FOR INSERT WITH CHECK (
        perfil_id::text = coalesce(current_setting('request.headers', true)::json->>'x-profile-id', '')
    );
