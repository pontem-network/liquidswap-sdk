from typing import Optional

from aptos_sdk.account import Account
from aptos_sdk.account_address import AccountAddress
from aptos_sdk.bcs import Serializer
from aptos_sdk.client import RestClient
from aptos_sdk.transactions import (
    EntryFunction,
    TransactionArgument,
    TransactionPayload,
)
from aptos_sdk.type_tag import StructTag, TypeTag

NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1"

LIQUIDSWAP = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12"

CURVES = f"{LIQUIDSWAP}::curves::Uncorrelated"

APT = "0x1::aptos_coin::AptosCoin"
APT_DECIMAL = 8

USDT = "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T"
USDT_DECIMAL = 6

# Your wallet path
path = "/Users/waynekuo/aptos/brave.json"
slippage = 0.05


class LiquidSwapClient(RestClient):
    def __init__(self):
        super().__init__(NODE_URL)
        self.my_account: Account = Account.load(path)

    def get_amount_out(self, amount_in: float) -> Optional[float]:
        """get USDT amount_out with APT `amount_in`"""

        data = self.account_resource(
            AccountAddress.from_hex(
                "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948"
            ),
            f"{LIQUIDSWAP}::liquidity_pool::LiquidityPool<{USDT}, {APT}, {CURVES}>",
        )["data"]

        coin_x_reserve = int(data["coin_x_reserve"]["value"]) / 10 ** USDT_DECIMAL
        coin_y_reserve = int(data["coin_y_reserve"]["value"]) / 10 ** APT_DECIMAL

        FEE_PCT = 3
        FEE_SCALE = 1000

        coinInAfterFees = amount_in * (FEE_SCALE - FEE_PCT)

        newReservesInSize = coin_y_reserve * FEE_SCALE + coinInAfterFees

        return coinInAfterFees * coin_x_reserve / newReservesInSize

    def get_apt_balance(self) -> Optional[int]:
        """get APT balance"""

        return int(rest_client.account_balance(self.my_account.address())) / 10 ** APT_DECIMAL

    def get_usdt_balance(self) -> Optional[int]:
        """get USDT balance"""
        return (
            int(
                self.account_resource(self.my_account.address(), f"0x1::coin::CoinStore<{USDT}>")[
                    "data"
                ]["coin"]["value"]
            )
            / 10 ** USDT_DECIMAL
        )

    def swap(self, from_amount: int, to_amount: int) -> str:
        """swap APT to USDT"""

        payload = EntryFunction.natural(
            f"{LIQUIDSWAP}::scripts",
            "swap",
            [
                TypeTag(StructTag.from_str(APT)),
                TypeTag(StructTag.from_str(USDT)),
                TypeTag(StructTag.from_str(CURVES)),
            ],
            [
                TransactionArgument(
                    from_amount,
                    Serializer.u64,
                ),
                TransactionArgument(
                    to_amount,
                    Serializer.u64,
                ),
            ],
        )
        signed_transaction = self.create_single_signer_bcs_transaction(
            self.my_account, TransactionPayload(payload)
        )
        return self.submit_bcs_transaction(signed_transaction)


if __name__ == "__main__":

    rest_client = LiquidSwapClient()

    print(f"public key: {rest_client.my_account.public_key()}")
    print(f"balance: APT {rest_client.get_apt_balance()}, USDT {rest_client.get_usdt_balance()}")

    apt_in = 0.0001

    usdt_out = rest_client.get_amount_out(apt_in)
    usdt_out = round(usdt_out, USDT_DECIMAL)
    print(f"apt_in: {apt_in}, usdt_out: {usdt_out}")

    from_amount = int(apt_in * 10 ** APT_DECIMAL)
    to_amount = int(usdt_out * 10 ** USDT_DECIMAL)

    print(f"swap {apt_in} APT to {usdt_out} USDT...")
    txn_hash = rest_client.swap(from_amount, to_amount)
    rest_client.wait_for_transaction(txn_hash)
    print(f"txn_hash: {txn_hash}")
