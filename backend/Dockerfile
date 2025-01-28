# syntax=docker/dockerfile:1

FROM node:lts-alpine as build
WORKDIR /volo/backend
COPY ./backend ./
COPY ./backend/.env.docker .env
COPY ./packages /volo/packages
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf -- *
COPY --from=build /volo/backend/build .
COPY ./backend/nginx.prod.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 3001
