import logo from './logo.png';
import call from './call.png';
import './App.css';
import web3 from './web3';
import myContract from './myContract';
import React from "react";
import ReactModal from 'react-modal';
import Iframe from 'react-iframe';

const delay = t => new Promise(s => setTimeout(s, t * 1000));

const divStyle = {
              'border': '0',
            'margin': '0 auto',
            'display': 'block',
            'border-radius': '10px',
            'max-width': '600px',
            'min-width': '300px'
};

class App extends React.Component {
  state = {
    admin: '',
    name: '',
    stakeValue: 0,
    stakeIndex: 0,
    withdrawValue: 0,
    account: '',
    balance: '...',
    stakedBalance: '...',
    tableContent: [],
    isWin: false,
    showModal: false
  };

  showData() {
    myContract.methods.balanceOf(this.state.account).call().then(wei => {
      this.setState({ balance: wei / (10 ** 18) });
    });

    myContract.methods.hasStake(this.state.account).call().then(stakedData => {
      this.setState({ stakedBalance: stakedData[0] / (10 ** 18) });
      this.setState({ tableContent: stakedData[1] });

      console.log(stakedData[1][0])
    });

    myContract.methods.admin().call().then(admin => {
      this.setState({ admin });
    });

    myContract.methods.name().call().then(name => {
      this.setState({ name });
    });
  }

  async componentDidMount() {
    window.ethereum.request({ method: "eth_requestAccounts" }).then(() => {
      web3.eth.requestAccounts()
        .then(accounts => {
          web3.eth.net.getId().then(async netId => {
            if (netId === 269) {
              this.setState({ account: accounts[0] });
              this.showData();
            } else {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x10d' }]
              })
              this.showData();
            }
          })
        })
    });
  }

  onSubmitBalanceOf = async (event) => {
    event.preventDefault();

    // this.setState({ message: 'Waiting on transaction success...' });

    // const accounts = await web3.eth.getAccounts();
    // await myContract.methods.balanceOf(this.state.account).send({
    //   from: accounts[0]
    // });

    // this.setState({ message: '' });
    // Router.replaceRoute(`/hpb/${this.props.address}`);
  };

  handleCall = async () => {
    
    
    try {
      const gasPrice = await web3.eth.getGasPrice();

      await myContract.methods.doubleOrNothing().send({
        from: this.state.account,
        gasPrice: gasPrice
      });

      await delay(3);

      myContract.methods.balanceOf(this.state.account).call().then(wei => {
        this.setState({ balance: wei / (10 ** 18) });
        this.setState({ isWin: wei > 0 });
        this.setState({ showModal: true });
      });
  
      myContract.methods.hasStake(this.state.account).call().then(stakedData => {
        this.setState({ stakedBalance: stakedData[0] / (10 ** 18) });
        this.setState({ tableContent: stakedData[1] });
  
        console.log(stakedData[1][0])
      });
  
      myContract.methods.admin().call().then(admin => {
        this.setState({ admin });
      });
  
      myContract.methods.name().call().then(name => {
        this.setState({ name });
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  handleStake = async (e) => {
    e.preventDefault();
    try {
      const gasPrice = await web3.eth.getGasPrice();

      await myContract.methods.stake(this.state.stakeValue).send({
        from: this.state.account,
        gasPrice: gasPrice
      });

      this.showData();

    } catch (error) {
      console.log(error);
    }
  }

  handleWithdraw = async (e) => {
    e.preventDefault();
    this.setState({ message: 'Waiting on transaction success...' });

    try {
      const gasPrice = await web3.eth.getGasPrice();

      await myContract.methods.withdrawStake(this.state.withdrawValue, this.state.stakeIndex).send({
        from: this.state.account,
        gasPrice: gasPrice
      });

      this.showData();
    } catch (error) {
      console.log(error);
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  render() {
    if (!this.state.account) {
      return (
        <div>
        <h1>Please connect your Metamask wallet to HPB first.</h1>
        <img src={logo} className="App-logo" alt="logo" />
        </div>
      )
    }

    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="HPB Stake" />
        <p>
          The world's first gamified staking DApp! Earn HPB by depositing HPB into the immutable, decentralised HPB Stake smart contract!</p>
          You can obtain HPB from Gate.io CEX or swap to HPB using allchainbridge.com
          <br />
          <a rel="noreferrer" target="_blank" href="https://allchainbridge.com</a>

        <p className='mt-20'>Number of HPB tokens in your connected wallet: {this.state.balance} HPB</p>
        <p>Number of HPB you have staked: {this.state.stakedBalance} HPB</p>

        <br />
        <p className='mt-20'>HPB Staking</p>
        <p><b>HPB Stake</b> is the first staking platform in the world to introduce an element of gamification and randomness to staking!</p>
        
        <p>When you stake your HPB, it will generate two values from 0-100. The first is your 'Deposit Percentage' (DP) value, and the second is 
        your 'Stake Multiplier' (SM) value.</p>

        <p>The Deposit Percentage determines what percentage of your stake HPB will accrue interest (0-100%)</p>
        <p>The Stake Multiplier determines what Annual Percentage Yield (APY) will be earned on this over a 1 year period</p>

        <p>For example, if you stake 100 HPB, and your DP is 83 and your SM is 22, then you would earn the following over 1 year:</p>
        <br />
        <p>83 HPB will earn interest, and of that 83 HPB, it will earn interes of 22% APY, which is 83 x 1.22 = 101.26 HPB</p>
        <p>Therefore after 1 year, you can with draw 101.26 + 17 HPB = 118.26 HPB</p>
                                                                                                      
               

        <form onSubmit={this.handleStake} className='mt-20'>
          <label>Number of HPB you wish to stake: </label><br />
          <div>
            <label className='ml-20'>Amount: </label>
            <input
              type='number'
              min={0}
              value={this.state.stakeValue}
              onChange={event => this.setState({ stakeValue: event.target.value })}
            />
            <button className='ml-20'>Stake</button>
          </div>
        </form>

        <br />
        <p>You can withdraw whenever you like, but withdrawals in less than 180 days will incur a penalty forfeit! 
        <p>less than 30 days = 25% forfeit of total stake</p>
        <p>30-60 days = 20% forfeit of total stake</p>
        <p>60-90 days = 15% forfeit of total stake</p>
        <p>90-120 days = 10% forfeit of total stake</p>
        <p>120-150 days = 5% forfeit of total stake</p>
        <p>150-180 days = 2.5% forfeit of total stake</p>
        <p>After 180 days = No forfeit, and interest begins to accrue</p>

        <br />
        <p>This is necessary to avoid people withdrawing their entire stake if they receive a DP and SM value that is less favourable to them. 
        It will also help fund the smart contract for other users as adoption increases</p>

        <form onSubmit={this.handleWithdraw} className='mt-20'>
          <label>Withdraw your Staked HPB </label><br />
          <div>
            <label className='ml-20'>Stake Index: </label>
            <input
              type='number'
              min={0}
              value={this.state.stakeIndex}
              onChange={event => this.setState({ stakeIndex: event.target.value })}
            />
            <label className='ml-20'>Amount: </label>
            <input
              type='number'
              min={0}
              value={this.state.withdrawValue}
              onChange={event => this.setState({ withdrawValue: event.target.value })}
            />
            <button className='ml-20'>Withdraw</button>
          </div>
        </form>

        {/* <Form address={this.props.address} onSubmit={this.onSubmit2} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>amount of DON:</label>
            <Form.Input width={6}
              value={this.state.amount}
              onChange={event => this.setState({ amount: event.target.value })}
            />
          </Form.Field>
          <Form.Field>
            <label>ID:</label>
            <Form.Input width={6}
              value={this.state.stake_index}
              onChange={event => this.setState({ stake_index: event.target.value })}
            />
          </Form.Field>
          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button color="green">First Deposit</Button>
        </Form>

        <Form address={this.props.address} onSubmit={this.onSubmitBalanceOf} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>balance:</label>
            <Form.Input width={6}
              value={this.state.amount}
              onChange={event => this.setState({ account: event.target.value })}
            />
          </Form.Field>
          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button color="green">Get Account</Button>
        </Form> */}

        <div className="flex center">
          <table className='mt-20'>
            <tr>
              <th>Stake Index</th>
              <th>Available to withdraw</th>
              <th>Last Deposit/Withdraw time</th>
              <th>Stake interest accrued</th>
            </tr>
            {this.state.tableContent.map((row, i) => (
              Number(row[0]) === 0 || Number(row[2]) === 0 ? <></> : (
                <tr key={i}>
                  <td>{i}</td>
                  <td>{`${row[1] / (10 ** 18)} HPB`}</td>
                  <td>{new Date(row[2] * 1000).toLocaleString()}</td>
                  <td>{`${row[3] / (10 ** 19)} HPB`}</td>
                </tr>
              )
            ))}
          </table>
        </div>
        <br />
        <div>
        
        <p className='mt-20'>you can also use HPDEX to trade HPB</p>
      
        
          <Iframe
            title="HPDEX"
            src="https://app.hpdex.org/#/swap"
            height="660px"
            width="100%"
            style={divStyle}
            id="myId"
            />
      </div>
        
        
        
        
        
        <ReactModal
           className="ReactModal__Content"
           isOpen={this.state.showModal}
           data={
            { background: "green" }
           }
        >
          {this.state.isWin 
            ? <h2 className="dialog-message win">Congratulations!</h2>
            : <h2 className="dialog-message lose">Bad luck!</h2>
          }
          <button onClick={this.handleCloseModal}>Close</button>
        </ReactModal>
      </div>
    );
  }
}
export default App;
