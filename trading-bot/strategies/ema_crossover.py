import pandas as pd
import pandas_ta as ta


def run(df: pd.DataFrame, params: dict) -> list[dict]:
    if df is None or len(df) < 50:
        return []

    df = df.copy()
    fast = params.get('ema_fast', 9)
    slow = params.get('ema_slow', 21)
    rsi_period = params.get('rsi_period', 14)
    rsi_ob = params.get('rsi_overbought', 70)
    rsi_os = params.get('rsi_oversold', 30)
    vol_period = params.get('volume_sma_period', 20)
    vol_thresh = params.get('volume_threshold', 1.5)

    df['EMA_FAST'] = ta.ema(df['Close'], length=fast)
    df['EMA_SLOW'] = ta.ema(df['Close'], length=slow)
    df['RSI'] = ta.rsi(df['Close'], length=rsi_period)
    df['VOL_SMA'] = df['Volume'].rolling(window=vol_period).mean()
    df['VOL_RATIO'] = df['Volume'] / df['VOL_SMA']

    signals = []
    last = df.iloc[-1]
    prev = df.iloc[-2]

    if pd.isna(last['EMA_FAST']) or pd.isna(last['EMA_SLOW']):
        return []

    if prev['EMA_FAST'] <= prev['EMA_SLOW'] and last['EMA_FAST'] > last['EMA_SLOW']:
        if rsi_os < last['RSI'] < rsi_ob:
            target = last['Close'] * 1.08
            stop = last['Close'] * 0.96
            vol_note = f", Volume {last['VOL_RATIO']:.1f}x SMA" if last['VOL_RATIO'] > vol_thresh else ""
            signals.append({
                'type': 'BUY',
                'price': round(last['Close'], 2),
                'target': round(target, 2),
                'stop_loss': round(stop, 2),
                'reason': f"EMA {fast}/{slow} bullish crossover{vol_note}. RSI {last['RSI']:.0f} confirming momentum.",
                'rsi': round(last['RSI'], 1),
                'volume_ratio': round(last['VOL_RATIO'], 1),
            })

    elif prev['EMA_FAST'] >= prev['EMA_SLOW'] and last['EMA_FAST'] < last['EMA_SLOW']:
        if rsi_os < last['RSI'] < rsi_ob:
            target = last['Close'] * 0.92
            stop = last['Close'] * 1.04
            signals.append({
                'type': 'SELL',
                'price': round(last['Close'], 2),
                'target': round(target, 2),
                'stop_loss': round(stop, 2),
                'reason': f"EMA {fast}/{slow} bearish crossover. RSI {last['RSI']:.0f} confirming downside momentum.",
                'rsi': round(last['RSI'], 1),
                'volume_ratio': round(last['VOL_RATIO'], 1),
            })

    if last['RSI'] < rsi_os:
        signals.append({
            'type': 'WATCH',
            'price': round(last['Close'], 2),
            'target': round(last['Close'] * 1.05, 2),
            'stop_loss': round(last['Close'] * 0.95, 2),
            'reason': f"RSI oversold at {last['RSI']:.0f}. Watch for bounce confirmation.",
            'rsi': round(last['RSI'], 1),
            'volume_ratio': round(last['VOL_RATIO'], 1),
        })

    elif last['RSI'] > rsi_ob:
        signals.append({
            'type': 'WATCH',
            'price': round(last['Close'], 2),
            'target': round(last['Close'] * 0.95, 2),
            'stop_loss': round(last['Close'] * 1.05, 2),
            'reason': f"RSI overbought at {last['RSI']:.0f}. Watch for reversal.",
            'rsi': round(last['RSI'], 1),
            'volume_ratio': round(last['VOL_RATIO'], 1),
        })

    return signals
