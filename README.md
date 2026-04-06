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


