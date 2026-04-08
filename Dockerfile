FROM node:20-alpine

# Identify working file/folder inside container
WORKDIR /app

# Cashing
COPY package*.json ./

# Install libs
RUN npm install

# Copying project code
COPY . .

# Ts build command
RUN npm run build

# Docker Port
EXPOSE 5000

# Final start command
CMD ["node", "dist/server.js"]
