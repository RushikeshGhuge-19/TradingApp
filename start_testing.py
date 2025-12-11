#!/usr/bin/env python3
"""
Integration Test Startup Script
Starts backend and frontend servers for testing
"""

import subprocess
import time
import os
import sys

def start_backend():
    """Start FastAPI backend"""
    print("\n🚀 Starting Backend (FastAPI)...")
    backend_dir = r"d:\TradingApp\Backend\algo-backend"
    
    if not os.path.exists(backend_dir):
        print(f"❌ Backend directory not found: {backend_dir}")
        return None
    
    os.chdir(backend_dir)
    
    # Start uvicorn
    cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    
    print("✓ Backend process started (PID: {})".format(proc.pid))
    print("✓ FastAPI will be available at: http://localhost:8000")
    print("✓ API docs at: http://localhost:8000/docs")
    time.sleep(3)
    return proc

def start_frontend():
    """Start React Vite frontend"""
    print("\n🚀 Starting Frontend (React + Vite)...")
    frontend_dir = r"d:\TradingApp\Frontend"
    
    if not os.path.exists(frontend_dir):
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return None
    
    os.chdir(frontend_dir)
    
    # Check if node_modules exists
    if not os.path.exists("node_modules"):
        print("📦 Installing dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Start dev server
    cmd = ["npm", "run", "dev"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    
    print("✓ Frontend process started (PID: {})".format(proc.pid))
    print("✓ Vite will be available at: http://localhost:5173")
    time.sleep(3)
    return proc

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════╗
║     Strategy Builder - Integration Testing Setup          ║
║                                                            ║
║ This script starts both backend and frontend servers      ║
║ for end-to-end testing                                    ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    backend_proc = start_backend()
    frontend_proc = start_frontend()
    
    print("""
╔════════════════════════════════════════════════════════════╗
║              ✅ Both Servers Ready!                       ║
║                                                            ║
║ Backend:  http://localhost:8000                           ║
║ Frontend: http://localhost:5173                           ║
║ API Docs: http://localhost:8000/docs                      ║
║                                                            ║
║ Press Ctrl+C to stop both servers                         ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    try:
        if backend_proc:
            backend_proc.wait()
        if frontend_proc:
            frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping servers...")
        if backend_proc:
            backend_proc.terminate()
        if frontend_proc:
            frontend_proc.terminate()
        time.sleep(1)
        print("✓ All servers stopped")
        sys.exit(0)
