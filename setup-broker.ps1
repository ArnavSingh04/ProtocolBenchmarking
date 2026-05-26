# PowerShell script to configure MQTT broker for testing on Windows

# Set your MQTT broker details
$MQTT_BROKER_IP = "192.168.0.17"
$MQTT_BROKER_PORT = "1883"  # Change to 8883 if using TLS/SSL

# Set environment variable
$env:MQTT_BROKER_URL = "mqtt://${MQTT_BROKER_IP}:${MQTT_BROKER_PORT}"

Write-Host "MQTT Broker configured: $env:MQTT_BROKER_URL"
Write-Host "Starting Meteor..."

# Start Meteor
meteor run

