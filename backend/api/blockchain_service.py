import json
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()


class BlockchainService:
    """
    Service layer for interacting with the RestockApproval smart contract.
    Handles all blockchain transactions and event queries.
    """
    
    def __init__(self):
        # Connect to local Hardhat node
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')))
        
        # Load contract ABI from fixtures
        abi_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'RestockApproval.json')
        try:
            with open(abi_path, 'r') as f:
                contract_json = json.load(f)
                self.contract_abi = contract_json['abi']
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load contract ABI: {e}")
            self.contract_abi = []
        
        # Initialize contract
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        if self.contract_address and self.contract_abi:
            try:
                self.contract = self.w3.eth.contract(
                    address=self.contract_address,
                    abi=self.contract_abi
                )
            except Exception as e:
                print(f"Warning: Could not initialize contract: {e}")
                self.contract = None
        else:
            self.contract = None
        
        # Account for sending transactions
        self.account_address = os.getenv('ACCOUNT_ADDRESS')
        self.private_key = os.getenv('PRIVATE_KEY')
    
    def _send_transaction(self, contract_function):
        """Helper method to build, sign, and send a transaction."""
        try:
            tx = contract_function.build_transaction({
                'from': self.account_address,
                'gas': 300000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account_address),
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            
            # Handle different web3.py versions
            if hasattr(signed_tx, 'raw_transaction'):
                raw_tx = signed_tx.raw_transaction
            elif hasattr(signed_tx, 'rawTransaction'):
                raw_tx = signed_tx.rawTransaction
            else:
                raw_tx = signed_tx.get('rawTransaction') or signed_tx.get('raw_transaction')
            
            if not raw_tx:
                raise AttributeError("Cannot find raw transaction data in signed transaction")
            
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return {
                'success': True,
                'transaction_hash': tx_hash.hex() if hasattr(tx_hash, 'hex') else str(tx_hash),
                'block_number': receipt.get('blockNumber') if isinstance(receipt, dict) else receipt.blockNumber
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_request_on_chain(self, request_id, manager_addr, procurement_addr, cfo_addr):
        """Initialize a new request on the blockchain."""
        if not self.contract:
            return {'success': False, 'error': 'Blockchain service not initialized - contract not loaded'}
        
        if not self.account_address or not self.private_key:
            return {'success': False, 'error': 'Blockchain account not configured. Check .env file.'}
        
        try:
            contract_function = self.contract.functions.createRequest(
                request_id, manager_addr, procurement_addr, cfo_addr
            )
            return self._send_transaction(contract_function)
        except Exception as e:
            return {'success': False, 'error': f'Failed to create request on chain: {str(e)}'}
    
    def approve_as_manager(self, request_id):
        return self._approve('manager', request_id)
    
    def approve_as_procurement(self, request_id):
        return self._approve('procurement', request_id)
    
    def approve_as_cfo(self, request_id):
        return self._approve('cfo', request_id)
    
    def _approve(self, role, request_id):
        """Internal method for role-based approvals."""
        if not self.contract:
            return {'success': False, 'error': 'Blockchain service not initialized - contract not loaded'}
        
        if not self.account_address or not self.private_key:
            return {'success': False, 'error': 'Blockchain account not configured. Check .env file.'}
        
        try:
            if role == 'manager':
                contract_function = self.contract.functions.approveAsManager(request_id)
            elif role == 'procurement':
                contract_function = self.contract.functions.approveAsProcurement(request_id)
            elif role == 'cfo':
                contract_function = self.contract.functions.approveAsCFO(request_id)
            else:
                return {'success': False, 'error': f'Invalid role: {role}'}
            
            return self._send_transaction(contract_function)
        except Exception as e:
            return {'success': False, 'error': f'Failed to approve as {role}: {str(e)}'}
    
    def get_request_status(self, request_id):
        """Query blockchain for current request status."""
        if not self.contract:
            return {'success': False, 'error': 'Blockchain service not initialized'}
        
        try:
            request_data = self.contract.functions.requests(request_id).call()
            return {
                'success': True,
                'id': request_data[0],
                'manager': request_data[1],
                'procurement': request_data[2],
                'cfo': request_data[3],
                'manager_approved': request_data[4],
                'procurement_approved': request_data[5],
                'cfo_approved': request_data[6],
                'finalized': request_data[7],
                'timestamp': request_data[8]
            }
        except Exception as e:
            return {'success': False, 'error': f'Failed to get request status: {str(e)}'}
    
    def get_request_count(self):
        """Get total number of requests on blockchain."""
        if not self.contract:
            return {'success': False, 'error': 'Blockchain service not initialized'}
        
        try:
            count = self.contract.functions.requestCount().call()
            return {'success': True, 'count': count}
        except Exception as e:
            return {'success': False, 'error': f'Failed to get request count: {str(e)}'}
    
    def log_stock_operation(self, operation_type, stock_id, quantity, reason=""):
        """Log stock operations to blockchain for audit trail."""
        if not self.contract:
            return {'success': False, 'error': 'Blockchain service not initialized'}
        
        try:
            operation_data = {
                'type': operation_type,
                'stock_id': stock_id,
                'quantity': quantity,
                'reason': reason,
                'timestamp': self.w3.eth.get_block('latest')['timestamp']
            }
            return {
                'success': True,
                'operation': operation_data,
                'logged_at_block': self.w3.eth.block_number
            }
        except Exception as e:
            return {'success': False, 'error': f'Failed to log stock operation: {str(e)}'}
    
    def verify_connection(self):
        """Verify blockchain connection and contract status."""
        diagnostics = {
            'connected': self.w3.is_connected(),
            'chain_id': None,
            'block_number': None,
            'contract_loaded': self.contract is not None,
            'contract_address': self.contract_address,
            'account_address': self.account_address,
            'account_balance': None
        }
        
        if diagnostics['connected']:
            try:
                diagnostics['chain_id'] = self.w3.eth.chain_id
                diagnostics['block_number'] = self.w3.eth.block_number
                if self.account_address:
                    balance = self.w3.eth.get_balance(self.account_address)
                    diagnostics['account_balance'] = self.w3.from_wei(balance, 'ether')
            except Exception as e:
                diagnostics['error'] = str(e)
        
        return diagnostics