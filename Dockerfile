FROM node:boron-alpine

ENV PARSE_HOME /parse
ENV CLOUD_CODE_HOME ${PARSE_HOME}/cloud

ADD * ${PARSE_HOME}/

WORKDIR $PARSE_HOME
RUN npm install

ENV PORT 1337


# ENV
# TRUST_PROXY


EXPOSE $PORT
VOLUME $CLOUD_CODE_HOME
ENV NODE_PATH .

CMD ["npm", "start"]
