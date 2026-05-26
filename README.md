# Protocol Comparison Tool

A web application that intelligently compares communication protocols (MQTT, HTTP, WebSocket, CoAP) based on user-selected quality attributes and real-world operating conditions.

## Features

- **Attribute Selection & Weighting**: Select and prioritize quality attributes (latency, reliability, throughput, jitter, ordering, data integrity, resource usage, security overhead)
- **Protocol Comparison**: Compare MQTT, HTTP, WebSocket, and CoAP protocols
- **Scenario Testing**: Test protocols under various real-world conditions (stable/unstable networks, high frequency, long duration, encrypted connections, concurrent load)
- **Real-time Dashboard**: View test results with dynamic visualizations
- **Fitness Scoring**: Get personalized recommendations based on your attribute priorities
- **Report Generation**: Download detailed test reports in JSON format

## Tech Stack

- **Framework**: Meteor 3.3.2 (full-stack)
- **Frontend**: React with React Router
- **Backend**: Node.js
- **Database**: MongoDB
- **Visualization**: Chart.js with react-chartjs-2
- **Protocol Libraries**: 
  - `mqtt` for MQTT
  - `axios` for HTTP
  - `ws` for WebSocket
  - `coap` for CoAP

## Installation

1. Navigate to the project directory:
   ```bash
   cd TestMyProtocol
   ```

2. Install dependencies:
   ```bash
   meteor npm install
   ```

3. Start the application:
   ```bash
   meteor run
   ```

4. Open your browser to `http://localhost:3000`

**Note:** This project was built using Meteor 3.3.2. If you have a different version, Meteor will automatically handle version compatibility.

## Usage

1. **Configure Test**:
   - Set weights for quality attributes (must total 100%)
   - Select protocols to compare
   - Choose test scenarios

2. **Run Tests**: Click "Start Benchmark Tests" to begin automated testing

3. **View Results**: 
   - Dashboard shows real-time progress and visualizations
   - Results page shows final scores and recommendations
   - Download detailed reports for further analysis

## Project Structure

```
TestMyProtocol/
├── client/              # React frontend
│   ├── components/      # Reusable components
│   ├── layouts/         # Layout components
│   └── pages/          # Page components
├── server/             # Server code
├── imports/            # Shared code
│   ├── api/           # MongoDB collections and methods
│   ├── test-engine/   # Protocol testing engine
│   └── startup/       # Startup scripts
└── .meteor/           # Meteor configuration
```

## Testing Protocols

The application includes testers for:
- **MQTT**: Tests with QoS levels and pub/sub patterns
- **HTTP**: Tests with request/response patterns
- **WebSocket**: Tests full-duplex communication
- **CoAP**: Tests lightweight IoT protocol

Each tester measures:
- Latency
- Reliability
- Throughput
- Jitter
- Ordering
- Data Integrity
- Resource Usage
- Security Overhead

## Network Simulation

The application simulates various network conditions:
- Packet loss
- Latency
- Jitter
- Bandwidth limitations
- Network instability

## License

This project is for educational purposes as part of FIT2107 - Software Quality and Testing.
