import os
from dotenv import load_dotenv

load_dotenv()

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://dnstcdkjgcmrhcukrjgw.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3RjZGtqZ2NtcmhjdWtyamd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzA1NzksImV4cCI6MjA5ODIwNjU3OX0.FZ5Y5bGw24w0wIEG9VuhhVPJWXXviOOmvLheLuCiTgw')

WATCHLIST = [
    'INFY.NS',       # Infosys
    'RELIANCE.NS',   # Reliance Industries
    'TCS.NS',        # Tata Consultancy Services
    'HDFCBANK.NS',   # HDFC Bank
    'ICICIBANK.NS',  # ICICI Bank
    'SBIN.NS',       # State Bank of India
    'BHARTIARTL.NS', # Bharti Airtel
    'ITC.NS',        # ITC
    'WIPRO.NS',      # Wipro
    'HINDUNILVR.NS', # Hindustan Unilever
]

INDICATOR_PARAMS = {
    'ema_fast': 9,
    'ema_slow': 21,
    'rsi_period': 14,
    'rsi_overbought': 70,
    'rsi_oversold': 30,
    'volume_sma_period': 20,
    'volume_threshold': 1.5,
}

PERIOD = '1mo'
INTERVAL = '1h'
