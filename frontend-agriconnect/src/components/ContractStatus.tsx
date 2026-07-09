import React from 'react'

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  signed: 'Signé',
  paid: 'Payé',
  delivered: 'Livré',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

function normalizeStatus(status?: string) {
  const value = String(status || 'pending').toLowerCase()
  if (['created', 'draft', 'awaiting', 'pending'].includes(value)) return 'pending'
  if (['signed', 'confirmed'].includes(value)) return 'signed'
  if (['paid', 'payment_received', 'payed'].includes(value)) return 'paid'
  if (['delivered', 'shipped'].includes(value)) return 'delivered'
  if (['completed', 'done', 'finished'].includes(value)) return 'completed'
  if (['cancelled', 'canceled', 'rejected'].includes(value)) return 'cancelled'
  return value || 'pending'
}

type Props = {
  status?: string
}

export default function ContractStatus({ status }: Props) {
  const normalized = normalizeStatus(status)
  const label = STATUS_LABELS[normalized] || 'En cours'
  const cssClass = `contract-status ${normalized}`

  return <span className={cssClass}>{label}</span>
}
