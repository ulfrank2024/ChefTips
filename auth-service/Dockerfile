FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY package*.json ./
# Add build tools needed for native modules like bcrypt
RUN apk add --no-cache python3 make g++
RUN npm install
COPY . .
# Copy the RDS global certificate bundle
# COPY global-bundle.pem /usr/local/share/ca-certificates/global-bundle.pem
# Install ca-certificates and update the CA certificates
RUN apk add --no-cache ca-certificates && update-ca-certificates
# Install PostgreSQL client for psql command-line tool
RUN apk add --no-cache postgresql-client
EXPOSE 3000
CMD [ "npm", "start" ]