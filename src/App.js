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
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Earn 87.6% interest per year, staking with the DON!</p>
          DON Token Address
          <br />
          <a rel="noreferrer" target="_blank" href="https://hpbscan.org/HRC20/0xef8432fD5D8b6B33a9915cD6Ad22fe9B6718Db9B">0xef8432fD5D8b6B33a9915cD6Ad22fe9B6718Db9B</a>

        <p className='mt-20'>Number of DON tokens in your wallet: {this.state.balance} DON</p>
        <p>Number of DON tokens you have staked: {this.state.stakedBalance} DON</p>

        <p className='mt-20'>Call the DON!</p>
        <img src={call} className="" alt="call" width={280} />
        <p className="desc">Warning: this function means Double Or Nothing!
        <br />  The function will call a random number from the HPB HRNG. 
        <br />  You will either double the DON tokens in your wallet, or you will lose all of them! 
        <br /> Only a true DON will be brave enough to call this function!</p>
        <button onClick={this.handleCall} className="call-btn">Call the don</button>
        <br />
        <p className='mt-20'>DON Token Staking</p>
        <p>Earn 0.01% interest for every hour staked (0.24% interest per day | 1.68% interest per week | 87.6% per year)</p>
               

        <form onSubmit={this.handleStake} className='mt-20'>
          <label>Number of DON Tokens you wish to stake: </label><br />
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
        <p>You can withdraw whenever you like, but withdrawals from each subsequent stake index incur a 1% incremental withdrawl fee. 
        You can only ever deposit once per stake index, however you can withdraw from each stake index in full or in part</p>

        <form onSubmit={this.handleWithdraw} className='mt-20'>
          <label>Number of DON Tokens you wish to withdraw (excluding stake interest which will be added automatically): </label><br />
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
                  <td>{`${row[1] / (10 ** 18)} DON`}</td>
                  <td>{new Date(row[2] * 1000).toLocaleString()}</td>
                  <td>{`${row[3] / (10 ** 19)} DON`}</td>
                </tr>
              )
            ))}
          </table>
        </div>
        <br />
        <div>
        
        <p className='mt-20'>Use HPDex to swap DON tokens</p>
        <p>Please ensure that you use only the offical DON token address:</p>
        <p>0xef8432fD5D8b6B33a9915cD6Ad22fe9B6718Db9B</p>
        
        
          <Iframe
            title="DON"
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
