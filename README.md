# Virtual Office - Sistema de Flujos Documentales

Plataforma profesional para gestión de flujos documentales, automatización de procesos y orquestación de tareas en entornos multi-departamento.

## Características Principales

- **Editor Visual de Flujos**: Diseña flujos complejos con @xyflow/react
- **Motor de Orquestación**: Ejecución confiable de instancias con garantías ACID
- **Tareas Multi-Usuario**: Asignaciones, firmas paralelas y secuenciales
- **Auditoría Completa**: Trazabilidad total de cada transición
- **Notificaciones en Tiempo Real**: WebSocket y SSE
- **Devoluciones Anotadas**: Sistema flexible de retorno y corrección
- **Webhooks Inteligentes**: Con reintentos y manejo de errores
- **Idempotencia**: Garantía de operaciones sin duplicados
- **Concurrencia Segura**: Locking distribuido con Redis Redlock

## Stack Técnico

### Frontend
- **Next.js 16** con App Router
- **React 19** y TypeScript
- **@xyflow/react** para flujos visuales
- **Zustand** para state management
- **Tailwind CSS** para estilos
- **Sonner** para notificaciones

### Backend
- **Node.js** con TypeScript
- **Prisma** para ORM
- **MySQL 8.0** para persistencia
- **Redis 7** para caché y locks
- **WebSocket** para real-time

### Infraestructura
- **Docker Compose** para orquestación local
- **MailHog** para testing de email
- **Redlock** para locks distribuidos

## Instalación

### Requisitos Previos
- Node.js 18+
- pnpm 10+
- Docker y Docker Compose
- MySQL 8.0 (o usar Docker)
- Redis 7 (o usar Docker)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd tabuladores
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
DATABASE_URL="mysql://virtual_office:virtual_office_password@localhost:3306/virtual_office"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="tu-clave-secreta-aqui"
```

4. **Iniciar servicios Docker**
```bash
docker-compose up -d
```

5. **Ejecutar migraciones y seed**
```bash
pnpm db:push
pnpm db:seed
```

6. **Iniciar desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
tabuladores/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Layout raíz
│   │   ├── page.tsx         # Home
│   │   ├── dashboard/       # Bandeja de trabajo
│   │   └── editor/          # Editor de flujos
│   ├── lib/
│   │   ├── config.ts        # Configuración centralizada
│   │   ├── db.ts            # Cliente Prisma
│   │   ├── redis.ts         # Cliente Redis
│   │   ├── logger.ts        # Logger centralizado
│   │   ├── services/        # Servicios core
│   │   │   ├── flow.service.ts
│   │   │   ├── orchestrator.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── lock.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── idempotency.service.ts
│   │   │   └── webhook.service.ts
│   │   └── actions/         # Server Actions
│   │       ├── flows.actions.ts
│   │       ├── documents.actions.ts
│   │       └── tasks.actions.ts
│   ├── store/               # Zustand stores
│   │   ├── flow.store.ts
│   │   ├── task.store.ts
│   │   └── notification.store.ts
│   ├── types/               # TypeScript types
│   └── components/          # Componentes React
├── prisma/
│   ├── schema.prisma        # Schema de BD
│   └── seed.js              # Datos iniciales
├── docker-compose.yml       # Orquestación de servicios
├── package.json
├── tsconfig.json
└── next.config.ts
```

## API - Server Actions

### Flows
- `createFlowAction()` - Crear nuevo flujo
- `updateFlowAction()` - Actualizar flujo existente
- `getFlowAction()` - Obtener flujo por ID
- `getFlowsByDepartmentAction()` - Listar flujos de departamento

### Documents
- `createDocumentAction()` - Crear documento e iniciar instancia
- `getDocumentAction()` - Obtener documento con instancias
- `getDocumentsByDepartmentAction()` - Listar documentos

### Tasks
- `completeTaskAction()` - Completar tarea
- `getUserTasksAction()` - Obtener tareas asignadas
- `returnInstanceAction()` - Devolver instancia a nodo anterior
- `annotateInstanceAction()` - Agregar anotación

## Caso de Uso: Orden de Pago

1. Contador crea documento tipo `order_payment`
2. Sistema inicia instancia con flujo
3. Se crean tareas paralelas de firma para jefes
4. Al completarse ambas firmas, se genera tarea para finanzas
5. Finanzas aprueba o devuelve con anotaciones
6. Si devuelve, contador corrige y reenvía
7. Instancia se completa exitosamente

## Garantías Técnicas

### Concurrencia
- Locking por instancia con Redis Redlock
- Previene condiciones de carrera
- TTL automático de locks

### Idempotencia
- Todas las acciones aceptan `idempotencyKey`
- Resultados cacheados por 24 horas
- Evita duplicados en reintentos

### Auditoría
- Registro de cada acción en `AuditLog`
- Trazabilidad completa de flujo
- Cambios versionados

### Notificaciones
- WebSocket para actualizaciones en tiempo real
- Fallback a polling si es necesario
- Preferencias personalizables por usuario

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo

# Build
pnpm build            # Compila para producción
pnpm start            # Inicia servidor de producción

# Base de datos
pnpm db:push          # Sincroniza schema con BD
pnpm db:migrate       # Ejecuta migraciones
pnpm db:seed          # Carga datos iniciales
pnpm db:studio        # Abre Prisma Studio (GUI)

# Linting
pnpm lint             # Verifica código
pnpm format           # Formatea código

# Workers
pnpm worker           # Inicia worker de orquestación
```

## Configuración de Producción

1. **Variables de Entorno**
   - Cambiar `NEXTAUTH_SECRET` a valor aleatorio fuerte
   - Usar SMTP real en lugar de MailHog
   - Configurar `REDIS_URL` con Redis en producción
   - Cambiar `DATABASE_URL` a MySQL en producción

2. **Seguridad**
   - Habilitar HTTPS
   - Configurar CORS apropiadamente
   - Validar y sanitizar todas las entradas
   - Usar roles y permisos

3. **Performance**
   - Configurar CDN para assets estáticos
   - Habilitar caching en Redis
   - Configurar índices de BD
   - Monitorear logs y métricas

4. **Backup**
   - Backups automáticos de MySQL
   - Replicación de Redis
   - Versionado de flujos

## Desarrollo

### Agregar un nuevo servicio

1. Crear archivo en `src/lib/services/nuevo.service.ts`
2. Implementar clase con métodos públicos
3. Exportar instancia singleton
4. Usar en actions o servicios

### Agregar una página

1. Crear directorio en `src/app/`
2. Crear `page.tsx` con componente
3. Usar Server Actions para datos
4. Estilizar con Tailwind CSS

### Agregar un tipo

1. Agregar a `src/types/index.ts`
2. Exportar desde el archivo
3. Usar en servicios y acciones

## Troubleshooting

### Error de conexión a BD
```bash
docker-compose logs mysql
```

### Error de Redis
```bash
docker-compose logs redis
```

### Limpiar todo y reiniciar
```bash
docker-compose down -v
docker-compose up -d
pnpm db:push
pnpm db:seed
```

## Monitoreo

- **Logs**: Centralizados en `logger.ts`
- **Métricas**: Disponibles en Redis Insights
- **BD**: Acceso via Prisma Studio (`pnpm db:studio`)
- **Mail**: Panel MailHog en `http://localhost:8025`

## Seguridad

- Validación de entrada con Zod
- SQL Injection protection via Prisma
- XSS prevention en React
- CSRF tokens en forms
- Roles basados en acceso
- Auditoría completa

## Performance

- Índices en campos frecuentes
- Caché en Redis
- Paginación en listados
- Lazy loading en frontend
- Compresión Gzip

## Licencia

Privado - Derechos reservados

## Soporte

Para issues o preguntas, contactar al equipo de desarrollo.
