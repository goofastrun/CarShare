FROM nginx:alpine

# envsubst для подстановки переменных в nginx.conf
RUN apk add --no-cache gettext

COPY . /usr/share/nginx/html
COPY ../nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# envsubst подставит BACKEND_URL из переменной окружения при старте
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
