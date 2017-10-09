FROM node:8

ENV PARSE_HOME /parse
ENV CLOUD_CODE_HOME ${PARSE_HOME}/cloud

# ENV NODE_TEMP /node
# RUN mkdir -p ${NODE_TEMP} ${PARSE_HOME}
# COPY package.json ${NODE_TEMP}
# RUN cd ${NODE_TEMP} && npm install && mkdir -p ${PARSE_HOME} && cp -a ${NODE_TEMP}/node_modules ${PARSE_HOME} && rm -rf ${NODE_TEMP}

WORKDIR $PARSE_HOME

ADD . ${PARSE_HOME}
RUN npm install

ENV PORT 1337

EXPOSE $PORT

CMD ["npm", "start"]