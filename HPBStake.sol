// SPDX-License-Identifier: UNLICENSED

// HPB RandomStake contract, developed by Jeff Powell (TG: jeffpUK)
// User can stake HPB to earn more HPB from the smart contract
// However there is an element of "gamifcation" of staking :-)


// The HPB HRNG will generate two random numbers
// The first (sm) will determine the stake APY percentage multiplier (between 0% and 100%)
// The second (dm) will determine the % of HPB deposited that will earn stake rewards (between 0% and 100%)

// Example: You deposit 100 HPB and the contract generates an "sm" of 22 and a "dm" of 83
// This means 83% of your staked HPB will be earning stake rewards (83 HPB)
// it also means that the 83 HPB will earn 22% APY - so after one year, your 83 HPB will be worth 101.26 HPB
// This means you can withdraw 101.26 + 17 HPB = 118.26 HPB   

// You must leave your HPB in the RandomStake smart contract for a minimum of 6 months or else you will receive a "forfeit" for withdrawal
// less than 30 days = 25% forfeit
// 30-60 days = 20% forfeit
// 60-90 days = 15% forfeit
// 90-120 days = 10% forfeit
// 120-150 days = 5% forfeit
// 150-180 days = 2.5% forfeit
// after 180 days = no forfeit for withdrawal

pragma solidity 0.8.4;


// HPB random number contract, used to generate random number
abstract contract HRNG {
             function hrand() public view virtual returns (bytes32);

        }


/**
Stakeable is a contract which is to be inherited by RandomStake contract which requires Staking capabilities
*/
contract HPBStake {

    address hrngAddr = 0xE3960495Ae7a400Fa45C82C40dA8455Ef8b1c65E;
    HRNG hrng;
    address public admin;
    bool public mutex;

    //forfeit percentages
    uint256 lessThanThirty = 250;
    uint256 thirtyToSixty = 200;
    uint256 sixtyToNinety = 150;
    uint256 ninetyToHundredTwenty = 100;
    uint256 hundredTwentyToHundredFifty = 50;
    uint256 hundredFiftyToHundredEighty = 25;
  
        /**
    rewardDivisor represents the maximum APY (expreseed hourly) 
    of the maximum potential reward (100%) dividied by the number of hours in one year. 
    Therefore 100% / 8760 = 0.0114155 APY % per hour

     */
    uint256 internal rewardDivisor = 8760;
    /**
    * @notice - since this contract is not intended for use without inheritance
    * it should be pushed once for it to work proplerly
     */
    constructor() {
        // This push is needed so we avoid index 0 causing bug of index-1
        stakeholders.push();
         hrng = HRNG(hrngAddr); 
         admin = msg.sender;
    }

    function lastr() private view returns (uint) {
         bytes32 r = hrng.hrand(); // call hrand to get hardware random.
         uint256 q = uint(r);
         return q;
    }

        function getDP() private view returns (uint256) {
         uint256 rand = lastr(); // call hrand 
         uint256 dpRand = rand % 100;
                
         return (dpRand);
       
    }

    function getSM() private view returns (uint256) {
         uint256 rand = lastr(); // call hrand 
         uint256 smRand = rand % 100;
                
         return (smRand);
       
    }

    /**
     * @notice
     * A Stake struct is used to represent the way we store stakes, 
     * A Stake will contain the users address, the amount of HPB staked,
       a timestamp, the amount of HPB which can be claimed,
       as well as an sm value and a dm value
     */
    struct Stake{
        address user;
        uint256 amount;
        // timestamp of when stake was made
        uint256 since;
        // claimable field is used to tell how big of a reward is currently available
        uint256 claimable;
        uint256 smvalue;
        uint256 dmvalue;
    }
    
    
    /**
    * @notice Stakeholder is a staker that has "active" stakes
      You can have more than one stake in the smart contract
     */
    struct Stakeholder{
        address user;
        Stake[] address_stakes;
        
    }

    /**
    * @notice 
    *   This is an array where we store ALL Stakes that are performed on the contract
    *   The stakes for each address are stored at a certain index, the index can be found using the stakes mapping
    */
    Stakeholder[] internal stakeholders;
    /**
    * @notice 
    * stakes is used to keep track of the INDEX for the stakers in the stakes array
     */
    mapping(address => uint256) internal stakes;
    /**
    * @notice the "Staked" event is triggered whenever a user stakes tokens, address is indexed to make it filterable
     */
     event Staked(address indexed user, uint256 amount, uint256 index, uint256 timestamp);
     
     
         /**
    * @notice _addStakeholder takes care of adding a stakeholder to the stakeholders array
     */
    function _addStakeholder(address staker) internal returns (uint256){
        // Push an empty item to the Array to make space for our new stakeholder
        stakeholders.push();
        // Calculate the index of the last item in the array by Len-1
        uint256 userIndex = stakeholders.length - 1;
        // Assign the address to the new index
        stakeholders[userIndex].user = staker;
        // Add index to the stakeHolders
        stakes[staker] = userIndex;
        return userIndex; 
    }
     
    
        /**
    * @notice
    * _stake is used to make a stake for a sender. It will remove the amount staked from the stakers wallet,
     and place the HPB inside a stake container
    * StakeID 
    */
    function _stake(uint256 _amount) internal{
        // Simple check so that user does not stake 0 HPB
        require(_amount > 0, "You cannot stake nothing!");

        //get a DP value
        uint256 dp = getDP();

        //get an SM value
        uint256 sm = getSM();
        

        // Mappings in solidity creates all values, but empty, so we can just check the address
        uint256 index = stakes[msg.sender];
        // block.timestamp = timestamp of the current block in seconds since the epoch
        uint256 timestamp = block.timestamp;
        // See if the staker already has a staked index or if its the first time
        if(index == 0){
            // This stakeholder stakes for the first time
            // We need to add him to the stakeHolders and also map it into the Index of the stakes
            // The index returned will be the index of the stakeholder in the stakeholders array
            index = _addStakeholder(msg.sender);
        }

        // Use the index to push a new Stake
        // push a newly created Stake with the current block timestamp.
        stakeholders[index].address_stakes.push(Stake(msg.sender, _amount, timestamp,0,dp,sm));
        // Emit an event that the stake has occured
        emit Staked(msg.sender, _amount, index, timestamp);
    }
    
    
         /**
      * @notice
      * calculateStakeReward is used to calculate how much a user should be rewarded for their stakes
      * and the duration the stake has been active
     */
      function calculateStakeReward(Stake memory _current_stake) internal view returns(uint256){
          // First calculate how long the stake has been active
          // Use current seconds since epoch - the seconds since epoch the stake was made
          // The output will be duration in SECONDS ,

          //30 days in seconds is 2592000 Seconds
          //60 days in seconds is 5184000 Seconds
          //90 days in seconds is 7776000 Seconds
          //120 days in seconds is 10368000 Seconds
          //150 days in seconds is 12960000 Seconds
          //180 days in seconds is 15552000 Seconds


          //reward if attempting to withdraw in less than 30 days
          if(_current_stake.since > 0 && _current_stake.since <= 2592000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          //reward if attempting to withdraw in 30 to 60 days
          else if(_current_stake.since > 2592001 && _current_stake.since <= 5184000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          //reward if attempting to withdraw in 60 to 90 days
          else if(_current_stake.since > 5184001 && _current_stake.since <= 7776000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          //reward if attempting to withdraw in 90 to 120 days
          else if(_current_stake.since > 7776001 && _current_stake.since <= 10368000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          //reward if attempting to withdraw in 120 to 150 days
          else if(_current_stake.since > 10368001 && _current_stake.since <= 12960000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          //reward if attempting to withdraw in 150 to 180 days
          else if(_current_stake.since > 12960001 && _current_stake.since <= 15552000) {
              return (((block.timestamp - _current_stake.since) / 1 hours) * _current_stake.amount) / rewardDivisor;
          }

          
          else {
          
          return 0;
          }
      }
      
      
      function calculateStakeTime(Stake memory _current_stake) internal view returns(uint256){
          // First calculate how long the stake has been active
          // Use current seconds since epoch - the seconds since epoch the stake was made
          // The output will be duration in SECONDS ,
          // We will reward the user 0.0114155% per Hour So thats 0.0114155% for every 3600 seconds
          // the algorithm is seconds = block.timestamp - stake seconds (block.timestap - _stake.since)
          // hours = Seconds / 3600 (seconds /3600) 
          // 3600 is a variable in Solidity called "hours"
          // We then multiply each HPB by the hours staked , and then divide this by the rewardDivisor rate 
          return ((block.timestamp - _current_stake.since) / 1 hours);
      }
      
      

        function _withdrawStake(uint256 index) public {
         // Grab user_index which is the index to use to grab the Stake[]
        uint256 user_index = stakes[msg.sender];
        Stake memory current_stake = stakeholders[user_index].address_stakes[index];
 //       require(current_stake.amount >= amount, "Staking: Cannot withdraw more than you have staked");

         // Calculate available Reward first before we start modifying data
         uint256 reward = calculateStakeReward(current_stake);
         // If stake is empty, 0, then remove it from the array of stakes
         if(current_stake.amount == 0){
             delete stakeholders[user_index].address_stakes[index];
         }else {
             // If not empty then replace the value of it
             stakeholders[user_index].address_stakes[index].amount = current_stake.amount;
             // Reset timer of stake
             stakeholders[user_index].address_stakes[index].since = block.timestamp;    
         }

 //        return current_stake.amount + reward;

        (bool success,) = msg.sender.call{value: (current_stake.amount + reward) /100 * (100 - index)}("");
        require(success, "Transfer failed.");

     }


 /*   function withdrawStake(uint256 index)  public {
      require(!mutex);
      mutex = true;
 //     Stake memory current_stake = stakeholders[user_index].address_stakes[index];
 //     uint256 amount_to_release = _withdrawStake(stake_index.amount * 10 ** 18, stake_index);
      // Return staked HPB to user
      (bool success,) = msg.sender.call{value: current_stake.amount /100 * (100 - index)}("");
      require(success, "Transfer failed.");
      
      mutex =false;
    }
/*


     
     /**
     * @notice
     * StakingSummary is a struct that is used to contain all stakes performed by a certain account
     */ 
     struct StakingSummary{
         uint256 total_amount;
         Stake[] stakes;
     }


     /**
     * @notice
     * hasStake is used to check if a account has stakes and the total amount along with all the seperate stakes
     */
    function hasStake(address _staker) public view returns(StakingSummary memory){
        // totalStakeAmount is used to count total staked amount of the address
        uint256 totalStakeAmount; 
        // Keep a summary in memory since we need to calculate this
        StakingSummary memory summary = StakingSummary(0, stakeholders[stakes[_staker]].address_stakes);
        // Itterate all stakes and grab amount of stakes
        for (uint256 s = 0; s < summary.stakes.length; s += 1){
           uint256 availableReward = calculateStakeReward(summary.stakes[s]);
           summary.stakes[s].claimable = availableReward;
           totalStakeAmount = totalStakeAmount+summary.stakes[s].amount;
       }
       // Assign calculate amount to summary
       summary.total_amount = totalStakeAmount;
        return summary;
    }



}
