FROM postgres:13
COPY ./tip-service/init.sql /docker-entrypoint-initdb.d/init.sql
RUN chown postgres:postgres /docker-entrypoint-initdb.d/init.sql && chmod +x /docker-entrypoint-initdb.d/init.sql
