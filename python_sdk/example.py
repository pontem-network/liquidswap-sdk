from typing import Optional

from aptos_sdk.account import Account
from aptos_sdk.account_address import AccountAddress
from aptos_sdk.bcs import Serializer
from aptos_sdk.client import RestClient, FaucetClient
from aptos_sdk.transactions import (
    EntryFunction,
    TransactionArgument,
    TransactionPayload,
)
from aptos_sdk.type_tag import StructTag, TypeTag

import constants
import config
from utils import convert_to_decimals, pretty_amount

# Your wallet path
wallet_path = "/Users/waynekuo/aptos/brave.json"
slippage = 0.05

CURVES = f"{constants.MODULES_ACCOUNT}::curves::Uncorrelated"


class LiquidSwapClient(RestClient):
    def __init__(self, wallet_path: str = None):
        super().__init__(config.Node_Url)

        if wallet_path:
            self.my_account = Account.load(wallet_path)
        else:
            self.my_account = Account.generate()

    def get_amount_out(self, amount_in: float) -> Optional[float]:
        """get USDT amount_out with APT `amount_in`"""

        data = self.account_resource(
            AccountAddress.from_hex(constants.RESOURCES_ACCOUNT),
            f"{constants.NETWORKS_MODULES['LiquidityPool']}::LiquidityPool<{config.Tokens_Mapping['USDT']}, {config.Tokens_Mapping['APTOS']}, {CURVES}>",
        )["data"]

        coin_x_reserve = pretty_amount(int(data["coin_x_reserve"]["value"]), "USDT")
        coin_y_reserve = pretty_amount(int(data["coin_y_reserve"]["value"]), "APTOS")

        coinInAfterFees = amount_in * (constants.FEE_SCALE - constants.FEE_PCT)

        newReservesInSize = coin_y_reserve * constants.FEE_SCALE + coinInAfterFees

        return coinInAfterFees * coin_x_reserve / newReservesInSize

    def get_apt_balance(self) -> Optional[int]:
        """get APT balance"""
        return pretty_amount(
            int(rest_client.account_balance(self.my_account.address())), "APTOS"
        )

    def get_usdt_balance(self) -> Optional[int]:
        """get USDT balance"""
        return (
            pretty_amount(
                int(
                    self.account_resource(
                        self.my_account.address(),
                        f"0x1::coin::CoinStore<{config.Tokens_Mapping['USDT']}>",
                    )["data"]["coin"]["value"]
                )
            ),
            "USDT",
        )

    def swap(self, from_amount: int, to_amount: int) -> str:
        """swap APT to USDT"""

        payload = EntryFunction.natural(
            constants.NETWORKS_MODULES["Scripts"],
            "swap",
            [
                TypeTag(StructTag.from_str(config.Tokens_Mapping["APTOS"])),
                TypeTag(StructTag.from_str(config.Tokens_Mapping["USDT"])),
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

    # faucet_client = FaucetClient(config.Faucet_Url, rest_client)
    # faucet_client.fund_account(
    #     f"{rest_client.my_account.public_key()}",
    #     convert_to_decimals(1, "APTOS"),
    # )

    print(f"public key: {rest_client.my_account.public_key()}")
    print(
        f"balance: APT {rest_client.get_apt_balance()}, USDT {rest_client.get_usdt_balance()}"
    )

    apt_in = 0.0001

    usdt_out = rest_client.get_amount_out(apt_in)
    usdt_out = round(usdt_out, config.Coin_Info["USDT"])
    print(f"apt_in: {apt_in}, usdt_out: {usdt_out}")

    from_amount = convert_to_decimals(apt_in, "APTOS")
    to_amount = convert_to_decimals(usdt_out, "USDT")

    print(f"swap {apt_in} APT to {usdt_out} USDT...")
    txn_hash = rest_client.swap(from_amount, to_amount)
    rest_client.wait_for_transaction(txn_hash)
    print(f"txn_hash: {txn_hash}")
