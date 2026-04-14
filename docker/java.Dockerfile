FROM eclipse-temurin:17-jdk-focal

RUN groupadd -r sandbox && useradd -r -g sandbox sandbox

USER sandbox
WORKDIR /sandbox

CMD ["java"]
