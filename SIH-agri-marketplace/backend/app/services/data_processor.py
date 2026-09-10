import os
import requests
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[3]
RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "datagov_up_mandi.csv"
PROCESSED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "datagov_up_cleaned.csv"

# Data.gov.in API Configuration
API_URL = "https://api.data.gov.in/resource/9ef7425e-581f-4398-85d3-2c16202a429a"
API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

class DataGovMandiProcessor:
    def __init__(self, api_key: str = API_KEY):
        self.api_key = api_key
        self._df: Optional[pd.DataFrame] = None
        
        # Configure robust HTTP session with retries
        self.session = requests.Session()
        retries = Retry(
            total=4,
            backoff_factor=2,  # Waits 2s, 4s, 8s, 16s between retries
            status_forcelist=[429, 500, 502, 503, 504]
        )
        self.session.mount('https://', HTTPAdapter(max_retries=retries))

    def fetch_from_api(self, total_records: int = 3000, batch_size: int = 1000, state: str = "Uttar Pradesh") -> pd.DataFrame:
        """Fetches raw records in paginated batches to prevent read timeouts."""
        all_records = []
        
        print(f"Fetching {total_records} records from Data.gov.in in batches of {batch_size}...")
        
        for offset in range(0, total_records, batch_size):
            params = {
                "api-key": self.api_key,
                "format": "json",
                "filters[state]": state,
                "limit": batch_size,
                "offset": offset
            }
            
            try:
                # Increased timeout to 60 seconds per batch request
                response = self.session.get(API_URL, params=params, timeout=60)
                if response.status_code == 200:
                    data = response.json()
                    records = data.get("records", [])
                    if not records:
                        print(f"No more records found at offset {offset}.")
                        break
                    all_records.extend(records)
                    print(f"Fetched batch {offset // batch_size + 1}: {len(records)} records.")
                else:
                    print(f"Batch fetch failed at offset {offset} with status {response.status_code}")
                    break
            except requests.exceptions.Timeout:
                print(f"Timeout occurred at offset {offset}. Retrying next batch...")
                continue
            except Exception as e:
                print(f"Error fetching batch at offset {offset}: {e}")
                break

        if not all_records:
            raise ValueError(f"Failed to retrieve records for state: '{state}'")

        df_raw = pd.DataFrame(all_records)

        # Cache raw response to data/raw
        RAW_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        df_raw.to_csv(RAW_DATA_PATH, index=False)
        return df_raw

    def process_and_clean(self, force_fetch: bool = False) -> pd.DataFrame:
        """Loads, standardizes, and caches Data.gov.in schema fields."""
        if not force_fetch and PROCESSED_DATA_PATH.exists():
            self._df = pd.read_csv(PROCESSED_DATA_PATH)
            self._df['date'] = pd.to_datetime(self._df['date'])
            return self._df

        # Fetch fresh or load from cached raw
        if RAW_DATA_PATH.exists() and not force_fetch:
            df = pd.read_csv(RAW_DATA_PATH)
        else:
            df = self.fetch_from_api()

        col_mapping = {
            'state': 'state',
            'district': 'district',
            'market': 'market',
            'commodity': 'commodity',
            'variety': 'variety',
            'arrival_date': 'date',
            'min_price': 'min_price',
            'max_price': 'max_price',
            'modal_price': 'modal_price'
        }

        df = df.rename(columns=col_mapping)

        # Datatype conversion
        df['date'] = pd.to_datetime(df['date'], format='mixed', errors='coerce')
        for col in ['min_price', 'max_price', 'modal_price']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        string_cols = ['state', 'district', 'market', 'commodity', 'variety']
        for col in string_cols:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip().str.title()

        df = df.dropna(subset=['modal_price', 'date']).sort_values(by=['commodity', 'date']).reset_index(drop=True)

        PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(PROCESSED_DATA_PATH, index=False)
        self._df = df
        return df

    def get_time_series_for_model(self, commodity_name: str) -> pd.DataFrame:
        """Creates continuous daily price series formatted for Prophet/XGBoost (ds, y)."""
        df = self.process_and_clean()

        filtered = df[df['commodity'].str.contains(commodity_name, case=False, na=False)].copy()
        if filtered.empty:
            raise ValueError(f"Commodity '{commodity_name}' not found in Data.gov.in records.")

        daily = filtered.groupby('date')['modal_price'].mean().reset_index()

        daily = daily.set_index('date')
        full_range = pd.date_range(start=daily.index.min(), end=daily.index.max(), freq='D')
        daily_complete = daily.reindex(full_range)
        daily_complete['modal_price'] = daily_complete['modal_price'].interpolate(method='time')

        return daily_complete.reset_index().rename(columns={'index': 'ds', 'modal_price': 'y'})

    def get_latest_market_metrics(self, commodity_name: str) -> Dict[str, Any]:
        """Provides latest market stats for FastAPI backend endpoints."""
        df = self.process_and_clean()
        filtered = df[df['commodity'].str.contains(commodity_name, case=False, na=False)]

        if filtered.empty:
            return {"error": f"No data for commodity: '{commodity_name}'"}

        latest = filtered.sort_values(by='date', ascending=False).iloc[0]

        return {
            "source": "Data.gov.in Open Data API",
            "commodity": latest['commodity'],
            "variety": latest['variety'],
            "district": latest['district'],
            "market": latest['market'],
            "date": latest['date'].strftime('%Y-%m-%d'),
            "modal_price": float(latest['modal_price']),
            "min_price": float(latest['min_price']),
            "max_price": float(latest['max_price'])
        }

# Global Service Singleton
data_processor = DataGovMandiProcessor()

if __name__ == "__main__":
    try:
        df_clean = data_processor.process_and_clean(force_fetch=True)
        print(f"\nSuccessfully processed {len(df_clean)} records from Data.gov.in API!")
        print(df_clean.head(3))
    except Exception as err:
        print(f"Execution Error: {err}")