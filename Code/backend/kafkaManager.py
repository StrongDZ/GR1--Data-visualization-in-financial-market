from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import Producer, Consumer
import json

class KafkaManager:
    def __init__(self, bootstrap_servers='localhost:9092'):
        """
        Khởi tạo KafkaManager với các bootstrap servers
        
        :param bootstrap_servers: Kafka bootstrap servers
        """
        self.bootstrap_servers = bootstrap_servers
        self.admin_config = {
            'bootstrap.servers': bootstrap_servers
        }
        self.producer_config = {
            'bootstrap.servers': bootstrap_servers,
            'client.id': 'python-producer'
        }
        self.consumer_config = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'python-consumer-group',
            'auto.offset.reset': 'latest'
        }

    def create_topic(self, topic_name, num_partitions=3, replication_factor=1):
        """
        Tạo Kafka topic mới
        
        :param topic_name: Tên topic
        :param num_partitions: Số lượng partition
        :param replication_factor: Hệ số sao chép
        :return: True nếu tạo topic thành công, False nếu có lỗi
        """
        try:
            admin_client = AdminClient(self.admin_config)

            # Kiểm tra topic đã tồn tại chưa
            existing_topics = admin_client.list_topics().topics
            if topic_name in existing_topics:
                print(f"Topic '{topic_name}' đã tồn tại.")
                return False

            # Tạo topic mới
            topic_list = [NewTopic(topic_name, num_partitions, replication_factor)]
            
            # Tạo topic
            fs = admin_client.create_topics(topic_list)
            
            # Kiểm tra kết quả
            for topic, f in fs.items():
                try:
                    f.result()  # Kiểm tra xem topic có được tạo thành công không
                    print(f"Topic '{topic}' được tạo thành công.")
                except Exception as e:
                    print(f"Lỗi khi tạo topic {topic}: {e}")
            
            return True

        except Exception as e:
            print(f"Lỗi khi tạo topic {topic_name}: {e}")
            return False

    def create_producer(self):
        """
        Tạo Kafka Producer
        
        :return: Confluent Kafka Producer
        """
        try:
            producer = Producer(self.producer_config)
            return producer
        except Exception as e:
            print(f"Lỗi khi tạo producer: {e}")
            return None

    def send_message(self, producer, topic, message):
        """
        Gửi tin nhắn tới topic
        
        :param producer: Confluent Kafka Producer
        :param topic: Tên topic
        :param message: Dữ liệu tin nhắn
        :return: True nếu gửi thành công, False nếu có lỗi
        """
        try:
            # Chuyển đổi message sang JSON
            message_json = json.dumps(message).encode('utf-8')
            
            # Hàm callback để kiểm tra gửi tin nhắn
            def delivery_report(err, msg):
                if err is not None:
                    print(f'Lỗi khi gửi tin nhắn: {err}')
                else:
                    print(f'Tin nhắn gửi thành công tới topic {msg.topic()}')
            
            # Gửi message
            producer.produce(topic, message_json, callback=delivery_report)
            
            # Flush để đảm bảo tin nhắn được gửi
            producer.flush()
            
            return True
        except Exception as e:
            print(f"Lỗi khi gửi tin nhắn: {e}")
            return False

    def create_consumer(self, topics):
        """
        Tạo Kafka Consumer
        
        :param topics: Danh sách các topic để subscribe
        :return: Confluent Kafka Consumer
        """
        try:
            # Nếu topics là string, chuyển thành list
            if isinstance(topics, str):
                topics = [topics]

            consumer = Consumer(self.consumer_config)
            consumer.subscribe(topics)
            
            print(f"Consumer được tạo cho topics: {topics}")
            return consumer
        except Exception as e:
            print(f"Lỗi khi tạo consumer: {e}")
            return None

    def consume_messages(self, consumer, callback=None, max_messages=None):
        try:
            message_count = 0
            while True:
                msg = consumer.poll(1.0)  # Thời gian chờ 1 giây

                if msg is None:
                    continue
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue

                # Xử lý message
                try:
                    value = json.loads(msg.value().decode('utf-8'))
                    print(f"Nhận tin nhắn từ topic {msg.topic()}")
                    print(f"Partition: {msg.partition()}")
                    print(f"Offset: {msg.offset()}")
                    print(f"Dữ liệu: {value}")

                    # Nếu có callback, gọi callback
                    if callback:
                        callback(value)

                    message_count += 1
                    
                    # Dừng nếu đạt số lượng tin nhắn tối đa
                    if max_messages and message_count >= max_messages:
                        break

                except Exception as e:
                    print(f"Lỗi khi xử lý tin nhắn: {e}")

        except Exception as e:
            print(f"Lỗi khi đọc tin nhắn: {e}")
        finally:
            consumer.close()

# Ví dụ sử dụng
def main():
    # Khởi tạo KafkaManager
    kafka_manager = KafkaManager()

    # Tạo topic
    topic_name = 'intraday'
    kafka_manager.create_topic(topic_name)

if __name__ == "__main__":
    main()