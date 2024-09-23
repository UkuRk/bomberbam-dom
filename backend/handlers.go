package main

import (
	"encoding/json"
	"net/http"
)

func HandlerJoin(w http.ResponseWriter, r *http.Request, h *Hub) {
	(w).Header().Set("Access-Control-Allow-Origin", "*")
	var msg struct {
		Username string `json:"username"`
	}
	json.NewDecoder(r.Body).Decode(&msg)

	if h.CheckUsername(msg.Username) || len(msg.Username) == 0 || len(msg.Username) > 10 {
		http.Error(w, "Username is already in use", 400)
		return
	}
}
