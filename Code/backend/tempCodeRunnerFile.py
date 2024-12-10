def prepare_data_for_es(df, index_name):
    for _, row in df.iterrows():
        yield {
            "_index": index_name,
            "_id": row['symbol'],  # Sử dụng symbol làm ID
            "_source": row.to_dict(),
        }
data = postgre.query_table("symbol_price_changes")     
helpers.bulk(es, prepare_data_for_es(data, index_name))