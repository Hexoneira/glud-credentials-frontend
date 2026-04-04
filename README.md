<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:091e3a,45:0f2b3f,100:1a3a52&text=GLUD%20CREDENTIALS%20FRONTEND&fontColor=ffffff&fontSize=38&fontAlignY=40&desc=Hexoneira%20x%20GLUD%20%7C%20Mobile-first%20Credential%20Experience&descAlignY=62&animation=fadeIn" alt="GLUD Credentials Frontend Banner" />
</p>

<p align="center">
	<strong>Frontend oficial del carnet digital GLUD</strong><br />
	Experiencia mobile-first para visualizacion, validacion y control de membresia.
</p>

<p align="center">
	<a href="https://astro.build/"><img alt="Astro" src="https://img.shields.io/badge/Astro-5.x-0b132b?style=for-the-badge&logo=astro&logoColor=white"></a>
	<a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19.x-1c2541?style=for-the-badge&logo=react&logoColor=61dafb"></a>
	<a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-4.x-3a506b?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8"></a>
	<a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-5bc0be?style=for-the-badge&logo=typescript&logoColor=0b132b"></a>
</p>

<p align="center">
	<img alt="Focus" src="https://img.shields.io/badge/Focus-Mobile%20First-0b132b?style=flat-square">
	<img alt="Visual Direction" src="https://img.shields.io/badge/Visual%20Direction-GLUD%20Aesthetic-1c2541?style=flat-square">
	<img alt="Architecture" src="https://img.shields.io/badge/Architecture-Frontend%20Web%20App-3a506b?style=flat-square">
	<img alt="Integration" src="https://img.shields.io/badge/Integration-GLUD%20Credentials%20API-5bc0be?style=flat-square&logoColor=0b132b">
	<img alt="Node" src="https://img.shields.io/badge/Node.js-22%2B-0f2b3f?style=flat-square&logo=node.js&logoColor=7dd3fc">
</p>

## Resumen Ejecutivo

GLUD Credentials Frontend es la interfaz oficial para gestionar la experiencia digital de credenciales de miembros GLUD.
El proyecto esta orientado a rendimiento, legibilidad y claridad operativa en dispositivos moviles, con una linea visual corporativa de alto contraste y acentos neon.

## Propuesta de Valor

- Centraliza el carnet digital en una vista clara y verificable.
- Reduce friccion en validaciones mediante QR y codigo dinamico.
- Asegura consistencia visual con la identidad GLUD.
- Prioriza lectura rapida en pantallas pequenas y escenarios de uso real.

## Alcance Funcional

- Autenticacion del miembro contra API.
- Visualizacion del carnet digital activo.
- Datos clave de perfil y estado de membresia.
- Validacion por QR y codigo temporal.
- Manejo de estados de carga, error, sin credencial y vigencia.
- Diseno responsive con enfoque mobile-first.

## Arquitectura Frontend

| Capa | Tecnologia | Responsabilidad |
| --- | --- | --- |
| App shell | Astro | Enrutamiento, SSR y optimizacion de carga inicial |
| Interactividad | React | Componentes dinamicos del carnet y QR |
| UI System | Tailwind CSS | Estilos utilitarios, escala responsive y consistencia visual |
| Tipado | TypeScript | Seguridad de tipos y mantenibilidad |

## Direccion de Diseno

| Aspecto | Definicion |
| --- | --- |
| Fondo | Oscuro profundo con gradientes sutiles |
| Acentos | Cian/azul electrico para estados y foco visual |
| Tipografia | Jerarquia fuerte, legible y orientada a movil |
| Estilo | Sobrio, tecnico y corporativo |
| Composicion | Carnet como elemento principal y contexto minimo |

Principios UX aplicados:

- Mobile-first real.
- Interaccion corta y directa.
- Claridad de estado en todo momento.
- Legibilidad alta en diferentes condiciones de luz.

## Integracion con Backend

Este frontend consume la API GLUD Credentials para autenticacion, consulta de miembro y estado de credencial.

- Backend relacionado: [GLUD Credentials API (Spring Boot)](https://github.com/hexoneira/glud-credentials-api)

## Inicio Rapido

### Requisitos

- Node.js 20 o superior (recomendado 22 LTS)
- npm 10 o superior

### Instalacion y ejecucion

```bash
npm install
npm run dev
```

### Build y preview

```bash
npm run build
npm run preview
```

### Variable de entorno esperada

```bash
PUBLIC_API_BASE_URL=http://localhost:8080
```

## Scripts Disponibles

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Levanta entorno de desarrollo |
| `npm run build` | Genera build de produccion |
| `npm run preview` | Sirve build localmente |
| `npm run astro` | Ejecuta comandos Astro CLI |

## Estructura del Proyecto

```text
src/
	components/
		CarnetPanel.astro
		TOTPQRBlock.tsx
		QRGenerator.tsx
	pages/
		index.astro
		carnet.astro
	styles/
		global.css
	config.ts
```

## Criterios de Calidad

- Performance y accesibilidad orientadas a Lighthouse mobile.
- Componentes reutilizables y tipados.
- Manejo centralizado de errores de API.
- Escalado visual consistente entre breakpoints.

## Organizacion

Proyecto desarrollado por Hexoneira para GLUD (Grupo GNU/Linux Universidad Distrital).

## Licencia

Distribuido bajo la licencia definida en `LICENSE`.
