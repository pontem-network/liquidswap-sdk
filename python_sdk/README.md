# Python SDK Example

This is a simple example for the Python SDK.

## Functions:

### get your APT and USDT balance

`get_apt_balance()`

`get_usdt_balance()`

### get expected amount out USDT with target `apt_in`

`get_amount_out(apt_in)`

### swap `apt_in` APT to USDT

`swap(from_amount, to_amount)`

## Expected Results:

```python
public key: 0x164eb1af65b9252a01f75e2f6da2bc6624eec64ba19db04be13ce3d182f4c36b
balance: APT 1.272624, USDT 0.009735
apt_in: 0.0001, usdt_out: 0.000748
swap 0.0001 APT to 0.000748 USDT...
txn_hash: 0x493b702a7358dee53ff4f09ce32d126dc62c48c2cc666b2eb658dc94ba9a73b2
```
