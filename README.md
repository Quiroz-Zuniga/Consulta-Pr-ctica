# Consulta Práctica Web — Sistema de Gestión Médica

**Consulta Práctica Web** es la migración integral del sistema médico legacy *"Consulta Práctica"* (Visual Basic / Microsoft Access `.mdb`) hacia una plataforma web moderna basada en **Clean Architecture**. Gestiona expedientes clínicos, emisión de recetas en PDF, agenda de citas en tiempo real y diagnósticos CIE-10, garantizando inmutabilidad legal de los historiales médicos y acceso multiusuario seguro.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
|---|---|---|
| **Backend Framework** | Node.js + Fastify | API REST de alto rendimiento y bajo consumo (< 35 MB RAM) |
| **Lenguaje** | TypeScript (`strict: true`) | Tipado estricto en todas las capas del backend |
| **Base de Datos / BaaS** | Supabase (PostgreSQL 16) | Auth JWT, Row Level Security (RLS), Storage, Realtime |
| **Motor de PDF** | PDFKit | Generación streaming de recetas médicas en PDF |
| **Validación** | Zod | Esquemas de validación de entrada en capa de interfaces |
| **Testing** | Node.js Test Runner + `tsx` | Pruebas de integración y unitarias para casos de uso |

---

## 📦 Lista de Dependencias

### Requisitos Previos
- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior

### Dependencias de Producción (`dependencies`)
| Paquete | Descripción |
|---|---|
| `fastify` (`^4.28.0`) | Framework web ligero para Node.js |
| `@fastify/cors` (`^9.0.1`) | Plugin de soporte CORS para Fastify |
| `@supabase/supabase-js` (`^2.49.0`) | SDK oficial de cliente para Supabase |
| `zod` (`^3.23.0`) | Declaración y validación de esquemas de datos |
| `pdfkit` (`^0.15.0`) | Generador de documentos PDF para Node.js |

### Dependencias de Desarrollo (`devDependencies`)
| Paquete | Descripción |
|---|---|
| `typescript` (`^5.4.0`) | Compilador TypeScript |
| `tsx` (`^4.7.0`) | Ejecutor TypeScript rápido y test runner |
| `@types/node` (`^20.12.0`) | Tipos de TypeScript para Node.js |
| `@types/pdfkit` (`^0.13.4`) | Tipos de TypeScript para PDFKit |

---

## 📂 Arquitectura del Proyecto (Clean Architecture)

```plaintext
backend/src/
├── domain/                  # Entidades puras, Value Objects, Puertos (Interfaces)
│   ├── entities/            # Patient.ts, MedicalHistory.ts, Prescription.ts, User.ts...
│   ├── value-objects/       # ICD10Code.ts, PatientID.ts...
│   └── ports/               # IPatientRepository.ts, IMedicalHistoryRepository.ts, IStorageService.ts...
├── application/             # Casos de Uso del negocio
│   ├── use-cases/           # AuthenticateUser.ts, RegisterConsultation.ts, SearchCIE10.ts...
│   └── dtos/                # Data Transfer Objects
├── infrastructure/          # Adaptadores técnicos y Servicios de Infraestructura
│   ├── supabase/            # Repositorios concretos PostgreSQL / Supabase
│   ├── pdf/                 # PdfKitService.ts (Motor de recetas PDF)
│   └── storage/             # SupabaseStorageService.ts
├── interfaces/              # Adaptadores HTTP / Rutas y Middlewares
│   ├── routes/              # authRoutes.ts, patientRoutes.ts, consultationRoutes.ts...
│   └── middlewares/         # authMiddleware.ts, roleGuard.ts
└── tests/                   # Suite de pruebas unitarias e integración
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/Quiroz-Zuniga/Consulta-Pr-ctica.git
cd Consulta-Pr-ctica/backend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` e ingresa tus credenciales de Supabase:

```bash
cp .env.example .env
```

Contenido de `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-jwt-secret

STORAGE_BUCKET_PRESCRIPTIONS=prescription-pdfs
STORAGE_BUCKET_PHOTOS=patient-photos
```

---

## 🚀 Comandos de Ejecución

Dentro del directorio `backend/`:

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con autorecarga (`tsx watch`) |
| `npm run typecheck` | Ejecuta la verificación estática de tipos con `tsc --noEmit` |
| `npm run test` | Ejecuta la suite de pruebas unitarias e integración de los casos de uso |
| `npm run build` | Compila el código TypeScript a JavaScript en `dist/` |
| `npm start` | Inicia el servidor compilado de producción (`node dist/server.js`) |

---

## 🛡️ Licencia y Propiedad
Proyecto privado para gestión clínica médica. Todos los derechos reservados.
