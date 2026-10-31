-- ==============================================================================
-- ROGUX DISTRIBUCIONES - ESQUEMA COMPLETO Y DATOS INICIALES PARA SUPABASE
-- Proyecto: ragux@appdesign.appdesignproyectos.com's Project (unhnyzyejdpwxgvbgbda)
-- URL: https://unhnyzyejdpwxgvbgbda.supabase.co
-- ==============================================================================

-- 1. TABLA: users (Usuarios y Empleados del Sistema)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'vendedor',
    telefono TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: products (Catálogo de Productos)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    unidad_medida TEXT NOT NULL DEFAULT 'H87',
    precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    categoria TEXT,
    stock NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: clients (Directorio de Clientes)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    rfc TEXT,
    direccion TEXT,
    ciudad TEXT,
    telefono TEXT,
    email TEXT,
    contacto TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- Permite lectura, escritura, actualización y borrado desde la app cliente
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
-- INSERCIÓN DE DATOS DE MUESTRA Y CREDENCIALES SOLICITADAS
-- ==============================================================================

-- 1. Credenciales de acceso requeridas
INSERT INTO public.users (id, nombre, usuario, clave, rol, telefono, activo)
VALUES 
    ('usr-admin', 'Administrador ROGUX', 'admin_123', 'Chevropar#1970', 'admin', '4443053182', true),
    ('usr-harold', 'Harold Anguiano Morales', 'haroldo90', 'Chevropar#1970', 'vendedor', '4443053182', true)
ON CONFLICT (usuario) DO UPDATE 
SET nombre = EXCLUDED.nombre, clave = EXCLUDED.clave, rol = EXCLUDED.rol, activo = EXCLUDED.activo;

-- 2. Clientes de muestra
INSERT INTO public.clients (id, nombre, rfc, direccion, ciudad, telefono, email, contacto)
VALUES 
    ('cli-004', 'MAXSTORE SUCURSAL ARRIAGA', 'SEFA900405BC9', 'VILLA DE ARRIAGA s/n', 'VILLA DE ARRIAGA , SAN LUIS POTOSI', '( ) - - -', 'maxstore.arriaga@ejemplo.com', 'Sucursal Arriaga (C.P. 78490 Centro)'),
    ('cli-001', 'FRANCISCO JAVIER MATA MOLINA', 'MAMF5512033Y8', 'GUERRERO 100, MATEHUALA CENTRO C.P. 78700', 'MATEHUALA, SAN LUIS POTOSI', '(488) 123-45-67', 'javier.mata@ejemplo.com', 'Lic. Francisco Javier Mata'),
    ('cli-002', 'FARMACIAS DE SAN LUIS S.A. DE C.V.', 'FSL9904128K1', 'AV. VENUSTIANO CARRANZA #1420, COL. TEQUISQUIAPAN C.P. 78230', 'SAN LUIS POTOSI, S.L.P.', '(444) 815-30-20', 'compras@farmaciasdesanluis.com', 'C.P. Mariana Rangel'),
    ('cli-003', 'DISTRIBUIDORA MÉDICA DEL CENTRO S.A.', 'DMC120803TR9', 'CALLE 5 DE MAYO #340, ZONA CENTRO C.P. 78000', 'SAN LUIS POTOSI, S.L.P.', '(444) 812-99-00', 'pedidos@medicasanluis.mx', 'Ing. Roberto Hernández')
ON CONFLICT (id) DO NOTHING;

-- 3. Catálogo de productos de muestra
INSERT INTO public.products (id, codigo, descripcion, unidad_medida, precio_unitario, categoria, stock)
VALUES 
    ('prod-01', 'M1251', 'BICARBONATO DE SODIO C/12 100 GRS JALOMA-7501094911059 M1251', 'H87', 10.21, 'Higiene y Cuidado', 250),
    ('prod-02', 'M1031', 'COTONETE NUTRAN 410PZS -7506601400322 -M1031', 'H87', 30.51, 'Higiene y Cuidado', 180),
    ('prod-03', 'M1256', 'ACEITE DE ALMENDRAS JALOMA 60 ML-750604031285 M1256', 'H87', 19.04, 'Aceites y Cuidado Personal', 300),
    ('prod-04', 'M1028', 'COTONETE NUTRAN 310PZS -7506601400308 - M1028', 'H87', 24.20, 'Higiene y Cuidado', 140),
    ('prod-05', 'M1272', 'JALOMA SILICA KERATINA 12 OLEOS 60ML-750604191244 M1272', 'H87', 22.19, 'Cuidado Capilar', 95),
    ('prod-06', 'M1032', 'COTONETE NUTRAN 500 PZS -7506601400346 - M1032', 'H87', 37.47, 'Higiene y Cuidado', 220),
    ('prod-07', 'M1253', 'ACEITE DE OLIVO JALOMA 120 ML-750604031128 M1253', 'H87', 20.00, 'Aceites y Cuidado Personal', 175),
    ('prod-08', 'M1259', 'ACETONA JALOMA 140 ML-750604031531 M1259', 'H87', 22.54, 'Cuidado de Uñas', 190),
    ('prod-09', 'M1277', 'VENDA ELASTICA DE 25 CM JALOMA- 759064471254 - M1277', 'H87', 33.01, 'Primeros Auxilios', 80),
    ('prod-10', 'M1276', 'VENDA ELASTICA DEL 15 CM JALOMA-759064471131 M1276', 'H87', 20.21, 'Primeros Auxilios', 110),
    ('prod-11', 'M1104', 'GEL FIJADOR CAPILAR NIVEL 250ML NUEVO-7501062750232 M1104', 'H87', 13.93, 'Cuidado Capilar', 320),
    ('prod-12', 'M1275', 'VENDA ELASTICA DEL 7 CM JALOMA-759064471102 M1275', 'H87', 11.03, 'Primeros Auxilios', 160),
    ('prod-13', 'M1278', 'VENDA ELASTICA DEL 10 CM-JALOMA-759064471123 M1278', 'H87', 13.82, 'Primeros Auxilios', 210),
    ('prod-14', 'M1279', 'VENDA ELASTICA DEL 30 CM-JALOMA-759064471936 M1279', 'H87', 38.16, 'Primeros Auxilios', 65),
    ('prod-15', 'M1273', 'VENDA ELASTICA DEL 5 CM JALOMA-759064471012 M1273', 'H87', 7.99, 'Primeros Auxilios', 240),
    ('prod-16', 'M1372', 'TOALLITA DESM-NIVEL HIDRATANTES C/25PZS -7501062790481 M1372', 'H87', 20.79, 'Higiene y Cuidado', 150),
    ('prod-17', 'M1055', 'CREM NIVEL ACEITE COCO 750ML-7501062721713 M1055', 'H87', 33.73, 'Cremas y Cuidado Facial', 130),
    ('prod-18', 'M1271', 'SILICA CON KERATINA Y 12 OLEOS 120ML JALOMA-759064101251 M1271', 'H87', 37.68, 'Cuidado Capilar', 85),
    ('prod-19', 'M1252', 'ACEITE DE ALMENDRAS JALOMA 120ML -759064031311 - M1252', 'H87', 24.64, 'Aceites y Cuidado Personal', 140),
    ('prod-20', 'M1230', 'VITROLERO P/LABIOS C/60 PZA JALOMA-7590640391230 M1230', 'H87', 216.00, 'Labiales y Cosmeticos', 45),
    ('prod-21', 'M1419', 'ESPONJABON EFECTO ANTIAQNE -741021029188 / T-TAKI ACIDO HIALURONICO M1419', 'H87', 26.90, 'Jabones y Cuidado Facial', 190),
    ('prod-22', 'M1192', 'ESPONJABON ACLARANTE CONCHA NACAR-7501102202854 M1192', 'H87', 26.90, 'Jabones y Cuidado Facial', 190),
    ('prod-23', 'M1054', 'CREMA 7ALMENDRAS EX-HUM 750ML -7501062721706 M1054', 'H87', 33.78, 'Cremas y Cuidado Facial', 120),
    ('prod-24', 'M1050', 'CREMA P/RESECA MIEL/AVENA 750ML -7501062721676 M1050', 'H87', 33.78, 'Cremas y Cuidado Facial', 115),
    ('prod-25', 'M1405', 'ALCOHOL SAN LUIS 250ML AZUL -2003101170 M1405', 'H87', 14.20, 'Antisépticos y Alcohol', 260),
    ('prod-26', 'M1289', 'GEL ANTIB MANZANA LITHUS 500ML -JEJ220707UMA2 M1289', 'H87', 34.54, 'Antisépticos y Alcohol', 170),
    ('prod-27', 'M1009', 'CREMA NIVEL 3 EN 1 M-SUPERFDE 230G JOMA -7501062722420 M1009', 'H87', 27.65, 'Cremas y Cuidado Facial', 140),
    ('prod-28', 'M1044', 'CREMA ROSA 600 G ACLARADO IDEAL -7501062721997 M1044', 'H87', 40.39, 'Cremas y Cuidado Facial', 110),
    ('prod-29', 'M1045', 'CREMA AZUL 600G EXTRA CON KARITE -7501062721980 M1045', 'H87', 40.39, 'Cremas y Cuidado Facial', 105),
    ('prod-30', 'M0054', 'SALSA VALENTINA PICANTE 24/370ML 097339000054 -M0054', 'PIEZAS', 15.95, 'Abarrotes y Alimentos', 300),
    ('prod-31', 'M0055', 'BIG FACIAL QUALITY 600 HOJAS PAPEL HIGIENICO BULTO C/8PAQUETES', 'PIEZAS', 515.87, 'Papelería y Limpieza', 50),
    ('prod-32', 'M1132', 'DODYS TOALLITA 80PZS AZUL- 7502221010729 M1132', 'PIEZAS', 27.46, 'Bebés e Higiene', 200),
    ('prod-33', 'M4302', 'SERVILLETA PETALO C/100 7501007704302 M4302', 'PIEZAS', 19.85, 'Papelería y Limpieza', 250)
ON CONFLICT (id) DO NOTHING;

-- 4. Perfil de Empresa
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

-- 5. Cotización de muestra (001963)
INSERT INTO public.quotations (
    id, folio, fecha_expedicion, lugar_expedicion, cliente_id, cliente_nombre,
    cliente_rfc, cliente_direccion, cliente_telefono, cliente_ciudad,
    items, subtotal, descuento, total, total_letra, valido_hasta,
    tiempo_entrega, forma_pago, creado_por, estado
)
VALUES (
    'cot-001',
    '001963',
    '2026-10-25',
    'SAN LUIS POTOSI, SAN LUIS POTOSI',
    'cli-001',
    'FRANCISCO JAVIER MATA MOLINA',
    'MAMF5512033Y8',
    'GUERRERO 100, MATEHUALA CENTRO C.P. 78700',
    '(488) 123-45-67',
    'MATEHUALA, SAN LUIS POTOSI',
    '[
      {"id":"item-1","codigo":"M1251","cantidad":24,"unidadMedida":"H87","descripcion":"BICARBONATO DE SODIO C/12 100 GRS JALOMA-7501094911059 M1251","precioUnitario":10.21,"importe":245.04},
      {"id":"item-2","codigo":"M1031","cantidad":20,"unidadMedida":"H87","descripcion":"COTONETE NUTRAN 410PZS -7506601400322 -M1031","precioUnitario":30.51,"importe":610.20},
      {"id":"item-3","codigo":"M1256","cantidad":25,"unidadMedida":"H87","descripcion":"ACEITE DE ALMENDRAS JALOMA 60 ML-750604031285 M1256","precioUnitario":19.04,"importe":476.00},
      {"id":"item-4","codigo":"M1028","cantidad":20,"unidadMedida":"H87","descripcion":"COTONETE NUTRAN 310PZS -7506601400308 - M1028","precioUnitario":24.20,"importe":484.00},
      {"id":"item-5","codigo":"M1272","cantidad":16,"unidadMedida":"H87","descripcion":"JALOMA SILICA KERATINA 12 OLEOS 60ML-750604191244 M1272","precioUnitario":22.19,"importe":355.04},
      {"id":"item-6","codigo":"M1032","cantidad":30,"unidadMedida":"H87","descripcion":"COTONETE NUTRAN 500 PZS -7506601400346 - M1032","precioUnitario":37.47,"importe":1124.10},
      {"id":"item-7","codigo":"M1253","cantidad":25,"unidadMedida":"H87","descripcion":"ACEITE DE OLIVO JALOMA 120 ML-750604031128 M1253","precioUnitario":20.00,"importe":500.00},
      {"id":"item-8","codigo":"M1259","cantidad":25,"unidadMedida":"H87","descripcion":"ACETONA JALOMA 140 ML-750604031531 M1259","precioUnitario":22.54,"importe":563.50},
      {"id":"item-9","codigo":"M1277","cantidad":3,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DE 25 CM JALOMA- 759064471254 - M1277","precioUnitario":33.01,"importe":99.03},
      {"id":"item-10","codigo":"M1276","cantidad":10,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DEL 15 CM JALOMA-759064471131 M1276","precioUnitario":20.21,"importe":202.10},
      {"id":"item-11","codigo":"M1104","cantidad":40,"unidadMedida":"H87","descripcion":"GEL FIJADOR CAPILAR NIVEL 250ML NUEVO-7501062750232 M1104","precioUnitario":13.93,"importe":557.20},
      {"id":"item-12","codigo":"M1275","cantidad":10,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DEL 7 CM JALOMA-759064471102 M1275","precioUnitario":11.03,"importe":110.30},
      {"id":"item-13","codigo":"M1278","cantidad":10,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DEL 10 CM-JALOMA-759064471123 M1278","precioUnitario":13.82,"importe":138.20},
      {"id":"item-14","codigo":"M1279","cantidad":1,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DEL 30 CM-JALOMA-759064471936 M1279","precioUnitario":38.16,"importe":38.16},
      {"id":"item-15","codigo":"M1273","cantidad":10,"unidadMedida":"H87","descripcion":"VENDA ELASTICA DEL 5 CM JALOMA-759064471012 M1273","precioUnitario":7.99,"importe":79.90},
      {"id":"item-16","codigo":"M1372","cantidad":24,"unidadMedida":"H87","descripcion":"TOALLITA DESM-NIVEL HIDRATANTES C/25PZS -7501062790481 M1372","precioUnitario":20.79,"importe":498.96},
      {"id":"item-17","codigo":"M1055","cantidad":6,"unidadMedida":"H87","descripcion":"CREM NIVEL ACEITE COCO 750ML-7501062721713 M1055","precioUnitario":33.73,"importe":202.38},
      {"id":"item-18","codigo":"M1271","cantidad":24,"unidadMedida":"H87","descripcion":"SILICA CON KERATINA Y 12 OLEOS 120ML JALOMA-759064101251 M1271","precioUnitario":37.68,"importe":904.32},
      {"id":"item-19","codigo":"M1252","cantidad":25,"unidadMedida":"H87","descripcion":"ACEITE DE ALMENDRAS JALOMA 120ML -759064031311 - M1252","precioUnitario":24.64,"importe":616.00},
      {"id":"item-20","codigo":"M1230","cantidad":2,"unidadMedida":"H87","descripcion":"VITROLERO P/LABIOS C/60 PZA JALOMA-7590640391230 M1230","precioUnitario":216.00,"importe":432.00},
      {"id":"item-21","codigo":"M1419","cantidad":6,"unidadMedida":"H87","descripcion":"ESPONJABON EFECTO ANTIAQNE -741021029188 / T-TAKI ACIDO HIALURONICO M1419","precioUnitario":26.90,"importe":161.40},
      {"id":"item-22","codigo":"M1192","cantidad":12,"unidadMedida":"H87","descripcion":"ESPONJABON ACLARANTE CONCHA NACAR-7501102202854 M1192","precioUnitario":26.90,"importe":322.80},
      {"id":"item-23","codigo":"M1054","cantidad":12,"unidadMedida":"H87","descripcion":"CREMA 7ALMENDRAS EX-HUM 750ML -7501062721706 M1054","precioUnitario":33.78,"importe":405.36},
      {"id":"item-24","codigo":"M1050","cantidad":12,"unidadMedida":"H87","descripcion":"CREMA P/RESECA MIEL/AVENA 750ML -7501062721676 M1050","precioUnitario":33.78,"importe":405.36},
      {"id":"item-25","codigo":"M1405","cantidad":36,"unidadMedida":"H87","descripcion":"ALCOHOL SAN LUIS 250ML AZUL -2003101170 M1405","precioUnitario":14.20,"importe":511.20},
      {"id":"item-26","codigo":"M1289","cantidad":24,"unidadMedida":"H87","descripcion":"GEL ANTIB MANZANA LITHUS 500ML -JEJ220707UMA2 M1289","precioUnitario":34.54,"importe":828.96},
      {"id":"item-27","codigo":"M1009","cantidad":12,"unidadMedida":"H87","descripcion":"CREMA NIVEL 3 EN 1 M-SUPERFDE 230G JOMA -7501062722420 M1009","precioUnitario":27.65,"importe":331.80},
      {"id":"item-28","codigo":"M1044","cantidad":12,"unidadMedida":"H87","descripcion":"CREMA ROSA 600 G ACLARADO IDEAL -7501062721997 M1044","precioUnitario":40.39,"importe":484.68},
      {"id":"item-29","codigo":"M1045","cantidad":12,"unidadMedida":"H87","descripcion":"CREMA AZUL 600G EXTRA CON KARITE -7501062721980 M1045","precioUnitario":40.39,"importe":484.68}
    ]'::jsonb,
    13198.81,
    0.00,
    13198.81,
    'TRECE MIL CIENTO NOVENTA Y OCHO PESOS 81/100 M.N.',
    '30 DÍAS / VIGENCIA INMEDIATA',
    'INMEDIATA SALVO PREVIA VENTA',
    'PAGO EN PARCIALIDADES O DIFERIDO',
    'Administrador',
    'vigente'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Nota de Venta de muestra (003087)
INSERT INTO public.sale_notes (
    id, folio, fecha_emision, lugar_expedicion, emisor_nombre, emisor_direccion,
    emisor_colonia_cp, emisor_ciudad_estado, emisor_telefono, emisor_email,
    cliente_id, cliente_nombre, cliente_rfc, cliente_direccion, cliente_colonia_cp,
    cliente_ciudad, cliente_telefono, items, subtotal, descuento, total,
    total_letra, observaciones, estado
)
VALUES (
    'nota-001',
    '003087',
    '2026-10-22',
    'SAN LUIS POTOSI, San Luis Potosi',
    'RAGUX DITRIBUCIONES',
    'VILLERIAS #273',
    'SAUCITO C.P. 78110',
    'SAN LUIS POTOSI, San Luis Potosi',
    'whatsapp (444)-3053182',
    'raguxdistribuciones@gmail.com',
    'cli-004',
    'MAXSTORE SUCURSAL ARRIAGA',
    'SEFA900405BC9',
    'VILLA DE ARRIAGA s/n',
    'CENTRO C.P. 78490',
    'VILLA DE ARRIAGA , SAN LUIS POTOSI',
    '( ) - - -',
    '[
      {"id":"item-n1","codigo":"M0054","cantidad":24,"unidad":"PIEZAS","descripcion":"SALSA VALENTINA PICANTE 24/370ML 097339000054 -M0054","precioUnitario":15.95,"importe":382.80},
      {"id":"item-n2","codigo":"M0055","cantidad":1,"unidad":"PIEZAS","descripcion":"BIG FACIAL QUALITY 600 HOJAS PAPEL HIGIENICO *********** BULTO C/8PAQUETES *********** -","precioUnitario":515.87,"importe":515.87},
      {"id":"item-n3","codigo":"M1132","cantidad":36,"unidad":"PIEZAS","descripcion":"DODYS TOALLITA 80PZS AZUL- 7502221010729 M1132","precioUnitario":27.46,"importe":988.56},
      {"id":"item-n4","codigo":"M4302","cantidad":10,"unidad":"PIEZAS","descripcion":"SERVILLETA PETALO C/100 7501007704302 M4302","precioUnitario":19.85,"importe":198.50}
    ]'::jsonb,
    2085.73,
    0.00,
    2085.73,
    'DOS MIL OCHENTA Y CINCO PESOS 73/100 M.N.',
    'ESTIMADO CLIENTE UNA VEZ CHECADA,ENTREGADA,ACEPTADA LAMERCANCIA Y FIRMADA ESTE COMPROBANTE POR NIGUN MOTIVO SE ACEPTAN RECLAMACIONES Y/O DEVOLUCIONES POSTERIORES A LA FECHA DE ENTREGA FAVOR DE REVISAR BIEN SU MERCANCIA. GRACIAS.',
    'pendiente'
)
ON CONFLICT (id) DO NOTHING;
