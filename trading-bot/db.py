from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

_supabase = None

def get_db():
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


def ensure_schema():
    sql = """
    CREATE TABLE IF NOT EXISTS trading_signals (
        id BIGSERIAL PRIMARY KEY,
        stock TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        price NUMERIC(12,2),
        target NUMERIC(12,2),
        stop_loss NUMERIC(12,2),
        rsi NUMERIC(5,1),
        volume_ratio NUMERIC(5,1),
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        acted_on BOOLEAN DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS idx_signals_created ON trading_signals(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_signals_stock ON trading_signals(stock);
    """
    try:
        get_db().rpc('exec_sql', {'query': sql})
    except Exception:
        pass


def log_signal(stock: str, signal_type: str, price: float, target: float,
               stop_loss: float, rsi: float, volume_ratio: float, reason: str):
    try:
        data = {
            'stock': stock,
            'signal_type': signal_type,
            'price': price,
            'target': target,
            'stop_loss': stop_loss,
            'rsi': rsi,
            'volume_ratio': volume_ratio,
            'reason': reason,
        }
        get_db().table('trading_signals').insert(data).execute()
    except Exception:
        pass


def get_recent_signals(stock: str, limit: int = 5):
    try:
        resp = get_db().table('trading_signals') \
            .select('*') \
            .eq('stock', stock) \
            .order('created_at', desc=True) \
            .limit(limit) \
            .execute()
        return resp.data
    except Exception:
        return []
