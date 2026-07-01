// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RestockApproval {
    struct Request {
        uint256 id;
        address manager;
        address procurement;
        address cfo;
        bool managerApproved;
        bool procurementApproved;
        bool cfoApproved;
        bool finalized;
        uint256 timestamp;
    }
    
    mapping(uint256 => Request) public requests;
    uint256 public requestCount;
    
    event RequestCreated(uint256 indexed requestId, address manager, address procurement, address cfo);
    event ManagerApproved(uint256 indexed requestId, address manager, uint256 timestamp);
    event ProcurementApproved(uint256 indexed requestId, address procurement, uint256 timestamp);
    event CFOApproved(uint256 indexed requestId, address cfo, uint256 timestamp);
    event RequestFinalized(uint256 indexed requestId, uint256 timestamp);
    
    function createRequest(
        uint256 _requestId,
        address _manager,
        address _procurement,
        address _cfo
    ) public {
        requests[_requestId] = Request({
            id: _requestId,
            manager: _manager,
            procurement: _procurement,
            cfo: _cfo,
            managerApproved: false,
            procurementApproved: false,
            cfoApproved: false,
            finalized: false,
            timestamp: block.timestamp
        });
        
        requestCount++;
        emit RequestCreated(_requestId, _manager, _procurement, _cfo);
    }
    
    function approveAsManager(uint256 _requestId) public {
        Request storage req = requests[_requestId];
        require(req.id != 0, "Request does not exist");
        require(!req.managerApproved, "Already approved by manager");
        require(msg.sender == req.manager, "Not authorized as manager");
        
        req.managerApproved = true;
        emit ManagerApproved(_requestId, msg.sender, block.timestamp);
    }
    
    function approveAsProcurement(uint256 _requestId) public {
        Request storage req = requests[_requestId];
        require(req.managerApproved, "Manager must approve first");
        require(!req.procurementApproved, "Already approved by procurement");
        require(msg.sender == req.procurement, "Not authorized as procurement");
        
        req.procurementApproved = true;
        emit ProcurementApproved(_requestId, msg.sender, block.timestamp);
    }
    
    function approveAsCFO(uint256 _requestId) public {
        Request storage req = requests[_requestId];
        require(req.procurementApproved, "Procurement must approve first");
        require(!req.cfoApproved, "Already approved by CFO");
        require(msg.sender == req.cfo, "Not authorized as CFO");
        
        req.cfoApproved = true;
        req.finalized = true;
        
        emit CFOApproved(_requestId, msg.sender, block.timestamp);
        emit RequestFinalized(_requestId, block.timestamp);
    }
}