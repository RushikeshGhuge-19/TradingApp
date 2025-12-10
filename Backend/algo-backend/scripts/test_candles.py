from app.services import market_data


def main():
    print("Calling market_data.get_recent_candles() with defaults...")
    candles = market_data.get_recent_candles()
    print(f"Returned {len(candles)} candles")
    if len(candles) > 0:
        for c in candles[:5]:
            print(c)


if __name__ == '__main__':
    main()
