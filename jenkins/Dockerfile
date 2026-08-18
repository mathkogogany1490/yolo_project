# Jenkins LTS + Docker CLI (host docker.sock 사용 → 로컬 배포)
FROM docker:27-cli AS dockercli

FROM jenkins/jenkins:lts-jdk17

USER root

COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
# compose 플러그인 경로는 이미지 버전에 따라 다를 수 있음
COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/docker-compose \
  /usr/local/libexec/docker/cli-plugins/docker-compose

RUN chmod +x /usr/local/bin/docker \
    /usr/local/libexec/docker/cli-plugins/docker-compose \
 && mkdir -p /usr/libexec/docker/cli-plugins \
 && ln -sf /usr/local/libexec/docker/cli-plugins/docker-compose \
        /usr/libexec/docker/cli-plugins/docker-compose \
 && apt-get update \
 && apt-get install -y --no-install-recommends curl git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 로컬 실습: docker.sock 권한 이슈 방지를 위해 root 로 실행
USER root