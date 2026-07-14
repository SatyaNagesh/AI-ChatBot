import requests

def send_signal(signal_type: str, stock: str, price: float, target: float,
                stop_loss: float, reason: str, rsi: float, volume_ratio: float,
                webhook_url: str):
    color_map = {'BUY': 0x00ff00, 'SELL': 0xff0000, 'WATCH': 0xffaa00}
    emoji_map = {'BUY': '🟢', 'SELL': '🔴', 'WATCH': '🟡'}
    rr = round((target - price) / (price - stop_loss), 1) if price != stop_loss else 0

    payload = {
        'embeds': [{
            'title': f"{emoji_map[signal_type]} {signal_type}  {stock.replace('.NS', '')}",
            'color': color_map[signal_type],
            'fields': [
                {'name': 'Current Price', 'value': f"₹{price:,.2f}", 'inline': True},
                {'name': 'Target', 'value': f"₹{target:,.2f}", 'inline': True},
                {'name': 'Stop Loss', 'value': f"₹{stop_loss:,.2f}", 'inline': True},
                {'name': 'Risk/Reward', 'value': f"1:{rr}", 'inline': True},
                {'name': 'RSI (14)', 'value': f"{rsi:.0f}", 'inline': True},
                {'name': 'Volume Ratio', 'value': f"{volume_ratio:.1f}x", 'inline': True},
                {'name': 'Analysis', 'value': reason, 'inline': False},
                {'name': 'Chart', 'value': f"[View on TradingView](https://www.tradingview.com/chart/?symbol=NSE:{stock.replace('.NS', '')})", 'inline': False},
            ],
            'footer': {'text': 'AI Analysis • Always verify before trading'},
        }]
    }

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        return resp.status_code == 204
    except requests.RequestException:
        return False


def send_error(webhook_url: str, message: str):
    payload = {
        'embeds': [{
            'title': '⚠️ Bot Error',
            'color': 0xff0000,
            'description': message,
            'footer': {'text': 'Check logs for details'},
        }]
    }
    try:
        requests.post(webhook_url, json=payload, timeout=10)
    except requests.RequestException:
        pass
