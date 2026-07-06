# ⛓️ CBU ChainStores – Blockchain-Secured Inventory Management System

> **CS301 Project Management**  
> **School of Information and Communication Technology**  
> **Copperbelt University**

A full-stack, blockchain-powered inventory management system developed for the **Copperbelt University Central Stores**. The system replaces manual spreadsheet-based inventory management with a secure, transparent, and role-based digital platform.

By leveraging a **private Ethereum blockchain**, every inventory request, approval, and fulfillment is permanently recorded, providing an immutable audit trail that enhances accountability, transparency, and security.

---

## 🚀 Features

### 🔐 Role-Based Access Control (RBAC)

The system supports six user roles, each with dedicated permissions and dashboards:

- 👨‍💼 Administrator
- 📦 Stores Manager
- 🛒 Procurement Officer
- 💰 Chief Financial Officer (CFO)
- 🏪 Storekeeper
- 🏫 Department Representative (Dean/HOD)

Each role only has access to features relevant to its responsibilities.

---

### ⛓️ Blockchain Audit Trail

Every inventory transaction is securely stored on a **private Ethereum blockchain** using **Hardhat**.

Features include:

- Immutable transaction history
- Tamper-proof approval records
- Transaction hashes
- Block numbers
- On-chain verification

---

### 📦 Inventory Management

Manage inventory efficiently through:

- Add new stock items
- Edit inventory details
- Search inventory
- Stock quantity adjustments
- Category management
- Automatic stock status indicators:
  - 🟢 Available
  - 🟡 Low Stock
  - 🔴 Out of Stock

---

### 📋 Sequential Approval Workflow

Inventory requests follow a strict approval chain:

```
Department
      │
      ▼
Stores Manager
      │
      ▼
Procurement Officer
      │
      ▼
CFO
      │
      ▼
Storekeeper (Fulfillment)
```

Each approval stage is validated by the smart contract before progressing to the next stage.

---

### 📊 Interactive Dashboard

Every user sees a personalized dashboard containing:

- Inventory statistics
- Monthly trends
- Category distribution
- Most requested items
- Recent activities
- Pending approvals

---

### 🔍 Blockchain Explorer

Administrators and authorized users can:

- View blockchain transactions
- Search by Request ID
- View Transaction Hashes
- View Block Numbers
- Verify on-chain records
- Copy transaction hashes

---

### 📱 Responsive Design

Built using **Bootstrap 5**, providing:

- Desktop support
- Tablet support
- Mobile support
- Clean Copperbelt University themed interface

---

# 🧠 Technology Stack

| Layer | Technologies |
|---------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Bootstrap 5, React Query, Axios, Recharts |
| **Backend** | Django 6, Django REST Framework, Simple JWT, web3.py |
| **Blockchain** | Solidity, Hardhat, Ethereum, ethers.js, web3.py |
| **Database** | SQLite (Development), PostgreSQL (Production) |
| **Authentication** | JSON Web Tokens (JWT) |

---

# 📸 Screenshots

| Login | Dashboard |
|-------|-----------|
| <img width="960" height="477" alt="cbucsms(i)" src="https://github.com/user-attachments/assets/63da327b-7d37-4f0b-8cb0-67ca1097ce16" />| <img width="960" height="478" alt="cbucsms(iii)" src="https://github.com/user-attachments/assets/b987fa90-ccf0-42e4-b8da-d013b9432a6f" />|

| Inventory | Blockchain Logs |
|-----------|-----------------|
|<img width="960" height="475" alt="cbucsms(vii)" src="https://github.com/user-attachments/assets/ba353a68-e85a-4f45-9671-4bd58f3daf0a" />| <img width="956" height="476" alt="cbucsms(ix)" src="https://github.com/user-attachments/assets/16d750da-6fd2-48a3-9bec-34462f92c1b1" /> |

> Replace these images with screenshots from your own application.

---

# 📁 Project Structure

```
cbu-chainstores/
│
├── backend/
│   ├── api/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── blockchain_service.py
│   │   └── fixtures/
│   │
│   ├── core/
│   └── manage.py
│
├── blockchain/
│   ├── contracts/
│   │   └── RestockApproval.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── index.html
│
├── screenshots/
│
└── README.md
```

---

# ⚙️ Prerequisites

Before running the project, ensure you have installed:

- Python 3.10+
- pip
- Node.js 18+
- npm
- Git

---

# 🔧 Installation

## 1. Clone the Repository

```
git clone https://github.com/your-username/cbu-chainstores.git

cd cbu-chainstores
```

---

## 2. Backend Setup (Django)

```
cd backend

python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py seed_data

python manage.py runserver
```

Backend runs on:

```
http://localhost:8000
```

API Endpoint:

```
http://localhost:8000/api/
```

---

## 3. Blockchain Setup (Hardhat)

Open another terminal.

```bash
cd blockchain

npm install

npx hardhat compile

npx hardhat node
```

The local blockchain will run on:

```
http://127.0.0.1:8545
```

Open another terminal while the blockchain node is running:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

After deployment, copy the deployed contract address into:

```
backend/.env
```

```env
CONTRACT_ADDRESS=0xYourContractAddress

ACCOUNT_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

PRIVATE_KEY=0xac0974bec39a17...
```

> **Note:** Hardhat automatically generates 20 funded development accounts.

---

## 4. Frontend Setup (React)

Open another terminal.

```bash
cd frontend

npm install

npm run dev
```

Application URL:

```
http://localhost:5173
```

---

# 👤 Demo Accounts

| Username | Password | Role |
|-----------|----------|------|
| admin | admin123 | Administrator |
| manager | manager123 | Stores Manager |
| procurement | proc123 | Procurement Officer |
| cfo | cfo123 | CFO |
| storekeeper | store123 | Storekeeper |
| dean_science | science123 | Department |

---

# 🔗 REST API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login/` | Login |
| GET | `/auth/me/` | Current user |
| GET | `/dashboard/stats/` | Dashboard statistics |
| GET | `/stocks/` | View inventory |
| POST | `/stocks/` | Add stock |
| POST | `/stocks/{id}/update_quantity/` | Update quantity |
| POST | `/stocks/{id}/mark_fulfilled/` | Fulfill request |
| GET | `/requests/` | View requests |
| POST | `/requests/` | Create request |
| POST | `/requests/{id}/approve/` | Approve or reject |
| GET | `/my-requests/timeline/` | Request tracking |
| GET | `/blockchain/verify/` | Verify blockchain |
| GET | `/blockchain/logs/` | Blockchain logs |
| GET | `/users/` | User management |

---

# 🔒 Security Features

- ✅ Immutable blockchain audit trail
- ✅ JWT Authentication
- ✅ Refresh token support
- ✅ Role-Based Access Control
- ✅ Protected API endpoints
- ✅ Smart contract validation
- ✅ Sequential approval enforcement
- ✅ Tamper-resistant transaction history

---

# 🧪 Workflow

```
Department
      │
      ▼
Creates Request
      │
      ▼
Stores Manager
      │
      ▼
Procurement Officer
      │
      ▼
     CFO
      │
      ▼
Storekeeper
      │
      ▼
Inventory Updated
      │
      ▼
Blockchain Record Stored
```

---

# 🧰 Troubleshooting

### Hardhat Node Not Connecting

Ensure your `.env` file contains:

```env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
```

---

### Invalid Contract Address

Restart Hardhat and redeploy:

```bash
npx hardhat node

npx hardhat run scripts/deploy.js --network localhost
```

Update the new contract address in `.env`.

---

### Missing Icons

Ensure icon names match exactly.

Example:

```jsx
ExclamationTriangleFill
```

instead of

```jsx
AlertTriangle
```

---

### 401 Unauthorized

Refresh your login credentials or sign in again to obtain a new JWT access token.

---

# 🎯 Future Improvements

- Email notifications
- QR Code inventory tracking
- Barcode scanning
- Multi-store support
- Blockchain analytics dashboard
- Docker deployment
- Cloud deployment (Azure/AWS)
- Mobile application
- Two-factor authentication (2FA)

---

# 📝 License

This project was developed for academic purposes as part of the **CS301 Project Management** course at **Copperbelt University**.

All rights reserved.

---

# 🙏 Acknowledgements

**Supervisor**

**Dr. Derrick Ntalasha**

**Institution**

Copperbelt University  
School of Information and Communication Technology

**Frameworks & Libraries**

- Django
- Django REST Framework
- React
- Bootstrap
- Hardhat
- Solidity
- React Query
- Recharts
- Axios
- web3.py

---

<div align="center">

### ❤️ Built with passion by the CS301 Project Group (2025/2026)

**Blockchain • Django • React • Ethereum • Hardhat**

</div>
