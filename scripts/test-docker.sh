#!/bin/sh
set -eu

project="workforce-tests-$$"
compose() {
  docker compose -p "$project" -f docker-compose.test.yml "$@"
}

cleanup() {
  result=$?
  trap - 0
  compose down --volumes --remove-orphans || {
    if [ "$result" -eq 0 ]; then result=1; fi
  }
  exit "$result"
}

trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM
compose up --build --abort-on-container-exit --exit-code-from tests
