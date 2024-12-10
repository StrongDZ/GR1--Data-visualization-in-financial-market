import sys
sys.path.append(r'D:\GR1\Code')
import json
import time
import threading
from datetime import datetime
from vnstock3 import Vnstock
from backend.database.pgsql import PostgresManager
from confluent_kafka import Producer

class CpMinProducer:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.producer_config = {
            'bootstrap.servers': bootstrap_servers,
            'client.id': 'cp_min-producer'
        }
        self.producer = Producer(self.producer_config)
        self.topic_name = 'data_real_time'
        self.stock = Vnstock().stock(source='VCI')

    def delivery_report(self, err, msg):
        if err is not None:
            print(f'Lỗi khi gửi tin nhắn: {err}')
        else:
            print(f'Tin nhắn gửi thành công tới topic {msg.topic()}')

    def send_cp_min_data(self, cp_min_data):
        try:
            message_json = json.dumps(cp_min_data).encode('utf-8')
            self.producer.produce(self.topic_name, message_json, callback=self.delivery_report)
            self.producer.flush()
        except Exception as e:
            print(f"Lỗi khi gửi dữ liệu cp_min: {e}")

    def produce_cp_min_data_for_symbols(self, symbols):
        postgre = PostgresManager("GR1_data")  # Khởi tạo PostgresManager mới
        MAX_RETRIES = 3       # Số lần thử lại tối đa
        DELAY_BETWEEN_REQUESTS = 3  # Thời gian chờ giữa các yêu cầu (giây)
        DELAY_ON_429 = 6      # Thời gian chờ khi gặp lỗi 429 (giây)
        while True:
            for symbol in symbols:
                retry_count = 0
                while retry_count < MAX_RETRIES:
                    try:
                        last_updated = postgre.get_latest_updated_timestamp(symbol=symbol, table_name='cp_min')
                        current_time = datetime.now().strftime("%Y-%m-%d")
                        
                        # Lấy dữ liệu cp_min từ API
                        df = self.stock.quote.history(
                            start=last_updated.strftime("%Y-%m-%d"),
                            end=current_time,
                            symbol=symbol,
                            interval='1m'  # Lấy dữ liệu hàng phút
                        )

                        # Lọc dữ liệu mới
                        df = df[df['time'] > last_updated].copy()

                        if not df.empty:
                            for _, row in df.iterrows():
                                # print(f'cp_min \n ${row}')
                                message = {
                                    'data': {  # Gói dữ liệu cổ phiếu
                                        'symbol': symbol,
                                        'time': row['time'].strftime('%Y-%m-%d %H:%M:%S'),
                                        'open': row['open'],
                                        'high': row['high'],
                                        'low': row['low'],
                                        'close': row['close'],
                                        'volume': row['volume']
                                    },
                                    'sqltable': 'cp_min'  # Thêm tên bảng vào message
                                }
                                self.send_cp_min_data(message)

                            print(f"Đã gửi {len(df)} dòng dữ liệu cp_min cho {symbol}")

                        time.sleep(DELAY_BETWEEN_REQUESTS)
                        break
                    
                    except Exception as e:
                        if "429" in str(e):  # Kiểm tra lỗi 429
                            print(f"Error 429: Too many requests for{symbol} to cp_min. Retrying after {DELAY_ON_429} seconds.")
                            time.sleep(DELAY_ON_429)  # Chờ lâu hơn khi gặp lỗi 429
                            retry_count += 1
                        else:
                            print(f"Error with {symbol}: {e}")
                            break  # Thoát vòng lặp retry nếu lỗi khác 429

            print("Vòng lặp đã hoàn thành. Đợi trước khi lặp lại...")
            time.sleep(5)

    def start_producing(self, all_symbols):
        threads = []
        chunk_size = 20  # Số lượng symbol mỗi thread xử lý

        for i in range(0, len(all_symbols), chunk_size):
            thread_symbols = all_symbols[i:i + chunk_size]
            thread = threading.Thread(target=self.produce_cp_min_data_for_symbols, args=(thread_symbols,))
            threads.append(thread)

        # Bắt đầu các luồng
        for thread in threads:
            thread.start()

        # Chờ cho các luồng hoàn thành
        for thread in threads:
            thread.join()

if __name__ == "__main__":
    producer = CpMinProducer()
    postgre = PostgresManager("GR1_data")
    symbols = postgre.query_table(table_name="ma_ck_niemyet_all")
    symbols = symbols["symbol"].tolist() 
    producer.start_producing(symbols)