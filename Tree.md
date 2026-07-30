smart-toy/
├── mobile/                    # Aplicación React Native
│   ├── src/
│   │   ├── assets/           # Imágenes, fuentes, etc.
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── icons/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── common/       # Botones, inputs, etc.
│   │   │   ├── child/        # Componentes del perfil del niño
│   │   │   └── toy/          # Componentes del muñeco
│   │   ├── screens/          # Pantallas de la app
│   │   │   ├── auth/         # Login, registro
│   │   │   ├── dashboard/    # Panel principal
│   │   │   ├── child/        # Configuración del niño
│   │   │   └── toy/          # Control del muñeco
│   │   ├── navigation/       # Configuración de rutas
│   │   ├── services/         # APIs y servicios
│   │   ├── store/            # Estado global (Redux/Zustand)
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utilidades
│   │   └── types/            # Definiciones TypeScript
│   ├── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Servidor Node.js
│   ├── src/
│   │   ├── controllers/      # Lógica de rutas
│   │   ├── services/         # Lógica de negocio
│   │   ├── models/           # Modelos de datos
│   │   ├── routes/           # Definición de rutas
│   │   ├── middleware/       # Auth, validación
│   │   ├── config/           # Configuraciones
│   │   └── utils/            # Utilidades
│   ├── package.json
│   └── tsconfig.json
│
├── design/                    # Archivos de Figma
│   └── prototypes/
│
└── README.md