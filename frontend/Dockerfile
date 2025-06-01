# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if available)
COPY package*.json ./

# Install project dependencies
# Vite projects might use yarn or pnpm, but the script used npm create vite
# so package-lock.json is expected. If it was yarn, it'd be yarn.lock
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Build the Vite app
RUN npm run build

# For serving the static build, you might use a server like 'serve' or nginx.
# Using 'serve' package to serve the build folder
RUN npm install -g serve
EXPOSE 5173

# The command to run when the container starts
# For development, docker-compose overrides this with 'npm run dev'.
# For a production build, it would be 'serve -s dist -l 5173'
CMD ["serve", "-s", "dist", "-l", "5173"]
