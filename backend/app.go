package main

import "net/http"

type App struct {
}

func NewApp() *App {
	return &App{}
}

func (a *App) ServeHTTP(hub *Hub) {
	http.HandleFunc("/api/join", func(w http.ResponseWriter, r *http.Request) {
		HandlerJoin(w, r, hub)
	})
}
