package main

type Message struct {
	Type   string `json:"type"`
	Body   string `json:"body"`
	Sender string `json:"sender"`
}

type Connected struct {
	Type      string   `json:"type"`
	Body      string   `json:"body"`
	Sender    string   `json:"sender"`
	Connected []string `json:"connected"`
}

type TimerMsg struct {
	Type string `json:"type"`
	Body int    `json:"body"`
}

type MoveMessage struct {
	Type      string      `json:"type"`
	Sender    string      `json:"sender"`
	Direction string      `json:"direction"`
	Position  interface{} `json:"position"`
}
