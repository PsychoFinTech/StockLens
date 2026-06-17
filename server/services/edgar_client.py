import sys
import io
import json
import math
import difflib
import os
import time
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

# Force stdout/stderr to UTF-8 to handle characters gracefully on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

USER_AGENT = "Stocklens Research Agent stocklens-admin@gmail.com"

def clean_val(v):
    """Clean pandas/numpy types for proper JSON serialization."""
    import pandas as pd
    import numpy as np
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

def get_cik(symbol):
    symbol = symbol.upper()
    cache_file = os.path.join(os.path.dirname(__file__), "ticker_to_cik.json")
    
    # Try reading from cache first
    ticker_map = {}
    if os.path.exists(cache_file):
        try:
            if time.time() - os.path.getmtime(cache_file) < 86400:
                with open(cache_file, "r", encoding="utf-8") as f:
                    ticker_map = json.load(f)
        except Exception:
            pass
            
    if not ticker_map:
        try:
            req = urllib.request.Request(
                "https://www.sec.gov/files/company_tickers.json",
                headers={"User-Agent": USER_AGENT}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                raw_data = json.loads(response.read().decode("utf-8"))
                for item in raw_data.values():
                    ticker_map[item["ticker"].upper()] = str(item["cik_str"]).zfill(10)
            # Write to cache
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(ticker_map, f)
        except Exception:
            # Fallbacks for popular stock tickers
            fallbacks = {
                "AAPL": "0000320193",
                "MSFT": "0000789019",
                "GOOGL": "0001652044",
                "GOOG": "0001652044",
                "AMZN": "0001018724",
                "NVDA": "0001045810",
                "META": "0001326801",
                "TSLA": "0001318605",
                "JPM": "0000019617",
            }
            return fallbacks.get(symbol)
            
    return ticker_map.get(symbol)

def fetch_facts_from_sec(cik):
    req = urllib.request.Request(
        f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json",
        headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))

def parse_sec_statement(facts, concepts_list):
    us_gaap = facts.get("facts", {}).get("us-gaap", {})
    
    # Determine years and periods using NetIncomeLoss or Revenues
    net_income_data = us_gaap.get("NetIncomeLoss", {}).get("units", {}).get("USD", [])
    if not net_income_data:
        net_income_data = us_gaap.get("Revenues", {}).get("units", {}).get("USD", [])
        
    annual_points = [p for p in net_income_data if p.get("form") == "10-K" and p.get("fp") == "FY"]
    
    year_to_period = {}
    for p in annual_points:
        fy = p.get("fy")
        end_date = p.get("end")
        if fy and end_date:
            year_to_period[int(fy)] = f"{end_date} (FY)"
            
    # Sort years descending, take latest 3
    sorted_years = sorted(list(year_to_period.keys()), reverse=True)[:3]
    periods = [year_to_period[y] for y in sorted_years]
    
    rows = []
    for concept_name, custom_label, std_concept in concepts_list:
        concept_data = us_gaap.get(concept_name, {})
        if not concept_data:
            continue
            
        units = concept_data.get("units", {})
        unit_key = "USD" if "USD" in units else list(units.keys())[0] if units else None
        if not unit_key:
            continue
            
        points = units.get(unit_key, [])
        points_by_year = {}
        for p in points:
            if p.get("form") == "10-K" and p.get("fp") == "FY":
                points_by_year[int(p.get("fy"))] = p.get("val")
                
        # Fill values for sorted_years
        values = []
        has_any_val = False
        for y in sorted_years:
            val = points_by_year.get(y)
            values.append(val)
            if val is not None:
                has_any_val = True
                
        if has_any_val:
            rows.append({
                "concept": f"us-gaap_{concept_name}",
                "label": custom_label,
                "standard_concept": std_concept,
                "values": values
            })
            
    return {
        "periods": periods,
        "rows": rows
    }

def handle_financials(symbol):
    cik = get_ciks_or_fallback(symbol)
    if not cik:
        raise ValueError(f"Could not resolve CIK for ticker: {symbol}")
        
    facts = fetch_facts_from_sec(cik)
    
    INCOME_CONCEPTS = [
        ("RevenueFromContractWithCustomerExcludingAssessedTax", "Net sales", "Revenue"),
        ("SalesRevenueNet", "Net sales", "Revenue"),
        ("Revenues", "Net sales", "Revenue"),
        ("CostOfGoodsAndServicesSold", "Cost of sales", "CostOfGoodsAndServicesSold"),
        ("CostOfGoodsSold", "Cost of sales", "CostOfGoodsAndServicesSold"),
        ("GrossProfit", "Gross margin", "GrossProfit"),
        ("ResearchAndDevelopmentExpense", "Research and development", "ResearchAndDevelopmentExpenses"),
        ("SellingGeneralAndAdministrativeExpense", "Selling, general and administrative", "SellingGeneralAndAdminExpenses"),
        ("OperatingExpenses", "Total operating expenses", "TotalOperatingExpenses"),
        ("OperatingIncomeLoss", "Operating income", "OperatingIncomeLoss"),
        ("NonoperatingIncomeExpense", "Other income/(expense), net", "NonoperatingIncomeExpense"),
        ("IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "Income before provision for income taxes", "PretaxIncomeLoss"),
        ("IncomeTaxExpenseBenefit", "Provision for income taxes", "IncomeTaxes"),
        ("NetIncomeLoss", "Net income", "NetIncome"),
        ("EarningsPerShareBasic", "Basic (in dollars per share)", None),
        ("EarningsPerShareDiluted", "Diluted (in dollars per share)", None),
        ("WeightedAverageNumberOfSharesOutstandingBasic", "Basic (in shares)", "SharesAverage"),
        ("WeightedAverageNumberOfDilutedSharesOutstanding", "Diluted (in shares)", "SharesFullyDilutedAverage")
    ]

    BALANCE_CONCEPTS = [
        ("CashAndCashEquivalentsAtCarryingValue", "Cash and cash equivalents", "CashAndMarketableSecurities"),
        ("MarketableSecuritiesCurrent", "Marketable securities", "ShortTermInvestments"),
        ("AccountsReceivableNetCurrent", "Accounts receivable, net", "TradeReceivables"),
        ("NontradeReceivablesCurrent", "Vendor non-trade receivables", "OtherNonOperatingCurrentAssets"),
        ("InventoryNet", "Inventories", "Inventories"),
        ("OtherAssetsCurrent", "Other current assets", "OtherNonOperatingCurrentAssets"),
        ("AssetsCurrent", "Total current assets", "CurrentAssetsTotal"),
        ("MarketableSecuritiesNoncurrent", "Marketable securities (noncurrent)", "OtherNonOperatingNonCurrentAssets"),
        ("PropertyPlantAndEquipmentNet", "Property, plant and equipment, net", "PlantPropertyEquipmentNet"),
        ("OtherAssetsNoncurrent", "Other non-current assets", "OtherNonOperatingNonCurrentAssets"),
        ("Assets", "Total assets", "Assets"),
        ("AccountsPayableCurrent", "Accounts payable", "TradePayables"),
        ("OtherLiabilitiesCurrent", "Other current liabilities", "OtherNonOperatingCurrentLiabilities"),
        ("ContractWithCustomerLiabilityCurrent", "Deferred revenue", "OtherOperatingCurrentLiabilities"),
        ("CommercialPaper", "Commercial paper", "ShortTermDebt"),
        ("LongTermDebtCurrent", "Term debt (current)", "CurrentPortionOfLongTermDebt"),
        ("LiabilitiesCurrent", "Total current liabilities", "CurrentLiabilitiesTotal"),
        ("LongTermDebtNoncurrent", "Term debt (noncurrent)", "LongTermDebt"),
        ("OtherLiabilitiesNoncurrent", "Other non-current liabilities", "OtherNonOperatingNonCurrentAssets"),
        ("Liabilities", "Total liabilities", "Liabilities"),
        ("CommonStocksIncludingAdditionalPaidInCapital", "Common stock and additional paid-in capital", "CommonEquity"),
        ("RetainedEarningsAccumulatedDeficit", "Retained earnings/(Accumulated deficit)", "RetainedEarnings"),
        ("AccumulatedOtherComprehensiveIncomeLossNetOfTax", "Accumulated other comprehensive loss", "AccumulatedOtherComprehensiveIncome"),
        ("StockholdersEquity", "Total shareholders' equity", "AllEquityBalance"),
        ("LiabilitiesAndStockholdersEquity", "Total liabilities and shareholders' equity", "LiabilitiesAndEquity")
    ]

    CASHFLOW_CONCEPTS = [
        ("CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "Cash, cash equivalents, and restricted cash, beginning", "CashAndCashEquivalents"),
        ("NetIncomeLoss", "Net income", "NetIncome"),
        ("DepreciationDepletionAndAmortization", "Depreciation and amortization", "DepreciationExpense"),
        ("ShareBasedCompensation", "Share-based compensation expense", "StockBasedCompensationExpense"),
        ("NetCashProvidedByUsedInOperatingActivities", "Cash generated by operating activities", "NetCashFromOperatingActivities"),
        ("PaymentsToAcquirePropertyPlantAndEquipment", "Payments for property, plant and equipment", "CapitalExpenses"),
        ("NetCashProvidedByUsedInInvestingActivities", "Cash generated by investing activities", "NetCashFromInvestingActivities"),
        ("PaymentsOfDividends", "Payments for dividends", "DistributionsToMinorityInterests"),
        ("PaymentsForRepurchaseOfCommonStock", "Repurchases of common stock", "EquityExpenseIncome(BuybackIssued)"),
        ("ProceedsFromIssuanceOfLongTermDebt", "Proceeds from term debt", "DebtProceeds"),
        ("RepaymentsOfLongTermDebt", "Repayments of term debt", "DebtRepayments"),
        ("NetCashProvidedByUsedInFinancingActivities", "Cash used in financing activities", "NetCashFromFinancingActivities"),
        ("CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect", "Net change in cash", "NetChangeInCash")
    ]

    output = {
        "income_statement": parse_sec_statement(facts, INCOME_CONCEPTS),
        "balance_sheet": parse_sec_statement(facts, BALANCE_CONCEPTS),
        "cashflow_statement": parse_sec_statement(facts, CASHFLOW_CONCEPTS)
    }
    
    print(json.dumps(output, ensure_ascii=False))

def get_ciks_or_fallback(symbol):
    cik = get_cik(symbol)
    if not cik:
        # Hardcoded list as final fallback
        fallbacks = {
            "AAPL": "0000320193",
            "MSFT": "0000789019",
            "GOOGL": "0001652044",
            "GOOG": "0001652044",
            "AMZN": "0001018724",
            "NVDA": "0001045810",
            "META": "0001326801",
            "TSLA": "0001318605",
            "JPM": "0000019617",
        }
        return fallbacks.get(symbol.upper())
    return cik

def get_relationship(rel_node):
    if rel_node is None:
        return "Insider"
    
    officer_title = rel_node.find(".//officerTitle")
    if officer_title is not None and officer_title.text:
        return officer_title.text.strip()
        
    is_dir = rel_node.find(".//isDirector")
    if is_dir is not None and is_dir.text and is_dir.text.lower() in ["1", "true"]:
        return "Director"
        
    is_off = rel_node.find(".//isOfficer")
    if is_off is not None and is_off.text and is_off.text.lower() in ["1", "true"]:
        return "Officer"
        
    is_ten = rel_node.find(".//isTenPercentOwner")
    if is_ten is not None and is_ten.text and is_ten.text.lower() in ["1", "true"]:
        return "10% Owner"
        
    return "Insider"

def parse_filing_xml(args):
    cik, acc_num, primary_doc, filing_date = args
    acc_num_no_dashes = acc_num.replace("-", "")
    xml_name = os.path.basename(primary_doc)
    
    xml_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_num_no_dashes}/{xml_name}"
    index_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_num_no_dashes}/{acc_num}-index.html"
    
    try:
        req_xml = urllib.request.Request(xml_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req_xml, timeout=5) as response_xml:
            xml_content = response_xml.read()
            
        root = ET.fromstring(xml_content)
        
        owner_name_node = root.find(".//rptOwnerName")
        owner_name = owner_name_node.text.strip() if owner_name_node is not None else "Unknown"
        
        if owner_name != "Unknown":
            parts = [p.capitalize() for p in owner_name.split()]
            if len(parts) > 1:
                owner_name = " ".join(parts)
        
        rel_node = root.find(".//reportingOwnerRelationship")
        relationship = get_relationship(rel_node)
        
        non_derivs = root.findall(".//nonDerivativeTransaction")
        txs = []
        for tx in non_derivs:
            title_node = tx.find(".//securityTitle/value")
            title = title_node.text if title_node is not None else "Common Stock"
            
            date_node = tx.find(".//transactionDate/value")
            tx_date = date_node.text if date_node is not None else filing_date
            
            code_node = tx.find(".//transactionCode")
            code = code_node.text if code_node is not None else ""
            
            shares_node = tx.find(".//transactionShares/value")
            shares = float(shares_node.text) if shares_node is not None else 0.0
            
            price_node = tx.find(".//transactionPricePerShare/value")
            price = float(price_node.text) if price_node is not None else 0.0
            
            value = shares * price
            
            remaining_node = tx.find(".//sharesOwnedFollowingTransaction/value")
            remaining = float(remaining_node.text) if remaining_node is not None else 0.0
            
            txs.append({
                "owner": owner_name,
                "relationship": relationship,
                "security_title": title,
                "date": tx_date,
                "code": code,
                "shares": shares,
                "price": price,
                "value": value,
                "remaining": remaining,
                "filing_url": index_url
            })
        return txs
    except Exception:
        return []

def handle_insiders(symbol):
    cik = get_ciks_or_fallback(symbol)
    if not cik:
        raise ValueError(f"Could not resolve CIK for ticker: {symbol}")
        
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=5) as response:
        sub = json.loads(response.read().decode("utf-8"))
        
    recent = sub["filings"]["recent"]
    forms = recent["form"]
    acc_nums = recent["accessionNumber"]
    docs = recent["primaryDocument"]
    dates = recent["filingDate"]
    
    form4_indices = [i for i, f in enumerate(forms) if f == "4"][:15]
    
    tasks = []
    for idx in form4_indices:
        tasks.append((cik, acc_nums[idx], docs[idx], dates[idx]))
        
    transactions = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(parse_filing_xml, tasks)
        for res in results:
            transactions.extend(res)
            
    print(json.dumps(transactions, ensure_ascii=False))

def handle_holdings(cik_or_symbol):
    # Lazy imports to save 5 seconds on startup of financials/insiders
    from edgar import Company, set_identity
    import pandas as pd
    import numpy as np

    set_identity("Stocklens Research Agent stocklens-admin@gmail.com")
    
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
        pass
        
    print(json.dumps({
        "holdings": holdings_list,
        "comparison": compare_list
    }, ensure_ascii=False))

def handle_section(symbol, item):
    # Lazy imports
    from edgar import Company, set_identity
    set_identity("Stocklens Research Agent stocklens-admin@gmail.com")
    
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
    # Lazy imports
    from edgar import Company, set_identity
    set_identity("Stocklens Research Agent stocklens-admin@gmail.com")
    
    company = Company(symbol)
    filings = company.get_filings(form="10-K")
    if len(filings) < 2:
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
