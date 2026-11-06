-- ==============================================================================
-- ROGUX DISTRIBUCIONES - ESQUEMA COMPLETO ACTUALIZADO PARA SUPABASE
-- Proyecto: ragux@appdesign.appdesignproyectos.com's Project (unhnyzyejdpwxgvbgbda)
-- URL: https://unhnyzyejdpwxgvbgbda.supabase.co
-- ==============================================================================
-- NOTA: Este script incluye todas las columnas del Layout de Clientes y Catálogo
-- de Productos (sin registros de muestra para permitir la importación limpia).
-- ==============================================================================

-- 1. TABLA: users (Usuarios y Empleados del Sistema)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'vendedor',
    telefono TEXT,
    whatsapp TEXT,
    email TEXT,
    foto_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migraciones idempotentes para users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. TABLA: products (Catálogo de Productos - Estructura ROGUX)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    unidad_medida TEXT NOT NULL DEFAULT 'PIEZAS',
    precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    categoria TEXT,
    stock NUMERIC(12, 2) DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migraciones idempotentes para products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unidad_medida TEXT NOT NULL DEFAULT 'PIEZAS';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. TABLA: clients (Directorio de Clientes - Estructura Oficial ley_yout_clientes)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    no TEXT,
    nombre TEXT NOT NULL,
    rfc TEXT,
    calle TEXT,
    numero_ext TEXT,
    colonia TEXT,
    cp TEXT,
    ciudad TEXT,
    estado TEXT,
    pais TEXT DEFAULT 'MEXICO',
    telefono TEXT,
    email TEXT,
    contacto TEXT,
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migraciones idempotentes para clients (garantiza compatibilidad si la tabla ya existe)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS no TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS calle TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS numero_ext TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS colonia TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cp TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'MEXICO';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. TABLA: quotations (Cotizaciones Comerciales)
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL,
    fecha_expedicion DATE NOT NULL,
    lugar_expedicion TEXT,
    cliente_id TEXT,
    cliente_nombre TEXT NOT NULL,
    cliente_rfc TEXT,
    cliente_direccion TEXT,
    cliente_telefono TEXT,
    cliente_ciudad TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_letra TEXT,
    valido_hasta TEXT,
    tiempo_entrega TEXT,
    forma_pago TEXT,
    notas TEXT,
    creado_por TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'vigente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: sale_notes (Notas de Venta y Pagarés)
CREATE TABLE IF NOT EXISTS public.sale_notes (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    lugar_expedicion TEXT,
    emisor_nombre TEXT,
    emisor_direccion TEXT,
    emisor_colonia_cp TEXT,
    emisor_ciudad_estado TEXT,
    emisor_telefono TEXT,
    emisor_email TEXT,
    cliente_id TEXT,
    cliente_nombre TEXT NOT NULL,
    cliente_rfc TEXT,
    cliente_direccion TEXT,
    cliente_colonia_cp TEXT,
    cliente_ciudad TEXT,
    cliente_telefono TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_letra TEXT,
    observaciones TEXT,
    texto_pagare TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: company_profile (Perfil del Emisor y Empresa)
CREATE TABLE IF NOT EXISTS public.company_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    nombre_comercial TEXT,
    razon_social TEXT,
    rfc TEXT,
    direccion_calle TEXT,
    colonia_cp TEXT,
    ciudad_estado TEXT,
    telefono TEXT,
    email TEXT,
    lugar_expedicion_defecto TEXT,
    logo_url TEXT,
    ultimo_folio INTEGER DEFAULT 1963,
    ultimo_folio_nota INTEGER DEFAULT 3087,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE ACCESO ROW-LEVEL SECURITY (RLS) PARA LLAVE PÚBLICA / ANON
-- Permite lectura, inserción en lote, actualización y eliminación desde la app
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access clients" ON public.clients;
CREATE POLICY "Public access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access quotations" ON public.quotations;
CREATE POLICY "Public access quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access sale_notes" ON public.sale_notes;
CREATE POLICY "Public access sale_notes" ON public.sale_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access company_profile" ON public.company_profile;
CREATE POLICY "Public access company_profile" ON public.company_profile FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO PARA BÚSQUEDAS RÁPIDAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_codigo ON public.products (codigo);
CREATE INDEX IF NOT EXISTS idx_products_activo ON public.products (activo);
CREATE INDEX IF NOT EXISTS idx_clients_rfc ON public.clients (rfc);
CREATE INDEX IF NOT EXISTS idx_clients_nombre ON public.clients (nombre);
CREATE INDEX IF NOT EXISTS idx_clients_activo ON public.clients (activo);

-- ==============================================================================
-- DATOS DEL SISTEMA: USUARIOS Y CONFIGURACIÓN DE EMPRESA
-- (NO SE INCLUYEN CLIENTES NI PRODUCTOS DE MUESTRA PARA PERMITIR IMPORTACIÓN LIMPIA)
-- ==============================================================================

-- 1. Usuarios Oficiales del Sistema (Admin, Ventas, Logística)
INSERT INTO public.users (id, nombre, usuario, clave, rol, telefono, whatsapp, email, foto_url, activo)
VALUES 
    ('usr-admin', 'Administrador ROGUX', 'admin_123', 'Chevropar#1970', 'admin', '4443053182', '4443053182', 'admin@raguxdistribuciones.com', '', true),
    ('usr-harold', 'Harold Anguiano Morales', 'haroldo90', 'Chevropar#1970', 'vendedor', '4443053182', '4443053182', 'haroldanguiano@gmail.com', '', true),
    ('usr-logistica', 'Encargado de Logística', 'logistica_1', 'Chevropar#1970', 'logistica', '4443053182', '4443053182', 'logistica@raguxdistribuciones.com', '', true)
ON CONFLICT (usuario) DO UPDATE 
SET nombre = EXCLUDED.nombre, 
    clave = EXCLUDED.clave, 
    rol = EXCLUDED.rol, 
    telefono = EXCLUDED.telefono, 
    whatsapp = EXCLUDED.whatsapp, 
    email = EXCLUDED.email, 
    foto_url = COALESCE(NULLIF(EXCLUDED.foto_url, ''), public.users.foto_url),
    activo = EXCLUDED.activo;

-- 2. Perfil Oficial de la Empresa
INSERT INTO public.company_profile (
    id, nombre_comercial, razon_social, rfc, direccion_calle, colonia_cp,
    ciudad_estado, telefono, email, lugar_expedicion_defecto, logo_url,
    ultimo_folio, ultimo_folio_nota
)
VALUES (
    'default',
    'LAURA GUEL GUERRERO (RAGUXDISTRIBUCIONES)',
    'LAURA GUEL GUERRERO',
    'GUGL780927NRA',
    'VILLERIAS #273',
    'SAUCITO C.P. 78110',
    'SAN LUIS POTOSI, San Luis Potosi',
    '(444)-3053182',
    'raguxdistribuciones@gmail.com',
    'SAN LUIS POTOSI, San Luis Potosi',
    'https://appdesignproyectos.com/raguxdistribuciones.jpeg',
    1963,
    3087
)
ON CONFLICT (id) DO UPDATE 
SET nombre_comercial = EXCLUDED.nombre_comercial,
    logo_url = EXCLUDED.logo_url,
    updated_at = NOW();

-- FIN DEL SCRIPT SQL ACTUALIZADO
