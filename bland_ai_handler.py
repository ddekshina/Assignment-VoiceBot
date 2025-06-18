from exchange_apis import ExchangeAPI

class BlandAIHandler:
    @staticmethod
    def process_voice_input(text, state):
        if not state.get('step'):
            return {
                "response": "Welcome to OTC Trading Bot! Choose an exchange: OKX, Bybit, Deribit, or Binance.",
                "state": {"step": "exchange_selection"}
            }
        
        if state['step'] == "exchange_selection":
            exchange = text.strip().title()
            if exchange not in ["OKX", "Bybit", "Deribit", "Binance"]:
                return {
                    "response": "Please choose: OKX, Bybit, Deribit, or Binance.",
                    "state": state
                }
            return {
                "response": f"{exchange} selected. Which symbol to trade?",
                "state": {"step": "symbol_selection", "exchange": exchange}
            }
        
        elif state['step'] == "symbol_selection":
            symbol = text.strip().upper()
            exchange = state['exchange']
            price = ExchangeAPI.get_price(exchange, symbol)
            
            if not price:
                return {
                    "response": f"Symbol {symbol} not found. Try another.",
                    "state": state
                }
            
            return {
                "response": f"{symbol} price: {price}. Enter quantity:",
                "state": {
                    "step": "quantity_input",
                    "exchange": exchange,
                    "symbol": symbol,
                    "price": price
                }
            }
        
        elif state['step'] == "quantity_input":
            try:
                quantity = float(text.strip())
                return {
                    "response": f"Enter price for {quantity} {state['symbol']}:",
                    "state": {**state, "step": "price_input", "quantity": quantity}
                }
            except ValueError:
                return {
                    "response": "Invalid quantity. Please enter a number.",
                    "state": state
                }
        
        elif state['step'] == "price_input":
            try:
                price = float(text.strip())
                order = {
                    "exchange": state['exchange'],
                    "symbol": state['symbol'],
                    "quantity": state['quantity'],
                    "price": price
                }
                return {
                    "response": f"Order confirmed: {order['quantity']} {order['symbol']} at {order['price']} on {order['exchange']}.",
                    "state": {"step": "completed"},
                    "order": order
                }
            except ValueError:
                return {
                    "response": "Invalid price. Please enter a number.",
                    "state": state
                }
        
        return {
            "response": "Sorry, I didn't understand. Please repeat.",
            "state": state
        }