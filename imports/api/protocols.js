// Chatgpt by openAI was used to assist in the writing the code for the following file
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const Protocols = new Mongo.Collection("protocols");

// Initialize protocols if empty
if (Meteor.isServer) {
  Meteor.startup(async () => {
    if ((await Protocols.find().countAsync()) === 0) {
      await Protocols.insertAsync({
        name: "MQTT",
        description: "Message Queuing Telemetry Transport",
        supported: true,
        features: ["QoS levels", "Pub/Sub", "Lightweight"]
      });
      await Protocols.insertAsync({
        name: "HTTP",
        description: "Hypertext Transfer Protocol",
        supported: true,
        features: ["Request/Response", "RESTful", "Widely supported"]
      });
      await Protocols.insertAsync({
        name: "WebSocket",
        description: "Full-duplex communication protocol",
        supported: true,
        features: ["Full-duplex", "Low latency", "Real-time"]
      });
      await Protocols.insertAsync({
        name: "CoAP",
        description: "Constrained Application Protocol",
        supported: true,
        features: ["IoT optimized", "UDP-based", "Low overhead"]
      });
    }
  });
}
