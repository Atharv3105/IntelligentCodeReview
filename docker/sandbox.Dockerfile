FROM python:3.11-alpine

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

USER sandbox
WORKDIR /sandbox

CMD ["python"]