FROM gcc:latest

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

USER sandbox
WORKDIR /sandbox

CMD ["g++"]
