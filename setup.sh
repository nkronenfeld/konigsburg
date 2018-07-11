#!/bin/bash	
npm install -g yarn
yarn install
go get -u github.com/golang/lint/golint
go get -u github.com/golang/dep/cmd/dep
dep ensure
