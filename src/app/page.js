// src/app/page.js
import MessageHistory from "@/components/MessageHistory";

export default function Home() {
  return (
        <main className="container mx-auto p-4">
          <div className="my-8">
            <h1 className="text-3xl font-bold mb-6">MS Teams Webhook Dashboard</h1>
            <MessageHistory />
          </div>
        </main>
  );
}
