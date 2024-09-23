package main

import (
	"encoding/json"
	"fmt"
)

type Hub struct {
	Clients     map[string]*Client
	broadcast   chan []byte
	register    chan *Client
	unregister  chan *Client
	timer       *Timer
	gameStarted bool
}

func InitHub() *Hub {
	return &Hub{
		Clients:    make(map[string]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		timer:      InitTimer(),
	}
}

func (h *Hub) CheckUsername(username string) bool {
	_, exist := h.Clients[username]
	return exist
}

func (h *Hub) LaunchRoutines() {
	go h.Run()
	go h.timer.RunCountDown()
}

func (h *Hub) Run() {
	playerReady := 0
	for {
		select {
		case client := <-h.register:
			if !h.gameStarted {
				h.RegisterClient(client)
			}
		case client := <-h.unregister:
			h.UnregisterClient(client)

		case t := <-h.timer.broadcastTime:
			h.UpdateTimer(t)

		case message := <-h.broadcast:
			var msg *Message
			json.Unmarshal(message, &msg)
			switch msg.Type {
			case "chat":
				for _, client := range h.Clients {
					client.send <- message
				}

			case "map":
				playerReady++
				if playerReady != len(h.Clients) {
				} else {
					jsonMap := GenerateMap()
					for _, client := range h.Clients {
						client.send <- jsonMap
					}
					playerReady = 0
				}
			case "move":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "end":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "death":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "degats":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "bomb":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "bonus":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "lock":
				for _, client := range h.Clients {
					client.send <- message
				}
			case "unlock":
				for _, client := range h.Clients {
					client.send <- message
				}
			}

		}
	}
}

func (h *Hub) RegisterClient(client *Client) {
	h.Clients[client.Username] = client

	connectedList := make([]string, 0)

	for _, c := range h.Clients {
		connectedList = append(connectedList, c.Username)
	}

	message := &Connected{
		Type:      "join",
		Body:      client.Username + " has joined the lobby",
		Sender:    client.Username,
		Connected: connectedList,
	}
	fmt.Printf("%s Joined the chat !\n", client.Username)
	joinedMessage, err := json.Marshal(message)
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, c := range h.Clients {
		c.send <- joinedMessage
	}
	h.CheckCountDown()
}

func (h *Hub) UnregisterClient(client *Client) {
	if _, ok := h.Clients[client.Username]; ok {
		connectedList := make([]string, 0)

		for _, c := range h.Clients {
			connectedList = append(connectedList, c.Username)
		}

		message := &Connected{
			Type:      "leave",
			Body:      client.Username + " left the chat",
			Sender:    client.Username,
			Connected: removeElement(connectedList, client.Username),
		}
		fmt.Printf("%s left the chat !\n", client.Username)

		leftMessage, err := json.Marshal(message)
		if err != nil {
			fmt.Println(err)
			return
		}
		for _, c := range h.Clients {
			if c.Username != client.Username {
				c.send <- leftMessage
			}
		}
		close(h.Clients[client.Username].send)
		delete(h.Clients, client.Username)

		h.CheckCountDown()
	}
}

func removeElement(connected []string, clientDisconnected string) []string {
	var newTab []string
	for _, user := range connected {
		if clientDisconnected != user {
			newTab = append(newTab, user)
		}
	}
	newConnected := []string{}
	newConnected = append(newConnected, newTab...)
	return newConnected
}
