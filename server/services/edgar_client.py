import sys
import io
import json
import math
import difflib

# Force stdout/stderr to UTF-8 to handle characters gracefully on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set identity as required by SEC EDGAR APIs
from edgar import *
import pandas as pd
import numpy as np

set_identity("Stocklens Research Agent stocklens-admin@gmail.com")

def clean_val(v):
    """Clean pandas/numpy types for proper JSON serialization."""
    if pd.isna(v):
        return None
    if hasattr(v, 'strftime'):
        return v.strftime('%Y-%m-%d')
    if isinstance(v, (np.integer, np.int64, np.int32)):
        return int(v)
    if isinstance(v, (np.floating, np.float64, np.float32)):
        return float(v)
    if isinstance(v, np.bool_):
        return bool(v)
    if hasattr(v, 'item'):
        try:
            return v.item()
        except Exception:
            pass
    return v

def handle_financials(symbol):
    company = Company(symbol)
    financials = company.get_financials()
    
    statements = {
        "income_statement": financials.income_statement(),
        "balance_sheet": financials.balance_sheet(),
        "cashflow_statement": financials.cashflow_statement()
    }
    
    output = {}
    for name, stmt in statements.items():
        if stmt is None:
            output[name] = {"periods": [], "rows": []}
            continue
            
        df = stmt.to_dataframe()
        if df is None or df.empty:
            output[name] = {"periods": [], "rows": []}
            continue
            
        # Identify period columns: starts with digit
        periods = [col for col in df.columns if col and col[0].isdigit()]
        
        rows = []
        for _, row in df.iterrows():
            concept = clean_val(row.get('concept', ''))
            label = clean_val(row.get('label', ''))
            standard_concept = clean_val(row.get('standard_concept', ''))
            values = [clean_val(row.get(col)) for col in periods]
            
            rows.append({
                "concept": concept,
                "label": label,
                "standard_concept": standard_concept,
                "values": values
            })
            
        output[name] = {
            "periods": periods,
            "rows": rows
        }
        
    print(json.dumps(output, ensure_ascii=False))

def get_relationship(owner):
    if getattr(owner, 'is_director', False):
        return "Director"
    elif getattr(owner, 'is_officer', False):
        return "Officer"
    elif getattr(owner, 'is_ten_pct_owner', False):
        return "10% Owner"
    else:
        return "Insider"

def handle_insiders(symbol):
    company = Company(symbol)
    filings = company.get_filings(form="4")
    
    # Take latest 15 Form 4 filings
    latest_filings = filings[:15]
    transactions = []
    
    for idx, f in enumerate(latest_filings):
        try:
            obj = f.obj()
            if obj is None:
                continue
                
            df = obj.to_dataframe()
            if df is None or df.empty:
                continue
                
            # Construct SEC EDGAR index URL directly
            cik = getattr(f, 'cik', '')
            if not cik:
                cik = getattr(company, 'cik', '')
            accession_no = f.accession_no
            accession_no_no_dashes = accession_no.replace('-', '')
            filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{accession_no_no_dashes}/{accession_no}-index.html"
            
            # Map columns from the parsed DataFrame
            for _, row in df.iterrows():
                owner_name = clean_val(row.get('Insider', 'Unknown'))
                relationship = clean_val(row.get('Position', 'Insider'))
                security_title = clean_val(row.get('Description', ''))
                date = clean_val(row.get('Date', ''))
                code = clean_val(row.get('Code', ''))
                shares = clean_val(row.get('Shares', 0))
                price = clean_val(row.get('Price', 0.0))
                value = clean_val(row.get('Value', 0.0))
                
                # Compute value if missing
                if value is None and shares is not None and price is not None:
                    try:
                        value = float(shares) * float(price)
                    except Exception:
                        value = 0.0
                        
                remaining = clean_val(row.get('Remaining Shares', 0))
                
                transactions.append({
                    "owner": owner_name,
                    "relationship": relationship,
                    "security_title": security_title,
                    "date": date,
                    "code": code,
                    "shares": shares,
                    "price": price,
                    "value": value,
                    "remaining": remaining,
                    "filing_url": filing_url
                })
        except Exception:
            # Skip errors on individual filings to be robust
            continue
            
    print(json.dumps(transactions, ensure_ascii=False))

def handle_holdings(cik_or_symbol):
    company = Company(cik_or_symbol)
    filings = company.get_filings(form="13F-HR")
    
    if len(filings) == 0:
        print(json.dumps({"holdings": [], "comparison": []}, ensure_ascii=False))
        return
        
    latest_13f = filings.latest()
    obj_13f = latest_13f.obj()
    
    holdings_list = []
    if obj_13f is not None and hasattr(obj_13f, 'holdings'):
        df = obj_13f.holdings
        if isinstance(df, pd.DataFrame):
            for _, row in df.iterrows():
                # Fallback dictionary mapping
                issuer = clean_val(row.get('Issuer', row.get('nameOfIssuer', '')))
                class_val = clean_val(row.get('Class', row.get('titleOfClass', '')))
                cusip = clean_val(row.get('Cusip', row.get('cusip', '')))
                value = clean_val(row.get('Value', row.get('value', None)))
                shares = clean_val(row.get('SharesPrnAmount', row.get('shrsOrPrnAmt', None)))
                type_val = clean_val(row.get('Type', row.get('shrsOrPrnAmtType', '')))
                option_type = clean_val(row.get('PutCall', row.get('putCall', None)))
                
                holdings_list.append({
                    "issuer": issuer,
                    "class": class_val,
                    "cusip": cusip,
                    "value": value,
                    "shares": shares,
                    "type": type_val,
                    "option_type": option_type
                })
                
    compare_list = []
    try:
        comparison = obj_13f.compare_holdings()
        if comparison is not None and hasattr(comparison, 'data') and isinstance(comparison.data, pd.DataFrame):
            records = comparison.data.to_dict(orient="records")
            for record in records:
                cleaned = {}
                for k, v in record.items():
                    cleaned[k] = clean_val(v)
                compare_list.append(cleaned)
    except Exception:
        # Ignore comparison errors and fallback to empty
        pass
        
    print(json.dumps({
        "holdings": holdings_list,
        "comparison": compare_list
    }, ensure_ascii=False))

def handle_section(symbol, item):
    company = Company(symbol)
    filings = company.get_filings(form="10-K")
    if len(filings) == 0:
        print(json.dumps({"error": "No 10-K filings found"}, ensure_ascii=False))
        return
        
    latest_10k = filings.latest().obj()
    text = ""
    if item == "1A":
        text = getattr(latest_10k, 'risk_factors', '')
    elif item == "7":
        text = getattr(latest_10k, 'management_discussion', '')
    else:
        # fallback try matching risk factors if 1A or management discussion if 7
        if "1A" in item:
            text = getattr(latest_10k, 'risk_factors', '')
        elif "7" in item:
            text = getattr(latest_10k, 'management_discussion', '')
            
    print(json.dumps({
        "symbol": symbol,
        "item": item,
        "text": text
    }, ensure_ascii=False))

def handle_risk_diff(symbol):
    company = Company(symbol)
    filings = company.get_filings(form="10-K")
    if len(filings) < 2:
        # If there's only 1 or 0 filings, we cannot diff
        if len(filings) == 1:
            try:
                latest = filings[0].obj()
                risk_latest = getattr(latest, 'risk_factors', '')
                paragraphs = [p.strip() for p in risk_latest.split('\n') if p.strip()]
                output = [{"type": "unchanged", "text": p} for p in paragraphs]
                print(json.dumps(output, ensure_ascii=False))
                return
            except Exception:
                pass
        print(json.dumps([], ensure_ascii=False))
        return
        
    latest = filings[0].obj()
    prev = filings[1].obj()
    
    risk_latest = getattr(latest, 'risk_factors', '')
    risk_prev = getattr(prev, 'risk_factors', '')
    
    p_latest = [p.strip() for p in risk_latest.split('\n') if p.strip()]
    p_prev = [p.strip() for p in risk_prev.split('\n') if p.strip()]
    
    diff = list(difflib.ndiff(p_prev, p_latest))
    results = []
    for line in diff:
        if line.startswith('+ '):
            results.append({"type": "added", "text": line[2:]})
        elif line.startswith('- '):
            results.append({"type": "removed", "text": line[2:]})
        elif line.startswith('  '):
            results.append({"type": "unchanged", "text": line[2:]})
            
    print(json.dumps(results, ensure_ascii=False))

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: py edgar_client.py <command> <arg1> [arg2]"}, ensure_ascii=False))
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    try:
        if cmd == "financials":
            handle_financials(sys.argv[2])
        elif cmd == "insiders":
            handle_insiders(sys.argv[2])
        elif cmd == "holdings":
            handle_holdings(sys.argv[2])
        elif cmd == "section":
            if len(sys.argv) < 4:
                print(json.dumps({"error": "Usage: py edgar_client.py section <symbol> <item>"}, ensure_ascii=False))
                sys.exit(1)
            handle_section(sys.argv[2], sys.argv[3])
        elif cmd == "risk_diff":
            handle_risk_diff(sys.argv[2])
        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}, ensure_ascii=False))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
