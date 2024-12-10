import subprocess
import time

def restart_zookeeper():
    print("Restarting Zookeeper...")
    subprocess.Popen([r'D:\GR1\kafka\bin\windows\zookeeper-server-start.bat', r'D:\GR1\kafka\config\zookeeper.properties'])
    time.sleep(10)  # Wait for Zookeeper to restart

def restart_kafka():
    print("Restarting Kafka...")
    subprocess.Popen([r'D:\GR1\kafka\bin\windows\kafka-server-start.bat', r'D:\GR1\kafka\config\server.properties'])
    time.sleep(10)  # Wait for Kafka to restart

def start_producer():
    print("Starting Producer...")
    subprocess.Popen(['python', r'D:\GR1\Code\backend\producer\cp_min_producer.py'])
    time.sleep(5)
    subprocess.Popen(['python', r'D:\GR1\Code\backend\producer\cp_day_producer.py'])
    time.sleep(5)
    subprocess.Popen(['python', r'D:\GR1\Code\backend\producer\intraday_producer.py'])
    time.sleep(5)
    subprocess.Popen(['python', r'D:\GR1\Code\backend\producer\chi_so_tai_chinh_producer.py'])
    time.sleep(5)
    subprocess.Popen(['python', r'D:\GR1\Code\backend\producer\stock_price_board.py'])

def start_consumer():
    print("Starting Consumer...")
    subprocess.Popen(['python', r'D:\GR1\Code\backend\consumer\stock_data_consumer.py'])
    time.sleep(5)
    subprocess.Popen(['python', r'D:\GR1\Code\backend\consumer\intraday_consumer.py'])

if __name__ == "__main__":
    restart_zookeeper()
    restart_kafka()
    start_consumer()
    time.sleep(10)
    start_producer()
    print("All services started.")
