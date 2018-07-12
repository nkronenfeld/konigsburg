FROM alpine:3.5

RUN mkdir /konigsburg-app

WORKDIR /konigsburg-app

COPY ./konigsburg .
COPY ./web/dist/bundle.js ./web/dist/bundle.js
COPY ./web/index.html ./web/index.html
COPY ./web/data ./web/data

EXPOSE 6789

ENTRYPOINT /konigsburg-app/konigsburg
