import sys
sys.path.append(r'D:\GR1\Code')
import pandas as pd
import threading
from backend.database.pgsql import PostgresManager
from vnstock3 import Vnstock

class FinancialRatiosInserter:
    def __init__(self, symbols):
        self.symbols = symbols
        self.postgre = PostgresManager("GR1_data")
        self.stock = Vnstock().stock(symbol='TCB',source='VCI')

    def insert_financial_ratios(self, symbols_chunk):
        all_data = []
        for symbol in symbols_chunk:
            # Lấy dữ liệu tài chính
            try:
                # Lấy dữ liệu tài chính theo quarter
                df_quarter = self.stock.finance.ratio(symbol=symbol, period='quarter', lang='vi', dropna=True)
                df_quarter.columns = ['_'.join(col).strip() for col in df_quarter.columns.values]
                df_quarter.reset_index(inplace=True)
            except Exception as e:
                print(f"Lỗi khi lấy dữ liệu quý cho {symbol}: {e}")
                df_quarter = pd.DataFrame()  # Tạo DataFrame rỗng nếu lỗi

            try:
                # Lấy dữ liệu tài chính theo year
                df_year = self.stock.finance.ratio(symbol=symbol, period='year', lang='vi', dropna=True)
                df_year.columns = ['_'.join(col).strip() for col in df_year.columns.values]
                df_year.reset_index(inplace=True)
            except Exception as e:
                print(f"Lỗi khi lấy dữ liệu năm cho {symbol}: {e}")
                df_year = pd.DataFrame()  # Tạo DataFrame rỗng nếu lỗi

            # Kết hợp dữ liệu từ cả hai period
            combined_df = pd.concat([df_quarter, df_year], ignore_index=True)

            # Nếu không có dữ liệu, bỏ qua
            if combined_df.empty:
                print(f"Dữ liệu rỗng cho {symbol}, bỏ qua.")
                continue
            # Danh sách cột cần thiết theo đúng thứ tự
            required_columns = [
                'Meta_CP',  
                'Meta_Năm',  
                'Meta_Kỳ',  
                'Chỉ tiêu cơ cấu nguồn vốn_(Vay NH+DH)/VCSH',  
                'Chỉ tiêu cơ cấu nguồn vốn_Nợ/VCSH',  
                'Chỉ tiêu cơ cấu nguồn vốn_TSCĐ / Vốn CSH',  
                'Chỉ tiêu cơ cấu nguồn vốn_Vốn CSH/Vốn điều lệ',  
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay tài sản',  
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay TSCĐ',  
                'Chỉ tiêu hiệu quả hoạt động_Số ngày thu tiền bình quân',  
                'Chỉ tiêu hiệu quả hoạt động_Số ngày tồn kho bình quân',  
                'Chỉ tiêu hiệu quả hoạt động_Số ngày thanh toán bình quân',  
                'Chỉ tiêu hiệu quả hoạt động_Chu kỳ tiền',  
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay hàng tồn kho',  
                'Chỉ tiêu khả năng sinh lợi_Biên EBIT (%)',  
                'Chỉ tiêu khả năng sinh lợi_Biên lợi nhuận gộp (%)',  
                'Chỉ tiêu khả năng sinh lợi_Biên lợi nhuận ròng (%)',  
                'Chỉ tiêu khả năng sinh lợi_ROE (%)',  
                'Chỉ tiêu khả năng sinh lợi_ROIC (%)',  
                'Chỉ tiêu khả năng sinh lợi_ROA (%)',  
                'Chỉ tiêu khả năng sinh lợi_EBITDA (Tỷ đồng)',  
                'Chỉ tiêu khả năng sinh lợi_EBIT (Tỷ đồng)',  
                'Chỉ tiêu khả năng sinh lợi_Tỷ suất cổ tức (%)',  
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán hiện thời',  
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán tiền mặt',  
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán nhanh',  
                'Chỉ tiêu thanh khoản_Khả năng chi trả lãi vay',  
                'Chỉ tiêu thanh khoản_Đòn bẩy tài chính',  
                'Chỉ tiêu định giá_Vốn hóa (Tỷ đồng)',  
                'Chỉ tiêu định giá_Số CP lưu hành (Triệu CP)',  
                'Chỉ tiêu định giá_P/E',  
                'Chỉ tiêu định giá_P/B',  
                'Chỉ tiêu định giá_P/S',  
                'Chỉ tiêu định giá_P/Cash Flow',  
                'Chỉ tiêu định giá_EPS (VND)',  
                'Chỉ tiêu định giá_BVPS (VND)',  
                'Chỉ tiêu định giá_EV/EBITDA'  
            ]

            # Thêm các cột thiếu với giá trị mặc định là 0

            # Thêm các cột thiếu với giá trị mặc định là 0
            for col in required_columns:
                if col not in combined_df.columns:
                    combined_df[col] = 0.0  

            # Sắp xếp lại các cột theo thứ tự yêu cầu
            combined_df = combined_df[required_columns].copy()
            column_mapping = {
                'Meta_CP': 'symbol',
                'Meta_Năm': 'nam',
                'Meta_Kỳ': 'ky',
                'Chỉ tiêu cơ cấu nguồn vốn_(Vay NH+DH)/VCSH': 'vay_nh_dh_vcsh',
                'Chỉ tiêu cơ cấu nguồn vốn_Nợ/VCSH': 'no_vcsh',
                'Chỉ tiêu cơ cấu nguồn vốn_TSCĐ / Vốn CSH': 'tscd_von_csh',
                'Chỉ tiêu cơ cấu nguồn vốn_Vốn CSH/Vốn điều lệ': 'von_csh_von_dl',
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay tài sản': 'vong_quay_ts',
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay TSCĐ': 'vong_quay_tscd',
                'Chỉ tiêu hiệu quả hoạt động_Số ngày thu tiền bình quân': 'so_ngay_thu_tien',
                'Chỉ tiêu hiệu quả hoạt động_Số ngày tồn kho bình quân': 'so_ngay_ton_kho',
                'Chỉ tiêu hiệu quả hoạt động_Số ngày thanh toán bình quân': 'so_ngay_thanh_toan',
                'Chỉ tiêu hiệu quả hoạt động_Chu kỳ tiền': 'chu_ky_tien',
                'Chỉ tiêu hiệu quả hoạt động_Vòng quay hàng tồn kho': 'vong_quay_hang_ton_kho',
                'Chỉ tiêu khả năng sinh lợi_Biên EBIT (%)': 'bien_ebit',
                'Chỉ tiêu khả năng sinh lợi_Biên lợi nhuận gộp (%)': 'bien_loi_nhuan_gop',
                'Chỉ tiêu khả năng sinh lợi_Biên lợi nhuận ròng (%)': 'bien_loi_nhuan_rong',
                'Chỉ tiêu khả năng sinh lợi_ROE (%)': 'roe',
                'Chỉ tiêu khả năng sinh lợi_ROIC (%)': 'roic',
                'Chỉ tiêu khả năng sinh lợi_ROA (%)': 'roa',
                'Chỉ tiêu khả năng sinh lợi_EBITDA (Tỷ đồng)': 'ebitda',
                'Chỉ tiêu khả năng sinh lợi_EBIT (Tỷ đồng)': 'ebit',
                'Chỉ tiêu khả năng sinh lợi_Tỷ suất cổ tức (%)': 'ty_suat_co_tuc',
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán hiện thời': 'chi_so_thanh_toan_hien_thoi',
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán tiền mặt': 'chi_so_thanh_toan_tien_mat',
                'Chỉ tiêu thanh khoản_Chỉ số thanh toán nhanh': 'chi_so_thanh_toan_nhanh',
                'Chỉ tiêu thanh khoản_Khả năng chi trả lãi vay': 'khả_năng_chi_tra_lai_vay',
                'Chỉ tiêu thanh khoản_Đòn bẩy tài chính': 'don_bay_tai_chinh',
                'Chỉ tiêu định giá_Vốn hóa (Tỷ đồng)': 'von_hoa',
                'Chỉ tiêu định giá_Số CP lưu hành (Triệu CP)': 'so_cp_luu_hanh',
                'Chỉ tiêu định giá_P/E': 'pe',
                'Chỉ tiêu định giá_P/B': 'pb',
                'Chỉ tiêu định giá_P/S': 'ps',
                'Chỉ tiêu định giá_P/Cash Flow': 'p_cash_flow',
                'Chỉ tiêu định giá_EPS (VND)': 'eps',
                'Chỉ tiêu định giá_BVPS (VND)': 'bvps',
                'Chỉ tiêu định giá_EV/EBITDA': 'ev_ebitda'
            }

            combined_df.rename(columns=column_mapping, inplace=True)

            # Thêm vào danh sách tất cả dữ liệu
            all_data.append(combined_df)

        # Nếu có dữ liệu, lưu vào cơ sở dữ liệu
        if all_data:
            final_df = pd.concat(all_data, ignore_index=True)
            try:
                self.postgre.insert_dataframe_to_table(final_df, "chi_so_tai_chinh")
            except Exception as e:
                print(f"Lỗi khi chèn dữ liệu vào cơ sở dữ liệu: {e}")

 # Lưu dữ liệu vào cơ sở dữ liệu
            self.postgre.insert_dataframe_to_table(final_df, "chi_so_tai_chinh")

def main():
    # Khởi tạo PostgresManager
    postgre = PostgresManager("GR1_data")

    # Lấy danh sách các symbol từ bảng "ma_ck_niemyet_all"
    symbols_df = postgre.query_table(table_name="ma_ck_niemyet_all", row_to_json=False)
    symbols = symbols_df["symbol"].tolist()

    # Chia danh sách cổ phiếu thành các nhóm, mỗi nhóm có tối đa 20 cổ phiếu
    threads = []
    chunk_size = 20  # Số lượng cổ phiếu mỗi thread xử lý

    for i in range(0, len(symbols), chunk_size):
        thread_symbols = symbols[i:i + chunk_size]
        inserter = FinancialRatiosInserter(thread_symbols)
        thread = threading.Thread(target=inserter.insert_financial_ratios, args=(thread_symbols,))
        threads.append(thread)

    # Bắt đầu các luồng
    for thread in threads:
        thread.start()

    # Chờ cho các luồng hoàn thành
    for thread in threads:
        thread.join()

if __name__ == "__main__":
    main()