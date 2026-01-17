FROM n8nio/n8n:latest

USER root

# Copy the custom node
COPY --chown=node:node . /home/node/.n8n/custom/n8n-nodes-tornado-api

# Install dependencies
WORKDIR /home/node/.n8n/custom/n8n-nodes-tornado-api
RUN npm install --omit=dev

USER node

WORKDIR /home/node
