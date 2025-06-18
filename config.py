import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BLANDAI_API_KEY = os.getenv('BLANDAI_API_KEY')
    EXCHANGE_API_BASE_URLS = {
        'OKX': 'https://www.okx.com/api/v5',
        'Bybit': 'https://api.bybit.com/v2',
        'Deribit': 'https://www.deribit.com/api/v2',
        'Binance': 'https://api.binance.com/api/v3'
    }