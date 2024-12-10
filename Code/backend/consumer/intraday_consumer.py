import sys
sys.path.append(r'D:\GR1\Code')
from confluent_kafka import Consumer
import json
import pandas as pd
from backend.database.pgsql import PostgresManager

class IntradayDataConsumer:
    def __init__(self, bootstrap_servers='localhost:9092', topic_name='intraday'):
        self.topic_name = topic_name
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'intraday_data_consumer_group',
            'auto.offset.reset': 'earliest'
        })
        
        self.consumer.subscribe([self.topic_name])
        self.postgre = PostgresManager("GR1_data")

    def deserialize_message(self, message):
        return json.loads(message.decode('utf-8'))

    def consume_and_store(self):
        while True:
            message = self.consumer.poll(1.0)  # Wait for a message for 1 second
            if message is None:
                continue  # No message received, continue polling

            if message.error():
                print(f"Consumer error: {message.error()}")
                continue  # Handle error

            try:
                # Giải mã message nhận được
                intraday_data = self.deserialize_message(message.value())
                
                # Tạo DataFrame từ dữ liệu intraday
                df = pd.DataFrame([{
                    'time': intraday_data['time'],  # Dữ liệu thời gian
                    'price': intraday_data['price'],  # Giá
                    'volume': intraday_data['volume'],  # Khối lượng
                    'match_type': intraday_data['match_type'],  # Loại giao dịch
                    'id': intraday_data['id'],
                    'symbol': intraday_data.get('symbol', '')  # Thêm symbol nếu có
                }])

                # Lưu vào PostgreSQL vào bảng 'intraday'
                self.postgre.insert_dataframe_to_table(df, 'intraday')
                
                print(f"Đã lưu dữ liệu cho {df['symbol'].values[0]} vào bảng intraday")
            
            except Exception as e:
                print(f"Lỗi khi xử lý message: {e}")

def main():
    consumer = IntradayDataConsumer()
    consumer.consume_and_store()

if __name__ == "__main__":
    main()