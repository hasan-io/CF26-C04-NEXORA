FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-server \
    python3 \
    python3-pip \
    curl \
    #postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir psycopg2-binary==2.9.9 python-dotenv==1.0.0 requests==2.31.0

RUN mkdir -p /var/run/sshd

WORKDIR /app

COPY server_simulator.py /app/server_simulator.py

ENV SERVER_ID=DEFAULT-SERVER
ENV FLOOR=0
ENV DEPARTMENT=Default
ENV SECURITY_LEVEL=Standard
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=c04
ENV DB_PASSWORD=secure_password
ENV DB_NAME=c04_events

EXPOSE 22 8000 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

CMD ["/bin/bash", "-c", "service ssh start && python3 /app/server_simulator.py"]