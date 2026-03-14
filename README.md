# Namma Parishkara AI

### AI-Powered Civic Issue Detection & Complaint System

## Overview

**Namma Parishkara AI** is an intelligent civic complaint system designed to help citizens report infrastructure issues such as potholes, garbage overflow, drainage blockages, and streetlight failures.

The system uses:

* Retrieval-Augmented Generation (RAG)
* Natural Language Processing (NLP)
* Computer Vision (Image Detection)
* Civic Policy Knowledge Base

The goal is to automatically analyze issues, generate complaints, and assist municipal departments in faster resolution.

---

# System Architecture

User Input → AI Processing → Civic Database → Complaint Generation → Department Action

Modules:

1. Chatbot Interface
2. Image Detection System
3. RAG Knowledge Retrieval
4. NLP Complaint Generator
5. Civic Policy Database
6. Dashboard & Reporting

---

# Core Technologies

Python – Backend processing
Streamlit – ChatGPT-style UI
Ollama – Local LLM runtime
LangChain – RAG orchestration
ChromaDB – Vector database
OpenCV – Image analysis

---

# What is RAG (Retrieval-Augmented Generation)?

RAG combines:

Knowledge Retrieval + Large Language Models

Instead of relying only on the model's training data, the system retrieves relevant documents from a local knowledge base and feeds them to the LLM.

Steps:

1. Documents are stored in the docs folder.
2. Documents are converted into embeddings.
3. Embeddings are stored in a vector database.
4. When a user asks a question, the system retrieves the most relevant documents.
5. The LLM generates a response using the retrieved context.

This ensures:

* Accurate responses
* Local knowledge usage
* Offline capability
* Reduced hallucination

---

# NLP Module

The Natural Language Processing module processes citizen complaints.

Capabilities:

* Text understanding
* Intent detection
* Issue classification
* Complaint generation
* Department routing

Example:

User Input:
"There is a huge pothole near MG Road causing accidents."

NLP Output:
Issue Type → Road Damage
Department → BBMP Roads
Severity → High
Suggested Action → Immediate repair within 24 hours

---

# Image Detection Module

Citizens can upload images of civic issues.

The system analyzes images using computer vision to detect:

* Potholes
* Garbage piles
* Broken roads
* Drain blockages

Image Processing Flow:

Upload Image → Preprocessing → Detection Model → Severity Analysis → Complaint Generation

Output Example:

Issue Detected: Pothole
Severity: High
Suggested Department: BBMP Roads

---

# Civic Policy Knowledge Base

The system uses a large civic policy dataset stored as documents or CSV.

These documents contain:

* Municipal regulations
* Repair timelines
* Department responsibilities
* Infrastructure guidelines

Example Knowledge Query:

User:
"What happens if pothole is severe?"

AI Response:
According to BBMP Road Pothole Repair Policy, high severity potholes must be repaired within 24 hours.

---

# Folder Structure

project_root/

app.py
rag_engine.py
image_detector.py

docs/
Civic policy documents used for RAG training

images/
Pothole training dataset

database/
CSV civic policies and complaint records

models/
Detection models

README.md

---

# Running the System

Step 1: Install dependencies

pip install streamlit langchain chromadb ollama opencv-python

Step 2: Start the LLM

ollama run mistral

Step 3: Run the application

streamlit run app.py

---

# Example Features

ChatGPT-style civic chatbot
Drag-and-drop pothole image upload
AI severity detection
Complaint auto-generation
Map location tagging
Offline operation

---

# Example Workflow

Citizen uploads pothole image

↓

AI detects pothole severity

↓

RAG retrieves civic repair policy

↓

System generates complaint

↓

Complaint assigned to department

---

# Benefits

Faster complaint resolution
AI-assisted infrastructure monitoring
Reduced manual reporting
Improved civic transparency

---

# Future Improvements

Live CCTV monitoring
Mobile app integration
Automatic geolocation detection
Integration with smart city APIs

---

# Project Purpose

This project demonstrates how AI technologies like RAG, NLP, and computer vision can improve public infrastructure management and enable smarter cities.

---

# Author

Punith
Punya Shree G
Poornima V
Pihu Ojha
AI Civic Technology Project

