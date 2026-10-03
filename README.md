# 📦 KARDEX ALMACÉN V3 WEB

Sistema de control de inventarios web moderno y seguro, diseñado para reemplazar la antigua arquitectura de archivos locales por una solución robusta en la nube.

## 🏗️ Arquitectura del Proyecto

El ecosistema está dividido en dos grandes bloques:

### 1. 🧠 El Cerebro: API Backend (Kardex V3)
Construida en Python utilizando **FastAPI**. Su rol es vivir en la nube (Render) y servir como puente seguro entre cualquier cliente y la Base de Datos (Neon PostgreSQL).

**Funciones Principales:**
- Procesa todas las reglas de negocio (Entradas, Salidas, Lotes).
- Emite y valida Tokens JWT (Seguridad de Sesión).
- Administra el control de Roles (Admin vs Operario).
- Generación de comprobantes y guías en PDF (`ReportLab`).

**Evolución y Mejoras (Lo Precario vs Lo Actual):**
- **De Local a Nube:** Se abandonó el almacenamiento local de archivos `.json` (V2) por una BD relacional en la nube (PostgreSQL), evitando la pérdida de datos y permitiendo sincronización multi-sucursal.
- **Seguridad Anti-Fuerza Bruta:** Se implementó un *Rate Limiting* estricto (`Slowapi`) que bloquea IPs maliciosas y rastrea intentos fallidos, blindando el sistema contra ataques.

### 2. 🌐 La Cara: Interfaz Web (Kardex V3)
Portal moderno construido con **React + Vite** y CSS Vainilla. Permite a los operarios de campo y supervisores acceder al inventario desde cualquier navegador web, celular o tablet.

**Funciones Principales:**
- Diseño *Mobile-First* (Responsivo).
- Gráficos interactivos en tiempo real (`Recharts`).
- Panel de reportes y transferencias de inventario al instante.
- **Movilidad del 100%:** Un almacenero puede caminar por los pasillos con su celular, registrar un despacho, y este aparecerá en la computadora del Administrador en cuestión de milisegundos.

---

## 🚀 Guía de Instalación Rápida (Entorno Local)

Sigue estos pasos para levantar el entorno de desarrollo en cualquier máquina nueva (Windows, Mac o Linux):

### Paso 1: Clonar el proyecto
```bash
git clone https://github.com/tu_usuario/KARDEX-ALMACEN-V3-WEB.git
cd KARDEX-ALMACEN-V3-WEB
```

### Paso 2: Configurar y Levantar el Backend
```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows usar: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno
# Crear un archivo .env dentro de la carpeta "backend" y colocar:
# NEON_URL="postgresql://usuario:contraseña@neon.tech..."

# Arrancar el servidor
uvicorn app.main:app --reload --port 8000
```

### Paso 3: Configurar y Levantar el Frontend
```bash
# Abrir una nueva terminal
cd frontend

# Instalar librerías
npm install

# (Opcional) Variables de Entorno Locales
# Crear un archivo .env en la carpeta "frontend" y colocar:
# VITE_API_URL=http://localhost:8000

# Levantar el proyecto
npm run dev
```
### Otra opcion
```bash
# Entrar directamente a traves del link fijado

```






  ##
