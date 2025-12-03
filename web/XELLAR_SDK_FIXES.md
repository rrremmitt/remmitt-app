# Xellar SDK Implementation Fixes

## Summary
Fixed critical implementation errors in `xellar-service.ts` to align with the official Xellar SDK v4.8.0 API.

## Changes Implemented

### 1. ✅ Authentication Response Handling

**Issue**: Incorrect token extraction from auth responses  
**Fix**: Added conditional logic based on `isWalletCreated` flag

#### New Type Definitions
```typescript
interface XellarAuthResponseWalletCreated {
  walletToken: string
  refreshToken: string
  address: string
  isWalletCreated: true
}

interface XellarAuthResponseNotCreated {
  accessToken: string
  isWalletCreated: false
}

type XellarSDKAuthResponse = XellarAuthResponseWalletCreated | XellarAuthResponseNotCreated
```

#### Updated Methods
- **`verifyOTP()`**: Now checks `isWalletCreated` and uses `walletToken` when wallet exists, `accessToken` when new
- **`loginWithGoogle()`**: Same conditional logic applied
- Removed debug `console.log` statements

### 2. ✅ Token Refresh Implementation

**Issue**: Method threw error instead of calling SDK  
**Fix**: Implemented actual `wallet.refreshToken()` call

```typescript
async refreshAccessToken(refreshToken: string) {
  const response = await this.client.wallet.refreshToken(refreshToken)
  this.sessionToken = response.walletToken
  this.refreshToken = response.refreshToken
  return { token: response.walletToken, expiresIn: 3600 }
}
```

### 3. ✅ Recipient Management Namespace

**Issue**: Used `client.rampable.*` instead of correct namespace  
**Fix**: Changed to `client.rampableRecipients.*` (note: plural)

- `createReceiver()` → `rampableRecipients.createRecipient()`
- `updateReceiver()` → `rampableRecipients.updateRecipient()`
- `deleteReceiver()` → `rampableRecipients.deleteRecipient()`

### 4. ✅ Rampable Access Token Management

**Issue**: Missing separate token for recipient/offramp operations  
**Fix**: Added private field and management methods

```typescript
private rampableAccessToken: string | null = null

setRampableAccessToken(token: string) { ... }
getRampableAccessToken(): string | null { ... }
```

All recipient and offramp operations now require and use `rampableAccessToken`.

### 5. ✅ SDK Method Name Corrections

**Issue**: Incorrect capitalization in SDK namespaces  
**Fixes**:
- `offramp` → `offRamp` (capital R)
- `onramp` → `onRamp` (capital R)
- `rampableRecipient` → `rampableRecipients` (plural)

### 6. ✅ Auth Options Cleanup

**Issue**: `chainId` not accepted in auth method options  
**Fix**: Removed `chainId` parameter from `email.verify()` and `google.authorize()` calls

### 7. ⚠️ Transaction History - Requires Alternative Approach

**Issue**: SDK doesn't provide `getTransactionHistory()` method  
**Current Fix**: Returns empty array with warning

```typescript
// NOTE: Xellar SDK does not provide a getTransactionHistory method
// The SDK only has getTransactionDetails(hash) for individual transactions
// TODO: Implement local transaction tracking or use blockchain explorer API
```

**Recommendations**:
1. Track transactions locally when creating offramp/onramp
2. Use blockchain explorer API (Basescan) for Base Sepolia
3. Store transaction hashes in local storage or database

### 8. ⚠️ Methods Requiring SDK Documentation Verification

The following methods need official SDK documentation to confirm correct parameters and response types:

#### `getBalance()`
- Currently returns zero balance with warning
- Need to verify correct method name and parameters in SDK v4.8.0

#### `getQuote()`
- Currently returns mock exchange rate
- Verify if `offRamp.getQuote()` exists or alternative method

#### `createOfframp()` & `createOnramp()`
- Using type assertions (`as any`) for parameters
- Need to verify correct parameter structure from SDK docs

#### `getOfframpStatus()`
- Currently returns mock status
- Verify if `offRamp.getStatus()` or `offRamp.getDetails()` exists

#### `validateBankAccount()`
- Returns mock validation
- SDK might not expose this method

#### KYC Methods (`submitKYC()`, `getKYCStatus()`)
- Currently throw "not implemented" error
- SDK might not expose KYC namespace

## Integration Impact

### auth-store.ts Updates Needed

The auth store must now handle optional wallet addresses:

```typescript
interface AuthState {
  token: string | null
  walletAddress: string | null  // Now optional
  isWalletCreated: boolean      // New field
  rampableAccessToken: string | null  // New field for recipient ops
}
```

### Recommended Flow

1. **Initial Login**: User receives `accessToken` (no wallet yet)
2. **Wallet Creation**: After KYC/setup, user gets `walletToken` + `address`
3. **Rampable Token**: Separate token for recipient/offramp operations
4. **Token Storage**: Store all three tokens separately

## Testing Checklist

- [ ] Test email OTP flow with new/existing wallets
- [ ] Test Google OAuth flow with new/existing wallets
- [ ] Test token refresh functionality
- [ ] Test recipient creation with rampableAccessToken
- [ ] Verify offramp transactions (once SDK methods confirmed)
- [ ] Verify onramp transactions (once SDK methods confirmed)
- [ ] Test auth state persistence across page reloads

## Next Steps

1. **Get Official SDK Docs**: Request Xellar SDK v4.8.0 documentation
2. **Verify Method Signatures**: Confirm all SDK method names and parameters
3. **Implement Transaction Tracking**: Build local transaction history storage
4. **Update Auth Store**: Modify to handle conditional wallet creation state
5. **Test Integration**: Full end-to-end testing with real SDK credentials

## Files Modified

- `/web/services/xellar-service.ts` - Complete rewrite with SDK fixes

## Breaking Changes

⚠️ **XellarAuthResponse Interface Changed**

Old:
```typescript
{
  token: string
  walletAddress: string  // Always required
  refreshToken?: string
}
```

New:
```typescript
{
  token: string
  walletAddress?: string  // Now optional
  isWalletCreated: boolean  // New field
  refreshToken?: string
}
```

Any code consuming auth responses must handle optional `walletAddress`.

## References

- Xellar SDK: `@xellar/sdk@4.8.0`
- Documentation: https://docs.xellar.co
- Issue: Auth response conditional on `isWalletCreated` flag
- Issue: Rampable operations require separate access token
