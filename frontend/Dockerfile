FROM node:20-alpine as build
ARG REACT_APP_API_BASE_URL=http://157.230.224.245:8080
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
