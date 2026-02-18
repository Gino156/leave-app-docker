FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Ang --host ay kailangan para ma-access ang Vite mula sa labas ng container
CMD ["npm", "run", "dev", "--", "--host"]