# stock_data_consumer.py
import sys
sys.path.append(r'D:\GR1\Code')
from confluent_kafka import Consumer
import json
import pandas as pd
from backend.database.pgsql import PostgresManager


class StockDataConsumer:
    def __init__(self, bootstrap_servers='localhost:9092', topic_name='data_real_time'):
        """
        Khởi tạo Kafka Consumer
        """
        self.topic_name = topic_name  # Lưu topic_name là thuộc tính của lớp
        self.consumer = Consumer({
            'bootstrap.servers': bootstrap_servers,  # Ensure this is a string
            'group.id': 'stock_data_consumer_group',  # Set the group.id here
            'auto.offset.reset': 'earliest',  # Chỉ lấy tin nhắn mới nhất
            'enable.auto.commit': True
        })
        
        self.consumer.subscribe([self.topic_name])
        self.postgre = PostgresManager("GR1_data")
    def deserialize_message(self, message):
        """
        Giải mã tin nhắn JSON
        """
        return json.loads(message.decode('utf-8'))

    def consume_and_store(self):
        """
        Tiêu thụ và lưu trữ dữ liệu từ Kafka vào PostgreSQL
        """
        while True:  # Keep consuming messages
            message = self.consumer.poll(1.0)  # Wait for a message for 1 second
            print(message)
            if message is None:
                continue  # No message received, continue polling

            if message.error():
                print(f"Consumer error: {message.error()}")
                continue  # Handle error

            try:
                data = self.deserialize_message(message.value())
                # Lấy dữ liệu và sqltable từ message
                stock_data = data.get('data')  # Dữ liệu cổ phiếu
                table_name = data.get('sqltable')  # Tên bảng

                # Chuyển message thành DataFrame
                df = pd.DataFrame([stock_data])

                # Lưu vào PostgreSQL vào bảng tương ứng
                self.postgre.insert_dataframe_to_table(df, table_name)
                
                print(f"Đã lưu dữ liệu cho {df['symbol'].values[0]} vào bảng {table_name}")
            
            except Exception as e:
                print(f"Lỗi khi xử lý message: {e}")

def main():
    consumer = StockDataConsumer()
    consumer.consume_and_store()

if __name__ == "__main__":
    main()