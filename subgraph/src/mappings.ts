import { Address, BigInt } from '@graphprotocol/graph-ts'
import {
  ProposalCreated,
  ProposalExecuted
} from '../generated/ProtocolGovernor/ProtocolGovernor'
import { AssetDeployed } from '../generated/RWAFactory/RWAFactory'
import { Deposit } from '../generated/RWAVault/RWAVault'
import { Proposal, Asset, User, Deposit as DepositEntity } from '../generated/schema'

function loadOrCreateUser(addressHex: string, timestamp: BigInt): User {
  let user = User.load(addressHex)
  if (user == null) {
    user = new User(addressHex)
    user.address = addressHex
    user.createdAt = timestamp
    user.save()
  }
  return user as User
}

export function handleAssetDeployed(event: AssetDeployed): void {
  let senderHex = event.transaction.from.toHexString()
  loadOrCreateUser(senderHex, event.block.timestamp)

  let assetId = event.params.assetAddress.toHexString()
  let asset = Asset.load(assetId)
  
  if (asset == null) {
    asset = new Asset(assetId)
  }

  asset.token = assetId
  asset.factory = event.address.toHexString()
  asset.createdAt = event.block.timestamp
  asset.method = BigInt.fromI32(event.params.method.toI32()).toI32()
  asset.save()
}

export function handleProposalCreated(event: ProposalCreated): void {
  let id = event.params.proposalId.toString()
  let proposal = new Proposal(id)

  proposal.proposalId = event.params.proposalId
  proposal.proposer = event.params.proposer.toHexString()
  proposal.description = event.params.description
  proposal.startBlock = event.params.startBlock
  proposal.endBlock = event.params.endBlock
  proposal.executed = false
  proposal.createdAt = event.block.timestamp
  proposal.governor = event.address.toHexString()

  let targetsHex: string[] = []
  for (let i = 0; i < event.params.targets.length; i++) {
    targetsHex.push(event.params.targets[i].toHexString())
  }
  proposal.targets = targetsHex
  proposal.values = event.params.values

  let calldatasHex: string[] = []
  for (let i = 0; i < event.params.calldatas.length; i++) {
    calldatasHex.push(event.params.calldatas[i].toHexString())
  }
  proposal.calldatas = calldatasHex

  proposal.save()
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let id = event.params.proposalId.toString()
  let proposal = Proposal.load(id)
  
  if (proposal != null) {
    proposal.executed = true
    proposal.save()
  }
}

export function handleVaultDeposit(event: Deposit): void {
  let depositId = event.transaction.hash.toHexString().concat('-').concat(event.logIndex.toString())
  let deposit = new DepositEntity(depositId)

  deposit.caller = event.params.caller.toHexString()
  deposit.owner = event.params.owner.toHexString()
  deposit.vault = event.address.toHexString()
  deposit.assets = event.params.assets
  deposit.shares = event.params.shares
  deposit.createdAt = event.block.timestamp
  deposit.transaction = event.transaction.hash.toHexString()

  deposit.save()
}