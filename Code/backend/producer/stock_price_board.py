import sys
sys.path.append(r'D:\GR1\Code')
from vnstock3 import Vnstock
import pandas as pd
import time
from backend.database.pgsql import PostgresManager
from datetime import datetime
import traceback

postgre = PostgresManager("GR1_data")
stock = Vnstock().stock(symbol='TCB',source='VCI')
current_time = datetime.now().strftime("%Y-%m-%d")

def poll_and_insert_data():
    try:
        # Đặt tên bảng mới
        table_name = 'stock_price_board'

        # Truy vấn danh sách symbols từ ba bảng khác nhau
        symbols_hnx = postgre.query_table(table_name='ma_ck_hnx', columns='symbol')
        symbols_hose = postgre.query_table(table_name='ma_ck_hose', columns='symbol')
        symbols_upcom = postgre.query_table(table_name='ma_ck_upcom', columns='symbol')

        # Kết hợp danh sách symbols
        all_symbols = pd.concat([symbols_hnx, symbols_hose, symbols_upcom]).drop_duplicates().reset_index(drop=True)
        symbols = all_symbols['symbol'].to_list()

        # Poll the price board data for each symbol
        price_data = stock.trading.price_board(symbols_list=symbols)
        price_data.columns = price_data.columns.droplevel(0)
        required_columns = [
            'symbol', 'ceiling', 'floor', 'ref_price', 'stock_type', 
            'exchange', 'last_trading_date', 'listed_share', 'type', 
            'id', 'organ_name', 'prior_close_price', 'match_price', 
            'match_vol', 'accumulated_volume', 'accumulated_value', 
            'avg_match_price', 'highest', 'lowest', 'match_type', 
            'foreign_sell_volume', 'foreign_buy_volume', 'current_room', 
            'total_room', 'bid_1_price', 'bid_1_volume', 'bid_2_price', 
            'bid_2_volume', 'bid_3_price', 'bid_3_volume', 'ask_1_price', 
            'ask_1_volume', 'ask_2_price', 'ask_2_volume', 'ask_3_price', 
            'ask_3_volume'
        ]

        modified_columns = [
            'ceiling', 'floor', 'ref_price',
            'prior_close_price', 'match_price', 
            'match_vol', 'accumulated_volume', 'accumulated_value', 
            'avg_match_price', 'highest', 'lowest',
            'foreign_sell_volume', 'foreign_buy_volume', 'bid_1_price', 'bid_1_volume', 'bid_2_price', 
            'bid_2_volume', 'bid_3_price', 'bid_3_volume', 'ask_1_price', 
            'ask_1_volume', 'ask_2_price', 'ask_2_volume', 'ask_3_price', 
            'ask_3_volume'
        ]

        # Lọc DataFrame để chỉ giữ lại các cột cần thiết
        price_data = price_data[required_columns]
        price_data = price_data.loc[:, ~price_data.columns.duplicated()]
        price_data[modified_columns] = price_data[modified_columns].fillna(0)
        for column in modified_columns:
            price_data[column] = price_data[column]/1000

        # Chèn dữ liệu vào bảng PostgreSQL
        postgre.insert_dataframe_to_table(price_data, table_name)
        print("Data inserted successfully.")
        return True

    except Exception as e:
        print(f"An error occurred: {e}")
        print(traceback.format_exc())
        return False

def main():
    while True:
        success = poll_and_insert_data()
        
        if not success:
            print("Polling failed. Waiting before retry...")
            time.sleep(10)  # Đợi 10 giây trước khi thử lại
        else:
            time.sleep(3)  # Đợi 6 giây giữa các lần poll khi thành công

if __name__ == "__main__":
    main()