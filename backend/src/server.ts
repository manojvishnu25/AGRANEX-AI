import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set permissive headers for local development and Chrome DevTools
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:;"
  );
  next();
});

// Chrome DevTools auto-probe handler
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

interface AppState {
  notifications: any[];
  listings: any[];
  farmPlots: any[];
  orders: any[];
  villageHubs: any[];
  truckBookings: any[];
  deliveryTracking: Record<string, {
    booking_id: string;
    current_lat: number;
    current_lng: number;
    speed_kmh: number;
    eta: string;
    status: string;
    proof_image_url: string;
    signature_data: string;
    driver_phone?: string;
    farmer_phone?: string;
    buyer_phone?: string;
  }>;
  wallets: Record<string, {
    balance_inr: number;
    escrow_balance_inr: number;
  }>;
  chatRooms: any[];
  chatMessages: any[];
}

// In-Memory state for live demonstration fallback
const appState: AppState = {
  notifications: [
    { id: '1', title: 'Disease Detection Alert', message: 'Early Blight detected in East Plot C (Tomatoes) with 96.8% AI confidence.', type: 'disease', is_read: false, created_at: new Date().toISOString() },
    { id: '2', title: 'Irrigation Reminder', message: 'South Plot B requires 420L drip cycle today at 04:00 PM due to moisture stress.', type: 'weather', is_read: false, created_at: new Date().toISOString() },
    { id: '3', title: 'Marketplace Price Hike', message: 'Sharbati Wheat market price increased by 4.2% in your regional mandis.', type: 'market', is_read: false, created_at: new Date().toISOString() }
  ],
  listings: [
    { 
      id: 'm1', 
      crop_name: 'Sharbati Wheat', 
      variety: 'Premium Grain', 
      quantity_quintals: 150, 
      price_per_quintal: 2450, 
      quality_grade: 'A', 
      location: 'Coimbatore Agri Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
      is_organic: true,
      discount_pct: 5,
      harvest_date: new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0],
      freshness_score: 96,
      carbon_footprint_kg: 0.12,
      estimated_delivery: 'Next Day',
      farmer_name: 'Rajesh Kumar',
      latitude: 10.9856,
      longitude: 76.9664
    },
    { 
      id: 'm2', 
      crop_name: 'Sweet Corn / Maize', 
      variety: 'Hybrid Gold', 
      quantity_quintals: 80, 
      price_per_quintal: 1890, 
      quality_grade: 'A', 
      location: 'Ludhiana Mandi', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800',
      is_organic: false,
      discount_pct: 0,
      harvest_date: new Date(Date.now() - 1*24*60*60*1000).toISOString().split('T')[0],
      freshness_score: 98,
      carbon_footprint_kg: 0.18,
      estimated_delivery: '2 Days',
      farmer_name: 'Harpreet Singh',
      latitude: 30.9010,
      longitude: 75.8573
    },
    { 
      id: 'm3', 
      crop_name: 'Organic Tomatoes', 
      variety: 'Country Red', 
      quantity_quintals: 45, 
      price_per_quintal: 1200, 
      quality_grade: 'A', 
      location: 'Coimbatore Agri Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800',
      is_organic: true,
      discount_pct: 10,
      harvest_date: new Date(Date.now()).toISOString().split('T')[0],
      freshness_score: 99,
      carbon_footprint_kg: 0.08,
      estimated_delivery: 'Next Day',
      farmer_name: 'Rajesh Kumar',
      latitude: 10.9820,
      longitude: 76.9630
    },
    { 
      id: 'm4', 
      crop_name: 'Premium Cotton', 
      variety: 'Long Staple', 
      quantity_quintals: 120, 
      price_per_quintal: 6800, 
      quality_grade: 'A+', 
      location: 'Coimbatore Agri Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1594761060297-a21221b67272?w=800',
      is_organic: true,
      discount_pct: 0,
      harvest_date: new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0],
      freshness_score: 95,
      carbon_footprint_kg: 0.22,
      estimated_delivery: 'Next Day',
      farmer_name: 'Rajesh Kumar',
      latitude: 10.9856,
      longitude: 76.9664
    },
    { 
      id: 'm5', 
      crop_name: 'Alphonso Mangoes', 
      variety: 'Ratnagiri Fresh', 
      quantity_quintals: 40, 
      price_per_quintal: 4800, 
      quality_grade: 'A', 
      location: 'Salem Agri Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800',
      is_organic: true,
      discount_pct: 12,
      harvest_date: new Date().toISOString().split('T')[0],
      freshness_score: 99,
      carbon_footprint_kg: 0.05,
      estimated_delivery: 'Next Day',
      farmer_name: 'Rajesh Kumar',
      latitude: 11.6643,
      longitude: 78.1460
    },
    { 
      id: 'm6', 
      crop_name: 'Organic Turmeric', 
      variety: 'Erode Salem', 
      quantity_quintals: 60, 
      price_per_quintal: 7500, 
      quality_grade: 'A+', 
      location: 'Erode Collection Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800',
      is_organic: true,
      discount_pct: 0,
      harvest_date: new Date(Date.now() - 10*24*60*60*1000).toISOString().split('T')[0],
      freshness_score: 93,
      carbon_footprint_kg: 0.15,
      estimated_delivery: '2 Days',
      farmer_name: 'Rajesh Kumar',
      latitude: 11.3410,
      longitude: 77.7170
    },
    { 
      id: 'm7', 
      crop_name: 'Malabar Black Pepper', 
      variety: 'Tellicherry Extra Bold', 
      quantity_quintals: 25, 
      price_per_quintal: 32000, 
      quality_grade: 'A', 
      location: 'Wayanad Depot', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800',
      is_organic: true,
      discount_pct: 8,
      harvest_date: new Date(Date.now() - 15*24*60*60*1000).toISOString().split('T')[0],
      freshness_score: 97,
      carbon_footprint_kg: 0.25,
      estimated_delivery: '3 Days',
      farmer_name: 'Raman Pillai',
      latitude: 11.6050,
      longitude: 76.0830
    },
    { 
      id: 'm8', 
      crop_name: 'Fresh Green Peas', 
      variety: 'Ooty Sweet', 
      quantity_quintals: 35, 
      price_per_quintal: 3500, 
      quality_grade: 'A', 
      location: 'Ooty Agri Hub', 
      status: 'active', 
      image_url: 'https://images.unsplash.com/photo-1587570220970-13f64c6198f1?w=800',
      is_organic: true,
      discount_pct: 20,
      harvest_date: new Date().toISOString().split('T')[0],
      freshness_score: 98,
      carbon_footprint_kg: 0.04,
      estimated_delivery: 'Next Day',
      farmer_name: 'Karthi Keyan',
      latitude: 11.4100,
      longitude: 76.6950
    }
  ],
  farmPlots: [
    { id: 'plot-a', plot_name: 'North Plot A - Wheat', crop_type: 'Wheat', health_status: 'healthy', area_hectares: 3.5 },
    { id: 'plot-b', plot_name: 'South Plot B - Maize', crop_type: 'Maize', health_status: 'water_stress', area_hectares: 4.0 },
    { id: 'plot-c', plot_name: 'East Plot C - Tomatoes', crop_type: 'Tomato', health_status: 'disease', area_hectares: 2.5 },
    { id: 'plot-d', plot_name: 'West Plot D - Cotton', crop_type: 'Cotton', health_status: 'healthy', area_hectares: 2.5 }
  ],
  orders: [
    {
      id: 'o1',
      buyer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', // mock buyer
      buyer_name: 'BigBasket Corporate',
      buyer_phone: '+91 98941 77651',
      farmer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Rajesh
      farmer_name: 'Rajesh Kumar',
      farmer_phone: '+91 94432 50122',
      crop_name: 'Sharbati Wheat',
      variety: 'Premium Grain',
      quantity_quintals: 50,
      price_per_quintal: 2450,
      total_amount: 122500,
      platform_fee: 2450,
      shared_truck_fee: 1500,
      gst: 6125,
      status: 'created',
      otp_code: '4821',
      created_at: new Date().toISOString()
    },
    {
      id: 'req1',
      buyer_id: 'buyer_ananya',
      buyer_name: 'Ananya S. (Buyer)',
      buyer_phone: '+91 98845 22105',
      farmer_id: '',
      farmer_name: '',
      farmer_phone: '',
      crop_name: 'Basmati Rice',
      variety: 'Pusa 1121',
      quantity_quintals: 25,
      price_per_quintal: 3200,
      total_amount: 85600, // (3200 * 25) + 2% fee + 5% gst
      platform_fee: 1600,
      shared_truck_fee: 0,
      gst: 4000,
      status: 'buyer_request',
      otp_code: '5123',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'req2',
      buyer_id: 'buyer_patil',
      buyer_name: 'Suresh Patil (Aggregator)',
      buyer_phone: '+91 97712 30948',
      farmer_id: '',
      farmer_name: '',
      farmer_phone: '',
      crop_name: 'Organic Cotton',
      variety: 'Long Staple',
      quantity_quintals: 40,
      price_per_quintal: 6800,
      total_amount: 291040, // (6800 * 40) + 2% + 5%
      platform_fee: 5440,
      shared_truck_fee: 0,
      gst: 13600,
      status: 'buyer_request',
      otp_code: '8910',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  villageHubs: [
    { id: 'h1', name: 'Coimbatore Collection Hub', region: 'Tamil Nadu', capacity_kg: 5000, current_weight_kg: 1200, temperature_celsius: 21.5, dispatch_countdown_seconds: 14400, status: 'collecting', lat: 10.9856, lng: 76.9664, queue: 3 },
    { id: 'h2', name: 'Ludhiana Regional Mandi', region: 'Punjab', capacity_kg: 8000, current_weight_kg: 3400, temperature_celsius: 24.0, dispatch_countdown_seconds: 7200, status: 'collecting', lat: 30.9010, lng: 75.8573, queue: 5 },
    { id: 'h3', name: 'Napa Valley Valley Depot', region: 'California', capacity_kg: 6000, current_weight_kg: 2000, temperature_celsius: 19.5, dispatch_countdown_seconds: 18000, status: 'collecting', lat: 38.2976, lng: -122.2869, queue: 2 }
  ],
  truckBookings: [
    {
      id: 'b1',
      hub_id: 'h1',
      hub_name: 'Coimbatore Collection Hub',
      vehicle_make: 'Tata',
      vehicle_model: 'Ultra T.7',
      license_plate: 'TN-37-DF-8812',
      driver_name: 'Saravanan Chinnasamy',
      driver_phone: '+91 94421 80922',
      total_cost: 3000,
      status: 'accepted',
      dispatch_time: new Date(Date.now() + 2*60*60*1000).toISOString(),
      farmers: [
        { name: 'Rajesh Kumar', weight_kg: 500, share_cost: 1500, savings: 1200 },
        { name: 'Karthi Keyan', weight_kg: 300, share_cost: 900, savings: 720 },
        { name: 'Mani Vasagam', weight_kg: 200, share_cost: 600, savings: 480 }
      ],
      order_ids: ['o1']
    }
  ],
  deliveryTracking: {
    b1: {
      booking_id: 'b1',
      current_lat: 10.9856,
      current_lng: 76.9664,
      speed_kmh: 45,
      eta: '1 hr 15 mins',
      status: 'transit',
      proof_image_url: '',
      signature_data: '',
      driver_phone: '+91 94421 80922',
      farmer_phone: '+91 94432 50122',
      buyer_phone: '+91 98941 77651'
    }
  },
  wallets: {
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11': { balance_inr: 45000, escrow_balance_inr: 122500 }, // Rajesh
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22': { balance_inr: 500000, escrow_balance_inr: 0 }, // Buyer
    'logistics_id_express': { balance_inr: 8000, escrow_balance_inr: 0 } // Logistics
  },
  chatRooms: [
    { id: 'room1', farmer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', farmer_name: 'Rajesh Kumar', buyer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', buyer_name: 'BigBasket Corporate' },
    { id: 'room2', farmer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', farmer_name: 'Rajesh Kumar', buyer_id: 'logistics_id_express', buyer_name: 'Saravanan Express (Logistics)' },
    { id: 'room3', farmer_id: 'logistics_id_express', farmer_name: 'Saravanan Express (Logistics)', buyer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', buyer_name: 'BigBasket Corporate' }
  ],
  chatMessages: [
    { id: 'msg1', room_id: 'room1', sender_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', content: 'Hello Rajesh, is the Sharbati Wheat crop grade A cert verified?', message_type: 'text', created_at: new Date(Date.now() - 100000).toISOString() },
    { id: 'msg2', room_id: 'room1', sender_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', content: 'Yes, it is moisture-tested (12.2% moisture) and certified organic. Ready at hub Coimbatore.', message_type: 'text', created_at: new Date(Date.now() - 50000).toISOString() },
    { id: 'msg3', room_id: 'room2', sender_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', content: 'Hi Saravanan, when will the vehicle reach Coimbatore Hub for pickup?', message_type: 'text', created_at: new Date(Date.now() - 120000).toISOString() },
    { id: 'msg4', room_id: 'room2', sender_id: 'logistics_id_express', content: 'Hello Rajesh, I am already at Coimbatore Hub. Ready for pickup once OTP is verified.', message_type: 'text', created_at: new Date(Date.now() - 60000).toISOString() },
    { id: 'msg5', room_id: 'room3', sender_id: 'logistics_id_express', content: 'Hello BigBasket Team, dispatch started. Transit vehicle TN-37-DF-8812 is on the way to Erode.', message_type: 'text', created_at: new Date(Date.now() - 150000).toISOString() },
    { id: 'msg6', room_id: 'room3', sender_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', content: 'Great, thanks for the update! We are tracking it live on the map.', message_type: 'text', created_at: new Date(Date.now() - 70000).toISOString() }
  ]
};

// Root status endpoint
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AGRANEX AI Backend Server</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #080C14; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 480px; shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h1 { color: #10B981; margin-top: 0; }
          a { display: inline-block; margin-top: 1.5rem; background: #10B981; color: #fff; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; }
          a:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌱 AGRANEX AI Backend</h1>
          <p>The backend API server is running smoothly on port 5000.</p>
          <p style="color: #94a3b8; font-size: 0.9rem;">To view the Web Application, open the frontend server at:</p>
          <a href="http://localhost:3000" target="_blank">Open Frontend App (localhost:3000)</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
// 1. Auth Mock Endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  // Generate a mock JWT for demonstration
  const token = 'mock-jwt-token-agranex-' + (role || 'farmer');
  return res.status(200).json({
    success: true,
    token,
    user: {
      id: role === 'buyer' 
        ? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' 
        : role === 'logistics' 
          ? 'logistics_id_express' 
          : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: email || 'farmer.rajesh@agranex.ai',
      full_name: email ? email.split('@')[0].replace('.', ' ') : 'Rajesh Kumar',
      role: role || 'farmer',
      preferred_language: 'en'
    }
  });
});

// 2. Farm plots for 3D digital twin
app.get('/api/v1/farms/plots', (req, res) => {
  res.status(200).json(appState.farmPlots);
});

app.post('/api/v1/farms/plots/update', (req, res) => {
  const { id, health_status } = req.body;
  const plot = appState.farmPlots.find(p => p.id === id);
  if (plot) {
    plot.health_status = health_status;
    io.emit('plot_updated', plot);
    return res.status(200).json({ success: true, plot });
  }
  return res.status(404).json({ success: false, message: 'Plot not found' });
});

// 3. AI Crop Disease Detection (NVIDIA Vision NIM Multimodal Engine)
app.post('/api/v1/ai/disease-detection', async (req, res) => {
  const { imageUrl, cropType, fileName, model, language } = req.body;
  const activeNimModel = model || 'google/diffusiongemma-26b-a4b-it';

  console.log(`[NVIDIA VISION NIM SCAN] Processing image scan for crop: '${cropType}', file: '${fileName || 'upload'}', model: '${activeNimModel}', language: '${language || 'en'}'...`);

  // Call real NVIDIA NIM API using official vision payload structure
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY;
  if (nvidiaKey && nvidiaKey.startsWith('nvapi-') && imageUrl && imageUrl.startsWith('data:image')) {
    try {
      console.log(`[NVIDIA VISION NIM CALL] Sending request to NVIDIA NIM API (${activeNimModel})...`);

      const hasBase64Image = imageUrl && imageUrl.startsWith('data:image');
      const imageDataUrl = hasBase64Image
        ? imageUrl
        : 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const promptText = `You are an expert AI Agricultural Pathologist and Computer Vision Specialist.
Analyze this uploaded agricultural image pixels:
1. First, check if the image shows an agricultural crop sample (leaf, seed, grain, fruit, vegetable, stem, or plant tissue) OR a non-agricultural object (e.g. car, vehicle, building, person, electronic device, furniture).
2. If it is NOT an agricultural crop sample (e.g., if it is a car, vehicle, building, person, electronic device), return JSON:
{
  "is_crop_leaf": false,
  "detected_object": "<describe non-agricultural object seen e.g. Red Car / Building>",
  "error_message": "Invalid Image: AI Vision model detected a non-agricultural object, not a crop sample."
}
3. If it IS an agricultural crop sample (leaf, grain, seed, fruit, stem, or plant):
   - Visually identify the exact crop species and sample type (e.g. "Wheat Grains (Triticum aestivum)", "Tomato Leaf", "Maize Seed", "Potato Tuber", "Cotton Leaf").
   - Perform AI health and pathology/disease/quality diagnosis (or indicate "Healthy Sample" if clean).
   - Return your AI model's full visual analysis in JSON:
{
  "is_crop_leaf": true,
  "detected_crop": "Wheat Grains (Triticum aestivum)",
  "detected_object": "Crop Sample",
  "disease_name": "<exact AI diagnosed disease/condition e.g. Healthy Grain Sample or Grain Bunt / Mold>",
  "confidence_score": 0.96,
  "severity": "<None / Low / Medium / High / Critical with percentage>",
  "affected_area_percent": 15.0,
  "detailed_explanation": "<Write a thorough 5 to 6 sentence scientific breakdown explaining the identified crop species, sample type (grains/leaves), visual symptoms or quality assessment, underlying condition/pathogen, and field/storage management strategy.>",
  "organic_solution": "<Organic treatment, bio-control, or seed storage recommendation>",
  "chemical_solution": "<Targeted chemical fungicide or seed treatment protocol>",
  "error_message": ""
}
${language && (language.startsWith('ta') || language === 'ta-IN') ? 'IMPORTANT: You must write the values for "detected_crop", "disease_name", "detailed_explanation", "organic_solution", and "chemical_solution" completely in Tamil language (தமிழ்).' : ''}
Respond ONLY in valid raw JSON with no extra markdown text or commentary outside JSON.`;

      let payload: any = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl
                }
              },
              {
                type: "text",
                text: promptText
              }
            ]
          }
        ],
        model: activeNimModel,
        max_tokens: 4096,
        stream: false,
        temperature: 0.3,
        top_p: 0.95
      };

      if (activeNimModel.includes('diffusiongemma')) {
        payload.chat_template_kwargs = { enable_thinking: true };
      }

      let nimResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nvidiaKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Fallback to meta/llama-3.1-70b-instruct if specific model ID returns 404/400
      if (!nimResponse.ok && activeNimModel !== 'meta/llama-3.1-70b-instruct') {
        console.log(`[NVIDIA NIM RETRY] Model ${activeNimModel} returned ${nimResponse.status}. Retrying with meta/llama-3.1-70b-instruct...`);
        payload.model = 'meta/llama-3.1-70b-instruct';
        delete payload.chat_template_kwargs;
        nimResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nvidiaKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (nimResponse.ok) {
        const nimData: any = await nimResponse.json();
        const rawContent = nimData.choices?.[0]?.message?.content;
        console.log(`[NVIDIA VISION NIM SUCCESS (${activeNimModel})]:`, rawContent);

        if (rawContent) {
          try {
            const cleanJsonStr = rawContent.substring(rawContent.indexOf('{'), rawContent.lastIndexOf('}') + 1);
            const parsed = JSON.parse(cleanJsonStr);

            if (parsed.is_crop_leaf === false) {
              return res.status(200).json({
                success: false,
                is_crop_leaf: false,
                source: `NVIDIA NIM Vision (${activeNimModel})`,
                error: parsed.error_message || `Invalid Image: NVIDIA AI Vision model detected a non-plant object (${parsed.detected_object || 'non-plant'}), not a crop leaf sample.`
              });
            }

            return res.status(200).json({
              success: true,
              is_crop_leaf: true,
              source: `NVIDIA NIM Vision (${activeNimModel})`,
              diagnosis: parsed
            });
          } catch (e) {
            console.log('Failed to parse NVIDIA Vision NIM JSON response, using fallback');
          }
        }
      } else {
        console.log(`[NVIDIA NIM API WARNING] NVIDIA NIM responded with status: ${nimResponse.status}`);
      }
    } catch (err) {
      console.log('NVIDIA Vision NIM fetch error:', (err as Error).message);
    }
  }

  // Real leaf dataset classifications based on typical open-source crop models
  const diseaseResponses: Record<string, any> = {
    tomato: {
      disease_name: 'Tomato Early Blight (Alternaria solani)',
      severity: 'Medium (42%)',
      confidence_score: 0.9482,
      affected_area_percent: 18.5,
      detailed_explanation: 'Tomato Early Blight is a destructive fungal infection caused by Alternaria solani that targets solanaceous crops during warm, humid conditions. The disease typically initiates on older foliage near the base of the plant, manifesting as small dark brown to black spots with characteristic concentric target-board rings. As the fungal pathogen advances, surrounding leaf tissues turn chlorotic (yellow) and necrose, leading to extensive premature defoliation. Reduced leaf canopy exposes developing tomato fruits to direct sunlight, triggering severe sunscald and decreasing total harvestable yields. Effective long-term management requires removing infected bottom foliage, ensuring adequate row spacing for canopy airflow, practicing crop rotation, and applying protective copper or mancozeb fungicide sprays at early onset.',
      organic_solution: 'Apply Neem Seed Kernel Extract (NSKE 5%) spray. Ensure bottom leaves do not touch soil and practice crop rotation with non-solanaceous crops.',
      chemical_solution: 'Spray Mancozeb 75% WP @ 2g/liter of water or Chlorothalonil 75% WP @ 2g/liter.',
      experts: ['Dr. Swaminathan (Agronomist)', 'Kavitha Ramasamy (Plant Pathologist)']
    },
    wheat: {
      disease_name: 'Wheat Yellow Leaf Rust (Puccinia striiformis)',
      severity: 'High (72%)',
      confidence_score: 0.9125,
      affected_area_percent: 34.0,
      detailed_explanation: 'Wheat Yellow Leaf Rust, caused by the obligate biotrophic fungus Puccinia striiformis, is one of the most economically damaging foliar diseases of wheat crops globally. Symptoms appear as linear rows of vivid yellow-orange pustules aligned along the leaf veins of susceptible grain varieties. Under favorable cool and moist microclimates (10-15°C), fungal spores germinate rapidly and spread rapidly across fields via wind currents. Severe infection destroys green leaf area, severely impairing photosynthetic capacity and grain filling efficiency. Left unmanaged, Yellow Rust can cause catastrophic yield losses up to 70%, requiring immediate application of systemic triazole fungicides like Propiconazole or Tebuconazole.',
      organic_solution: 'Spray fermented butter milk solution (10%) or bio-agents like Trichoderma viride. Use rust-resistant wheat varieties.',
      chemical_solution: 'Apply Propiconazole 25% EC @ 1ml/liter of water or Tebuconazole 250 EC.',
      experts: ['Suresh Patel (Rust Disease Specialist)']
    },
    maize: {
      disease_name: 'Maize Common Rust (Puccinia sorghi)',
      severity: 'Low (15%)',
      confidence_score: 0.8875,
      affected_area_percent: 8.0,
      detailed_explanation: 'Maize Common Rust is a widespread fungal disease caused by Puccinia sorghi, affecting corn leaves during periods of cool, humid weather. The disease produces oval, cinnamon-brown pustules that erupt through both upper and lower leaf surfaces. As the crop matures, these pustules release airborne spores and darken to black teliospores for overwintering. Heavy rust infections reduce functional green leaf area, accelerating premature leaf senescence during critical grain-filling stages. Integrated control involves cultivating resistant hybrid corn varieties, managing field crop residue, and applying foliar fungicides if infection levels exceed economic thresholds.',
      organic_solution: 'Apply compost tea spray and ensure crop rotation with legumes like cowpea or groundnut.',
      chemical_solution: 'Spray Azoxystrobin @ 1g/liter of water or Mancozeb @ 2.5g/liter.',
      experts: ['Madan Lal (Corn Expert)']
    }
  };

  const diseaseResponsesTa: Record<string, any> = {
    tomato: {
      disease_name: 'தக்காளி முன்பருவக் கருகல் நோய் (Early Blight - Alternaria solani)',
      severity: 'நடுத்தரமானது (42%)',
      confidence_score: 0.9482,
      affected_area_percent: 18.5,
      detailed_explanation: 'தக்காளி முன்பருவக் கருகல் நோய் என்பது ஆல்டர்நேரியா சோலானி என்ற பூஞ்சையால் ஏற்படும் ஒரு ஆபத்தான நோயாகும். இது முதலில் செடியின் அடிப்பகுதியில் உள்ள பழைய இலைகளில் சிறிய பழுப்பு அல்லது கருப்பு நிற புள்ளிகளாகத் தோன்றும். காலப்போக்கில் இந்த புள்ளிகள் விரிவடைந்து இலைகள் மஞ்சள் நிறமாக மாறி உதிர்ந்துவிடும். இதனால் செடியின் உற்பத்தி திறன் குறைவதோடு காய்கள் வெயிலில் நேரடியாக பட்டு சேதமடையும். இதனை கட்டுப்படுத்த பாதிக்கப்பட்ட இலைகளை உடனே அகற்ற வேண்டும், செடிகளுக்கு இடையே நல்ல காற்றோட்டம் இருப்பதை உறுதி செய்ய வேண்டும், மற்றும் வேப்ப எண்ணெய் கரைசல் அல்லது மேன்கோசெப் தெளிக்க வேண்டும்.',
      organic_solution: '5% வேப்பம்பருப்பு சாறு (NSKE) தெளிக்கவும். செடியின் கீழ் இலைகள் மண்ணில் படாதவாறு பார்த்துக் கொள்ளவும், சுழற்சி முறையில் பயிரிடவும்.',
      chemical_solution: 'மேன்கோசெப் 75% WP மருந்தை ஒரு லிட்டர் தண்ணீருக்கு 2 கிராம் என்ற அளவில் கலந்து தெளிக்கவும்.',
      experts: ['Dr. சுவாமிநாதன் (வேளாண் விஞ்ஞானி)', 'கவிதா ராமசாமி (பயிர் நோயியல் நிபுணர்)']
    },
    wheat: {
      disease_name: 'கோதுமை மஞ்சள் இலை துரு நோய் (Yellow Rust - Puccinia striiformis)',
      severity: 'அதிகம் (72%)',
      confidence_score: 0.9125,
      affected_area_percent: 34.0,
      detailed_explanation: 'கோதுமை மஞ்சள் துரு நோய் என்பது பக்ஸீனியா ஸ்ட்ரிஃபார்மிஸ் என்ற பூஞ்சையால் ஏற்படும் தீவிர நோயாகும். இது இலைகளின் மேற்பரப்பில் நீளமான மஞ்சள் நிற கோடுகளாகவும் பவுடர் போன்ற துரு துகள்களாகவும் தோன்றும். இது பயிரின் ஒளிச்சேர்க்கையை பாதித்து கோதுமை தானியங்களின் எடையைக் குறைக்கும். இதனை கட்டுப்படுத்த நோய் எதிர்ப்பு திறன் கொண்ட பயிர் ரகங்களை பயன்படுத்த வேண்டும் மற்றும் ஆரம்ப கட்டத்திலேயே தகுந்த மருந்துகளை தெளிக்க வேண்டும்.',
      organic_solution: 'மோர் கரைசல் (10%) அல்லது ட்ரைக்கோடெர்மா விரிடி போன்ற உயிரியல் முகவர்களை தெளிக்கவும். துரு எதிர்ப்பு கோதுமை ரகங்களை பயன்படுத்தவும்.',
      chemical_solution: 'புரோபிகோனசோல் 25% EC மருந்தை ஒரு லிட்டர் தண்ணீருக்கு 1 மிலி வீதம் கலந்து தெளிக்கவும்.',
      experts: ['Dr. சுவாமிநாதன் (வேளாண் விஞ்ஞானி)', 'கவிதா ராமசாமி (பயிர் நோயியல் நிபுணர்)']
    },
    maize: {
      disease_name: 'சோள இலை துரு நோய் (Common Rust - Puccinia sorghi)',
      severity: 'குறைவு (15%)',
      confidence_score: 0.8950,
      affected_area_percent: 8.0,
      detailed_explanation: 'சோள இலை துரு நோய் என்பது இலைகளில் நீள்வட்ட வடிவ பழுப்பு நிற புள்ளிகளாகத் தோன்றும் பூஞ்சை நோயாகும். இது முக்கியமாக ஈரப்பதமான மற்றும் குளிர்ந்த காலநிலையில் பரவக்கூடியது. இலைகளில் புள்ளிகள் அதிகமாகும் போது ஒளிச்சேர்க்கை பாதிக்கப்படும்.',
      organic_solution: 'பயிர்க் கழிவுகளை அகற்றவும், சுழற்சி முறையில் பயிரிடவும், மேலும் சூடோமோனாஸ் தெளிக்கவும்.',
      chemical_solution: 'மேன்கோசெப் அல்லது கார்பென்டாசிம் மருந்தை தெளிக்கவும்.',
      experts: ['Dr. சுவாமிநாதன் (வேளாண் விஞ்ஞானி)', 'கவிதா ராமசாமி (பயிர் நோயியல் நிபுணர்)']
    }
  };

  const defaultDisease = {
    disease_name: 'Leaf Spot / Nutrient Deficient Spot',
    severity: 'Mild (10%)',
    confidence_score: 0.8520,
    affected_area_percent: 5.0,
    detailed_explanation: 'Crop Leaf Spot diseases are common fungal or bacterial infections that produce necrotized spots across foliage in humid field environments. Initial symptoms appear as water-soaked spots that expand into dark brown or black lesions surrounded by chlorotic yellow halos. Pathogens thrive under prolonged leaf wetness, gradually impairing the plant\'s photosynthetic capacity and structural vigor. As necrotic lesions coalesce, affected leaves yellow and drop prematurely, increasing crop vulnerability to secondary stress. Preventive management includes drip irrigation to keep leaves dry, adequate plant spacing, balanced nitrogen application, and protective copper fungicide sprays.',
    organic_solution: 'Spray copper hydroxide organic solutions and improve drainage to avoid waterlogging.',
    chemical_solution: 'Apply Chlorothalonil fungicide at recommended label doses.',
    experts: ['Dr. Swaminathan (Agronomist)']
  };

  const defaultDiseaseTa = {
    disease_name: 'இலைப்புள்ளி / ஊட்டச்சத்து குறைபாடு புள்ளி (Leaf Spot)',
    severity: 'குறைவானது (10%)',
    confidence_score: 0.8520,
    affected_area_percent: 5.0,
    detailed_explanation: 'பயிர்களில் இலைப்புள்ளி நோய் என்பது ஈரப்பதமான சூழ்நிலையில் தோன்றும் பூஞ்சை அல்லது பாக்டீரியா தொற்றாகும். இது முதலில் சிறிய புள்ளிகளாக ஆரம்பித்து பின்னர் பெரிய கருகிய புள்ளிகளாக மாறும். இதனை தவிர்க்க சொட்டு நீர் பாசனத்தை பயன்படுத்தவும், செடிகளுக்கு இடையே போதிய இடைவெளி விடவும் மற்றும் வேப்ப எண்ணெய் கரைசல் தெளிக்கவும்.',
    organic_solution: 'செம்பு கலந்த இயற்கை கரைசல் தெளிக்கவும், வயலில் தேங்கும் தண்ணீரை வடிக்கவும்.',
    chemical_solution: 'குளோரோதலோனில் பூஞ்சைக் கொல்லி மருந்தை தெளிக்கவும்.',
    experts: ['Dr. சுவாமிநாதன் (வேளாண் விஞ்ஞானி)']
  };

  const normalizedCrop = (cropType || 'tomato').toLowerCase();
  const isTamil = language === 'ta' || (language && language.startsWith('ta'));
  
  const diagnosis = isTamil
    ? (diseaseResponsesTa[normalizedCrop] || defaultDiseaseTa)
    : (diseaseResponses[normalizedCrop] || defaultDisease);

  // Save to notifications for live feed
  const alertNotification = {
    id: String(appState.notifications.length + 1),
    title: isTamil ? 'புதிய நோய் கண்டறிதல்' : 'New Disease Diagnosis',
    message: isTamil 
      ? `உங்கள் பயிரில் ${diagnosis.disease_name} கண்டறியப்பட்டுள்ளது.` 
      : `Detected ${diagnosis.disease_name} in your crop sample.`,
    type: 'disease',
    is_read: false,
    created_at: new Date().toISOString()
  };
  appState.notifications.unshift(alertNotification);
  io.emit('new_notification', alertNotification);

  res.status(200).json({ success: true, is_crop_leaf: true, source: 'AGRANEX Local Engine', diagnosis });
});

// 4. AI Yield Prediction Simulation (Random Forest / XGBoost logic)
app.post('/api/v1/ai/yield-prediction', (req, res) => {
  const { cropType, areaHectares, soilPh, rainfallMm, nitrogenPpm } = req.body;
  
  // Basic ML logic simulation representing weightage calculated by random forest
  const baseYields: Record<string, number> = { wheat: 4.5, maize: 5.2, tomato: 22.0, cotton: 2.8 };
  const basePricePerTon: Record<string, number> = { wheat: 24500, maize: 18900, tomato: 15000, cotton: 62000 };

  const selectedCrop = (cropType || 'wheat').toLowerCase();
  const base = baseYields[selectedCrop] || 3.5;
  const price = basePricePerTon[selectedCrop] || 20000;
  
  // Parameters weight
  const phFactor = Math.max(0.7, 1 - Math.abs(6.5 - (soilPh || 6.5)) * 0.1); // optimal pH around 6.5
  const rainfallFactor = Math.max(0.6, 1 - Math.abs(800 - (rainfallMm || 800)) * 0.0004); // optimal rainfall 800mm
  const nitrogenFactor = Math.max(0.8, 1 + ((nitrogenPpm || 140) - 140) * 0.001); // base nitrogen around 140

  const predictedYieldPerHectare = base * phFactor * rainfallFactor * nitrogenFactor;
  const totalYield = predictedYieldPerHectare * (areaHectares || 1);
  const revenue = totalYield * (price / 10); // Price is per quintal (1/10 of a ton)

  res.status(200).json({
    success: true,
    predictedYieldPerHectare: Number(predictedYieldPerHectare.toFixed(2)),
    totalYieldTonnes: Number(totalYield.toFixed(2)),
    expectedRevenueInr: Math.round(revenue),
    optimalHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~90 days
    riskScore: Number((Math.random() * 20 + 5).toFixed(1)), // low-medium risk
    fertilizerNeeds: { nitrogen: '25 kg/ha', phosphorus: '15 kg/ha', potassium: '20 kg/ha' },
    irrigationNeeds: '40mm equivalent every 4 days'
  });
});

// 5. Agranex AI Voice & Chat Assistant (Multilingual Tamil, English, Hindi with NVIDIA NIM API integration)
const handleAgranexQuery = async (req: express.Request, res: express.Response) => {
  const { query, language, model } = req.body;
  const q = (query || '').toLowerCase();
  const lang = (language || 'en').toLowerCase();
  const selectedModel = model || 'meta/llama-3.1-70b-instruct';
  
  // Try real NVIDIA NIM API endpoint if key is present
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY;
  if (nvidiaKey && nvidiaKey.startsWith('nvapi-') && model) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: `You are Agranex, an expert AI Agricultural Assistant for AGRANEX powered by ${selectedModel}. Provide concise, helpful advice for farmers in language code '${lang}'. Keep responses under 3 sentences.`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.5,
          max_tokens: 180
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const nimText = data.choices?.[0]?.message?.content;
        if (nimText) {
          return res.status(200).json({ success: true, response: nimText, source: `NVIDIA NIM (${selectedModel})`, language: lang });
        }
      }
    } catch (err) {
      console.log('NVIDIA NIM API call fallback to rules engine:', (err as Error).message);
    }
  }

  // Fallback Rule Engine Responses
  const responses: Record<string, Record<string, string>> = {
    en: {
      default: 'I am Agranex, your AI agricultural assistant. You can ask me about irrigation, crop diseases, satellite alerts, or market prices.',
      weather: 'Currently at Coimbatore, it is 29°C with 68% humidity. There is a moderate rainfall alert for tomorrow evening.',
      disease: 'For Tomato Early Blight, we recommend spraying Neem Seed Extract or Mancozeb 75% WP.',
      water: 'Based on soil moisture values in Plot B (18.5%), irrigation is highly recommended within the next 4 hours.',
      market: 'Market prices for Wheat have increased by 4.2% to ₹2,450 per quintal.'
    },
    ta: {
      default: 'வணக்கம், நான் அக்ரானெக்ஸ் (Agranex). உங்களது வேளாண்மை தொடர்பான கேள்விகளுக்கு உதவ தயாராக உள்ளேன். பயிர் நோய்கள், பாசனம் அல்லது சந்தை விலை பற்றி கேளுங்கள்.',
      weather: 'கோயம்புத்தூரில் தற்போது 29°C வெப்பமும் 68% ஈரப்பதமும் உள்ளது. நாளை மாலை மிதமான மழைக்கு வாய்ப்புள்ளது.',
      disease: 'தக்காளி இலை கருகல் நோய்க்கு, வேப்ப எண்ணெய் கரைசல் அல்லது மேன்கோசெப் மருந்தை தெளிக்கவும்.',
      water: 'பகுதி B-ல் ஈரப்பதம் குறைவாக உள்ளதால் அடுத்த 4 மணி நேரத்திற்குள் பாசனம் செய்ய பரிந்துரைக்கப்படுகிறது.',
      market: 'கோதுமை விலை 4.2% உயர்ந்து ஒரு குவிண்டாலுக்கு ₹2,450 ஆக அதிகரித்துள்ளது.'
    },
    hi: {
      default: 'नमस्ते, मैं अक्वानेक्स (Agranex) हूँ। मैं आपकी कृषि से संबंधित सहायता कर सकती हूँ। फसल रोग, सिंचाई या बाजार मूल्य के बारे में पूछें।',
      weather: 'कोयंबटूर में अभी तापमान 29°C और आर्द्रता 68% है। कल शाम हल्की बारिश की संभावना है।',
      disease: 'टमाटर के अगेती झुलसा रोग के लिए नीम के बीज का अर्क या मैनकोजेब का छिड़काव करें।',
      water: 'प्लॉट बी में नमी 18.5% है। अगले 4 घंटों के भीतर सिंचाई की सलाह दी जाती है।',
      market: 'गेहूं का बाजार मूल्य 4.2% बढ़कर ₹2,450 प्रति क्विंटल हो गया है।'
    }
  };

  const langSet = responses[lang] || responses['en'];
  let aiResponse = langSet.default;

  if (q.includes('weather') || q.includes('rain') || q.includes('मौसम') || q.includes('மழை')) {
    aiResponse = langSet.weather;
  } else if (q.includes('disease') || q.includes('blight') || q.includes('बीमारी') || q.includes('நோய்')) {
    aiResponse = langSet.disease;
  } else if (q.includes('water') || q.includes('irrigation') || q.includes('पानी') || q.includes('பாசனம்')) {
    aiResponse = langSet.water;
  } else if (q.includes('price') || q.includes('market') || q.includes('बाजार') || q.includes('சந்தை')) {
    aiResponse = langSet.market;
  }

  res.status(200).json({ success: true, response: aiResponse, source: 'AGRANEX Local Engine', language: lang });
};

app.post('/api/v1/ai/agranex-query', handleAgranexQuery);
app.post('/api/v1/ai/nova-query', handleAgranexQuery);

// 6. Marketplace Listings API
app.get('/api/v1/marketplace/listings', (req, res) => {
  let filtered = [...appState.listings];
  const { search, category, location, organic } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(l => 
      l.crop_name.toLowerCase().includes(q) || 
      l.variety.toLowerCase().includes(q) || 
      l.location.toLowerCase().includes(q)
    );
  }

  if (organic === 'true') {
    filtered = filtered.filter(l => l.is_organic);
  }

  res.status(200).json(filtered);
});

app.post('/api/v1/marketplace/listings/create', (req, res) => {
  const { 
    crop_name, variety, quantity_quintals, price_per_quintal, 
    quality_grade, location, image_url, is_organic, discount_pct,
    farmer_name, latitude, longitude
  } = req.body;

  const newListing = {
    id: 'm' + (appState.listings.length + 1),
    crop_name: crop_name || 'Generic Crop',
    variety: variety || 'Hybrid Standard',
    quantity_quintals: Number(quantity_quintals) || 50,
    price_per_quintal: Number(price_per_quintal) || 2000,
    quality_grade: quality_grade || 'A',
    location: location || 'Coimbatore Agri Hub',
    status: 'active' as const,
    image_url: image_url || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800',
    is_organic: !!is_organic,
    discount_pct: Number(discount_pct) || 0,
    harvest_date: new Date().toISOString().split('T')[0],
    freshness_score: Math.floor(Math.random() * 8 + 92), // 92-100
    carbon_footprint_kg: parseFloat((Math.random() * 0.15 + 0.05).toFixed(2)),
    estimated_delivery: 'Next Day',
    farmer_name: farmer_name || 'Rajesh Kumar',
    latitude: Number(latitude) || 10.9856,
    longitude: Number(longitude) || 76.9664
  };

  appState.listings.unshift(newListing);
  io.emit('new_listing', newListing);
  res.status(201).json({ success: true, listing: newListing });
});

// Marketplace Orders API
app.get('/api/v1/marketplace/orders', (req, res) => {
  const { userId, role } = req.query;
  let userOrders = [...appState.orders];
  
  if (userId) {
    if (role === 'farmer') {
      userOrders = userOrders.filter(o => o.farmer_id === userId || o.status === 'buyer_request');
    } else if (role === 'buyer') {
      userOrders = userOrders.filter(o => o.buyer_id === userId);
    }
  }
  res.status(200).json(userOrders);
});

app.post('/api/v1/marketplace/orders/create', (req, res) => {
  const { buyerId, buyerName, listingId, quantity } = req.body;
  const listing = appState.listings.find(l => l.id === listingId);

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Crop listing not found' });
  }

  const subtotal = listing.price_per_quintal * Number(quantity);
  const platformFee = Math.round(subtotal * 0.02); // 2%
  const gst = Math.round(subtotal * 0.05); // 5%
  const totalAmount = subtotal + platformFee + gst;

  // Escrow balance validation
  const buyerWallet = appState.wallets[buyerId] || { balance_inr: 0, escrow_balance_inr: 0 };
  if (buyerWallet.balance_inr < totalAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient wallet balance for purchase' });
  }

  // Deduct from buyer balance, move to escrow
  buyerWallet.balance_inr -= totalAmount;
  buyerWallet.escrow_balance_inr += totalAmount;
  appState.wallets[buyerId] = buyerWallet;

  const newOrder = {
    id: 'o' + (appState.orders.length + 1),
    buyer_id: buyerId,
    buyer_name: buyerName || 'Agranex Buyer',
    buyer_phone: buyerId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' ? '+91 98941 77651' : '+91 90543 21087',
    farmer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Rajesh
    farmer_name: listing.farmer_name,
    farmer_phone: listing.farmer_name === 'Rajesh Kumar' ? '+91 94432 50122' : '+91 98432 09845',
    crop_name: listing.crop_name,
    variety: listing.variety,
    quantity_quintals: Number(quantity),
    price_per_quintal: listing.price_per_quintal,
    total_amount: totalAmount,
    platform_fee: platformFee,
    shared_truck_fee: 0, // set during logistics assignment
    gst: gst,
    status: 'created',
    otp_code: Math.floor(1000 + Math.random() * 9000).toString(),
    created_at: new Date().toISOString()
  };

  appState.orders.unshift(newOrder);
  io.emit('new_order', newOrder);

  // Trigger Notification
  const newNotif = {
    id: String(appState.notifications.length + 1),
    title: 'New Order Received',
    message: `${buyerName} placed an order for ${quantity} quintals of ${listing.crop_name}.`,
    type: 'alert' as const,
    is_read: false,
    created_at: new Date().toISOString()
  };
  appState.notifications.unshift(newNotif);
  io.emit('new_notification', newNotif);

  res.status(201).json({ success: true, order: newOrder });
});

const autoBookTruck = (order: any) => {
  const bookingId = 'b' + (appState.truckBookings.length + 1);
  const newBooking = {
    id: bookingId,
    hub_id: 'h1',
    hub_name: 'Coimbatore Collection Hub',
    vehicle_make: 'Tata',
    vehicle_model: 'Ace Gold',
    license_plate: 'TN-37-DF-' + Math.floor(1000 + Math.random() * 9000),
    driver_name: 'Pending Assignment',
    driver_phone: '+91 94421 80922',
    total_cost: 1500,
    status: 'requested',
    dispatch_time: new Date().toISOString(),
    farmers: [
      { name: order.farmer_name || 'Rajesh Kumar', weight_kg: (order.quantity_quintals || 0.5) * 100, share_cost: 1500, savings: 1000 }
    ],
    order_ids: [order.id],
    route_distance_km: 25,
    fuel_saved_liters: 8.5,
    co2_offset_kg: 22.8
  };
  appState.truckBookings.unshift(newBooking);
  
  order.status = 'accepted';
  order.shared_truck_fee = 1500;
  
  appState.deliveryTracking[bookingId] = {
    booking_id: bookingId,
    current_lat: 10.9856,
    current_lng: 76.9664,
    speed_kmh: 0,
    eta: 'Pending dispatch',
    status: 'idle',
    proof_image_url: '',
    signature_data: '',
    driver_phone: '+91 94421 80922',
    farmer_phone: order.farmer_phone || '+91 94432 50122',
    buyer_phone: order.buyer_phone || '+91 98941 77651'
  };

  io.emit('new_truck_booking', newBooking);
  io.emit('truck_booking_status', newBooking);
};

// Background GPS simulation loop
setInterval(() => {
  appState.truckBookings.forEach(booking => {
    if (booking.status === 'transit') {
      const tracking = appState.deliveryTracking[booking.id];
      if (tracking) {
        const destLat = 11.3410; // Erode Agri Mandi
        const destLng = 77.7170; // Erode Agri Mandi
        const step = 0.015; // dynamic coordinate increments for city-to-city speed
        
        if (tracking.current_lat < destLat) {
          tracking.current_lat = Math.min(destLat, tracking.current_lat + step);
        }
        if (tracking.current_lng < destLng) {
          tracking.current_lng = Math.min(destLng, tracking.current_lng + step);
        }
        
        if (tracking.current_lat >= destLat && tracking.current_lng >= destLng) {
          tracking.status = 'arrived';
          tracking.speed_kmh = 0;
          tracking.eta = 'Arrived';
          booking.status = 'delivered';
          appState.orders.forEach(o => {
            if (booking.order_ids && booking.order_ids.includes(o.id) && o.status === 'transit') {
              o.status = 'delivered';
              io.emit('order_status_changed', o);
            }
          });
          io.emit('truck_booking_status', booking);
        } else {
          tracking.speed_kmh = Math.floor(40 + Math.random() * 15);
          tracking.eta = '12 mins';
        }
        io.emit('delivery_gps_updated', tracking);
      }
    }
  });
}, 4000);

app.post('/api/v1/marketplace/orders/accept', (req, res) => {
  const { orderId } = req.body;
  const order = appState.orders.find(o => o.id === orderId);

  if (order) {
    autoBookTruck(order);
    io.emit('order_status_changed', order);
    return res.status(200).json({ success: true, order });
  }
  res.status(404).json({ success: false, message: 'Order not found' });
});

app.post('/api/v1/marketplace/orders/ship', (req, res) => {
  const { orderId, hubId } = req.body;
  const order = appState.orders.find(o => o.id === orderId);
  const hub = appState.villageHubs.find(h => h.id === hubId);

  if (order && hub) {
    order.status = 'at_hub';
    // Add weight to Hub
    const orderWeightKg = order.quantity_quintals * 100;
    hub.current_weight_kg = Math.min(hub.capacity_kg, hub.current_weight_kg + orderWeightKg);
    
    io.emit('order_status_changed', order);
    io.emit('hub_updated', hub);
    return res.status(200).json({ success: true, order, hub });
  }
  res.status(404).json({ success: false, message: 'Order or Hub not found' });
});

app.post('/api/v1/marketplace/orders/create-request', (req, res) => {
  const { buyerId, buyerName, cropName, variety, quantity, price } = req.body;
  
  const subtotal = Number(price) * Number(quantity);
  const platformFee = Math.round(subtotal * 0.02);
  const gst = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + platformFee + gst;

  const buyerWallet = appState.wallets[buyerId] || { balance_inr: 500000, escrow_balance_inr: 0 };
  if (buyerWallet.balance_inr < totalAmount) {
    buyerWallet.balance_inr += totalAmount + 100000;
  }

  buyerWallet.balance_inr -= totalAmount;
  buyerWallet.escrow_balance_inr += totalAmount;
  appState.wallets[buyerId] = buyerWallet;

  const newOrder = {
    id: 'o' + (appState.orders.length + 1),
    buyer_id: buyerId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    buyer_name: buyerName || 'Ananya S. (Buyer)',
    farmer_id: '',
    farmer_name: '',
    crop_name: cropName,
    variety: variety || 'General',
    quantity_quintals: Number(quantity),
    price_per_quintal: Number(price),
    total_amount: totalAmount,
    platform_fee: platformFee,
    shared_truck_fee: 0,
    gst: gst,
    status: 'buyer_request',
    otp_code: Math.floor(1000 + Math.random() * 9000).toString(),
    created_at: new Date().toISOString()
  };

  appState.orders.unshift(newOrder);
  io.emit('new_order', newOrder);

  // Trigger Notification
  const newNotif = {
    id: String(appState.notifications.length + 1),
    title: 'New Buy Request Posted',
    message: `A buyer requested ${quantity} quintals of ${cropName} at ₹${price}/quintal.`,
    type: 'alert' as const,
    is_read: false,
    created_at: new Date().toISOString()
  };
  appState.notifications.unshift(newNotif);
  io.emit('new_notification', newNotif);

  res.status(201).json({ success: true, order: newOrder });
});

app.post('/api/v1/marketplace/orders/accept-request', (req, res) => {
  const { orderId, farmerId, farmerName } = req.body;
  const order = appState.orders.find(o => o.id === orderId);

  if (order && order.status === 'buyer_request') {
    order.farmer_id = farmerId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    order.farmer_name = farmerName || 'Rajesh Kumar';
    autoBookTruck(order);
    io.emit('order_status_changed', order);
    return res.status(200).json({ success: true, order });
  }
  res.status(404).json({ success: false, message: 'Order request not found' });
});

app.get('/api/v1/marketplace/logistics/tracking/order/:orderId', (req, res) => {
  const { orderId } = req.params;
  const booking = appState.truckBookings.find(b => b.order_ids && b.order_ids.includes(orderId));
  if (booking) {
    const tracking = appState.deliveryTracking[booking.id];
    if (tracking) {
      return res.status(200).json({ success: true, tracking, booking });
    }
  }
  return res.status(404).json({ success: false, message: 'No active tracking for this order' });
});

app.get('/api/v1/marketplace/logistics/tracking/booking/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const booking = appState.truckBookings.find(b => b.id === bookingId);
  if (booking) {
    const tracking = appState.deliveryTracking[booking.id];
    if (tracking) {
      return res.status(200).json({ success: true, tracking, booking });
    }
  }
  return res.status(404).json({ success: false, message: 'No active tracking for this booking' });
});

// Community Hubs API
app.get('/api/v1/marketplace/hubs', (req, res) => {
  res.status(200).json(appState.villageHubs);
});

app.post('/api/v1/marketplace/hubs/weight', (req, res) => {
  const { hubId, weightKg } = req.body;
  const hub = appState.villageHubs.find(h => h.id === hubId);
  if (hub) {
    hub.current_weight_kg = Number(weightKg);
    io.emit('hub_updated', hub);
    return res.status(200).json({ success: true, hub });
  }
  res.status(404).json({ success: false, message: 'Hub not found' });
});

// Shared Truck Logistics API
app.get('/api/v1/marketplace/logistics/bookings', (req, res) => {
  res.status(200).json(appState.truckBookings);
});

app.post('/api/v1/marketplace/logistics/bookings/create', (req, res) => {
  const { hubId, vehicleMake, vehicleModel, licensePlate, totalCost, bookings } = req.body;
  
  // Allocate cost based on weight %
  const totalWeight = bookings.reduce((sum: number, b: any) => sum + b.weight_kg, 0);
  const allocatedFarmers = bookings.map((b: any) => {
    const weightPct = totalWeight > 0 ? (b.weight_kg / totalWeight) : 0;
    const shareCost = Math.round(totalCost * weightPct);
    const individualCost = Math.round(totalCost * 0.9); // standard single booking estimation
    const savings = Math.max(0, individualCost - shareCost);
    return {
      name: b.farmer_name,
      weight_kg: b.weight_kg,
      share_cost: shareCost,
      savings: savings
    };
  });

  // Calculate route optimization metrics
  const numFarmers = bookings.length;
  const baseDistancePerFarmer = 22; // avg km individual trip
  const totalIndividualDistance = numFarmers * baseDistancePerFarmer;
  const optimizedRouteDistance = Math.round(15 + numFarmers * 6); // optimized route
  const distanceSaved = Math.max(5, totalIndividualDistance - optimizedRouteDistance);
  const fuelSavedLiters = Number((distanceSaved * 0.35).toFixed(1)); // 0.35 liters per km
  const co2OffsetKg = Number((fuelSavedLiters * 2.68).toFixed(1)); // 2.68 kg CO2 per liter

  // Link active orders from this hub for these farmers
  const farmerNames = bookings.map((b: any) => b.farmer_name);
  const linkedOrders = appState.orders.filter(o => 
    o.status === 'at_hub' && farmerNames.includes(o.farmer_name)
  );
  const linkedOrderIds = linkedOrders.map(o => o.id);

  const newBooking = {
    id: 'b' + (appState.truckBookings.length + 1),
    hub_id: hubId,
    hub_name: appState.villageHubs.find(h => h.id === hubId)?.name || 'Village Hub',
    vehicle_make: vehicleMake || 'Tata',
    vehicle_model: vehicleModel || 'Ultra',
    license_plate: licensePlate || 'TN-37-DF-0000',
    driver_name: 'Driver Assigned',
    total_cost: Number(totalCost),
    status: 'requested',
    dispatch_time: new Date(Date.now() + 3*60*60*1000).toISOString(),
    farmers: allocatedFarmers,
    order_ids: linkedOrderIds,
    route_distance_km: optimizedRouteDistance,
    fuel_saved_liters: fuelSavedLiters,
    co2_offset_kg: co2OffsetKg
  };

  // Update status of linked orders
  linkedOrders.forEach(o => {
    o.status = 'truck_assigned';
    o.shared_truck_fee = allocatedFarmers.find((f: any) => f.name === o.farmer_name)?.share_cost || 1000;
  });

  appState.truckBookings.unshift(newBooking);
  
  // Link this booking to delivery tracking coordinates
  appState.deliveryTracking[newBooking.id] = {
    booking_id: newBooking.id,
    current_lat: 10.9856,
    current_lng: 76.9664,
    speed_kmh: 0,
    eta: 'Pending Dispatch',
    status: 'idle',
    proof_image_url: '',
    signature_data: ''
  };

  io.emit('new_truck_booking', newBooking);
  res.status(201).json({ success: true, booking: newBooking });
});

app.post('/api/v1/marketplace/logistics/bookings/accept', (req, res) => {
  const { bookingId, driverName } = req.body;
  const booking = appState.truckBookings.find(b => b.id === bookingId);
  const tracking = appState.deliveryTracking[bookingId];

  if (booking && tracking) {
    booking.status = 'accepted';
    booking.driver_name = driverName || 'Driver John';
    tracking.status = 'pickup';
    tracking.speed_kmh = 35;
    tracking.eta = '45 mins';

    // Map order statuses linked to this booking
    appState.orders.forEach(o => {
      if (booking.order_ids && booking.order_ids.includes(o.id)) {
        o.status = 'truck_assigned';
        o.shared_truck_fee = booking.farmers.find((f: any) => f.name === o.farmer_name)?.share_cost || 1000;
      }
    });

    io.emit('truck_booking_status', booking);
    io.emit('delivery_gps_updated', tracking);
    return res.status(200).json({ success: true, booking, tracking });
  }
  res.status(404).json({ success: false, message: 'Booking not found' });
});

app.post('/api/v1/marketplace/logistics/bookings/update-gps', (req, res) => {
  const { bookingId, lat, lng, speed, eta, status } = req.body;
  const tracking = appState.deliveryTracking[bookingId];
  const booking = appState.truckBookings.find(b => b.id === bookingId);

  if (tracking) {
    tracking.current_lat = Number(lat);
    tracking.current_lng = Number(lng);
    if (speed !== undefined) tracking.speed_kmh = Number(speed);
    if (eta !== undefined) tracking.eta = String(eta);
    if (status !== undefined) tracking.status = String(status);

    // If dispatching, also update order statuses
    if (status === 'transit') {
      appState.orders.forEach(o => {
        if (booking && booking.order_ids && booking.order_ids.includes(o.id) && o.status === 'truck_assigned') {
          o.status = 'transit';
        }
      });
    }

    io.emit('delivery_gps_updated', tracking);
    return res.status(200).json({ success: true, tracking });
  }
  res.status(404).json({ success: false, message: 'Tracking record not found' });
});

app.post('/api/v1/marketplace/logistics/bookings/deliver', (req, res) => {
  const { bookingId, proofImage, signature } = req.body;
  const booking = appState.truckBookings.find(b => b.id === bookingId);
  const tracking = appState.deliveryTracking[bookingId];

  if (booking && tracking) {
    booking.status = 'completed';
    tracking.status = 'delivered';
    tracking.speed_kmh = 0;
    tracking.eta = 'Delivered';
    tracking.proof_image_url = proofImage || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400';
    tracking.signature_data = signature || 'Sign';

    // Update order status to out for delivery / delivered
    appState.orders.forEach(o => {
      if (booking.order_ids && booking.order_ids.includes(o.id) && o.status === 'transit') {
        o.status = 'delivered';
      }
    });

    // Alert Buyer
    const newNotif = {
      id: String(appState.notifications.length + 1),
      title: 'Order Delivered',
      message: `Your crop shipment ${booking.license_plate} has arrived. Please confirm delivery using the OTP code.`,
      type: 'success' as const,
      is_read: false,
      created_at: new Date().toISOString()
    };
    appState.notifications.unshift(newNotif);
    io.emit('new_notification', newNotif);

    io.emit('truck_booking_status', booking);
    io.emit('delivery_gps_updated', tracking);
    return res.status(200).json({ success: true, booking, tracking });
  }
  res.status(404).json({ success: false, message: 'Booking not found' });
});

// Transporter Farmer Handover Validation (Transporter starts transit by verifying farmer OTP)
app.post('/api/v1/marketplace/orders/confirm-handover', (req, res) => {
  const { orderId, otp } = req.body;
  const order = appState.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.otp_code !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid Handover OTP Code' });
  }

  // Set order status to transit
  order.status = 'transit';

  // Find linked booking and change status to transit
  const booking = appState.truckBookings.find(b => b.order_ids && b.order_ids.includes(orderId));
  if (booking) {
    booking.status = 'transit';
    
    // Update tracking
    const tracking = appState.deliveryTracking[booking.id];
    if (tracking) {
      tracking.status = 'transit';
      tracking.speed_kmh = 45;
      tracking.eta = '30 mins';
      io.emit('delivery_gps_updated', tracking);
    }
    io.emit('truck_booking_status', booking);
  }

  io.emit('order_status_changed', order);
  return res.status(200).json({ success: true, order });
});

// Escrow Release Payment Portal
app.post('/api/v1/marketplace/orders/confirm-delivery', (req, res) => {
  const { orderId } = req.body;
  const order = appState.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = 'confirmed';

  // Escrow Wallet Transfers
  const buyerId = order.buyer_id;
  const farmerId = order.farmer_id;
  const logisticsId = 'logistics_id_express';

  const buyerWallet = appState.wallets[buyerId] || { balance_inr: 0, escrow_balance_inr: 0 };
  const farmerWallet = appState.wallets[farmerId] || { balance_inr: 0, escrow_balance_inr: 0 };
  const logisticsWallet = appState.wallets[logisticsId] || { balance_inr: 0, escrow_balance_inr: 0 };

  const cropPrice = order.total_amount - order.platform_fee - order.gst;
  const truckFee = order.shared_truck_fee || 1500;

  // Deduct from buyer escrow
  buyerWallet.escrow_balance_inr = Math.max(0, buyerWallet.escrow_balance_inr - order.total_amount);

  // Credit farmer (Crop Price minus truck fee share)
  farmerWallet.balance_inr += (cropPrice - truckFee);
  
  // Credit Logistics (Shared Truck Fee)
  logisticsWallet.balance_inr += truckFee;

  appState.wallets[buyerId] = buyerWallet;
  appState.wallets[farmerId] = farmerWallet;
  appState.wallets[logisticsId] = logisticsWallet;

  // Trigger Notifications
  const farmerNotif = {
    id: String(appState.notifications.length + 1),
    title: 'Payment Received',
    message: `₹${(cropPrice - truckFee).toLocaleString()} credited to your wallet for Order ${orderId}.`,
    type: 'success' as const,
    is_read: false,
    created_at: new Date().toISOString()
  };
  appState.notifications.unshift(farmerNotif);
  io.emit('new_notification', farmerNotif);

  // If this order is part of a booking, check if all other orders in the booking are also confirmed.
  const booking = appState.truckBookings.find(b => b.order_ids && b.order_ids.includes(orderId));
  if (booking) {
    const allConfirmed = appState.orders
      .filter(o => booking.order_ids.includes(o.id))
      .every(o => o.status === 'confirmed');

    if (allConfirmed) {
      booking.status = 'completed';
      const tracking = appState.deliveryTracking[booking.id];
      if (tracking) {
        tracking.status = 'delivered';
        tracking.speed_kmh = 0;
        tracking.eta = 'Delivered';
        io.emit('delivery_gps_updated', tracking);
      }
      io.emit('truck_booking_status', booking);
    }
  }

  io.emit('order_status_changed', order);
  io.emit('wallets_updated', appState.wallets);

  res.status(200).json({ success: true, order, wallets: appState.wallets });
});

// Wallets Balance API
app.get('/api/v1/marketplace/wallets', (req, res) => {
  const { userId } = req.query;
  const wallet = appState.wallets[String(userId)] || { balance_inr: 0, escrow_balance_inr: 0 };
  res.status(200).json(wallet);
});

// Chats Messaging API
app.get('/api/v1/marketplace/chats/rooms', (req, res) => {
  const { userId } = req.query;
  const rooms = appState.chatRooms.filter(r => 
    r.farmer_id === userId || r.buyer_id === userId || r.logistics_id === userId
  );
  res.status(200).json(rooms);
});

app.get('/api/v1/marketplace/chats/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const messages = appState.chatMessages.filter(m => m.room_id === roomId);
  res.status(200).json(messages);
});

app.post('/api/v1/marketplace/chats/send', (req, res) => {
  const { roomId, senderId, content, mediaUrl, messageType } = req.body;

  const newMessage = {
    id: 'msg' + (appState.chatMessages.length + 1),
    room_id: roomId,
    sender_id: senderId,
    content: content || '',
    media_url: mediaUrl || '',
    message_type: messageType || 'text',
    created_at: new Date().toISOString()
  };

  appState.chatMessages.push(newMessage);
  io.emit('new_chat_message', newMessage);
  res.status(201).json({ success: true, message: newMessage });
});

// 7. Notifications
app.get('/api/v1/notifications', (req, res) => {
  res.status(200).json(appState.notifications);
});

app.post('/api/v1/notifications/mark-read', (req, res) => {
  appState.notifications.forEach(n => n.is_read = true);
  res.status(200).json({ success: true });
});

// 8. Government Schemes Mock Database Search
app.get('/api/v1/schemes', (req, res) => {
  const schemes = [
    {
      id: 's1',
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      department: 'Ministry of Agriculture & Farmers Welfare',
      description: 'Direct income support of ₹6,000 per year in three equal installments to small and marginal farmer families.',
      benefit: '₹6,000 / year',
      eligibility: 'Small & marginal landholding families up to 2 Hectares.',
      status: 'eligible',
      portalUrl: 'https://pmkisan.gov.in/'
    },
    {
      id: 's2',
      name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
      department: 'Department of Agriculture & Farmers Welfare',
      description: 'Provides subsidy for buying farm machinery like tractors, sprayers, drones, and precision tools.',
      benefit: '50% to 80% subsidy on equipment purchase',
      eligibility: 'All registered farmers holding Kisan Credit Card.',
      status: 'eligible',
      portalUrl: 'https://agrimachinery.nic.in/'
    },
    {
      id: 's3',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      department: 'Insurance Division, Ministry of Agriculture',
      description: 'Financial support and risk insurance covering crop losses from natural calamities, pests & diseases.',
      benefit: 'Up to 90% premium subsidy, covers total crop value loss',
      eligibility: 'All food, oilseeds, and commercial horticultural crops.',
      status: 'eligible',
      portalUrl: 'https://pmfby.gov.in/'
    },
    {
      id: 's4',
      name: 'Kisan Credit Card (KCC) Scheme',
      department: 'Reserve Bank of India & NABARD',
      description: 'Provides short-term formal credit to farmers for crop cultivation, harvest expenses, and farm maintenance at subsidized interest rates.',
      benefit: 'Credit up to ₹3,000,000 at effective 4% interest rate',
      eligibility: 'All farmers, tenant farmers, and sharecroppers.',
      status: 'approved',
      portalUrl: 'https://www.myscheme.gov.in/schemes/kcc'
    },
    {
      id: 's5',
      name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
      department: 'National Mission for Sustainable Agriculture',
      description: 'Promotes organic farming through cluster approach and Participatory Guarantee System (PGS) certification.',
      benefit: '₹50,000 per hectare for 3 years for organic inputs',
      eligibility: 'Farmers adopting organic farming in 50-acre clusters.',
      status: 'eligible',
      portalUrl: 'https://pgsindia-ncof.gov.in/pkvy/index.aspx'
    },
    {
      id: 's6',
      name: 'PM Krishi Sinchayee Yojana (PMKSY - Drip & Micro Irrigation)',
      department: 'Ministry of Jal Shakti & Agriculture',
      description: 'Financial assistance for installing micro-irrigation systems (drip and sprinkler) to maximize water use efficiency.',
      benefit: '55% to 70% subsidy on micro-irrigation installation',
      eligibility: 'Farmers with available irrigation source and land records.',
      status: 'eligible',
      portalUrl: 'https://pmksy.gov.in/'
    }
  ];
  res.status(200).json(schemes);
});

// Application endpoint to apply for a government scheme
app.post('/api/v1/schemes/apply', (req, res) => {
  const { schemeId, farmerName } = req.body;
  
  const newNotif = {
    id: String(appState.notifications.length + 1),
    title: 'Government Scheme Application Submitted',
    message: `Application submitted successfully for Scheme ID #${schemeId}. Verification document review in progress.`,
    type: 'success' as const,
    is_read: false,
    created_at: new Date().toISOString()
  };
  appState.notifications.unshift(newNotif);
  io.emit('new_notification', newNotif);

  res.status(200).json({ 
    success: true, 
    message: `Application submitted successfully for Scheme ID ${schemeId}`,
    application_id: `AGR-SCH-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'under_review'
  });
});

// 9. Admin audit log telemetry
app.get('/api/v1/admin/audit-logs', (req, res) => {
  const auditLogs = [
    { timestamp: new Date().toISOString(), action: 'LOGIN_SUCCESS', user: 'farmer.rajesh@agranex.ai', ip: '192.168.1.45' },
    { timestamp: new Date(Date.now() - 300000).toISOString(), action: 'DISEASE_SCAN_COMPLETE', user: 'farmer.rajesh@agranex.ai', ip: '192.168.1.45' },
    { timestamp: new Date(Date.now() - 600000).toISOString(), action: 'MARKETPLACE_LISTING_CREATED', user: 'farmer.rajesh@agranex.ai', ip: '192.168.1.45' },
    { timestamp: new Date(Date.now() - 900000).toISOString(), action: 'MODEL_RETRAIN_TRIGGER', user: 'admin@agranex.ai', ip: '127.0.0.1' }
  ];
  res.status(200).json(auditLogs);
});

// Real-time socket connections for simulated drones / live environment telemetry
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send mock telemetry every 4 seconds to the client to simulate IoT sensors and drone movements
  const telemetryInterval = setInterval(() => {
    socket.emit('iot_telemetry', {
      droneCoords: {
        x: Math.sin(Date.now() * 0.001) * 20,
        z: Math.cos(Date.now() * 0.001) * 20,
        y: 8
      },
      moistureLevel: Number((20 + Math.sin(Date.now() * 0.0005) * 5).toFixed(1)),
      batteryLevel: Math.max(0, Math.floor(100 - (Date.now() % 600000) / 6000)),
      windSpeed: Number((12 + Math.cos(Date.now() * 0.001) * 3).toFixed(1))
    });
  }, 4000);

  socket.on('disconnect', () => {
    clearInterval(telemetryInterval);
    console.log('Client disconnected:', socket.id);
  });
});

// Only start listening when not running in Vercel's Serverless environment (e.g. run locally, or inside a persistent Vercel Web Service container)
const isVercelServerless = !!(process.env.VERCEL && process.env.AWS_REGION);
if (!isVercelServerless) {
  server.listen(PORT, () => {
    console.log(`[AGRANEX SERVER] Running on port ${PORT}`);
  });
}

// Export app for Vercel serverless functions
export default app;
