#!/bin/bash
# Setup script to configure MQTT broker for testing

# Set your MQTT broker details
MQTT_BROKER_IP="192.168.0.17"
MQTT_BROKER_PORT="1883"  # Change to 8883 if using TLS/SSL

# Set environment variables
export MQTT_BROKER_URL="mqtt://${MQTT_BROKER_IP}:${MQTT_BROKER_PORT}"

echo "MQTT Broker configured: ${MQTT_BROKER_URL}"
echo "Starting Meteor..."

# Start Meteor
meteor run

