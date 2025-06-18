import requests
from config import Config

class ExchangeAPI:
    @staticmethod
    def get_symbols(exchange):
        base_url = Config.EXCHANGE_API_BASE_URLS.get(exchange)
        if not base_url:
            return None
        
        try:
            if exchange == 'OKX':
                response = requests.get(f"{base_url}/public/instruments?instType=SPOT")
                return [inst['instId'] for inst in response.json().get('data', [])]
            elif exchange == 'Bybit':
                response = requests.get(f"{base_url}/public/symbols")
                return [sym['name'] for sym in response.json().get('result', [])]
            elif exchange == 'Deribit':
                response = requests.get(f"{base_url}/public/get_instruments?currency=BTC")
                return [inst['instrument_name'] for inst in response.json().get('result', [])]
            elif exchange == 'Binance':
                response = requests.get(f"{base_url}/exchangeInfo")
                return [sym['symbol'] for sym in response.json().get('symbols', [])]
        except Exception:
            return None

    @staticmethod
    def get_price(exchange, symbol):
        base_url = Config.EXCHANGE_API_BASE_URLS.get(exchange)
        if not base_url:
            return None
        
        try:
            if exchange == 'OKX':
                response = requests.get(f"{base_url}/market/ticker?instId={symbol}")
                return response.json().get('data', [{}])[0].get('last')
            elif exchange == 'Bybit':
                response = requests.get(f"{base_url}/public/tickers?symbol={symbol}")
                return response.json().get('result', [{}])[0].get('last_price')
            elif exchange == 'Deribit':
                response = requests.get(f"{base_url}/public/ticker?instrument_name={symbol}")
                return response.json().get('result', {}).get('last_price')
            elif exchange == 'Binance':
                response = requests.get(f"{base_url}/ticker/price?symbol={symbol}")
                return response.json().get('price')
        except Exception:
            return None