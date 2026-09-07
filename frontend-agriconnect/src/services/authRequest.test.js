import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAuthRequestPayload, buildAuthVerifyPayload } from './authRequest'

test('buildAuthRequestPayload uses identifier/type contract for email login', () => {
  const payload = buildAuthRequestPayload({
    deliveryMethod: 'email',
    email: 'alice@example.com',
    role: 'acheteur-particulier',
    mode: 'login',
  })

  assert.deepEqual(payload, {
    identifier: 'alice@example.com',
    type: 'email',
    role: 'BUYER_PARTICULIER',
    mode: 'login',
  })
})

test('buildAuthVerifyPayload maps phone login to backend contact identifier', () => {
  const payload = buildAuthVerifyPayload({
    deliveryMethod: 'phone',
    phone: '+33 7 12 34 56 78',
    code: '123456',
    mode: 'login',
    role: 'acheteur-particulier',
    firstName: 'Jean',
    lastName: 'Dupont',
  })

  assert.deepEqual(payload, {
    identifier: '33712345678',
    type: 'contact',
    otp: '123456',
    code: '123456',
    mode: 'login',
    role: 'BUYER_PARTICULIER',
    fullName: 'Jean Dupont',
  })
})
