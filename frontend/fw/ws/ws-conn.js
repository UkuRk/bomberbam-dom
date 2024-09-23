export default class WebSocketHandler extends WebSocket {
    // Initialize constructor
    constructor(url) {
        super(url);
        this.buffer = ''; // To store partial data between messages
    }

    // Send message through WebSocket connection
    sendMessage(data) {
        this.send(JSON.stringify(data));
    }

    // Handle incoming messages
    onMessage(callback) {
        this.addEventListener('message', event => {
            // Append new data to the buffer
            this.buffer += event.data;

            try {
                // Attempt to parse multiple JSON objects in the buffer
                let boundary = this.buffer.indexOf('}{');  // Find boundary between two concatenated JSON objects

                while (boundary !== -1) {
                    // Split and process each JSON object
                    const completeMsg = this.buffer.slice(0, boundary + 1);
                    const parsedData = JSON.parse(completeMsg); // Parse the first complete JSON object

                    // Callback with parsed data
                    callback(parsedData);

                    // Update buffer by removing the processed JSON
                    this.buffer = this.buffer.slice(boundary + 1);

                    // Look for another boundary in the updated buffer
                    boundary = this.buffer.indexOf('}{');
                }

                // Try parsing any remaining data if it's a complete JSON object
                if (this.buffer.trim().length > 0) {
                    const parsedData = JSON.parse(this.buffer);
                    callback(parsedData);
                    this.buffer = ''; // Clear the buffer after successful parsing
                }
            } catch (error) {
                // If parsing fails, leave the buffer as is and wait for more data
                console.error('Error parsing message data:', error);
            }
        });
    }

    // Method for WebSocket connection open event
    onOpen(callback) {
        this.addEventListener('open', () => {
            callback();
        });
    }

    // Method for WebSocket connection close event
    onClose(callback) {
        this.addEventListener('close', () => {
            callback();
        });
    }
}
