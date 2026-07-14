import yfinance as yf
import sys
from datetime import datetime, timezone

from config import WATCHLIST, INDICATOR_PARAMS, DISCORD_WEBHOOK_URL
from strategies.ema_crossover import run as ema_crossover
from notify import send_signal, send_error
from db import log_signal, get_recent_signals


def fetch_stock(ticker: str) -> tuple:
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period='1mo', interval='1h')
        if hist.empty:
            return None, None
        info = stock.info
        name = info.get('shortName') or info.get('longName') or ticker
        return hist, name
    except Exception:
        return None, None


def is_duplicate(signals: list[dict], stock: str, signal_type: str) -> bool:
    recent = get_recent_signals(stock, limit=3)
    for r in recent:
        if r['signal_type'] == signal_type:
            return True
    return False


def main():
    if not DISCORD_WEBHOOK_URL:
        print("ERROR: DISCORD_WEBHOOK_URL not set")
        sys.exit(1)

    now = datetime.now(timezone.utc)
    print(f"[{now.isoformat()}] Starting analysis...")

    for ticker in WATCHLIST:
        hist, name = fetch_stock(ticker)
        if hist is None:
            print(f"  {ticker}: skipped (no data)")
            continue

        ticker_name = name or ticker
        signals = ema_crossover(hist, INDICATOR_PARAMS)

        if not signals:
            print(f"  {ticker_name}: no signals")
            continue

        for sig in signals:
            if is_duplicate(signals, ticker, sig['type']):
                print(f"  {ticker_name}: {sig['type']} — duplicate, skipped")
                continue

            ok = send_signal(
                signal_type=sig['type'],
                stock=ticker,
                price=sig['price'],
                target=sig['target'],
                stop_loss=sig['stop_loss'],
                reason=sig['reason'],
                rsi=sig['rsi'],
                volume_ratio=sig['volume_ratio'],
                webhook_url=DISCORD_WEBHOOK_URL,
            )
            log_signal(
                stock=ticker,
                signal_type=sig['type'],
                price=sig['price'],
                target=sig['target'],
                stop_loss=sig['stop_loss'],
                rsi=sig['rsi'],
                volume_ratio=sig['volume_ratio'],
                reason=sig['reason'],
            )

            status = "sent" if ok else "failed"
            print(f"  {ticker_name}: {sig['type']} @ ₹{sig['price']} — {status}")

    print(f"[{datetime.now(timezone.utc).isoformat()}] Done.")


if __name__ == '__main__':
    main()
