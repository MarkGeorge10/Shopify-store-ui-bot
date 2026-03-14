# Shopify Live Concierge: The Multimodal AI Assistant — Frontend (Next.js)

The immersive, multimodal storefront and admin dashboard for the **Shopify Live Concierge: The Multimodal AI Assistant**, built for the **Gemini Live Agent Challenge**. 

## 🌟 Interactive Experiences

- **Voice Concierge**: A real-time, bidirectional voice chat using the Gemini Live API. Speak naturally, ask about products, and manage your cart hands-free.
- **Visual Product Discovery**: Drag-and-drop any image to find visually similar items in the store, powered by Gemini Vision and CLIP embeddings.
- **Agentic Chat**: A persistent sidebar chat that doesn't just talk — it acts. It can update your cart, check order statuses, and show you product grids in real-time.
- **Merchant RAG Analytics**: A professional dashboard for store owners to monitor AI search performance with live metrics and query logs.

## 🎨 Design Philosophy

Built with a **Premium Dark Aesthetic**:
- **Glassmorphism**: Sleek, semi-transparent UI elements.
- **Micro-animations**: Smooth transitions using Framer Motion.
- **Responsive Layout**: Designed to feel like a premium mobile app on any device.

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion
- **Icons**: Lucide React
- **Voice**: Web Audio API (PCM 16-bit Mono) via WebSocket

---

## 💻 Local Setup Instructions

### 1. Installation
```bash
# Clone the repository
git clone <your-repo-url>
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

## 📊 Admin Dashboard Features

The dashboard allows merchants to:
1. **Connect Store**: Instantly link a Shopify store using API tokens.
2. **Toggle Enhanced Search**: Enable/Disable the Pinecone-backed RAG engine.
3. **Monitor Performance**: 
   - **NDCG & Hit Rate**: Quality metrics for AI retrieval.
   - **Latency Analysis**: Tracking response speeds across providers.
   - **Live Query Logs**: Real-time visibility into what customers are searching for.
4. **User Feedback**: See thumbs up/down ratios from real customer interactions.

---

## 📂 Project Structure

- `/app/dashboard`: Merchant management portal.
- `/app/s/[slug]`: Public storefront experience.
- `/components`: Modular UI library (Cards, Modals, Chat, Voice).
## 🧪 Reproducible Testing (For Judges)

### 1. Testing the Live Concierge (Voice)
1.  Click the **Microphone icon** in the bottom right of the storefront.
2.  Grant microphone permissions.
3.  Speak a query like: *"Do you have any blue shoes?"*
4.  **Expectation**: The pulse animation should turn blue (Gemini listening) and then green (Gemini speaking), followed by a visual product grid appearing in the chat.

### 2. Testing the Visual AI Search
1.  Go to the "Visual Search" page or drag an image into the chat input.
2.  Upload a clear image of an article of clothing.
3.  **Expectation**: The AI will "see" the image, perform a vector search, and return a grid of similar items from the inventory.

### 3. Testing the Agentic Cart
1.  While in a voice or text session, say: *"Add the first item to my cart."*
2.  **Expectation**: The Cart icon in the header should update instantly, and a success message will appear.
3.  Say: *"I'm ready to checkout."*
4.  **Expectation**: A specialized "Checkout Checkout" button will appear, which links to the secure Shopify checkout page.
