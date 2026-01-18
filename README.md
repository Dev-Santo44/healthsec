# HealthSec: Personalized Health AI with Local Edge Training

HealthSec is a cutting-edge platform designed to empower users with personalized health insights while maintaining data privacy. By leveraging **Local Model Training** (Edge AI), the system trains models directly on the user's device, ensuring sensitive health data stays local. Only anonymized model weights are uploaded to a global repository for aggregation and improvement of the base model.

## 🚀 Key Features

- **Local Model Training**: Train health AI models on your own device using `tensorflow.js`.
- **Global Weight Synchronization**: Upload locally refined model weights to a secure Supabase Storage bucket.
- **Privacy-First Architecture**: Health data remains on the device; only weights are shared.
- **Secure Authentication**: Powerded by Supabase Auth (Email, Social logins).
- **Real-time Monitoring**: Track training progress and health metrics in a beautiful dashboard.
- **Scalable Backend**: Built on GCP Cloud Run and Supabase (PostgreSQL).

## 🛠 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Machine Learning**: [TensorFlow.js](https://js.tensorflow.org/) for browser-based training
- **Deployment**: [Google Cloud Platform](https://cloud.google.com/) (Cloud Run)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

```text
healthsec/
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   ├── components/         # Reusable UI components
│   ├── lib/
│   │   ├── supabase/       # Supabase client configuration
│   │   └── ml/             # Local training & weight management logic
│   └── types/              # TypeScript definitions
├── public/                 # Static assets
└── .env.local              # Environment variables
```

## 🏗 Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd healthsec
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧠 ML Workflow

1.  **Data Collection**: Health data is gathered and stored locally (e.g., IndexedDB or state).
2.  **Local Training**: The `MLManager` initializes a model and fits it to visual data.
3.  **Weight Extraction**: Model weights are serialized into a binary format.
4.  **Upload**: Weights are uploaded to Supabase Storage with versioning metadata.
5.  **Global Merge**: (Future) Server-side logic aggregates weights from multiple users.

## 🛡 Security

- All communication is via HTTPS.
- Model weights are validated for structure before being processed.
- Role-based access control (RBAC) via Supabase RLS.

## 📄 License

This project is licensed under the MIT License.
