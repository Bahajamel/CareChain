# CareChain — Decentralized Health Insurance Platform

## Overview

CareChain is a Web3 application designed to modernize health insurance systems by leveraging blockchain and decentralized storage.  
The platform enables secure, transparent, and automated management of medical records and reimbursement claims.

It combines:
- **Blockchain (smart contracts)** for trust and automation  
- **IPFS** for decentralized storage of medical documents  
- **Backend APIs** for data processing  
- **Frontend interface** for user interaction  

---

## Problem Statement

Traditional health insurance systems suffer from:

- Lack of transparency  
- Manual and slow claim processing  
- Risk of fraud and data tampering  
- Centralized storage of sensitive medical data  

CareChain addresses these issues by introducing decentralization, immutability, and automation.

---

## Solution

CareChain provides:

- Secure upload of medical documents  
- Decentralized storage via IPFS  
- Structured metadata for each medical record  
- Smart contract-based claim management  
- Transparent and traceable workflows  

---

## Architecture

Frontend (React)
↓
Backend (Node.js / Express)
↓
IPFS (via Pinata)
↓
Blockchain (Smart Contracts)


---

## Key Features

### 1. Medical Record Upload
- Upload PDF/image documents  
- Store files on IPFS  
- Generate metadata (JSON)  
- Return immutable CID references  

### 2. Metadata System
- Structured medical data:
  - patient address  
  - provider address  
  - type of medical act  
  - amount  
  - document CID  
- Stored on IPFS  

### 3. Smart Contract Integration
- Store `metadataCid` on-chain  
- Manage claims and reimbursements  
- Ensure transparency and traceability  

### 4. Role-Based System
- **Patient**: view records and claims  
- **Provider**: submit medical records  
- **Insurer**: validate or reject claims  

---

## Tech Stack

### Frontend
- React  
- Ethers.js  

### Backend
- Node.js  
- Express  
- Multer (file upload)  
- Axios  

### Decentralized Storage
- IPFS  
- Pinata  

### Blockchain
- Solidity  
- Ethereum-compatible network  



```
CareChain
├─ .sfdx
│  ├─ tools
│  │  ├─ sobjects
│  │  │  └─ standardObjects
│  │  │     ├─ Account.cls
│  │  │     ├─ AccountHistory.cls
│  │  │     ├─ Asset.cls
│  │  │     ├─ Attachment.cls
│  │  │     ├─ Case.cls
│  │  │     ├─ Contact.cls
│  │  │     ├─ Contract.cls
│  │  │     ├─ Domain.cls
│  │  │     ├─ Lead.cls
│  │  │     ├─ Note.cls
│  │  │     ├─ Opportunity.cls
│  │  │     ├─ Order.cls
│  │  │     ├─ Pricebook2.cls
│  │  │     ├─ PricebookEntry.cls
│  │  │     ├─ Product2.cls
│  │  │     ├─ RecordType.cls
│  │  │     ├─ Report.cls
│  │  │     ├─ Task.cls
│  │  │     └─ User.cls
│  │  └─ soqlMetadata
│  │     ├─ standardObjects
│  │     │  ├─ Account.json
│  │     │  ├─ AccountHistory.json
│  │     │  ├─ Asset.json
│  │     │  ├─ Attachment.json
│  │     │  ├─ Case.json
│  │     │  ├─ Contact.json
│  │     │  ├─ Contract.json
│  │     │  ├─ Domain.json
│  │     │  ├─ Lead.json
│  │     │  ├─ Note.json
│  │     │  ├─ Opportunity.json
│  │     │  ├─ Order.json
│  │     │  ├─ Pricebook2.json
│  │     │  ├─ PricebookEntry.json
│  │     │  ├─ Product2.json
│  │     │  ├─ RecordType.json
│  │     │  ├─ Report.json
│  │     │  ├─ Task.json
│  │     │  └─ User.json
│  │     └─ typeNames.json
│  └─ typings
│     └─ lwc
│        └─ sobjects
│           ├─ Account.d.ts
│           ├─ AccountHistory.d.ts
│           ├─ Asset.d.ts
│           ├─ Attachment.d.ts
│           ├─ Case.d.ts
│           ├─ Contact.d.ts
│           ├─ Contract.d.ts
│           ├─ Domain.d.ts
│           ├─ Lead.d.ts
│           ├─ Note.d.ts
│           ├─ Opportunity.d.ts
│           ├─ Order.d.ts
│           ├─ Pricebook2.d.ts
│           ├─ PricebookEntry.d.ts
│           ├─ Product2.d.ts
│           ├─ RecordType.d.ts
│           ├─ Report.d.ts
│           ├─ Task.d.ts
│           └─ User.d.ts
├─ back-end
│  ├─ .env
│  ├─ .env.example
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ server.js
│  ├─ src
│  │  ├─ app.js
│  │  ├─ config
│  │  │  ├─ contracts.js
│  │  │  ├─ env.js
│  │  │  └─ index.js
│  │  ├─ controllers
│  │  │  ├─ files.controller.js
│  │  │  └─ medicalRecords.controller.js
│  │  ├─ middlewares
│  │  │  ├─ apiKey.middleware.js
│  │  │  ├─ error.middleware.js
│  │  │  └─ upload.middleware.js
│  │  ├─ routes
│  │  │  ├─ files.routes.js
│  │  │  └─ medicalRecords.routes.js
│  │  ├─ services
│  │  │  ├─ blockchain.service.js
│  │  │  └─ ipfs.service.js
│  │  └─ utils
│  │     └─ AppError.js
│  └─ uploads
├─ blockchain_health_insurance_roadmap.pdf
├─ cahier_des_charges_carechain.pdf
├─ contracts
│  ├─ contracts
│  │  ├─ AccessControl.sol
│  │  ├─ ClaimContract.sol
│  │  ├─ interfaces
│  │  │  ├─ IAccess.sol
│  │  │  ├─ IMedical.sol
│  │  │  └─ IPolicy.sol
│  │  ├─ MedicalRecord.sol
│  │  └─ PolicyContract.sol
│  ├─ deployments
│  │  ├─ abis
│  │  │  ├─ AccessControl.json
│  │  │  ├─ ClaimContract.json
│  │  │  ├─ MedicalRecord.json
│  │  │  └─ PolicyContract.json
│  │  └─ deployment.json
│  ├─ hardhat.config.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ scripts
│  │  └─ deploy.ts
│  ├─ test
│  │  ├─ access.test.ts
│  │  ├─ claim.test.ts
│  │  ├─ medicalRecord.test.ts
│  │  ├─ policy.test.ts
│  │  └─ workflow.test.ts
│  └─ tsconfig.json
├─ front-end
│  ├─ .env.example
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ api
│  │  │  └─ client.js
│  │  ├─ App.jsx
│  │  ├─ config
│  │  │  └─ contracts.js
│  │  ├─ context
│  │  │  ├─ App.jsx
│  │  │  ├─ ClaimsContext.jsx
│  │  │  └─ WalletContext.jsx
│  │  ├─ hooks
│  │  │  ├─ useContract.js
│  │  │  └─ useUserRole.js
│  │  ├─ index.css
│  │  ├─ layout
│  │  │  └─ MvpLayout.jsx
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ AdminDashboard.jsx
│  │  │  ├─ DashboardRouter.jsx
│  │  │  ├─ InsurerDashboard.jsx
│  │  │  ├─ PatientDashboard.jsx
│  │  │  ├─ ProviderDashboard.jsx
│  │  │  ├─ UploadMedicalRecord.jsx
│  │  │  └─ WalletConnectPage.jsx
│  │  └─ web3
│  └─ vite.config.js
├─ README.md
└─ scripts

```