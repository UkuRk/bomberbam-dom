package main

import (
	"encoding/json"
	"fmt"
	"time"
)

type Timer struct {
	startCountdown chan bool
	resetCountdown chan int
	broadcastTime  chan int
	started        bool
}

func InitTimer() *Timer {
	return &Timer{
		startCountdown: make(chan bool, 2),
		resetCountdown: make(chan int, 2),
		broadcastTime:  make(chan int),
	}
}

func (t *Timer) RunCountDown() {
	const startingTime = 15
	var timeCounter = startingTime

	for {
		select {
		case s := <-t.startCountdown:
			t.started = s
			if !s {
				timeCounter = startingTime
				t.broadcastTime <- timeCounter
			}
		case newTimer := <-t.resetCountdown:
			timeCounter = newTimer
		default:

			if t.started {
				if timeCounter <= 0 {
					t.started = false
					timeCounter = startingTime

				} else {
					timeCounter--
					time.Sleep(1 * time.Second)
					if t.started {
						t.broadcastTime <- timeCounter
					}
				}
			} else {
				t.started = <-t.startCountdown
			}
		}
	}
}

func (h *Hub) CheckCountDown() {
	if h.timer.started {
		switch len(h.Clients) {
		case 0, 1:
			h.timer.resetCountdown <- 15
			h.timer.started = false
			h.timer.startCountdown <- false
		case 2, 3:
			h.timer.resetCountdown <- 15
		case 4:
			h.timer.resetCountdown <- 10
		}
	} else if len(h.Clients) >= 2 {
		h.timer.started = true
		h.timer.startCountdown <- true
	}
}

func (h *Hub) UpdateTimer(t int) {
	goTimer := &TimerMsg{
		Type: "update-timer",
		Body: t,
	}

	toSend, err := json.Marshal(goTimer)
	if err != nil {
		fmt.Println(err)
	}
	for _, client := range h.Clients {
		client.send <- toSend
	}
}
