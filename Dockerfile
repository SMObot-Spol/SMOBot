# Use the official Node.js image as the base image
FROM node:18-alpine

ENV NODE_ENV=production

RUN apk update && \
    apk upgrade && \
    apk add --no-cache python3 make g++
# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY ["package.json", "package-lock.json*", "./"]

# Install dependencies
RUN npm install

# Copy the rest of the application's code to the container
COPY . .

# Expose the port your application listens on
EXPOSE 3000

# Command to run your Node.js application
CMD ["node", "index.js"]