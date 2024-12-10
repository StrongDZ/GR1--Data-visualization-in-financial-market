from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from database.pgsql import PostgresManager
from flask_cors import CORS
from elasticsearch import Elasticsearch, helpers

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# es = Elasticsearch("http://localhost:9200")
# index_name = "symbol_price_changes"

# postgre = PostgresManager("GR1_data")
# # Chuẩn bị dữ liệu cho Elasticsearch
# def prepare_data_for_es(df, index_name):
#     for _, row in df.iterrows():
#         yield {
#             "_index": index_name,
#             "_id": row['symbol'],  # Sử dụng symbol làm ID
#             "_source": row.to_dict(),
#         }
# data = postgre.query_table("symbol_price_changes")     
# helpers.bulk(es, prepare_data_for_es(data, index_name))

# # Đẩy dữ liệu vào Elasticsearch
# if not es.indices.exists(index=index_name):
#     es.indices.create(index=index_name)
    

@app.route('/api/symbols', methods=['GET'])
def get_symbols():
    
    postgre = PostgresManager("GR1_data")
    try:
        symbols_data = postgre.query_table(table_name='ma_ck_niemyet_all', columns='symbol')
        # print(symbols_data)
        symbols = list(symbols_data['symbol'])  # Giả sử item['symbol'] là cách truy cập vào symbol
        # print(symbols)
        # print(jsonify(symbols))
        return jsonify(symbols)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Lắng nghe yêu cầu từ client
@socketio.on('request_data')
def handle_request_data(symbol):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ database cho symbol
        # print(symbol)
        stock_data = postgre.query_table(
            table_name='cp_min',
            filter_condition=f"symbol = '{symbol}'",
            order_by="time",
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client

        emit('update_data', {'symbol': symbol, 'data': stock_data})
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu cho {symbol}: {e}")
        emit('error', {'message': str(e)})

@socketio.on('request_data_newest')
def handle_request_data_newest(symbol):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy thời gian cập nhật mới nhất từ database
        latest_updated = postgre.get_latest_updated_timestamp(symbol, 'cp_min')
        if latest_updated is None:
            emit('error', {'message': f"No data found for {symbol}."})
            return

        # Chuyển đổi thời gian cập nhật mới nhất sang đầu ngày
        latest_updated_start_of_day = latest_updated.replace(hour=0, minute=0, second=0, microsecond=0)
        # Lấy dữ liệu từ database cho symbol từ đầu ngày
        stock_data = postgre.query_table(
            table_name='cp_min',
            filter_condition=f"symbol = '{symbol}' AND time >= '{latest_updated_start_of_day}'",  # Lấy dữ liệu từ đầu ngày
            order_by="time",
            row_to_json=True
        )
        
        # Gửi dữ liệu trở lại cho client
        emit('update_data_newest', {'symbol': symbol, 'data': stock_data})
    except Exception as e:
        print(f"Error fetching newest data for {symbol}: {e}")
        emit('error', {'message': str(e)})
@socketio.on('request_stock_price_board')
def handle_request_stock_price_board():
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng stock_price_board
        stock_data = postgre.query_table(
            table_name='stock_price_board',
            order_by='symbol',
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client
        emit('update_stock_price_board', stock_data)
    except Exception as e:
        print(f"Error fetching stock price board data: {e}")
        emit('error', {'message': str(e)})
        
@socketio.on('request_change_data')
def handle_request_change_data(symbol):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng symbol_price_change theo symbol
        change_data = postgre.query_table(
            table_name='symbol_price_changes',
            filter_condition=f"symbol = '{symbol}'",  # Lấy dữ liệu cho symbol cụ thể
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client
        emit('update_change', change_data)
    except Exception as e:
        print(f"Error fetching change data for {symbol}: {e}")
        emit('error', {'message': str(e)})
        
@socketio.on('request_index_info')
def handle_request_index_info(index):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng symbol_price_change theo symbol
        index_info = postgre.query_table(
            table_name='index_info',
            filter_condition=f"index = '{index}'",
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client
        emit('update_index_info', {'index': index ,'data': index_info})
    except Exception as e:
        print(f"Error fetching change data for index_info")
        emit('error', {'message': str(e)})
        
@socketio.on('request_co_ban')
def handle_request_co_ban():
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu tài chính từ database
        financial_metrics = postgre.query_table(
            table_name='co_ban',  # Thay đổi tên bảng nếu cần
            order_by='symbol',
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client
        emit('update_co_ban', financial_metrics)
    except Exception as e:
        print(f"Error fetching financial metrics data: {e}")
        emit('error', {'message': str(e)})
        
@socketio.on('request_tong_hop')
def handle_request_tong_hop(symbol):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng tong_hop cho symbol
        tong_hop_data = postgre.query_table(
            table_name='tong_hop',  # Tên bảng cần truy vấn
            filter_condition=f"symbol = '{symbol}'",  # Điều kiện lọc theo symbol
            row_to_json=True
        )
        # print(tong_hop_data)
        # Gửi dữ liệu trở lại cho client
        emit('update_tong_hop', {'symbol': symbol, 'data': tong_hop_data})
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu cho {symbol} từ bảng tong_hop: {e}")
        emit('error', {'message': str(e)})

@socketio.on('request_ban_do')
def handle_request_ban_do():
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng tong_hop cho symbol
        ban_do_data = postgre.query_table(
            table_name='ban_do',  # Tên bảng cần truy vấn
            order_by='accumulated_volume',
            row_to_json=True
        )
        
        # Gửi dữ liệu trở lại cho client
        emit('update_ban_do', ban_do_data)
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu cho từ bảng ban_do: {e}")
        emit('error', {'message': str(e)})
@socketio.on('request_intraday_data')
def handle_request_intraday_data(symbol):
    postgre = PostgresManager("GR1_data")
    try:
        # Lấy dữ liệu từ bảng symbol_price_change theo symbol
        latest_updated = postgre.get_latest_updated_timestamp(symbol, 'cp_min')
        if latest_updated is None:
            emit('error', {'message': f"No data found for {symbol}."})
            return
        latest_updated_start_of_day = latest_updated.replace(hour=0, minute=0, second=0, microsecond=0)

        intraday_data = postgre.query_table(
            table_name='intraday',
            filter_condition=f"symbol = '{symbol}' AND time >= '{latest_updated_start_of_day}'",
            row_to_json=True
        )
        # Gửi dữ liệu trở lại cho client
        sorted_data = sorted(intraday_data, key=lambda x: x['time'], reverse=True)
        
        emit('update_intraday_data', sorted_data)
    except Exception as e:
        print(f"Error fetching change data for {symbol}: {e}")
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True)