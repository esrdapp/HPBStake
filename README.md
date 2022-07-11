# HPB Stake

HPB Stake, developed by Jeff Powell (TG: jeffpUK)

A User can stake HPB to earn even more HPB from the staking smart contract, however there is an element of "gamifcation" of staking using HRNG :-)

The HPB HRNG will generate two random numbers:

The first "Deposit Percentage" (dp) will determine the % of HPB deposited that will earn stake rewards (between 0% and 100%)
The second, "Stake Multiplier" (sm) will determine the stake APY percentage multiplier (between 0% and 100%)


Example: You deposit 100 HPB into HPB Stake, and the contract generates a "dp" of 83 and a "sm" of 22

This means 83% of your staked HPB will now be earning stake rewards (83 HPB of the 100 HPB)
It also means that the 83 HPB will be earning 22% APY - so after one year, your 83 HPB will be worth 101.26 HPB (83 x 1.22)

This means you can withdraw 101.26 + your remaining 17 HPB = 118.26 HPB after 12 months

Smart contract rules:

1. Your HPB must be staked for 12 months to receive the full APY benefit
2. Your stake HPB will only start to accrue interest after 180 days - Interest begins on day 180

3. You must leave your HPB in the RandomStake smart contract for a minimum of 180 days or else you will receive a "penalty" for early withdrawal

# less than 30 days = 25% forfeit
# 30-60 days = 20% forfeit
# 60-90 days = 15% forfeit
# 90-120 days = 10% forfeit
# 120-150 days = 5% forfeit
# 150-180 days = 2.5% forfeit
# After 180 days = no forfeit for withdrawal and interest starts to accrue

You will not know what your "DP" and "SM" values will be (generated randomly by HRNG) until you have deposited your HPB! :-)


for more details on the HPB blockchain, visit https://hpb.io

to engage with the HPB global community, visit https://t.me/hpbglobal
