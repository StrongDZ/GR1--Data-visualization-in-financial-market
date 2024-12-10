import sys
sys.path.append(r'D:\GR1\Code')
from vnstock3 import Vnstock
import pandas as pd
import time
from backend.database.pgsql import PostgresManager
from datetime import datetime, timedelta

postgre = PostgresManager("GR1_data")
stock = Vnstock().stock(symbol='TCB',source='VCI')
current_time = datetime.now().strftime("%Y-%m-%d")
symbol = 'AAA'
# last_updated = postgre.get_latest_updated_timestamp(symbol=symbol, table_name='intraday')
# print(postgre.get_latest_updated_timestamp(symbol=symbol, table_name='intraday'))
# print(f"haha ${last_updated}")
df = stock.quote.intraday(symbol=symbol, page_size = 1000)
# df = df[df['time'] > last_updated].copy()
df['symbol'] = symbol
print(df.to_string())