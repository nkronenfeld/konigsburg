#!/bin/bash
export CGO_ENABLED=0
export GOOS=linux 
export GOARCH=amd64 
go build
docker build -t docker.uncharted.software/konigsburg:latest .
