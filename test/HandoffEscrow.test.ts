import { expect } from "chai";
import { network } from "hardhat";
import type { BaseContract, ContractRunner, ContractTransactionResponse } from "ethers";

type Escrow = BaseContract & {
  createDeal(ref: string, terms: string, amount: number, expiry: number, intendedBuyer: string): Promise<ContractTransactionResponse>;
  fundDeal(id: number, commitment: string): Promise<ContractTransactionResponse>;
  confirmHandoff(id: number): Promise<ContractTransactionResponse>;
  claimHandoff(id: number, secret: string): Promise<ContractTransactionResponse>;
  refundDeal(id: number): Promise<ContractTransactionResponse>;
  refundExpired(id: number): Promise<ContractTransactionResponse>;
  cancelDeal(id: number): Promise<ContractTransactionResponse>;
  getDeal(id: number): Promise<{ seller: string; intendedBuyer: string; buyer: string; amount: bigint; expiresAt: bigint; status: bigint; resolution: bigint; dealRef: string }>;
  getDealIdByRef(ref: string): Promise<bigint>;
  getActorActivity(owner: string): Promise<{ dealsCreated: bigint; dealsFunded: bigint; completedAsSeller: bigint; completedAsBuyer: bigint; refundedAsBuyer: bigint; refundsIssuedAsSeller: bigint }>;
  getCreatedCount(owner: string): Promise<bigint>;
  getFundedCount(owner: string): Promise<bigint>;
  getCreatedId(owner: string, index: number): Promise<bigint>;
  getFundedId(owner: string, index: number): Promise<bigint>;
  totalLiability(): Promise<bigint>;
};

type Token = BaseContract & {
  mint(owner: string, amount: number): Promise<ContractTransactionResponse>;
  approve(spender: string, amount: number): Promise<ContractTransactionResponse>;
  balanceOf(owner: string): Promise<bigint>;
};

const connected = <T extends BaseContract>(contract: T, runner: ContractRunner) => contract.connect(runner) as T;
const ref = (value: number) => `0x${value.toString(16).padStart(64, "0")}`;
const secret = ref(777);

describe("HandoffEscrow", function () {
  let ethers: Awaited<ReturnType<typeof network.create>>["ethers"];
  before(async () => { ({ ethers } = await network.create()); });

  async function fixture() {
    const signers = await ethers.getSigners();
    const token = await (await ethers.getContractFactory("MockUSDT")).deploy() as unknown as Token;
    await token.waitForDeployment();
    const escrow = await (await ethers.getContractFactory("HandoffEscrow")).deploy(await token.getAddress()) as unknown as Escrow;
    await escrow.waitForDeployment();
    await token.mint(signers[1].address, 100_000_000);
    await connected(token, signers[1]).approve(await escrow.getAddress(), 100_000_000);
    return { escrow, token, signers };
  }

  async function expiry(offset = 3600) {
    const block = await ethers.provider.getBlock("latest");
    return Number(block!.timestamp) + offset;
  }

  async function create(escrow: Escrow, seller: ContractRunner, options: { id?: number; amount?: number; intended?: string; offset?: number } = {}) {
    const id = options.id ?? 1;
    await connected(escrow, seller).createDeal(ref(id), ref(100 + id), options.amount ?? 5_000_000, await expiry(options.offset), options.intended ?? ethers.ZeroAddress);
  }

  async function move(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  it("creates open and address-bound deals and indexes them by reference", async () => {
    const { escrow, signers } = await fixture();
    await expect(connected(escrow, signers[0]).createDeal(ref(1), ref(101), 1_000_000, await expiry(), signers[1].address))
      .to.emit(escrow, "DealCreated");
    const deal = await escrow.getDeal(1);
    expect(deal.seller).to.equal(signers[0].address);
    expect(deal.intendedBuyer).to.equal(signers[1].address);
    expect(deal.status).to.equal(0);
    expect(await escrow.getDealIdByRef(ref(1))).to.equal(1);
    expect(await escrow.getCreatedId(signers[0].address, 0)).to.equal(1);
  });

  it("rejects duplicate references, invalid amounts, expiries and self-targeting", async () => {
    const { escrow, signers } = await fixture();
    await create(escrow, signers[0]);
    await expect(connected(escrow, signers[0]).createDeal(ref(1), ref(102), 1, await expiry(), ethers.ZeroAddress)).to.be.revertedWithCustomError(escrow, "DuplicateDealReference");
    await expect(connected(escrow, signers[0]).createDeal(ref(2), ref(102), 0, await expiry(), ethers.ZeroAddress)).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    await expect(connected(escrow, signers[0]).createDeal(ref(2), ref(102), 50_000_001, await expiry(), ethers.ZeroAddress)).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    await expect(connected(escrow, signers[0]).createDeal(ref(2), ref(102), 1, await expiry(60), ethers.ZeroAddress)).to.be.revertedWithCustomError(escrow, "InvalidExpiry");
    await expect(connected(escrow, signers[0]).createDeal(ref(2), ref(102), 1, await expiry(), signers[0].address)).to.be.revertedWithCustomError(escrow, "InvalidBuyer");
  });

  it("funds with the intended buyer, exact principal and neutral activity", async () => {
    const { escrow, token, signers } = await fixture();
    await create(escrow, signers[0], { intended: signers[1].address });
    const commitment = ethers.sha256(secret);
    await expect(connected(escrow, signers[2]).fundDeal(1, commitment)).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await expect(connected(escrow, signers[0]).fundDeal(1, commitment)).to.be.revertedWithCustomError(escrow, "InvalidBuyer");
    await expect(connected(escrow, signers[1]).fundDeal(1, commitment)).to.emit(escrow, "DealFunded");
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(5_000_000);
    expect(await escrow.totalLiability()).to.equal(5_000_000);
    expect(await escrow.getFundedId(signers[1].address, 0)).to.equal(1);
    expect((await escrow.getActorActivity(signers[1].address)).dealsFunded).to.equal(1);
  });

  it("rejects funding when less than five minutes remain", async () => {
    const { escrow, signers } = await fixture();
    await create(escrow, signers[0], { offset: 301 });
    await move(2);
    await expect(connected(escrow, signers[1]).fundDeal(1, ethers.sha256(secret))).to.be.revertedWithCustomError(escrow, "FundingWindowClosed");
  });

  it("lets the buyer confirm and transfers principal once", async () => {
    const { escrow, token, signers } = await fixture();
    await create(escrow, signers[0]);
    await connected(escrow, signers[1]).fundDeal(1, ethers.sha256(secret));
    await expect(connected(escrow, signers[1]).confirmHandoff(1)).to.emit(escrow, "DealCompleted");
    expect(await token.balanceOf(signers[0].address)).to.equal(5_000_000);
    expect(await escrow.totalLiability()).to.equal(0);
    await expect(connected(escrow, signers[1]).confirmHandoff(1)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
  });

  it("lets only the seller claim with the buyer secret", async () => {
    const { escrow, token, signers } = await fixture();
    await create(escrow, signers[0]);
    await connected(escrow, signers[1]).fundDeal(1, ethers.sha256(secret));
    await expect(connected(escrow, signers[2]).claimHandoff(1, secret)).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await expect(connected(escrow, signers[0]).claimHandoff(1, ref(778))).to.be.revertedWithCustomError(escrow, "InvalidSecret");
    await connected(escrow, signers[0]).claimHandoff(1, secret);
    expect(await token.balanceOf(signers[0].address)).to.equal(5_000_000);
    expect((await escrow.getDeal(1)).resolution).to.equal(2);
  });

  it("allows seller refund and permissionless refund exactly at expiry", async () => {
    const { escrow, token, signers } = await fixture();
    await create(escrow, signers[0], { id: 1 });
    await connected(escrow, signers[1]).fundDeal(1, ethers.sha256(secret));
    await connected(escrow, signers[0]).refundDeal(1);
    expect(await token.balanceOf(signers[1].address)).to.equal(100_000_000);
    expect((await escrow.getDeal(1)).resolution).to.equal(3);

    await create(escrow, signers[0], { id: 2, offset: 600 });
    await connected(escrow, signers[1]).fundDeal(2, ethers.sha256(ref(2)));
    await expect(connected(escrow, signers[2]).refundExpired(2)).to.be.revertedWithCustomError(escrow, "DealNotExpired");
    const deal = await escrow.getDeal(2);
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(deal.expiresAt)]);
    await connected(escrow, signers[2]).refundExpired(2);
    expect((await escrow.getDeal(2)).resolution).to.equal(4);
    expect(await escrow.totalLiability()).to.equal(0);
  });

  it("cancels only open deals and guards missing indexes", async () => {
    const { escrow, signers } = await fixture();
    await create(escrow, signers[0]);
    await expect(connected(escrow, signers[1]).cancelDeal(1)).to.be.revertedWithCustomError(escrow, "Unauthorized");
    await connected(escrow, signers[0]).cancelDeal(1);
    expect((await escrow.getDeal(1)).status).to.equal(4);
    await expect(escrow.getFundedId(signers[1].address, 0)).to.be.revertedWithCustomError(escrow, "IndexOutOfBounds");
    await expect(escrow.getDeal(99)).to.be.revertedWithCustomError(escrow, "DealNotFound");
  });
});
