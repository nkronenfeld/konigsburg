package main

import (
	"net/http"
	"log"
)



func main() {
	fs := http.FileServer(http.Dir("web"))
	http.Handle("/", fs)
	log.Println("Listening...")
	http.ListenAndServe(":6789", nil)
}
