// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HandoffEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint64 public constant MAX_AMOUNT = 50_000_000; // 50 USDT, six decimals
    uint64 public constant MIN_DURATION = 5 minutes;
    uint64 public constant MAX_DURATION = 30 days;
    uint64 public constant MIN_FUNDING_WINDOW = 5 minutes;

    uint8 public constant STATUS_OPEN = 0;
    uint8 public constant STATUS_FUNDED = 1;
    uint8 public constant STATUS_COMPLETED = 2;
    uint8 public constant STATUS_REFUNDED = 3;
    uint8 public constant STATUS_CANCELLED = 4;

    uint8 public constant RESOLUTION_NONE = 0;
    uint8 public constant RESOLUTION_BUYER_CONFIRMED = 1;
    uint8 public constant RESOLUTION_SELLER_CLAIMED = 2;
    uint8 public constant RESOLUTION_SELLER_REFUNDED = 3;
    uint8 public constant RESOLUTION_EXPIRED_REFUND = 4;

    struct Deal {
        uint256 id;
        bytes32 dealRef;
        address seller;
        address intendedBuyer;
        address buyer;
        bytes32 termsHash;
        bytes32 releaseCommitment;
        uint64 amount;
        uint64 createdAt;
        uint64 expiresAt;
        uint64 fundedAt;
        uint64 resolvedAt;
        uint8 status;
        uint8 resolution;
    }

    struct ActorActivity {
        uint256 dealsCreated;
        uint256 dealsFunded;
        uint256 completedAsSeller;
        uint256 completedAsBuyer;
        uint256 refundedAsBuyer;
        uint256 refundsIssuedAsSeller;
    }

    error InvalidToken();
    error InvalidDealReference();
    error DuplicateDealReference();
    error InvalidTermsHash();
    error InvalidAmount();
    error InvalidExpiry();
    error InvalidBuyer();
    error DealNotFound();
    error InvalidStatus();
    error Unauthorized();
    error FundingWindowClosed();
    error InvalidCommitment();
    error InvalidSecret();
    error DealExpired();
    error DealNotExpired();
    error UnsupportedTokenBehavior();
    error IndexOutOfBounds();

    event DealCreated(
        uint256 indexed dealId,
        bytes32 indexed dealRef,
        address indexed seller,
        address intendedBuyer,
        uint64 amount,
        uint64 expiresAt,
        bytes32 termsHash
    );
    event DealFunded(uint256 indexed dealId, address indexed buyer, bytes32 releaseCommitment, uint64 fundedAt);
    event DealCompleted(uint256 indexed dealId, address indexed seller, address indexed buyer, uint8 resolution, uint64 resolvedAt);
    event DealRefunded(uint256 indexed dealId, address indexed buyer, uint8 resolution, uint64 resolvedAt);
    event DealCancelled(uint256 indexed dealId, address indexed seller, uint64 resolvedAt);

    IERC20 public immutable usdt;
    uint256 public totalDeals;
    uint256 public totalLiability;

    mapping(uint256 => Deal) private deals;
    mapping(bytes32 => uint256) private dealIdsByRef;
    mapping(address => ActorActivity) private activity;
    mapping(address => uint256[]) private createdDealIds;
    mapping(address => uint256[]) private fundedDealIds;

    constructor(address usdtAddress) {
        if (usdtAddress == address(0) || usdtAddress.code.length == 0) revert InvalidToken();
        usdt = IERC20(usdtAddress);
    }

    function createDeal(
        bytes32 dealRef,
        bytes32 termsHash,
        uint64 amount,
        uint64 expiresAt,
        address intendedBuyer
    ) external returns (uint256 dealId) {
        if (dealRef == bytes32(0)) revert InvalidDealReference();
        if (dealIdsByRef[dealRef] != 0) revert DuplicateDealReference();
        if (termsHash == bytes32(0)) revert InvalidTermsHash();
        if (amount == 0 || amount > MAX_AMOUNT) revert InvalidAmount();
        if (expiresAt < block.timestamp + MIN_DURATION || expiresAt > block.timestamp + MAX_DURATION) revert InvalidExpiry();
        if (intendedBuyer == msg.sender) revert InvalidBuyer();

        dealId = ++totalDeals;
        uint64 createdAt = uint64(block.timestamp);
        deals[dealId] = Deal({
            id: dealId,
            dealRef: dealRef,
            seller: msg.sender,
            intendedBuyer: intendedBuyer,
            buyer: address(0),
            termsHash: termsHash,
            releaseCommitment: bytes32(0),
            amount: amount,
            createdAt: createdAt,
            expiresAt: expiresAt,
            fundedAt: 0,
            resolvedAt: 0,
            status: STATUS_OPEN,
            resolution: RESOLUTION_NONE
        });
        dealIdsByRef[dealRef] = dealId;
        createdDealIds[msg.sender].push(dealId);
        activity[msg.sender].dealsCreated += 1;
        emit DealCreated(dealId, dealRef, msg.sender, intendedBuyer, amount, expiresAt, termsHash);
    }

    function fundDeal(uint256 dealId, bytes32 releaseCommitment) external nonReentrant {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_OPEN) revert InvalidStatus();
        if (msg.sender == deal.seller) revert InvalidBuyer();
        if (deal.intendedBuyer != address(0) && msg.sender != deal.intendedBuyer) revert Unauthorized();
        if (block.timestamp + MIN_FUNDING_WINDOW > deal.expiresAt) revert FundingWindowClosed();
        if (releaseCommitment == bytes32(0)) revert InvalidCommitment();

        uint256 balanceBefore = usdt.balanceOf(address(this));
        deal.buyer = msg.sender;
        deal.releaseCommitment = releaseCommitment;
        deal.fundedAt = uint64(block.timestamp);
        deal.status = STATUS_FUNDED;
        totalLiability += deal.amount;
        fundedDealIds[msg.sender].push(dealId);
        activity[msg.sender].dealsFunded += 1;
        usdt.safeTransferFrom(msg.sender, address(this), deal.amount);
        if (usdt.balanceOf(address(this)) != balanceBefore + deal.amount) revert UnsupportedTokenBehavior();
        _assertSolvent();
        emit DealFunded(dealId, msg.sender, releaseCommitment, deal.fundedAt);
    }

    function confirmHandoff(uint256 dealId) external nonReentrant {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_FUNDED) revert InvalidStatus();
        if (msg.sender != deal.buyer) revert Unauthorized();
        if (block.timestamp >= deal.expiresAt) revert DealExpired();
        _complete(deal, RESOLUTION_BUYER_CONFIRMED);
    }

    function claimHandoff(uint256 dealId, bytes32 releaseSecret) external nonReentrant {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_FUNDED) revert InvalidStatus();
        if (msg.sender != deal.seller) revert Unauthorized();
        if (block.timestamp >= deal.expiresAt) revert DealExpired();
        if (sha256(abi.encodePacked(releaseSecret)) != deal.releaseCommitment) revert InvalidSecret();
        _complete(deal, RESOLUTION_SELLER_CLAIMED);
    }

    function refundDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_FUNDED) revert InvalidStatus();
        if (msg.sender != deal.seller) revert Unauthorized();
        _refund(deal, RESOLUTION_SELLER_REFUNDED);
    }

    function refundExpired(uint256 dealId) external nonReentrant {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_FUNDED) revert InvalidStatus();
        if (block.timestamp < deal.expiresAt) revert DealNotExpired();
        _refund(deal, RESOLUTION_EXPIRED_REFUND);
    }

    function cancelDeal(uint256 dealId) external {
        Deal storage deal = _deal(dealId);
        if (deal.status != STATUS_OPEN) revert InvalidStatus();
        if (msg.sender != deal.seller) revert Unauthorized();
        deal.status = STATUS_CANCELLED;
        deal.resolvedAt = uint64(block.timestamp);
        emit DealCancelled(dealId, msg.sender, deal.resolvedAt);
    }

    function getDeal(uint256 dealId) external view returns (Deal memory) { return _dealView(dealId); }
    function getDealIdByRef(bytes32 dealRef) external view returns (uint256) { return dealIdsByRef[dealRef]; }
    function getActorActivity(address actor) external view returns (ActorActivity memory) { return activity[actor]; }
    function getCreatedCount(address actor) external view returns (uint256) { return createdDealIds[actor].length; }
    function getFundedCount(address actor) external view returns (uint256) { return fundedDealIds[actor].length; }
    function getCreatedId(address actor, uint256 index) external view returns (uint256) {
        if (index >= createdDealIds[actor].length) revert IndexOutOfBounds();
        return createdDealIds[actor][index];
    }
    function getFundedId(address actor, uint256 index) external view returns (uint256) {
        if (index >= fundedDealIds[actor].length) revert IndexOutOfBounds();
        return fundedDealIds[actor][index];
    }

    function _complete(Deal storage deal, uint8 resolution) private {
        deal.status = STATUS_COMPLETED;
        deal.resolution = resolution;
        deal.resolvedAt = uint64(block.timestamp);
        totalLiability -= deal.amount;
        activity[deal.seller].completedAsSeller += 1;
        activity[deal.buyer].completedAsBuyer += 1;
        _payExact(deal.seller, deal.amount);
        emit DealCompleted(deal.id, deal.seller, deal.buyer, resolution, deal.resolvedAt);
    }

    function _refund(Deal storage deal, uint8 resolution) private {
        deal.status = STATUS_REFUNDED;
        deal.resolution = resolution;
        deal.resolvedAt = uint64(block.timestamp);
        totalLiability -= deal.amount;
        activity[deal.buyer].refundedAsBuyer += 1;
        activity[deal.seller].refundsIssuedAsSeller += 1;
        _payExact(deal.buyer, deal.amount);
        emit DealRefunded(deal.id, deal.buyer, resolution, deal.resolvedAt);
    }

    function _payExact(address recipient, uint256 amount) private {
        uint256 recipientBefore = usdt.balanceOf(recipient);
        usdt.safeTransfer(recipient, amount);
        if (usdt.balanceOf(recipient) != recipientBefore + amount) revert UnsupportedTokenBehavior();
        _assertSolvent();
    }

    function _assertSolvent() private view {
        if (usdt.balanceOf(address(this)) < totalLiability) revert UnsupportedTokenBehavior();
    }

    function _deal(uint256 dealId) private view returns (Deal storage deal) {
        deal = deals[dealId];
        if (deal.id == 0) revert DealNotFound();
    }

    function _dealView(uint256 dealId) private view returns (Deal memory deal) {
        deal = deals[dealId];
        if (deal.id == 0) revert DealNotFound();
    }
}
