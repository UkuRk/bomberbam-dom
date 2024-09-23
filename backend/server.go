package main

import (
	"log"
	"net/http"
)

type Server struct {
	app *App
}

func NewServer(app *App) *Server {
	return &Server{app: app}
}

func (s *Server) Start(hub *Hub) {
	http.HandleFunc("/api/ws", func(w http.ResponseWriter, r *http.Request) {
		WebsocketHandler(hub, w, r)
	})
	s.app.ServeHTTP(hub)
	log.Println("Server is listening on port 8080...")
	http.ListenAndServe("localhost:8080", nil)
}
