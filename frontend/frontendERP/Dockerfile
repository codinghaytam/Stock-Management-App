# Stage 1: Build the Angular application
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html directory
# Note: Adjust the path 'dist/frontendERP/browser' based on your angular.json project name
COPY --from=build /app/dist/frontendERP/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the template for environment variable substitution
COPY public/assets/env.template.js /usr/share/nginx/html/assets/env.template.js

# Expose port 80
EXPOSE 80

# Command to substitute environment variables and start Nginx
CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
