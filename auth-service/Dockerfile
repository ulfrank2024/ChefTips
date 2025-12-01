FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -l controllers/
# Copy the RDS global certificate bundle
# COPY global-bundle.pem /usr/local/share/ca-certificates/global-bundle.pem
# Install ca-certificates and update the CA certificates
RUN apk add --no-cache ca-certificates && update-ca-certificates
EXPOSE 3000
CMD [ "npm", "start" ]