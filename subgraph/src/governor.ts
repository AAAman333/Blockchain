import { ProposalCreated, ProposalExecuted } from '../generated/ProtocolGovernor/ProtocolGovernor'
import { Proposal } from '../generated/schema'

export function handleProposalCreated(event: ProposalCreated): void {
  let id = event.params.proposalId.toString()
  let proposal = Proposal.load(id)
  if (proposal != null) {
    return
  }

  proposal = new Proposal(id)
  proposal.proposalId = event.params.proposalId
  proposal.proposer = event.params.proposer.toHexString()
  proposal.description = event.params.description
  proposal.voteStart = event.params.voteStart
  proposal.voteEnd = event.params.voteEnd
  proposal.createdAt = event.block.timestamp
  proposal.executed = false
  proposal.save()
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let id = event.params.proposalId.toString()
  let proposal = Proposal.load(id)
  if (proposal == null) {
    proposal = new Proposal(id)
    proposal.proposalId = event.params.proposalId
    proposal.proposer = ''
    proposal.description = ''
    proposal.voteStart = event.block.number
    proposal.voteEnd = event.block.number
    proposal.createdAt = event.block.timestamp
  }
  proposal.executed = true
  proposal.save()
}
