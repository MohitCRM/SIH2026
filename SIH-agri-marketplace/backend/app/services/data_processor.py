import re
import pandas as pd
import numpy as np
from pathlib import Path

# Define project relative paths matching your architecture
PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"

def parse_agmarknet_report(filepath: Path) -> pd.DataFrame:
    """
    Parses wide-format Agmarknet 'Marketwise Price & Arrival' CSV reports
    and converts them into a standardized, long time-series DataFrame.
    """
    raw_df = pd.read_csv(filepath, header=None)
    
    # Locate header row containing 'Commodity' or 'Commodity Group'
    header_idx = None
    for idx, row in raw_df.iterrows():
        row_str = [str(v).strip() for v in row.values]
        if 'Commodity' in row_str or 'Commodity Group' in row_str:
            header_idx = idx
            break

    if header_idx is None:
        raise ValueError(f"Could not locate header row in file: {filepath.name}")

    headers = [str(val).strip() for val in raw_df.iloc[header_idx].values]
    data_df = raw_df.iloc[header_idx + 1:].copy()
    data_df.columns = headers

    # Identify dynamic columns
    price_cols = [c for c in headers if re.match(r'Price on', c, re.IGNORECASE)]
    arrival_cols = [c for c in headers if re.match(r'Arrival on', c, re.IGNORECASE)]
    msp_cols = [c for c in headers if 'MSP' in c]
    msp_col = msp_cols[0] if msp_cols else None

    # Transform wide columns into long format
    records = []
    for _, row in data_df.iterrows():
        commodity_group = row.get('Commodity Group', '')
        commodity = row.get('Commodity', '')
        msp_raw = row[msp_col] if msp_col else np.nan

        for p_col in price_cols:
            date_match = re.search(r'Price on (.+)', p_col, re.IGNORECASE)
            if not date_match:
                continue
            
            date_str = date_match.group(1).strip()
            arr_col_candidates = [c for c in arrival_cols if date_str in c]
            arr_col = arr_col_candidates[0] if arr_col_candidates else None

            p_val = str(row[p_col]).strip()
            a_val = str(row[arr_col]).strip() if arr_col else '-'
            m_val = str(msp_raw).strip()

            price_clean = float(p_val) if p_val not in ['-', 'nan', 'NaN', ''] else np.nan
            arrival_clean = float(a_val) if a_val not in ['-', 'nan', 'NaN', ''] else np.nan
            msp_clean = float(m_val) if m_val not in ['-', 'nan', 'NaN', ''] else np.nan

            records.append({
                'commodity_group': commodity_group,
                'commodity': commodity,
                'msp_rs_per_quintal': msp_clean,
                'date': pd.to_datetime(date_str, format='%d %b, %Y', errors='coerce'),
                'modal_price': price_clean,
                'arrival_tonnes': arrival_clean
            })

    cleaned_df = pd.DataFrame(records)
    cleaned_df = cleaned_df.sort_values(by=['commodity', 'date']).reset_index(drop=True)
    return cleaned_df

def process_and_store_agmarknet_data(input_filename: str, output_filename: str = "cleaned_prices.csv"):
    """
    Reads a raw CSV from data/raw/, cleans/transforms it, 
    and saves the output in data/processed/.
    """
    raw_file_path = RAW_DATA_DIR / input_filename
    processed_file_path = PROCESSED_DATA_DIR / output_filename

    if not raw_file_path.exists():
        raise FileNotFoundError(f"Source file not found at: {raw_file_path}")

    # Create destination folder if it doesn't exist
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Reading raw data from: {raw_file_path}")
    cleaned_df = parse_agmarknet_report(raw_file_path)

    # Save processed CSV
    cleaned_df.to_csv(processed_file_path, index=False)
    print(f"Successfully processed {len(cleaned_df)} rows and stored at: {processed_file_path}")

if __name__ == "__main__":
    # Example execution for your raw file name
    raw_filename = "Market_Wise_Price_Arrival_09-09-2026_10-23-23_PM.csv"
    process_and_store_agmarknet_data(
        input_filename=raw_filename, 
        output_filename="agmarknet_andhra_pradesh_cleaned.csv"
    )