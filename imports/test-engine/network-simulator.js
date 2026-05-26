// Chatgpt by openAI was used to assist in the writing the code for the following file
export class NetworkSimulator {
  constructor() {
    this.conditions = {
      packetLoss: 0,
      latency: 0,
      jitter: 0,
      bandwidth: Infinity,
      unstable: false
    };
  }

  setConditions(conditions) {
    this.conditions = { ...this.conditions, ...conditions };
  }

  simulateDelay(baseDelay = 0) {
    const latency = this.conditions.latency || 0;
    const jitter = this.conditions.jitter || 0;

    let delay = baseDelay + latency;

    if (jitter > 0) {
      // Add random jitter
      delay += (Math.random() - 0.5) * 2 * jitter;
    }

    if (this.conditions.unstable) {
      // Simulate network instability with random spikes
      if (Math.random() < 0.1) {
        delay += Math.random() * 500; // Random spikes up to 500ms
      }
    }

    return Math.max(0, delay);
  }

  shouldDropPacket() {
    if (this.conditions.packetLoss > 0) {
      return Math.random() < this.conditions.packetLoss / 100;
    }
    return false;
  }

  simulateBandwidthLimit(dataSize, baseTime) {
    if (this.conditions.bandwidth === Infinity) {
      return baseTime;
    }

    // Calculate additional time based on bandwidth limit (in bytes per second)
    const additionalTime = (dataSize / this.conditions.bandwidth) * 1000; // Convert to ms
    return baseTime + additionalTime;
  }

  async wait(delay) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }
}
