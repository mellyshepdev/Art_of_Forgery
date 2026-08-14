# Build the Vite application
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# Serve the production build with Apache
FROM httpd:2.4-alpine

# Enable mod_rewrite for React client-side routing
RUN sed -i \
    's/^#$LoadModule rewrite_module modules\/mod_rewrite.so$/\1/' \
    /usr/local/apache2/conf/httpd.conf \
    && echo "Include conf/extra/spa.conf" \
    >> /usr/local/apache2/conf/httpd.conf

COPY apache-spa.conf /usr/local/apache2/conf/extra/spa.conf

# Vite outputs production files into dist/
COPY --from=build /app/dist/ /usr/local/apache2/htdocs/

EXPOSE 80