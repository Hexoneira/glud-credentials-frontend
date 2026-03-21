<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:091e3a,45:0f2b3f,100:1a3a52&text=GLUD%20CREDENTIALS%20FRONTEND&fontColor=ffffff&fontSize=38&fontAlignY=40&desc=Hexoneira%20x%20GLUD%20%7C%20Mobile-first%20Credential%20Experience&descAlignY=62&animation=fadeIn" alt="GLUD Credentials Frontend Banner" />
</p>

<p align="center">
	<a href="https://astro.build/" target="_blank"><img alt="Astro" src="https://img.shields.io/badge/Astro-5.x-0b132b?style=for-the-badge&logo=astro&logoColor=white"></a>
	<a href="https://react.dev/" target="_blank"><img alt="React" src="https://img.shields.io/badge/React-19.x-1c2541?style=for-the-badge&logo=react&logoColor=61dafb"></a>
	<a href="https://tailwindcss.com/" target="_blank"><img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-4.x-3a506b?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8"></a>
	<a href="https://www.typescriptlang.org/" target="_blank"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-5bc0be?style=for-the-badge&logo=typescript&logoColor=0b132b"></a>
</p>

<p align="center">
	<img alt="UX" src="https://img.shields.io/badge/Focus-Mobile%20First-0b132b?style=flat-square">
	<img alt="Identity" src="https://img.shields.io/badge/Visual%20Direction-GLUD%20Aesthetic-1c2541?style=flat-square">
	<img alt="Architecture" src="https://img.shields.io/badge/Architecture-Frontend%20Web%20App-3a506b?style=flat-square">
	<img alt="Integration" src="https://img.shields.io/badge/Integration-GLUD%20Credentials%20API-5bc0be?style=flat-square&logoColor=0b132b">
</p>

## GLUD Credentials Frontend

Frontend oficial para la visualizacion del carnet digital de miembros GLUD y sus datos asociados, optimizado para dispositivos moviles.

Este proyecto esta disenado para ofrecer una experiencia rapida, clara y segura, manteniendo la linea visual de [glud.org](https://glud.org): contraste oscuro, acentos neon, tipografia contundente y componentes orientados a comunidad tecnologica.

## Objetivo

Construir una web app enfocada en moviles donde cada miembro pueda:

- Consultar su carnet digital activo.
- Ver estado de membresia y vigencia.
- Acceder a informacion esencial de perfil.
- Validar y compartir su credencial de forma simple (por QR o identificador).

## Alcance funcional

- Autenticacion del miembro (flujo seguro contra API).
- Vista principal del carnet digital.
- Pantalla de detalles de membresia.
- Visualizacion de QR/identificador para validacion.
- Manejo de estados: cargando, sin credencial, expirada, error de red.
- Diseno responsive con prioridad absoluta a pantallas pequenas.

## Stack oficial

- Astro (estructura, routing y rendimiento web)
- React (componentes interactivos)
- Tailwind CSS (sistema de estilos utilitario)
- TypeScript (tipado estricto)

## Direccion de diseño

Basado en la estetica de GLUD:

| Aspecto | Definicion |
| --- | --- |
| Fondo | Oscuro profundo con gradientes sutiles. |
| Acentos | Cian/azul electrico para acciones primarias. |
| Tipografia | Fuerte para titulares y lectura clara en movil. |
| Recursos visuales | Elementos geometricos ligeros como apoyo visual. |
| Jerarquia | Simple, con foco en el carnet como pieza central. |

Principios UX del proyecto:

| Principio | Aplicacion |
| --- | --- |
| Mobile first real | Se disena primero para smartphone. |
| Interaccion corta | Maximo valor en pocos toques. |
| Claridad de estado | Siempre mostrar que ocurre. |
| Legibilidad | Alta en exteriores y pantallas pequenas. |

## Integracion con backend

Este frontend consume la API del proyecto GLUD Credentials API para autenticacion, consulta de miembro y lectura de credencial digital.

Repositorio backend relacionado:
- [GLUD Credentials API (Spring Boot)](https://github.com/hexoneira/glud-credentials-api)

## Inicio rapido

### Requisitos

- Node.js 20 o superior (recomendado 22 LTS)
- npm 10 o superior

### 1) Instalar dependencias

```bash
npm install
```

### 2) Ejecutar en desarrollo

```bash
npm run dev
```

### 3) Build de produccion

```bash
npm run build
```

### 4) Preview local

```bash
npm run preview
```

## Flujo funcional principal

1. El miembro inicia sesion.
2. El sistema consulta su estado de membresia.
3. Se renderiza el carnet digital con datos vigentes.
4. El usuario puede mostrar QR/identificador para validacion.
5. Se gestionan estados alternos (sin carnet, expirado o error).

## Criterios de calidad del frontend

- Lighthouse mobile con foco en Performance y Accessibility.
- Tiempo de carga inicial bajo en red movil.
- Componentes reutilizables y tipados.
- Estilos consistentes mediante tokens y utilidades Tailwind.
- Manejo centralizado de errores de API.

## Organizacion

Proyecto desarrollado por Hexoneira para GLUD (Grupo GNU/Linux Universidad Distrital).

## Licencia

Este repositorio se distribuye bajo la licencia definida en `LICENSE`.
