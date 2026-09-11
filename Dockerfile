# Imagen oficial de Node.js alojada en Amazon Public ECR (sin límites de rate limit 429 de Docker Hub)
FROM public.ecr.aws/docker/library/node:22-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar manifiestos de paquetes e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar código de la aplicación
COPY . .

# Crear volumen o carpeta para la base de datos persistente
RUN mkdir -p /app/data

# Exponer el puerto del servidor
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la plataforma
CMD ["node", "server.js"]
