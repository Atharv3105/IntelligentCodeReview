FROM node:18-slim

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

USER sandbox
WORKDIR /sandbox

CMD ["node"]
