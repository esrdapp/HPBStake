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
        <div className="App">
        <h1>Welcome to HPB Stake</h1>
	<h3>Please connect your Metamask wallet to HPB chain first</h3>
		<p>Network Name: HPB</p>
		<p>New RPC URL: https://hpbnode.com </p>
		<p>Chain ID: 269 </p>
		<p>Currency Symbol: HPB</p>
		<p>Block Explorer: https://hscan.org </p>
		<br />
        <img src={logo} className="App-logo" alt="logo" />
        </div>
      )
    }

    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="logo" />
        
	<h1>HPB Stake</h1>
	<h3>The worlds first gamified crypto staking platform!</h3>
	
        <p>When you stake your HPB, it will generate two values from 0-100</p> 
        <p>The first is your DP (Deposit Percentage) value</p>
        <p>The second is your SM (Stake Multiplier) value.</p>

        <p>The DP determines what percentage of your total staked HPB will accrue interest (0-100%)</p>
												     
        <p>The SM determines what Annual Percentage Yield (APY) that will be earned on the DP over a 1 year period (0-100%)</p>

        <p>For example, if you staked 100 HPB, and your DP is 83 and your SM is 22:</p> 

        <p>83% of your HPB (83 HPB) will earn interest</p>
        <p>That 83 HPB will earn interest of 22% APY, which is 83 x 1.22 = 101.26 HPB</p>
        <p>Therefore after 1 year, you can withdraw 101.26 + 17 HPB = 118.26 HPB</p>
	
<br />
 
	<h3>You can also have more than one stake!</h3>		

        <p>Remember, you can purchase HPB from Gate.io or by using Allchainbridge.com</p>
          <br />
          <a rel="noreferrer" target="_blank" href="https://allchainbridge.com">AllChainBridge Powered by SWFT</a>

        <p className='mt-20'>Number of HPB in your wallet: {this.state.balance} HPB</p>
        <p>Number of HPB you currently have staked: {this.state.stakedBalance} HPB</p>

        <br />
        <p className='mt-20'>HPB Staking</p>
               

        <form onSubmit={this.handleStake} className='mt-20'>
          <label>Number of HPB you wish to stake: </label><br />
          <div>
            <label className="ml-20">Amount: </label>
            <input
              type="number"
              min={0}
              value={this.state.stakeValue}
              onChange={event => this.setState({ stakeValue: event.target.value })}
            />
            <button className="ml-20">Stake</button>
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

        <form onSubmit={this.handleWithdraw} className='mt-20'>
          <label>Stake ID you wish to withdraw: </label><br />
          <div>
            <label className="ml-20">Stake Index: </label>
            <input
              type="number"
              min={0}
              value={this.state.stakeIndex}
              onChange={event => this.setState({ stakeIndex: event.target.value })}
            />
            <label className="ml-20">Amount: </label>
            <input
              type="number"
              min={0}
              value={this.state.withdrawValue}
              onChange={event => this.setState({ withdrawValue: event.target.value })}
            />
            <button className="ml-20">Withdraw</button>
          </div>
        </form>

        {/* <Form address={this.props.address} onSubmit={this.onSubmit2} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>amount of HPB:</label>
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
          <table className="mt-20">
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
        
        <p className='mt-20'>Use HPDex to trade HPB with other HRC20 tokens</p>
     
        
          <Iframe
            title="HPB"
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
