package main

func main() {
	app := NewApp()
	server := NewServer(app)
	hub := InitHub()
	hub.LaunchRoutines()
	server.Start(hub)
}
