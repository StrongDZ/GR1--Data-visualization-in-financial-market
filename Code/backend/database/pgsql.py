from datetime import datetime, timedelta
import sys
sys.path.append(r'D:\GR1\Code')
import psycopg2
from psycopg2 import sql, extras
import pandas as pd
from backend.config.config_env import PostgreSQL_URL

class PostgresManager:
    def __init__(self, db):
        self.db = db
        self.connection_str = PostgreSQL_URL
        self.__connection = psycopg2.connect(self.connection_str)
        self.__cursor = self.__connection.cursor()

    
    def check_table_exists(self, table_name):
        """Check if a table already exists in the database."""
        query = sql.SQL("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """)
        self.__cursor.execute(query, (table_name,))
        return self.__cursor.fetchone()[0]

    def create_table_and_insert_dataframe(self, df, table_name):
        print("haha")
        # Ensure that the DataFrame is not empty
        if df.empty:
            print("The DataFrame is empty. No data to insert.")
            return

        if not self.check_table_exists(table_name):
            # Get column names and data types
            columns = df.columns
            types = [self._get_postgres_type(dtype) for dtype in df.dtypes]

            # Create the table creation query
            create_table_query = self._generate_create_table_query(table_name, columns, types)

            # Execute the query to create the table
            try:
                with self.__connection.cursor() as cursor:
                    cursor.execute(create_table_query)
                    self.__connection.commit()
                    print(f"Table '{table_name}' created successfully.")
            except Exception as e:
                print(f"Error creating table: {e}")
                self.__connection.rollback()
                return
            self.insert_dataframe_to_table(df, table_name)

        else: 
            print(f"Table '{table_name}' was already existed")
        
    
    def _generate_create_table_query(self, table_name, columns, types):
        """ Generate a SQL query to create a table with the specified columns and types """
        column_defs = [
            f"{col} {typ}" for col, typ in zip(columns, types)
        ]
        
        query = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_defs)});"
        return query

    def _get_postgres_type(self, dtype):
        """Map pandas dtypes to PostgreSQL types."""
        if pd.api.types.is_integer_dtype(dtype):
            return 'INTEGER'
        elif pd.api.types.is_float_dtype(dtype):
            return 'FLOAT'
        elif pd.api.types.is_object_dtype(dtype):
            return 'TEXT'
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            return 'TIMESTAMP'
        else:
            return 'TEXT'

    def insert_dataframe_to_table(self, df, table_name):
        # Prepare the insert statement
        if not self.check_table_exists(table_name):
            self.create_table_and_insert_dataframe(df, table_name)
            return
        columns = df.columns.tolist()
        insert_query = sql.SQL("INSERT INTO {} ({}) VALUES %s").format(
            sql.Identifier(table_name),
            sql.SQL(', ').join(map(sql.Identifier, columns))
        )

        # Prepare the data to insert as tuples
        values = [tuple(row) for row in df.values]
        
        try:
            with self.__connection.cursor() as cursor:
                psycopg2.extras.execute_values(cursor, insert_query, values)
                self.__connection.commit()
                print(f"Inserted {len(df)} rows into table {table_name}.")
        except Exception as e:
            print(f"Error inserting data: {e}")
            self.__connection.rollback()

    def query_table(self, table_name, columns='*', filter_condition=None, order_by=None, limit=None, row_to_json=False):
        """
        Truy vấn dữ liệu từ bảng PostgreSQL
        
        :param table_name: Tên bảng
        :param columns: Các cột cần lấy (mặc định là tất cả)
        :param filter_condition: Điều kiện lọc (WHERE)
        :param order_by: Sắp xếp theo cột
        :param limit: Giới hạn số lượng bản ghi
        :param row_to_json: Chuyển đổi mỗi hàng thành JSON (mặc định False)
        :return: DataFrame chứa kết quả truy vấn
        """
        try:
            # Xây dựng câu truy vấn
            query = f"SELECT {columns} FROM {table_name}"

            if filter_condition:
                query += f" WHERE {filter_condition}"

            if order_by:
                query += f" ORDER BY {order_by}"

            if limit:
                query += f" LIMIT {limit}"

            if row_to_json:
                query = f"SELECT row_to_json(t) FROM ({query}) as t"
            # print(query)
            # Thực thi truy vấn
            with self.__connection.cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                # print(results)
            
                if row_to_json:
                    return [result[0] for result in results]
                
                column_names = [desc[0] for desc in cursor.description]
                df = pd.DataFrame(results, columns=column_names)
                return df
        
        except Exception as e:
            print(f"Lỗi khi truy vấn bảng {table_name}: {e}")
            return pd.DataFrame()
        
    def get_latest_updated_timestamp(self, symbol, table_name):
        # Tính toán ngày 7 ngày trước
        # print("doanxem")
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        query = sql.SQL("""
            SELECT COALESCE(MAX(time), %s::timestamp) 
            FROM {}
            WHERE symbol = '{}'
        """).format(sql.Identifier(table_name), sql.SQL(symbol))
        
        try:
            # Sử dụng tham số để tránh SQL injection
            self.__cursor.execute(query, (seven_days_ago,))
            data = self.__cursor.fetchone()
            return data[0]
        except Exception as e:
            print(f"Error querying data: {e}")
            return None
    
    def close_connection(self):
        if self.__connection:
            self.__cursor.close()
            self.__connection.close()
            print("Closed connection to PostgreSQL.")
