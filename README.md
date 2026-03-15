# Shopify Live Concierge: The Multimodal AI Assistant — Frontend (Next.js)

## 🏆 Gemini Live Agent Challenge Submission

### 🔑 Test Credentials (Judges)
| Access Point | Username / Email | Password |
| :--- | :--- | :--- |
| **Merchant Dashboard** | `mark@example.com` | `12345678` |
| **Shopify Checkout** | *(If prompted)* | `rteong` |

---

## 1. Project Overview
**Shopify Live Concierge** is a multimodal AI shopping assistant that transforms any Shopify store into an intelligent conversational shopping experience powered by **Google Gemini**.

Customers can interact with the store through text, voice, or images, allowing them to search products, receive recommendations, manage their shopping cart, and track orders conversationally.

The system integrates Gemini's multimodal reasoning, vector search, and Shopify commerce APIs to create a real-time AI concierge capable of both understanding user intent and executing actions.

## 2. Key Features and Functionality

### 2.1 Multimodal Conversational Shopping
- **Text chat**: Natural language queries.
- **Voice conversation**: Real-time, bidirectional voice chat using the **Gemini Multimodal Live API**.
- **Image-based product search**: Powered by **CLIP embeddings** and **Pinecone**.

### 2.2 Agentic Cart Management
The AI assistant can directly manage the user’s shopping cart using **Shopify Storefront GraphQL APIs**.
- Add/Remove products.
- Update quantities.
- Generate secure checkout links.

### 2.3 Order Tracking
Authenticated users can retrieve order status and tracking links directly from the **Shopify Admin API**.

### 2.4 Merchant Analytics Dashboard
A professional dashboard for store owners to monitor AI performance:
- **NDCG, Hit Rate, MRR**
- **Search Latency**
- **Live Query Logs**

## 🛠️ Technology Stack
- **Framework**: Next.js 14 (App Router)
- **AI**: Google Gemini 2.0 Flash & Flash-Live
- **Vector Search**: Pinecone Serverless
- **Data**: Supabase (PostgreSQL)
- **Commerce**: Shopify GraphQL APIs

---

## 💻 Local Setup Instructions

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/MarkGeorge10/Shopify-store-ui-bot
cd shopify-ai-concierge

# Install dependencies
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 3. Run the Development Server
```bash
npm run dev
```

---

## 📂 Project Structure
- `/app/dashboard`: Merchant management portal.
- `/app/s/[slug]`: Public storefront experience.
- `/components`: Modular UI library (Cards, Modals, Chat, Voice).

---

## 🧪 Reproducible Testing (For Judges)

### 1. Testing the Live Concierge (Voice)
1.  Navigate to a store (e.g., `/s/mobile-development-store-bf16b6`).
2.  Click the **Microphone icon**.
3.  Speak: *"Do you have any blue shoes?"*

### 2. Testing the Visual AI Search
1.  Drag an image into the chat input.
2.  Expectation: The AI returns a grid of similar items.

### 3. Testing the Agentic Cart
1.  Say: *"Add the first item to my cart."*
2.  Follow up: *"I'm ready to checkout."*
