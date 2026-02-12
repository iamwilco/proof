type AlertPayload = {
  title: string;
  message: string;
  details?: Record<string, unknown>;
};

export const sendAlert = async ({ title, message, details }: AlertPayload) => {
  const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("Monitoring webhook not configured", { title, message, details });
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, details, timestamp: new Date().toISOString() }),
    });
  } catch (error) {
    console.error("Failed to send monitoring alert", error);
  }
};
