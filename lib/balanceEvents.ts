// lib/balanceEvents.ts - Système d'événements pour mise à jour de balance en temps réel

// Événement custom pour notifier les changements de balance
export const BALANCE_UPDATE_EVENT = 'reveelbox:balance-update'
export const INVENTORY_UPDATE_EVENT = 'reveelbox:inventory-update'

// Dispatcher un événement de mise à jour de balance
export function dispatchBalanceUpdate() {
  if (typeof window !== 'undefined') {
    console.log('🔔 Dispatching balance update event')
    window.dispatchEvent(new CustomEvent(BALANCE_UPDATE_EVENT))
  }
}

// Dispatcher un événement de mise à jour d'inventaire
export function dispatchInventoryUpdate() {
  if (typeof window !== 'undefined') {
    console.log('🔔 Dispatching inventory update event')
    window.dispatchEvent(new CustomEvent(INVENTORY_UPDATE_EVENT))
  }
}

// Dispatcher les deux événements (pratique après une vente)
export function dispatchBalanceAndInventoryUpdate() {
  dispatchBalanceUpdate()
  dispatchInventoryUpdate()
}
