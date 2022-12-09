from config import Coin_Info


def convert_to_decimals(amount: float, token: str) -> int:
    return int(amount * 10 ** Coin_Info[token])


def pretty_amount(amount: int, token: str) -> float:
    return float(amount / 10 ** Coin_Info[token])
