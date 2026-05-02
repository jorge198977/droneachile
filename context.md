# 🚀 DroneaChile – Backend Requirements (Full)

## 🧠 Visión del Proyecto

**DroneaChile** es una plataforma tipo red social enfocada en contenido audiovisual aéreo de Chile, donde usuarios pueden:

- Subir videos (principalmente desde YouTube)
- Explorar contenido por región
- Interactuar (likes, comentarios, compartir)
- Descubrir tendencias mediante IA

El sistema debe ser **escalable, modular y preparado para procesamiento inteligente en el futuro**.

---

# 🏗️ Arquitectura

## 🧩 Patrón: Hexagonal (Ports & Adapters)

Separación clara de responsabilidades:

```txt
src/
 ├── domain/         → entidades y lógica pura
 ├── application/    → casos de uso
 ├── infrastructure/ → prisma, servicios externos
 ├── interfaces/     → controllers (HTTP)
```

---

## 🧠 Principios

- Clean Code
- SOLID
- Separación de responsabilidades
- Preparado para escalabilidad
- Bajo acoplamiento

---

# ⚙️ Stack Tecnológico

- **Backend:** NestJS
- **ORM:** Prisma
- **Base de datos:** PostgreSQL
- **Auth:** JWT
- **Contenedores:** Docker + docker-compose
- **Cache / Cola (futuro):** Redis + BullMQ
- **Storage (futuro):** Cloudflare R2 / Amazon S3

---

# 🧩 Módulos del Sistema

## 🔐 1. Auth

### Funcionalidades

- Registro
- Login
- JWT access token
- Protección de rutas

---

## 👤 2. Users

### Funcionalidades

- Obtener perfil
- Editar perfil
- Avatar (futuro)
- Ver videos del usuario

---

## 🎥 3. Videos (CORE)

### Funcionalidades

- Crear video (URL YouTube)
- Editar video
- Eliminar video
- Listar videos
- Obtener detalle

### Estados

- `pending`
- `published`
- `rejected`

### Reglas

- Solo admin aprueba contenido
- Videos nuevos quedan en `pending`

---

## 🌎 4. Regions

### Funcionalidades

- CRUD (admin)
- Listado público

---

## 🏷️ 5. Categories

### Funcionalidades

- Crear categorías
- Asignar a videos

---

## ❤️ 6. Likes

### Funcionalidades

- Dar like
- Quitar like
- Contador por video

---

## 💬 7. Comments

### Funcionalidades

- Crear comentario
- Eliminar comentario
- Listar comentarios por video

---

## 👁️ 8. Views

### Funcionalidades

- Registrar visualización
- Métricas

---

## 🛡️ 9. Moderation

### Funcionalidades

- Aprobar video
- Rechazar video
- Registrar logs

---

## 🤖 10. AI Module (Fase 2+)

### Funcionalidades

- Generar títulos automáticos
- Generar descripciones
- Generar tags
- Ranking inteligente
- Detección de tendencias

---

# 🧠 Modelo de Datos (Prisma)

## User

- id
- name
- email
- password
- role (admin | creator | user)
- avatarUrl
- createdAt

---

## Video

- id
- title
- description
- videoUrl
- thumbnailUrl
- source (youtube | upload)
- regionId
- userId
- status
- views
- likes
- createdAt

---

## Region

- id
- name
- slug

---

## Category

- id
- name

---

## VideoCategory

- videoId
- categoryId

---

## Like

- id
- userId
- videoId

---

## Comment

- id
- userId
- videoId
- content
- createdAt

---

## View

- id
- videoId
- userId (optional)
- createdAt

---

## ModerationLog

- id
- videoId
- adminId
- action
- reason
- createdAt

---

## Clip (futuro IA)

- id
- videoId
- startTime
- endTime
- clipUrl

---

# 🔌 API Endpoints

## Auth

- POST /auth/register
- POST /auth/login

---

## Users

- GET /users/me
- GET /users/:id

---

## Videos

- GET /videos
- GET /videos/:id
- POST /videos
- PATCH /videos/:id
- DELETE /videos/:id

---

## Moderation

- PATCH /videos/:id/approve
- PATCH /videos/:id/reject

---

## Regions

- GET /regions

---

## Likes

- POST /videos/:id/like
- DELETE /videos/:id/like

---

## Comments

- GET /videos/:id/comments
- POST /videos/:id/comments
- DELETE /comments/:id

---

## Views

- POST /videos/:id/view

---

# 🤖 IA – Lógica

## Generación automática

Input:

- título YouTube
- región
- contexto

Output:

- título optimizado
- descripción
- tags

---

## Ranking

```txt
score = views * 0.5 + likes * 2 + comments * 3
```

---

## Trending

- crecimiento de views
- engagement

---

# 🐳 Infraestructura (Docker)

## Servicios

- api (NestJS)
- db (PostgreSQL)
- redis (futuro)
- worker (futuro)

---

## Estrategia

- MVP sin workers
- preparado para background jobs

---

# 🚀 Roadmap

## Fase 1 (MVP)

- Auth
- Videos (YouTube)
- Regiones
- Moderación

---

## Fase 2

- Likes
- Comentarios
- Views

---

## Fase 3

- Ranking
- Trending

---

## Fase 4

- IA
- Clips automáticos

---

# 🔐 Seguridad

- JWT obligatorio
- Validación de datos
- Roles y permisos
- Rate limiting (futuro)

---

# 🧠 Consideraciones Clave

- No almacenar videos en MVP
- Usar YouTube como storage
- Diseñar para escalar
- Preparar integración con IA
- Separar lógica de negocio correctamente

---

# 🎯 Objetivo Final

Construir una plataforma donde:

> Los usuarios descubren, comparten y viven Chile desde el aire mediante contenido generado por la comunidad y potenciado por inteligencia artificial.

---
