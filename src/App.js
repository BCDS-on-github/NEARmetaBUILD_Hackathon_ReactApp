import * as React from 'react';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InfoIcon from '@mui/icons-material/Info';
import LoadingButton from '@mui/lab/LoadingButton';

import BatchOperationsTable from './components/batchOperationsTable.js';
import MasterTable from './components/allUnitsTable.js';

import * as nearAPI from "near-api-js";

//
// React Stuff
//
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

//
// NEAR Stuff
//


function createData(
  unique_id,
  blood_type,
  donation_date,
  testing_complete_date,
  inventoried_date,
  shipped_date,
  transfused_date,
  disposal_date
) {
  return {
    unique_id,
    blood_type,
    donation_date,
    testing_complete_date,
    inventoried_date,
    shipped_date,
    transfused_date,
    disposal_date,
  };
}

function not(a, b) {
  return a.filter((row_data) => b.indexOf(row_data) === -1);
}

const config = {
  networkId: "testnet",
  keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

const smart_contract_account_id = "nft-fsm-contract.eski.testnet";


export default function App() {
  const [wallet, setWallet] = React.useState([]);
  const [contract, setContract] = React.useState([]);
  const [chipLabel, setChipLabel] = React.useState('');
  const [chipColor, setChipColor] = React.useState('default');
  const [walletConnected, setWalletConnected] = React.useState(false);

  const [newNFTDialogOpen, setNewNFTDialogOpen] = React.useState(false);
  const [bloodType, setBloodType] = React.useState('');

  const [masterTableRowsArray, setMasterTableRowsArray] = React.useState([]);
  const [batchOperationsRowsArray, setBatchOperationsRowsArray] = React.useState([]);

  const [awaitingTransitionCompletion, setAwaitingTransitionCompletion] = React.useState(false);
  const [awaitingMintCompletion, setAwaitingMintCompletion] = React.useState(false);

  React.useEffect(
    () => {
      initialize();
    },
    []
  );

  React.useEffect(
    () => {
      try {
        if (wallet.isSignedIn()) {
          setChipLabel(wallet.getAccountId());
          setChipColor('success');
          setContract(
            new nearAPI.Contract(
              wallet.account(),
              smart_contract_account_id,
              {
                viewMethods: ["nft_tokens_for_owner", "nft_total_supply"],
                changeMethods: ["nft_mint", "nft_transition_finite_state"],
                sender: wallet.account(),
              }
            )
          )
        }
      } catch (error) {
        setChipLabel('Connect a NEAR Wallet');
        setChipColor('warning')
      }
    },
    [
      wallet,
    ]
  );

  React.useEffect(
    () => {
      loadNFTs();
    },
    [
      contract,
    ]
  );

  const handleOpenNewNFTDialog = () => {
    setBloodType('');
    setNewNFTDialogOpen(true);
  };

  const handleCloseNewNFTDialog = () => {
    setNewNFTDialogOpen(false);
  };

  const handleChangeBloodType = (event) => {
    setBloodType(event.target.value);
  };

  const handleClickMintNewNFTButton = () => {
    setNewNFTDialogOpen(false);
    handleMintNewNFT();
  }

  const handleTransferSelectedRowsFromMasterTableToBatchOperationsTable = (array_of_selected_rows) => {
    setBatchOperationsRowsArray(batchOperationsRowsArray.concat(array_of_selected_rows));
    setMasterTableRowsArray(not(masterTableRowsArray, array_of_selected_rows));
  }

  const handleTransferSelectedRowsFromBatchOperationsTableToMasterTable = (array_of_selected_rows) => {
    setMasterTableRowsArray(masterTableRowsArray.concat(array_of_selected_rows));
    setBatchOperationsRowsArray(not(batchOperationsRowsArray, array_of_selected_rows));
  }

  async function initialize() {
    const near = await nearAPI.connect(config);
    setWallet(new nearAPI.WalletConnection(near));
  }

  async function loadNFTs() {
    try {
      const tokens = await contract.nft_tokens_for_owner({account_id: chipLabel});
      var transient_index = 0;
      var transient_array = [];
      while (transient_index < tokens.length) {
        transient_array = transient_array.concat(
          [
            createData(
              tokens[transient_index].token_id,
              tokens[transient_index].finite_state.blood_type,
              tokens[transient_index].finite_state.donation_date,
              tokens[transient_index].finite_state.testing_complete_date,
              tokens[transient_index].finite_state.inventoried_date,
              tokens[transient_index].finite_state.shipped_date,
              tokens[transient_index].finite_state.transfused_date,
              tokens[transient_index].finite_state.disposal_date,
            )
          ]
        );
        transient_index += 1;
      }
      setMasterTableRowsArray(transient_array);
      setBatchOperationsRowsArray([]);
      setWalletConnected(true);
    } catch {
      // do nothing
    }
  }

  async function handleMintNewNFT() {
    setAwaitingMintCompletion(true)
    const transient_token_count = await contract.nft_total_supply()
    const transient_token_id = 'nft-fsm-' + transient_token_count
    await contract.nft_mint(
      {
        token_id: transient_token_id,
        metadata: {
          title: 'Blood Donation',
          description: 'simulated blood donation',
          media: 'https://ipfs.io/ipfs/QmYYE1T7C5tGiAT8YEPsL2w2zT6s9Eo862oQZwi2W3MRM3',
        },
        receiver_id: wallet.getAccountId(),
        finite_state: {
          blood_type: String(bloodType),
          donation_date: new Date().toUTCString(),
          testing_complete_date: "_",
          inventoried_date: "_",
          shipped_date: "_",
          transfused_date: "_",
          disposal_date: "_",
        }
      }
    );
    loadNFTs();
    setAwaitingMintCompletion(false)
  }

  async function handleTransitionNext () {
    setBatchOperationsRowsArray([]);
    setAwaitingTransitionCompletion(true);
    var transient_index = 0
    while ( transient_index < batchOperationsRowsArray.length ) {
      await contract.nft_transition_finite_state(
        {
          token_id: batchOperationsRowsArray[transient_index].unique_id,
          transition: "next",
          datetime: new Date().toUTCString()
        }
      );
      transient_index += 1
    }
    loadNFTs();
    setAwaitingTransitionCompletion(false);
  }

  const handleLogin = () => {
    wallet.requestSignIn(
      smart_contract_account_id,
      "Blood Bank NFT Manager"
    );
  };

  const handleLogout = () => {
    setMasterTableRowsArray([]);
    setBatchOperationsRowsArray([]);
    setChipLabel('Connect a NEAR Wallet');
    setChipColor('warning')
    wallet.signOut();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Blood Bank > Supply Chain > NFT Manager
            </Typography>
            <Tooltip
              arrow
              title={
                <React.Fragment>
                  <Typography variant='h6'>
                    Connect/Disconnect Wallet
                  </Typography>
                  <br/>
                  <Typography variant='body1'>
                    Click the "Connect a NEAR Wallet" button (to the right of this info bubble) to connect your testnet wallet.
                  </Typography>
                  <br/>
                  <Typography variant='body1'>
                    In this demo, the smart contract you will be connecting to covers all gas and storage fees.
                  </Typography>
                </React.Fragment>
              }
            >
              <InfoIcon color='info'/>
            </Tooltip>
            <Chip label={chipLabel} color={chipColor} onClick={handleLogin} onDelete={handleLogout}/>
          </Toolbar>
        </AppBar>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Item>
              <MasterTable passedRowDataArray={masterTableRowsArray} handleTransfer={handleTransferSelectedRowsFromMasterTableToBatchOperationsTable}/>
              <Grid container spacing={0} justifyContent='flex-end'>
                <LoadingButton
                  loading={awaitingMintCompletion}
                  disabled={!walletConnected}
                  onClick={handleOpenNewNFTDialog}
                >
                  Mint New Blood Donation NFT
                </LoadingButton>
              </Grid>
            </Item>
          </Grid>
          <Grid item xs={12}>
            <Item>
              <BatchOperationsTable passedRowDataArray={batchOperationsRowsArray} handleTransfer={handleTransferSelectedRowsFromBatchOperationsTableToMasterTable}/>
              <Grid container spacing={0} justifyContent='flex-end'>
                <LoadingButton
                  loading={awaitingTransitionCompletion}
                  disabled={!walletConnected}
                  onClick={handleTransitionNext}>
                    Transition: Next State
                  </LoadingButton>
              </Grid>
            </Item>
          </Grid>
        </Grid>
      </Box>
      <Dialog open={newNFTDialogOpen} onClose={handleCloseNewNFTDialog}>
        <DialogTitle>Mint New Blood Donation NFT</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a blood type to mint a new donation NFT.  The transaction will use the NEAR tokens in your linked wallet.  The minted NFT will be transferred to your linked wallet.
          </DialogContentText>
          <Box sx={{ minWidth: 120 }} mt={4}>
            <FormControl fullWidth>
              <InputLabel id="select-blood-type-label">Blood Type</InputLabel>
              <Select
                labelId="select-blood-type-label"
                id="select-blood-type"
                value={bloodType}
                label="Blood Type"
                onChange={handleChangeBloodType}
              >
                <MenuItem value={"A+"}>A+</MenuItem>
                <MenuItem value={"A-"}>A-</MenuItem>
                <MenuItem value={"B+"}>B+</MenuItem>
                <MenuItem value={"B-"}>B-</MenuItem>
                <MenuItem value={"AB+"}>AB+</MenuItem>
                <MenuItem value={"AB-"}>AB-</MenuItem>
                <MenuItem value={"O+"}>O+</MenuItem>
                <MenuItem value={"O-"}>O-</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewNFTDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleClickMintNewNFTButton} disabled={bloodType === ''}>Mint</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
